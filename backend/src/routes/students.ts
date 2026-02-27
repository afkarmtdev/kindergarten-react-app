import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'

const students = new Hono()

const studentSchema = z.object({
  full_name: z.string().min(1),
  date_of_birth: z.string(),
  gender: z.enum(['male', 'female']),
  class_name: z.string(),
  parent_name: z.string(),
  parent_email: z.string().email(),
  parent_phone: z.string(),
  photo_url: z.string().optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  class_name: z.string().optional(),
  gender: z.enum(['male', 'female', '']).optional(),
})

// GET all students (paginated + filtered)
students.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search, class_name, gender } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('students')
    .select('*', { count: 'exact' })
    .order('full_name')
    .range(from, to)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,parent_name.ilike.%${search}%,parent_email.ilike.%${search}%`)
  }
  if (class_name) query = query.eq('class_name', class_name)
  if (gender) query = query.eq('gender', gender)

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

// GET single student
students.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('students')
    .select('*, attendance(*)')
    .eq('id', id)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

// POST bulk import students
students.post('/bulk', async (c) => {
  const body = await c.req.json()
  const rows: Record<string, string>[] = Array.isArray(body?.students) ? body.students : []

  if (rows.length === 0) return c.json({ error: 'No students provided' }, 400)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const valid: Record<string, string>[] = []
  const failed: { row: number; reason: string }[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2 // 1-indexed + header row
    if (!row.full_name?.trim()) return failed.push({ row: rowNum, reason: 'full_name is required' })
    if (!['male', 'female'].includes(row.gender)) return failed.push({ row: rowNum, reason: 'gender must be male or female' })
    if (!row.class_name?.trim()) return failed.push({ row: rowNum, reason: 'class_name is required' })
    if (!row.parent_name?.trim()) return failed.push({ row: rowNum, reason: 'parent_name is required' })
    if (!row.parent_email?.trim() || !emailRegex.test(row.parent_email)) return failed.push({ row: rowNum, reason: 'parent_email is invalid' })
    if (!row.parent_phone?.trim()) return failed.push({ row: rowNum, reason: 'parent_phone is required' })
    valid.push(sanitiseStrings({
      full_name: row.full_name.trim(),
      date_of_birth: row.date_of_birth?.trim() || '',
      gender: row.gender,
      class_name: row.class_name.trim(),
      parent_name: row.parent_name.trim(),
      parent_email: row.parent_email.trim(),
      parent_phone: row.parent_phone.trim(),
    }))
  })

  if (valid.length === 0) return c.json({ imported: 0, failed })

  const { error } = await supabase.from('students').insert(valid)
  if (error) return c.json({ error: error.message }, 500)

  return c.json({ imported: valid.length, failed })
})

// POST create student
students.post('/', zValidator('json', studentSchema), async (c) => {
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase
    .from('students')
    .insert(body)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PUT update student
students.put('/:id', zValidator('json', studentSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('students')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE student
students.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase.from('students').delete().eq('id', id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Student deleted' })
})

export default students
