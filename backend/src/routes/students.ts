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
  class_id: z.preprocess((v) => (!v ? null : v), z.string().uuid().nullable().optional()),
  parent_name: z.string(),
  parent_email: z.string().email(),
  parent_phone: z.string(),
  photo_url: z.string().optional(),
})

// Flatten classrooms join into class_name field
function flattenClassroom(row: Record<string, unknown>): Record<string, unknown> {
  const { classrooms, ...rest } = row as { classrooms?: { name?: string } | null } & Record<
    string,
    unknown
  >
  return { ...rest, class_name: classrooms?.name ?? null }
}

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  class_id: z.preprocess((v) => (!v ? undefined : v), z.string().uuid().optional()),
  gender: z.enum(['male', 'female', '']).optional(),
  birthday_today: z
    .enum(['true', 'false', ''])
    .optional()
    .transform((v) => v === 'true'),
})

// GET all students (paginated + filtered)
students.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search, class_id, gender, birthday_today } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('students')
    .select('*, classrooms(name)', { count: 'exact' })
    .order('full_name')
    .range(from, to)

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,parent_name.ilike.%${search}%,parent_email.ilike.%${search}%`
    )
  }
  if (class_id) query = query.eq('class_id', class_id)
  if (gender) query = query.eq('gender', gender)
  if (birthday_today) {
    // Supabase JS can't do date part extraction, so fetch all and filter server-side
    let bdayQuery = supabase.from('students').select('*, classrooms(name)').order('full_name')

    if (search) {
      bdayQuery = bdayQuery.or(
        `full_name.ilike.%${search}%,parent_name.ilike.%${search}%,parent_email.ilike.%${search}%`
      )
    }
    if (class_id) bdayQuery = bdayQuery.eq('class_id', class_id)
    if (gender) bdayQuery = bdayQuery.eq('gender', gender)

    const { data: allData, error: allError } = await bdayQuery

    if (allError) return c.json({ error: allError.message }, 500)

    const now = new Date()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const suffix = `-${mm}-${dd}`
    const filtered = (allData ?? []).filter(
      (s) => typeof s.date_of_birth === 'string' && s.date_of_birth.endsWith(suffix)
    )

    const total = filtered.length
    const paged = filtered.slice(from, from + limit)
    return c.json({
      data: paged.map(flattenClassroom),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  const { data, error, count } = await query

  if (error) return c.json({ error: error.message }, 500)

  return c.json({
    data: (data ?? []).map(flattenClassroom),
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
    .select('*, attendance(*), classrooms(name)')
    .eq('id', id)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(flattenClassroom(data as Record<string, unknown>))
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
    if (!['male', 'female'].includes(row.gender))
      return failed.push({ row: rowNum, reason: 'gender must be male or female' })
    if (!row.class_name?.trim())
      return failed.push({ row: rowNum, reason: 'class_name is required' })
    if (!row.parent_name?.trim())
      return failed.push({ row: rowNum, reason: 'parent_name is required' })
    if (!row.parent_email?.trim() || !emailRegex.test(row.parent_email))
      return failed.push({ row: rowNum, reason: 'parent_email is invalid' })
    if (!row.parent_phone?.trim())
      return failed.push({ row: rowNum, reason: 'parent_phone is required' })
    valid.push(
      sanitiseStrings({
        full_name: row.full_name.trim(),
        date_of_birth: row.date_of_birth?.trim() || '',
        gender: row.gender,
        class_name: row.class_name.trim(), // kept for class_id lookup below; stripped before insert
        parent_name: row.parent_name.trim(),
        parent_email: row.parent_email.trim(),
        parent_phone: row.parent_phone.trim(),
      })
    )
  })

  if (valid.length === 0) return c.json({ imported: 0, failed })

  // Resolve class_id from class_name for each valid row
  const uniqueClassNames = [...new Set(valid.map((r) => r.class_name))]
  const { data: classRows } = await supabase
    .from('classrooms')
    .select('id, name')
    .in('name', uniqueClassNames)

  const classMap: Record<string, string> = {}
  for (const cls of classRows ?? []) classMap[cls.name] = cls.id

  const toInsert: Record<string, unknown>[] = []
  for (const r of valid) {
    const { class_name: _cn, ...rest } = r
    if (!classMap[_cn]) {
      failed.push({
        row: valid.indexOf(r) + 1,
        reason: `class_name '${_cn}' not found in classrooms`,
      })
      continue
    }
    toInsert.push({ ...rest, class_id: classMap[_cn] })
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('students').insert(toInsert)
    if (error) return c.json({ error: error.message }, 500)
  }

  return c.json({ imported: toInsert.length, failed })
})

// POST create student
students.post('/', zValidator('json', studentSchema), async (c) => {
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase
    .from('students')
    .insert(body)
    .select('*, classrooms(name)')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(flattenClassroom(data as Record<string, unknown>), 201)
})

// PUT update student
students.put('/:id', zValidator('json', studentSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('students')
    .update(body)
    .eq('id', id)
    .select('*, classrooms(name)')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(flattenClassroom(data as Record<string, unknown>))
})

// DELETE student
students.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase.from('students').delete().eq('id', id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Student deleted' })
})

// ── Parent Portal Access Management ──────────────────────────────────────────

// POST /:id/access-code — generate a unique access code for a student
students.post('/:id/access-code', async (c) => {
  const { id } = c.req.param()

  // Generate KC-YYYY-NNNN format; retry up to 5 times on collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const year = new Date().getFullYear()
    const suffix = String(Math.floor(Math.random() * 9000) + 1000)
    const accessCode = `KC-${year}-${suffix}`

    const { data, error } = await supabase
      .from('students')
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
students.put(
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

    const { error } = await supabase.from('students').update({ portal_pin_hash: hash }).eq('id', id)

    if (error) return c.json({ error: error.message }, 500)
    return c.json({ ok: true })
  }
)

// DELETE /:id/portal-access — revoke all parent portal access for a student
students.delete('/:id/portal-access', async (c) => {
  const { id } = c.req.param()

  const [{ error: studentError }, { error: sessionError }] = await Promise.all([
    supabase.from('students').update({ access_code: null, portal_pin_hash: null }).eq('id', id),
    supabase.from('parent_sessions').delete().eq('student_id', id),
  ])

  if (studentError) return c.json({ error: studentError.message }, 500)
  if (sessionError) return c.json({ error: sessionError.message }, 500)

  return c.json({ ok: true })
})

export default students
