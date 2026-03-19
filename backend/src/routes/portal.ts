import { Hono } from 'hono'
import { createHash } from 'crypto'
import { supabase } from '../db/supabase'
import { MAX_DEVICE_SESSIONS } from '../lib/constants'

// All routes here are protected by parentMiddleware in index.ts
// c.get('parentId') and c.get('parentChildIds') are always set
const app = new Hono()

/**
 * Resolve which student_id to use for the current request.
 * If ?student_id is provided, validate it's in the parent's allowed children.
 * If not provided, default to the first child.
 * Returns null if no valid student can be resolved (→ 403).
 */
function resolveStudentId(c: {
  req: { query: (k: string) => string | undefined }
  get: (k: string) => unknown
}): string | null {
  const requested = c.req.query('student_id')
  const allowed: string[] = c.get('parentChildIds') as string[]
  if (!requested) return allowed[0] ?? null
  return allowed.includes(requested) ? requested : null
}

// GET /api/portal/me — parent profile with children
app.get('/me', async (c) => {
  const parentId = c.get('parentId') as string

  const { data: parent, error } = await supabase
    .from('parents')
    .select('id, full_name, email, phone')
    .eq('id', parentId)
    .single()

  if (error || !parent) return c.json({ error: 'Parent not found' }, 404)

  // Fetch children via parent_students join
  const { data: links } = await supabase
    .from('parent_students')
    .select(
      'relationship, students(id, full_name, date_of_birth, gender, photo_url, classrooms(name))'
    )
    .eq('parent_id', parentId)
    .is('deleted_at', null)

  const children = (links ?? []).map((link: Record<string, unknown>) => {
    const student = link.students as {
      id: string
      full_name: string
      date_of_birth: string
      gender: string
      photo_url: string | null
      classrooms: { name: string } | null
    } | null
    return {
      id: student?.id ?? '',
      full_name: student?.full_name ?? '',
      date_of_birth: student?.date_of_birth ?? '',
      gender: student?.gender ?? 'male',
      class_name: student?.classrooms?.name ?? null,
      photo_url: student?.photo_url ?? null,
      relationship: link.relationship as string,
    }
  })

  return c.json({ data: { ...parent, children } })
})

// GET /api/portal/attendance?page&limit&student_id — paginated attendance for a child
app.get('/attendance', async (c) => {
  const studentId = resolveStudentId(c)
  if (!studentId) return c.json({ error: 'Access denied' }, 403)

  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') ?? 20)))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('attendance')
    .select('id, date, status, notes, created_at', { count: 'exact' })
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .range(from, to)

  if (error) return c.json({ error: 'Failed to fetch attendance' }, 500)

  const total = count ?? 0
  return c.json({
    data: data ?? [],
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
})

// GET /api/portal/fees?page&limit&student_id — fee records for a child
app.get('/fees', async (c) => {
  const studentId = resolveStudentId(c)
  if (!studentId) return c.json({ error: 'Access denied' }, 403)

  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') ?? 20)))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('fee_records')
    .select(
      'id, type, description, amount_owed, amount_paid, discount_amount, status, due_date, paid_at, created_at',
      {
        count: 'exact',
      }
    )
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('due_date', { ascending: false })
    .range(from, to)

  if (error) return c.json({ error: 'Failed to fetch fees' }, 500)

  const total = count ?? 0
  return c.json({
    data: data ?? [],
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
})

// GET /api/portal/announcements — non-expired announcements (school-wide, no student scoping)
app.get('/announcements', async (c) => {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, category, image_url, is_pinned, expires_at, created_at')
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return c.json({ error: 'Failed to fetch announcements' }, 500)
  return c.json({ data: data ?? [] })
})

// GET /api/portal/daily-reports?limit&student_id — recent daily reports for a child
app.get('/daily-reports', async (c) => {
  const studentId = resolveStudentId(c)
  if (!studentId) return c.json({ error: 'Access denied' }, 403)

  const limit = Math.min(30, Math.max(1, Number(c.req.query('limit') ?? 14)))

  const { data, error } = await supabase
    .from('daily_reports')
    .select(
      'id, report_date, meals_eaten, nap_minutes, toilet_count, mood, activity_note, photo_url, created_at'
    )
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('report_date', { ascending: false })
    .limit(limit)

  if (error) return c.json({ error: 'Failed to fetch daily reports' }, 500)
  return c.json({ data: data ?? [] })
})

// GET /api/portal/portfolio?term&student_id — portfolio entries + report card for a child
app.get('/portfolio', async (c) => {
  const studentId = resolveStudentId(c)
  if (!studentId) return c.json({ error: 'Access denied' }, 403)

  const term = c.req.query('term')

  // Fetch all entries to extract available terms, then filter if term specified
  const { data: allEntries, error: entriesError } = await supabase
    .from('portfolio_entries')
    .select('id, domain, observation, photo_url, term, entry_date, created_at')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('entry_date', { ascending: false })

  if (entriesError) return c.json({ error: 'Failed to fetch portfolio' }, 500)

  const entries = allEntries ?? []
  const terms = [...new Set(entries.map((e: { term: string }) => e.term))].sort().reverse()
  const selectedTerm = term ?? terms[0] ?? null
  const filteredEntries = selectedTerm
    ? entries.filter((e: { term: string }) => e.term === selectedTerm)
    : entries

  const { data: report } = selectedTerm
    ? await supabase
        .from('portfolio_reports')
        .select('term, teacher_comment, principal_comment, generated_at')
        .eq('student_id', studentId)
        .eq('term', selectedTerm)
        .single()
    : { data: null }

  return c.json({
    entries: filteredEntries,
    report: report ?? null,
    terms,
  })
})

// GET /api/portal/devices — list active sessions for this parent
app.get('/devices', async (c) => {
  const parentId = c.get('parentId') as string
  const now = new Date().toISOString()

  const currentToken = c.req.header('Authorization')?.replace('Bearer ', '') ?? ''
  const currentTokenHash = createHash('sha256').update(currentToken).digest('hex')

  const { data, error } = await supabase
    .from('parent_sessions')
    .select('id, token_hash, device_label, created_at, expires_at')
    .eq('parent_id', parentId)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: 'Failed to fetch devices' }, 500)

  const sessions = (data ?? []).map(
    (s: {
      id: string
      token_hash: string
      device_label: string | null
      created_at: string
      expires_at: string
    }) => ({
      id: s.id,
      device_label: s.device_label ?? 'Unknown device',
      created_at: s.created_at,
      expires_at: s.expires_at,
      is_current: s.token_hash === currentTokenHash,
    })
  )

  return c.json({ data: sessions, max_devices: MAX_DEVICE_SESSIONS })
})

// DELETE /api/portal/devices/:sessionId — revoke a specific session
app.delete('/devices/:sessionId', async (c) => {
  const parentId = c.get('parentId') as string
  const { sessionId } = c.req.param()

  // Only allow deleting own sessions
  const { data: session } = await supabase
    .from('parent_sessions')
    .select('id, parent_id')
    .eq('id', sessionId)
    .eq('parent_id', parentId)
    .single()

  if (!session) return c.json({ error: 'Session not found' }, 404)

  const { error } = await supabase.from('parent_sessions').delete().eq('id', sessionId)

  if (error) return c.json({ error: 'Failed to revoke session' }, 500)
  return c.json({ ok: true })
})

// GET /api/portal/medical — read-only medical profile for a child
app.get('/medical', async (c) => {
  const studentId = resolveStudentId(c)
  if (!studentId) return c.json({ error: 'Access denied' }, 403)

  const { data, error } = await supabase
    .from('student_medical')
    .select('*')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .single()

  if (error && error.code !== 'PGRST116')
    return c.json({ error: 'Failed to fetch medical profile' }, 500)
  return c.json({ data: data ?? null })
})

// GET /api/portal/incidents — paginated incidents for a child
app.get('/incidents', async (c) => {
  const studentId = resolveStudentId(c)
  if (!studentId) return c.json({ error: 'Access denied' }, 403)

  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') ?? 20)))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('incidents')
    .select(
      'id, incident_date, incident_time, type, severity, description, action_taken, witnessed_by, parent_notified, photo_url, follow_up_notes, status, created_at',
      { count: 'exact' }
    )
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('incident_date', { ascending: false })
    .range(from, to)

  if (error) return c.json({ error: 'Failed to fetch incidents' }, 500)

  const total = count ?? 0
  return c.json({
    data: data ?? [],
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
})

export default app
