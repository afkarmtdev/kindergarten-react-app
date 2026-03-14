import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'

const parents = new Hono()

const parentSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
})

// GET all parents (paginated + filtered)
parents.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('parents')
    .select('id, full_name, email, phone, access_code, created_at, parent_students(id)', {
      count: 'exact',
    })
    .order('full_name')
    .range(from, to)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) return c.json({ error: error.message }, 500)

  const mapped = (data ?? []).map((row: Record<string, unknown>) => {
    const { parent_students, ...rest } = row as {
      parent_students?: { id: string }[]
    } & Record<string, unknown>
    return { ...rest, children_count: parent_students?.length ?? 0 }
  })

  return c.json({
    data: mapped,
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
})

// GET parent by student ID (for student profile portal access card)
parents.get('/by-student/:studentId', async (c) => {
  const { studentId } = c.req.param()

  const { data: link, error } = await supabase
    .from('parent_students')
    .select('parents(id, full_name, email, phone, access_code, portal_pin_hash, created_at)')
    .eq('student_id', studentId)
    .limit(1)
    .single()

  if (error || !link) return c.json({ data: null })

  const parent = (link as Record<string, unknown>).parents as Record<string, unknown> | null
  return c.json({ data: parent ?? null })
})

// GET single parent with linked children
parents.get('/:id', async (c) => {
  const { id } = c.req.param()

  const { data: parent, error } = await supabase
    .from('parents')
    .select('id, full_name, email, phone, access_code, created_at')
    .eq('id', id)
    .single()

  if (error || !parent) return c.json({ error: 'Parent not found' }, 404)

  // Fetch linked children via parent_students join
  const { data: links } = await supabase
    .from('parent_students')
    .select('relationship, students(id, full_name, photo_url, classrooms(name))')
    .eq('parent_id', id)

  const children = (links ?? []).map((link: Record<string, unknown>) => {
    const student = link.students as {
      id: string
      full_name: string
      photo_url: string | null
      classrooms: { name: string } | null
    } | null
    return {
      id: student?.id ?? '',
      full_name: student?.full_name ?? '',
      class_name: student?.classrooms?.name ?? null,
      photo_url: student?.photo_url ?? null,
      relationship: link.relationship as string,
    }
  })

  return c.json({ ...parent, children })
})

// POST create parent
parents.post('/', zValidator('json', parentSchema), async (c) => {
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase
    .from('parents')
    .insert(body)
    .select('id, full_name, email, phone, access_code, created_at')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PUT update parent
parents.put('/:id', zValidator('json', parentSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('parents')
    .update(body)
    .eq('id', id)
    .select('id, full_name, email, phone, access_code, created_at')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE parent
parents.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase.from('parents').delete().eq('id', id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Parent deleted' })
})

// POST /:id/access-code — generate a unique access code for a parent
parents.post('/:id/access-code', async (c) => {
  const { id } = c.req.param()

  // Generate KC-YYYY-NNNN format; retry up to 5 times on collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const year = new Date().getFullYear()
    const suffix = String(Math.floor(Math.random() * 9000) + 1000)
    const accessCode = `KC-${year}-${suffix}`

    const { data, error } = await supabase
      .from('parents')
      .update({ access_code: accessCode })
      .eq('id', id)
      .select('id, access_code')
      .single()

    if (!error && data) return c.json({ access_code: data.access_code })
    // If unique constraint violation, retry; otherwise bail
    if (error && !error.message.includes('unique')) {
      return c.json({ error: error.message }, 500)
    }
  }

  return c.json({ error: 'Failed to generate unique access code' }, 500)
})

// PUT /:id/portal-pin — set or reset the parent portal PIN
parents.put(
  '/:id/portal-pin',
  zValidator(
    'json',
    z.object({
      pin: z
        .string()
        .length(6)
        .regex(/^\d{6}$/, 'PIN must be 6 digits'),
    })
  ),
  async (c) => {
    const { id } = c.req.param()
    const { pin } = c.req.valid('json')

    const hash = await Bun.password.hash(pin)

    const { error } = await supabase.from('parents').update({ portal_pin_hash: hash }).eq('id', id)

    if (error) return c.json({ error: error.message }, 500)
    return c.json({ ok: true })
  }
)

// DELETE /:id/portal-access — revoke all parent portal access
parents.delete('/:id/portal-access', async (c) => {
  const { id } = c.req.param()

  const [{ error: parentError }, { error: sessionError }] = await Promise.all([
    supabase.from('parents').update({ access_code: null, portal_pin_hash: null }).eq('id', id),
    supabase.from('parent_sessions').delete().eq('parent_id', id),
  ])

  if (parentError) return c.json({ error: parentError.message }, 500)
  if (sessionError) return c.json({ error: sessionError.message }, 500)

  return c.json({ ok: true })
})

// POST /:id/link-student — link a student to this parent
parents.post(
  '/:id/link-student',
  zValidator(
    'json',
    z.object({
      student_id: z.string().uuid(),
      relationship: z
        .enum(['parent', 'guardian', 'step_parent', 'other'])
        .optional()
        .default('parent'),
    })
  ),
  async (c) => {
    const { id } = c.req.param()
    const { student_id, relationship } = c.req.valid('json')

    // Validate student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', student_id)
      .single()

    if (studentError || !student) {
      return c.json({ error: 'Student not found' }, 404)
    }

    const { data, error } = await supabase
      .from('parent_students')
      .insert({ parent_id: id, student_id, relationship })
      .select()
      .single()

    if (error) return c.json({ error: error.message }, 500)
    return c.json(data, 201)
  }
)

// DELETE /:parentId/unlink-student/:studentId — remove link between parent and student
parents.delete('/:parentId/unlink-student/:studentId', async (c) => {
  const { parentId, studentId } = c.req.param()

  const { error } = await supabase
    .from('parent_students')
    .delete()
    .eq('parent_id', parentId)
    .eq('student_id', studentId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Student unlinked' })
})

// GET /:id/sessions — list active portal sessions for a parent (admin)
parents.get('/:id/sessions', async (c) => {
  const { id } = c.req.param()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('parent_sessions')
    .select('id, device_label, created_at, expires_at')
    .eq('parent_id', id)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// DELETE /:id/sessions/:sessionId — revoke a specific session (admin)
parents.delete('/:id/sessions/:sessionId', async (c) => {
  const { id, sessionId } = c.req.param()

  // Verify session belongs to this parent
  const { data: session } = await supabase
    .from('parent_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('parent_id', id)
    .single()

  if (!session) return c.json({ error: 'Session not found' }, 404)

  const { error } = await supabase.from('parent_sessions').delete().eq('id', sessionId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

export default parents
