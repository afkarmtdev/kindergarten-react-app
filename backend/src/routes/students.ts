import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'

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
  status: z.enum(['active', 'graduated', 'inactive']).default('active'),
})

/**
 * Find or create a parent record from student form data,
 * then link it to the given student via parent_students.
 */
async function upsertParentLink(
  studentId: string,
  parentName: string,
  parentEmail: string,
  parentPhone: string
): Promise<{ error?: string }> {
  // 1. Try to find existing parent by email (canonical dedup key)
  const normEmail = parentEmail.trim().toLowerCase()
  const { data: existing } = await supabase
    .from('parents')
    .select('id')
    .eq('email', normEmail)
    .limit(1)
    .single()

  let parentId: string

  if (existing) {
    parentId = existing.id
    // Update name/phone in case they changed
    await supabase
      .from('parents')
      .update({ full_name: parentName, phone: parentPhone })
      .eq('id', parentId)
  } else {
    // 2. Create new parent
    const { data: created, error: createErr } = await supabase
      .from('parents')
      .insert({ full_name: parentName, email: normEmail, phone: parentPhone })
      .select('id')
      .single()

    if (createErr || !created) return { error: createErr?.message ?? 'Failed to create parent' }
    parentId = created.id
  }

  // 3. Link parent ↔ student (ignore if already linked)
  const { error: linkErr } = await supabase
    .from('parent_students')
    .upsert({ parent_id: parentId, student_id: studentId }, { onConflict: 'parent_id,student_id' })

  if (linkErr) return { error: linkErr.message }
  return {}
}

// Flatten classrooms + parent_students joins into flat fields
function flattenStudent(row: Record<string, unknown>): Record<string, unknown> {
  const { classrooms, parent_students, ...rest } = row as {
    classrooms?: { name?: string; academic_year?: string } | null
    parent_students?: { parents?: { full_name?: string; email?: string; phone?: string } | null }[]
  } & Record<string, unknown>

  const link = Array.isArray(parent_students) ? parent_students[0] : undefined
  const parent = link?.parents
    ? {
        full_name: link.parents.full_name ?? '',
        email: link.parents.email ?? null,
        phone: link.parents.phone ?? '',
      }
    : null

  const class_name = classrooms?.name
    ? `${classrooms.name} (${classrooms.academic_year ?? ''})`
    : null
  return { ...rest, class_name, parent: parent }
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
  status: z.enum(['active', 'graduated', 'inactive', '']).optional(),
})

// GET all students (paginated + filtered)
students.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search, class_id, gender, birthday_today, status } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('students')
    .select(
      '*, classrooms(name, academic_year), parent_students(parents(full_name, email, phone))',
      {
        count: 'exact',
      }
    )
    .is('deleted_at', null)
    .order('full_name')
    .range(from, to)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%`)
  }
  if (class_id) query = query.eq('class_id', class_id)
  if (gender) query = query.eq('gender', gender)
  if (status) query = query.eq('status', status)
  if (birthday_today) {
    // Supabase JS can't do date part extraction, so fetch all and filter server-side
    let bdayQuery = supabase
      .from('students')
      .select(
        '*, classrooms(name, academic_year), parent_students(parents(full_name, email, phone))'
      )
      .is('deleted_at', null)
      .order('full_name')

    if (search) {
      bdayQuery = bdayQuery.or(`full_name.ilike.%${search}%`)
    }
    if (class_id) bdayQuery = bdayQuery.eq('class_id', class_id)
    if (gender) bdayQuery = bdayQuery.eq('gender', gender)
    if (status) bdayQuery = bdayQuery.eq('status', status)

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
      data: paged.map(flattenStudent),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  const { data, error, count } = await query

  if (error) return c.json({ error: error.message }, 500)

  return c.json({
    data: (data ?? []).map(flattenStudent),
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
})

// GET /:id/timeline — paginated student activity timeline
const timelineSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().optional(),
})

students.get('/:id/timeline', zValidator('query', timelineSchema), async (c) => {
  const { id } = c.req.param()
  const { limit, before } = c.req.valid('query')
  const perSource = limit + 1

  // Build queries — each hits an index, returns ≤ perSource rows
  let attendanceQ = supabase
    .from('attendance')
    .select('date, status')
    .eq('student_id', id)
    .order('date', { ascending: false })
    .limit(perSource)

  let portfolioQ = supabase
    .from('portfolio_entries')
    .select('id, domain, observation, entry_date')
    .eq('student_id', id)
    .is('deleted_at', null)
    .order('entry_date', { ascending: false })
    .limit(perSource)

  let artWallQ = supabase
    .from('art_wall')
    .select('id, caption, artwork_date')
    .eq('student_id', id)
    .is('deleted_at', null)
    .order('artwork_date', { ascending: false })
    .limit(perSource)

  let feesQ = supabase
    .from('fee_records')
    .select('id, description, amount_paid, paid_at')
    .eq('student_id', id)
    .is('deleted_at', null)
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false })
    .limit(perSource)

  let reportsQ = supabase
    .from('portfolio_reports')
    .select('term, generated_at')
    .eq('student_id', id)
    .order('generated_at', { ascending: false })
    .limit(perSource)

  let dailyQ = supabase
    .from('daily_reports')
    .select('id, report_date, mood, activity_note')
    .eq('student_id', id)
    .is('deleted_at', null)
    .order('report_date', { ascending: false })
    .limit(perSource)

  // Apply cursor filter if paginating
  if (before) {
    attendanceQ = attendanceQ.lt('date', before)
    portfolioQ = portfolioQ.lt('entry_date', before)
    artWallQ = artWallQ.lt('artwork_date', before)
    feesQ = feesQ.lt('paid_at', before)
    reportsQ = reportsQ.lt('generated_at', before)
    dailyQ = dailyQ.lt('report_date', before)
  }

  const [attendance, portfolio, artWall, fees, reports, daily] = await Promise.all([
    attendanceQ,
    portfolioQ,
    artWallQ,
    feesQ,
    reportsQ,
    dailyQ,
  ])

  // Normalize into unified events
  type Event = { type: string; date: string; title: string; subtitle?: string }
  const events: Event[] = []

  for (const r of attendance.data ?? []) {
    events.push({
      type: 'attendance',
      date: r.date,
      title: r.status.charAt(0).toUpperCase() + r.status.slice(1),
      subtitle: undefined,
    })
  }

  for (const r of portfolio.data ?? []) {
    const domain = (r.domain as string).replace(/_/g, ' ')
    events.push({
      type: 'portfolio',
      date: r.entry_date,
      title: domain.charAt(0).toUpperCase() + domain.slice(1),
      subtitle: r.observation ? (r.observation as string).slice(0, 80) : undefined,
    })
  }

  for (const r of artWall.data ?? []) {
    events.push({
      type: 'artwork',
      date: r.artwork_date ?? r.created_at?.slice(0, 10) ?? '',
      title: (r.caption as string) || 'Artwork',
      subtitle: undefined,
    })
  }

  for (const r of fees.data ?? []) {
    events.push({
      type: 'fee_payment',
      date: (r.paid_at as string).slice(0, 10),
      title: `RM ${Number(r.amount_paid).toFixed(2)}`,
      subtitle: r.description as string,
    })
  }

  for (const r of reports.data ?? []) {
    events.push({
      type: 'report_card',
      date: (r.generated_at as string).slice(0, 10),
      title: `Report Card: ${r.term}`,
      subtitle: undefined,
    })
  }

  for (const r of daily.data ?? []) {
    const mood = r.mood ? ` - ${r.mood}` : ''
    events.push({
      type: 'daily_report',
      date: r.report_date,
      title: `Daily Report${mood}`,
      subtitle: r.activity_note ? (r.activity_note as string).slice(0, 80) : undefined,
    })
  }

  // Sort by date descending
  events.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))

  // Paginate
  const page = events.slice(0, limit)
  const has_more = events.length > limit
  const next_cursor = page.length > 0 ? page[page.length - 1].date : undefined

  return c.json({
    events: page,
    has_more,
    next_cursor,
  })
})

// GET single student
students.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('students')
    .select(
      '*, attendance(*), classrooms(name, academic_year), parent_students(parents(full_name, email, phone))'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(flattenStudent(data as Record<string, unknown>))
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
    .is('deleted_at', null)
    .eq('status', 'active')

  const classMap: Record<string, string> = {}
  for (const cls of classRows ?? []) classMap[cls.name] = cls.id

  const toInsert: Record<string, unknown>[] = []
  const parentInfoMap: Record<
    number,
    { parent_name: string; parent_email: string; parent_phone: string }
  > = {}
  for (const r of valid) {
    const { class_name: _cn, parent_name, parent_email, parent_phone, ...rest } = r
    if (!classMap[_cn]) {
      failed.push({
        row: valid.indexOf(r) + 1,
        reason: `class_name '${_cn}' not found in classrooms`,
      })
      continue
    }
    parentInfoMap[toInsert.length] = { parent_name, parent_email, parent_phone }
    toInsert.push({ ...rest, class_id: classMap[_cn], ...auditCreate(c) })
  }

  if (toInsert.length > 0) {
    const { data: inserted, error } = await supabase.from('students').insert(toInsert).select('id')

    if (error) return c.json({ error: error.message }, 500)

    // Auto-create parent records for all inserted students
    if (inserted) {
      await Promise.all(
        inserted.map((s: { id: string }, i: number) => {
          const p = parentInfoMap[i]
          if (p?.parent_name && p?.parent_email && p?.parent_phone) {
            return upsertParentLink(s.id, p.parent_name, p.parent_email, p.parent_phone)
          }
        })
      )
    }
  }

  return c.json({ imported: toInsert.length, failed })
})

// POST create student
students.post('/', zValidator('json', studentSchema), async (c) => {
  const body = sanitiseStrings(c.req.valid('json'))
  const { parent_name, parent_email, parent_phone, ...studentFields } = body as Record<
    string,
    string
  >

  const { data, error } = await supabase
    .from('students')
    .insert({ ...studentFields, ...auditCreate(c) })
    .select('*, classrooms(name, academic_year), parent_students(parents(full_name, email, phone))')
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // Auto-create/find parent and link to student
  if (parent_name && parent_email && parent_phone) {
    await upsertParentLink(data.id, parent_name, parent_email, parent_phone)
  }

  return c.json(flattenStudent(data as Record<string, unknown>), 201)
})

// PUT update student
students.put('/:id', zValidator('json', studentSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))

  // Separate parent fields from student fields
  const { parent_name, parent_email, parent_phone, ...studentFields } = body as Record<
    string,
    string
  >

  const { data, error } = await supabase
    .from('students')
    .update({ ...studentFields, ...auditUpdate(c) })
    .eq('id', id)
    .select('*, classrooms(name, academic_year), parent_students(parents(full_name, email, phone))')
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // Sync parent record if all three parent fields are present
  if (parent_name && parent_email && parent_phone) {
    await upsertParentLink(id, parent_name, parent_email, parent_phone)
  }

  return c.json(flattenStudent(data as Record<string, unknown>))
})

// DELETE student (soft delete)
students.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase
    .from('students')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)

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
