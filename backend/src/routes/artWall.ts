import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'

const artWall = new Hono()

const artWallSchema = z.object({
  photo_url: z.string().url(),
  caption: z.string().max(500).optional(),
  student_id: z.string().uuid().optional().nullable(),
  student_name: z.string().max(200).optional().nullable(),
  artwork_date: z.string().optional().nullable(),
  display_order: z.coerce.number().int().default(0),
  is_visible: z.boolean().default(true),
  tilt_angle: z.coerce.number().int().min(-15).max(15).nullable().optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  search: z.string().optional(),
})

// GET all art wall items (paginated) — admin
artWall.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('art_wall')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`caption.ilike.%${search}%,student_name.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) return c.json({ error: error.message }, 500)

  return c.json({
    data: data ?? [],
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
})

// GET art wall items by student (paginated)
artWall.get('/by-student/:studentId', zValidator('query', paginationSchema), async (c) => {
  const { studentId } = c.req.param()
  const { page, limit, search } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('art_wall')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .eq('student_id', studentId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.ilike('caption', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) return c.json({ error: error.message }, 500)

  return c.json({
    data: data ?? [],
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
})

// GET single art wall item
artWall.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('art_wall')
    .select('*')
    .is('deleted_at', null)
    .eq('id', id)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

// POST create art wall item
artWall.post('/', zValidator('json', artWallSchema), async (c) => {
  const raw = c.req.valid('json')
  const body = sanitiseStrings(raw)

  // If student_id provided but no student_name, look up the name
  if (body.student_id && !body.student_name) {
    const { data: student } = await supabase
      .from('students')
      .select('full_name')
      .eq('id', body.student_id)
      .is('deleted_at', null)
      .single()
    if (student) {
      body.student_name = student.full_name
    }
  }

  const { data, error } = await supabase
    .from('art_wall')
    .insert({ ...body, ...auditCreate(c) })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PUT update art wall item
artWall.put('/:id', zValidator('json', artWallSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const raw = c.req.valid('json')
  const body = sanitiseStrings(raw)

  // If student_id provided but no student_name, look up the name
  if (body.student_id && !body.student_name) {
    const { data: student } = await supabase
      .from('students')
      .select('full_name')
      .eq('id', body.student_id)
      .is('deleted_at', null)
      .single()
    if (student) {
      body.student_name = student.full_name
    }
  }

  const { data, error } = await supabase
    .from('art_wall')
    .update({ ...body, ...auditUpdate(c) })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE art wall item
artWall.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase
    .from('art_wall')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Art wall item deleted' })
})

export default artWall
