import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'

const incidents = new Hono()

const incidentSchema = z.object({
  student_id: z.string().uuid(),
  incident_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  incident_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  type: z.enum(['injury', 'illness', 'behavioral', 'allergic_reaction', 'other']),
  severity: z.enum(['minor', 'moderate', 'serious']),
  location: z.string().max(200).nullable().optional(),
  description: z.string().min(1).max(5000),
  action_taken: z.string().min(1).max(5000),
  witnessed_by: z.string().max(200).nullable().optional(),
  parent_notified: z.boolean().default(false),
  parent_notified_at: z.string().nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
  follow_up_notes: z.string().max(5000).nullable().optional(),
  status: z.enum(['open', 'resolved']).default('open'),
})

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  student_id: z.string().uuid().optional(),
  type: z.enum(['injury', 'illness', 'behavioral', 'allergic_reaction', 'other']).optional(),
  severity: z.enum(['minor', 'moderate', 'serious']).optional(),
  status: z.enum(['open', 'resolved']).optional(),
  from_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

// Helper to flatten joined student data
function flattenIncident(row: Record<string, unknown>) {
  const { students, ...rest } = row
  const student = students as {
    full_name: string
    photo_url?: string
    classrooms?: { name: string } | null
  } | null
  return {
    ...rest,
    students: student
      ? {
          full_name: student.full_name,
          class_name: student.classrooms?.name ?? null,
          photo_url: student.photo_url,
        }
      : null,
  }
}

// GET /api/incidents — paginated list with filters
incidents.get('/', zValidator('query', querySchema), async (c) => {
  const { page, limit, search, student_id, type, severity, status, from_date, to_date } =
    c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('incidents')
    .select('*, students(full_name, photo_url, classrooms(name))', { count: 'exact' })
    .is('deleted_at', null)
    .order('incident_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (student_id) query = query.eq('student_id', student_id)
  if (type) query = query.eq('type', type)
  if (severity) query = query.eq('severity', severity)
  if (status) query = query.eq('status', status)
  if (from_date) query = query.gte('incident_date', from_date)
  if (to_date) query = query.lte('incident_date', to_date)
  if (search) query = query.ilike('description', `%${search}%`)

  const { data, error, count } = await query
  if (error) return c.json({ error: error.message }, 500)

  return c.json({
    data: (data ?? []).map((r) => flattenIncident(r as Record<string, unknown>)),
    meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
  })
})

// GET /api/incidents/by-student/:studentId — paginated incidents for one student
incidents.get(
  '/by-student/:studentId',
  zValidator(
    'query',
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
  ),
  async (c) => {
    const { studentId } = c.req.param()
    const { page, limit } = c.req.valid('query')
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('incidents')
      .select('*', { count: 'exact' })
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('incident_date', { ascending: false })
      .range(from, to)

    if (error) return c.json({ error: error.message }, 500)

    return c.json({
      data: data ?? [],
      meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
    })
  }
)

// GET /api/incidents/:id — single incident
incidents.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('incidents')
    .select('*, students(full_name, photo_url, classrooms(name))')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(flattenIncident(data as Record<string, unknown>))
})

// POST /api/incidents — create
incidents.post('/', zValidator('json', incidentSchema), async (c) => {
  const user = c.get('user' as never) as { email?: string } | undefined
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('incidents')
    .insert({ ...body, recorded_by: user?.email ?? null, ...auditCreate(c) })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PUT /api/incidents/:id — update
incidents.put('/:id', zValidator('json', incidentSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('incidents')
    .update({ ...body, ...auditUpdate(c) })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE /api/incidents/:id — soft delete
incidents.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase
    .from('incidents')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Incident deleted' })
})

export default incidents
