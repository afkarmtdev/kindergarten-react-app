import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'
import { logger } from '../lib/logger'
import { activeParent, type ParentLink } from '../lib/parentLinks'
import { isValidUUID } from '../lib/validation'
import {
  pageTimeline,
  parseTimelineCursor,
  shiftDay,
  TIMELINE_CURSOR_RE,
  type TimelineEvent,
} from '../lib/timeline'

// Nested parent join used by every student read; flattenStudent() picks the parent from it
const PARENT_JOIN =
  'parent_students(created_at, deleted_at, parents(id, full_name, email, phone, deleted_at))'

type ParentLinks = ParentLink<{ id?: string; full_name?: string; email?: string; phone?: string }>[]

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
 * - `linkCreatedAt` lets a replacement parent take over the replaced link's place in the
 *   earliest-link order (see activeParent), so the student form keeps showing it.
 * - `emaillessParentId` is the parent the form showed when that parent has no email (allowed
 *   on the Parents page). If no parent has the entered email, it is that parent's email being
 *   filled in, so it is saved on their record instead of creating a new parent.
 */
async function upsertParentLink(
  studentId: string,
  parentName: string,
  parentEmail: string,
  parentPhone: string,
  options: { linkCreatedAt?: string | null; emaillessParentId?: string } = {}
): Promise<{ parentId?: string; error?: string }> {
  const { linkCreatedAt, emaillessParentId } = options
  // 1. Try to find existing parent by email (canonical dedup key)
  const normEmail = parentEmail.trim().toLowerCase()
  const { data: existing } = await supabase
    .from('parents')
    .select('id, deleted_at')
    .eq('email', normEmail)
    .limit(1)
    .single()

  let parentId: string

  if (existing) {
    parentId = existing.id
    // Update name/phone in case they changed. Email is unique, so a deleted parent entered
    // again is restored, with portal access cleared so it has to be issued afresh.
    await supabase
      .from('parents')
      .update({
        full_name: parentName,
        phone: parentPhone,
        ...(existing.deleted_at
          ? { deleted_at: null, deleted_by: null, access_code: null, portal_pin_hash: null }
          : {}),
      })
      .eq('id', parentId)
  } else {
    // 2. No parent has this email: fill it in on the shown emailless parent (the `is email
    //    null` guard keeps a parent that got an email meanwhile untouched), else create one
    const { data: adopted } = emaillessParentId
      ? await supabase
          .from('parents')
          .update({ full_name: parentName, email: normEmail, phone: parentPhone })
          .eq('id', emaillessParentId)
          .is('email', null)
          .select('id')
          .single()
      : { data: null }

    if (adopted) {
      parentId = adopted.id
    } else {
      const { data: created, error: createErr } = await supabase
        .from('parents')
        .insert({ full_name: parentName, email: normEmail, phone: parentPhone })
        .select('id')
        .single()

      if (createErr || !created) return { error: createErr?.message ?? 'Failed to create parent' }
      parentId = created.id
    }
  }

  // 3. Link parent ↔ student; re-activates a link that was unlinked (soft-deleted) before
  const { error: linkErr } = await supabase.from('parent_students').upsert(
    {
      parent_id: parentId,
      student_id: studentId,
      deleted_at: null,
      deleted_by: null,
      ...(linkCreatedAt ? { created_at: linkCreatedAt } : {}),
    },
    { onConflict: 'parent_id,student_id' }
  )

  if (linkErr) return { error: linkErr.message }
  return { parentId }
}

// Flatten classrooms + parent_students joins into flat fields
function flattenStudent(row: Record<string, unknown>): Record<string, unknown> {
  const { classrooms, parent_students, ...rest } = row as {
    classrooms?: { name?: string; academic_year?: string } | null
    parent_students?: ParentLinks
  } & Record<string, unknown>

  const linked = activeParent(parent_students)
  const parent = linked
    ? {
        full_name: linked.full_name ?? '',
        email: linked.email ?? null,
        phone: linked.phone ?? '',
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

// GET /count — lightweight active student count (no joins)
students.get('/count', async (c) => {
  const { data, error } = await supabase.rpc('dashboard_active_student_count')
  if (error) {
    logger.error({ error: error.message }, 'Failed to count students')
    return c.json({ error: 'Failed to count students' }, 500)
  }
  return c.json({ count: Number(data) || 0 })
})

// GET all students (paginated + filtered)
students.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search, class_id, gender, birthday_today, status } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('students')
    .select(`*, classrooms(name, academic_year), ${PARENT_JOIN}`, {
      count: 'exact',
    })
    .is('deleted_at', null)
    .order('full_name')
    .range(from, to)

  if (search) {
    query = query.ilike('full_name', `%${search}%`)
  }
  if (class_id) query = query.eq('class_id', class_id)
  if (gender) query = query.eq('gender', gender)
  if (status) query = query.eq('status', status)
  if (birthday_today) {
    const now = new Date()
    const mm = now.getMonth() + 1
    const dd = now.getDate()

    const [{ data: bdayData, error: bdayError }, { data: bdayCount }] = await Promise.all([
      supabase.rpc('dashboard_birthdays_today', {
        p_month: mm,
        p_day: dd,
        p_limit: limit,
      }),
      supabase.rpc('dashboard_birthday_count', {
        p_month: mm,
        p_day: dd,
      }),
    ])

    if (bdayError) {
      logger.error({ error: bdayError.message }, 'Failed to fetch birthday students')
      return c.json({ error: 'Failed to fetch students' }, 500)
    }

    const students = bdayData ?? []
    const total = Number(bdayCount) || students.length

    return c.json({
      data: students,
      meta: { total, page: 1, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  const { data, error, count } = await query

  if (error) {
    logger.error({ error: error.message }, 'Failed to fetch students')
    return c.json({ error: 'Failed to fetch students' }, 500)
  }

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
  before: z.string().regex(TIMELINE_CURSOR_RE).optional(),
})

students.get('/:id/timeline', zValidator('query', timelineSchema), async (c) => {
  const { id } = c.req.param()
  if (!isValidUUID(id)) return c.json({ error: 'Invalid ID' }, 400)
  const { limit, before } = c.req.valid('query')
  const cursor = parseTimelineCursor(before)
  // Enough rows per source to skip the cursor day's already-shown events and still fill a page
  const perSource = limit + 1 + (cursor?.skip ?? 0)

  // Build queries — each hits an index, returns ≤ perSource rows. Secondary order by id keeps
  // same-day rows in a fixed order, which the cursor relies on.
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
    .order('id', { ascending: false })
    .limit(perSource)

  // artwork_date is optional (falls back to the upload day), which SQL cannot order or filter
  // on, so a student's artworks (a handful) are all fetched and placed by pageTimeline()
  const artWallQ = supabase
    .from('art_wall')
    .select('id, caption, artwork_date, created_at')
    .eq('student_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  let feesQ = supabase
    .from('fee_records')
    .select('id, description, amount_paid, paid_at')
    .eq('student_id', id)
    .is('deleted_at', null)
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(perSource)

  let reportsQ = supabase
    .from('portfolio_reports')
    .select('term, generated_at')
    .eq('student_id', id)
    .not('generated_at', 'is', null)
    .order('generated_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(perSource)

  let dailyQ = supabase
    .from('daily_reports')
    .select('id, report_date, mood, activity_note')
    .eq('student_id', id)
    .is('deleted_at', null)
    .order('report_date', { ascending: false })
    .limit(perSource)

  let incidentsQ = supabase
    .from('incidents')
    .select('id, incident_date, type, severity, description')
    .eq('student_id', id)
    .is('deleted_at', null)
    .order('incident_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(perSource)

  // Apply cursor filter if paginating: up to and including the cursor day. Timestamp
  // columns compare against the next midnight so the whole cursor day is kept.
  if (cursor) {
    const dayAfter = shiftDay(cursor.date, 1)
    attendanceQ = attendanceQ.lte('date', cursor.date)
    portfolioQ = portfolioQ.lte('entry_date', cursor.date)
    feesQ = feesQ.lt('paid_at', dayAfter)
    reportsQ = reportsQ.lt('generated_at', dayAfter)
    dailyQ = dailyQ.lte('report_date', cursor.date)
    incidentsQ = incidentsQ.lte('incident_date', cursor.date)
  }

  const [attendance, portfolio, artWall, fees, reports, daily, incidentsResult] = await Promise.all(
    [attendanceQ, portfolioQ, artWallQ, feesQ, reportsQ, dailyQ, incidentsQ]
  )

  // Normalize into unified events (push order = source order for same-day events)
  const events: TimelineEvent[] = []

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
      date: r.artwork_date ?? String(r.created_at ?? '').slice(0, 10),
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

  for (const r of incidentsResult.data ?? []) {
    const typeLabel = (r.type as string).replace(/_/g, ' ')
    events.push({
      type: 'incident',
      date: r.incident_date,
      title: `${(r.severity as string).charAt(0).toUpperCase() + (r.severity as string).slice(1)} ${typeLabel}`,
      subtitle: r.description ? (r.description as string).slice(0, 80) : undefined,
    })
  }

  return c.json(pageTimeline(events, limit, cursor))
})

// GET single student
students.get('/:id', async (c) => {
  const { id } = c.req.param()
  if (!isValidUUID(id)) return c.json({ error: 'Invalid ID' }, 400)
  const { data, error } = await supabase
    .from('students')
    .select(`*, attendance(*), classrooms(name, academic_year), ${PARENT_JOIN}`)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return c.json({ error: 'Student not found' }, 404)
  return c.json(flattenStudent(data as Record<string, unknown>))
})

// POST bulk import students
students.post('/bulk', async (c) => {
  const body = await c.req.json()
  const rows: Record<string, string>[] = Array.isArray(body?.students) ? body.students : []

  if (rows.length === 0) return c.json({ error: 'No students provided' }, 400)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const valid: { rowNum: number; row: Record<string, string> }[] = []
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
    valid.push({
      rowNum,
      row: sanitiseStrings({
        full_name: row.full_name.trim(),
        date_of_birth: row.date_of_birth?.trim() || '',
        gender: row.gender,
        class_name: row.class_name.trim(), // kept for class_id lookup below; stripped before insert
        parent_name: row.parent_name.trim(),
        parent_email: row.parent_email.trim(),
        parent_phone: row.parent_phone.trim(),
      }),
    })
  })

  if (valid.length === 0) return c.json({ imported: 0, failed })

  // Resolve class_id from class_name for each valid row
  const uniqueClassNames = [...new Set(valid.map((v) => v.row.class_name))]
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
  for (const { rowNum, row: r } of valid) {
    const { class_name: _cn, parent_name, parent_email, parent_phone, ...rest } = r
    if (!classMap[_cn]) {
      failed.push({
        row: rowNum,
        reason: `class_name '${_cn}' not found in classrooms`,
      })
      continue
    }
    parentInfoMap[toInsert.length] = { parent_name, parent_email, parent_phone }
    toInsert.push({ ...rest, class_id: classMap[_cn], ...auditCreate(c) })
  }

  if (toInsert.length > 0) {
    const { data: inserted, error } = await supabase.from('students').insert(toInsert).select('id')

    if (error) {
      logger.error({ error: error.message }, 'Failed to bulk import students')
      return c.json({ error: 'Failed to import students' }, 500)
    }

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
    .select(`*, classrooms(name, academic_year), ${PARENT_JOIN}`)
    .single()

  if (error) {
    logger.error({ error: error.message }, 'Failed to create student')
    return c.json({ error: 'Failed to create student' }, 500)
  }

  const student = flattenStudent(data as Record<string, unknown>)

  // Auto-create/find parent and link to student. The insert was read back before the link
  // existed, so the response carries the parent from the form.
  if (parent_name && parent_email && parent_phone) {
    const { parentId } = await upsertParentLink(data.id, parent_name, parent_email, parent_phone)
    if (parentId) {
      student.parent = {
        full_name: parent_name,
        email: parent_email.trim().toLowerCase(),
        phone: parent_phone,
      }
    }
  }

  return c.json(student, 201)
})

// PUT update student
students.put('/:id', zValidator('json', studentSchema.partial()), async (c) => {
  const { id } = c.req.param()
  if (!isValidUUID(id)) return c.json({ error: 'Invalid ID' }, 400)
  const body = sanitiseStrings(c.req.valid('json'))

  // Separate parent fields from student fields
  const { parent_name, parent_email, parent_phone, ...studentFields } = body as Record<
    string,
    string
  >

  // Sync the parent first when all three parent fields are present, so the read-back
  // below already shows the parent as saved
  if (parent_name && parent_email && parent_phone) {
    // The parent the form showed: also confirms the student exists before touching parents
    const { data: current, error: currentError } = await supabase
      .from('students')
      .select(`id, ${PARENT_JOIN}`)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (currentError?.code === 'PGRST116' || (!currentError && !current)) {
      return c.json({ error: 'Student not found' }, 404)
    }
    if (currentError) {
      logger.error({ error: currentError.message }, 'Failed to read student before update')
      return c.json({ error: 'Failed to update student' }, 500)
    }

    const links = (current as Record<string, unknown>).parent_students as ParentLinks
    const shown = activeParent(links)
    const shownLink = links?.find((link) => !link.deleted_at && link.parents?.id === shown?.id)
    const normEmail = parent_email.trim().toLowerCase()
    const replacing = !!shown && shown.email?.toLowerCase() !== normEmail

    const { parentId } = await upsertParentLink(id, parent_name, parent_email, parent_phone, {
      linkCreatedAt: replacing ? shownLink?.created_at : undefined,
      emaillessParentId: shown?.id && !shown.email ? shown.id : undefined,
    })

    // A different email is a different parent: it replaces the shown one on this student
    // only. The old parent keeps their record, other children and portal access. (An
    // emailless shown parent that just got its email filled in has the same id: no unlink.)
    if (parentId && shown?.id && shown.id !== parentId) {
      await supabase
        .from('parent_students')
        .update(auditDelete(c))
        .eq('parent_id', shown.id)
        .eq('student_id', id)
        .is('deleted_at', null)
    }
  }

  const { data, error } = await supabase
    .from('students')
    .update({ ...studentFields, ...auditUpdate(c) })
    .eq('id', id)
    .select(`*, classrooms(name, academic_year), ${PARENT_JOIN}`)
    .single()

  if (error) {
    logger.error({ error: error.message }, 'Failed to update student')
    return c.json({ error: 'Failed to update student' }, 500)
  }

  return c.json(flattenStudent(data as Record<string, unknown>))
})

// DELETE student (soft delete)
students.delete('/:id', async (c) => {
  const { id } = c.req.param()
  if (!isValidUUID(id)) return c.json({ error: 'Invalid ID' }, 400)
  const { error } = await supabase
    .from('students')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    logger.error({ error: error.message }, 'Failed to delete student')
    return c.json({ error: 'Failed to delete student' }, 500)
  }
  return c.json({ message: 'Student deleted' })
})

// Portal access (access code, PIN, revoke) is managed per parent in routes/parents.ts

export default students
