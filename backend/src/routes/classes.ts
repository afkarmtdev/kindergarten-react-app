import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'

const classes = new Hono()

const classSchema = z.object({
  name: z.string().min(1),
  academic_year: z
    .string()
    .length(4)
    .regex(/^\d{4}$/),
  teacher_name: z.string().min(1),
  capacity: z.number().int().positive(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(9),
  search: z.string().optional(),
  status: z.enum(['active', 'graduated', '']).optional(),
})

// GET /count — lightweight active class count (no joins)
classes.get('/count', async (c) => {
  const { count, error } = await supabase
    .from('classrooms')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('status', 'active')

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ count: count ?? 0 })
})

// GET all classes (paginated) with student count
classes.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search, status } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('classrooms')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('name')
    .range(from, to)

  if (search) {
    query = query.or(`name.ilike.%${search}%,teacher_name.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)

  const { data: classData, error, count } = await query

  if (error) return c.json({ error: error.message }, 500)

  // Count students per class using class_id FK
  const classIds = (classData ?? []).map((cls) => cls.id)
  const studentCounts: Record<string, number> = {}

  if (classIds.length > 0) {
    const { data: countData } = await supabase.rpc('dashboard_class_student_counts', {
      p_class_ids: classIds,
    })

    for (const row of countData ?? []) {
      studentCounts[row.class_id] = Number(row.student_count)
    }
  }

  const data = (classData ?? []).map((cls) => ({
    ...cls,
    student_count: studentCounts[cls.id] ?? 0,
  }))

  return c.json({
    data,
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
})

// GET single class with students
classes.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data: cls, error } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return c.json({ error: error.message }, 404)

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', id)
    .is('deleted_at', null)
    .eq('status', 'active')

  return c.json({ ...cls, students: students ?? [] })
})

// POST create class
classes.post('/', zValidator('json', classSchema), async (c) => {
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase
    .from('classrooms')
    .insert({ ...body, ...auditCreate(c) })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PUT update class
classes.put('/:id', zValidator('json', classSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('classrooms')
    .update({ ...body, ...auditUpdate(c) })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE class
classes.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase
    .from('classrooms')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Class deleted' })
})

// POST /:id/graduate — graduate a class and its students
const graduateSchema = z.object({
  student_ids: z.array(z.string().uuid()).min(1),
  reassign_class_id: z.preprocess((v) => (!v ? undefined : v), z.string().uuid().optional()),
  reassign_student_ids: z.array(z.string().uuid()).optional(),
})

classes.post('/:id/graduate', zValidator('json', graduateSchema), async (c) => {
  const { id } = c.req.param()
  const { student_ids, reassign_class_id, reassign_student_ids } = c.req.valid('json')

  // Verify class exists and is active
  const { data: cls, error: clsError } = await supabase
    .from('classrooms')
    .select('id, status')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (clsError || !cls) return c.json({ error: 'Class not found' }, 404)
  if (cls.status === 'graduated') return c.json({ error: 'Class is already graduated' }, 400)

  // Graduate selected students
  const { error: gradError } = await supabase
    .from('students')
    .update({ status: 'graduated', ...auditUpdate(c) })
    .in('id', student_ids)
    .is('deleted_at', null)

  if (gradError) return c.json({ error: gradError.message }, 500)

  // Reassign remaining students if destination provided
  let reassigned_count = 0
  if (reassign_class_id && reassign_student_ids && reassign_student_ids.length > 0) {
    // Verify destination class exists and is active
    const { data: dest } = await supabase
      .from('classrooms')
      .select('id')
      .eq('id', reassign_class_id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single()

    if (!dest) return c.json({ error: 'Destination class not found or not active' }, 400)

    const { error: reassignError } = await supabase
      .from('students')
      .update({ class_id: reassign_class_id, ...auditUpdate(c) })
      .in('id', reassign_student_ids)
      .is('deleted_at', null)

    if (reassignError) return c.json({ error: reassignError.message }, 500)
    reassigned_count = reassign_student_ids.length
  }

  // Graduate the class itself
  const { error: classGradError } = await supabase
    .from('classrooms')
    .update({ status: 'graduated', ...auditUpdate(c) })
    .eq('id', id)

  if (classGradError) return c.json({ error: classGradError.message }, 500)

  return c.json({
    message: 'Class graduated',
    graduated_count: student_ids.length,
    reassigned_count,
  })
})

export default classes
