import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'

const classes = new Hono()

const classSchema = z.object({
  name: z.string().min(1),
  teacher_name: z.string().min(1),
  capacity: z.number().int().positive(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  search: z.string().optional(),
})

// GET all classes (paginated) with student count
classes.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('classrooms')
    .select('*', { count: 'exact' })
    .order('name')
    .range(from, to)

  if (search) {
    query = query.or(`name.ilike.%${search}%,teacher_name.ilike.%${search}%`)
  }

  const { data: classData, error, count } = await query

  if (error) return c.json({ error: error.message }, 500)

  // Count students per class using class_name text match
  const classNames = (classData ?? []).map((cls) => cls.name)
  const studentCounts: Record<string, number> = {}

  if (classNames.length > 0) {
    const { data: studentData } = await supabase
      .from('students')
      .select('class_name')
      .in('class_name', classNames)

    for (const s of studentData ?? []) {
      studentCounts[s.class_name] = (studentCounts[s.class_name] ?? 0) + 1
    }
  }

  const data = (classData ?? []).map((cls) => ({
    ...cls,
    student_count: studentCounts[cls.name] ?? 0,
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
    .single()

  if (error) return c.json({ error: error.message }, 404)

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_name', cls.name)

  return c.json({ ...cls, students: students ?? [] })
})

// POST create class
classes.post('/', zValidator('json', classSchema), async (c) => {
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase
    .from('classrooms')
    .insert(body)
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
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE class
classes.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase.from('classrooms').delete().eq('id', id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Class deleted' })
})

export default classes
