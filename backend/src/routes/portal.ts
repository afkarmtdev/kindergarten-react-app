import { Hono } from 'hono'
import { supabase } from '../db/supabase'

// All routes here are protected by parentMiddleware in index.ts
// c.get('parentStudentId') is always set — never trust a client-supplied student_id
const app = new Hono()

// GET /api/portal/me — student profile for the authenticated parent
app.get('/me', async (c) => {
  const studentId = c.get('parentStudentId')

  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, date_of_birth, gender, classrooms(name), photo_url')
    .eq('id', studentId)
    .single()

  if (error || !data) return c.json({ error: 'Student not found' }, 404)
  const { classrooms, ...rest } = data as { classrooms?: { name?: string } | null } & typeof data
  return c.json({ data: { ...rest, class_name: classrooms?.name ?? null } })
})

// GET /api/portal/attendance?page&limit — paginated attendance for this student
app.get('/attendance', async (c) => {
  const studentId = c.get('parentStudentId')
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') ?? 20)))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('attendance')
    .select('id, date, status, notes, created_at', { count: 'exact' })
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .range(from, to)

  if (error) return c.json({ error: 'Failed to fetch attendance' }, 500)

  const total = count ?? 0
  return c.json({
    data: data ?? [],
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
})

// GET /api/portal/fees?page&limit — fee records for this student
// Intentionally omits discount_reason and internal admin fields
app.get('/fees', async (c) => {
  const studentId = c.get('parentStudentId')
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
    .order('due_date', { ascending: false })
    .range(from, to)

  if (error) return c.json({ error: 'Failed to fetch fees' }, 500)

  const total = count ?? 0
  return c.json({
    data: data ?? [],
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
})

// GET /api/portal/announcements — non-expired announcements (same as public feed)
app.get('/announcements', async (c) => {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, category, image_url, is_pinned, expires_at, created_at')
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return c.json({ error: 'Failed to fetch announcements' }, 500)
  return c.json({ data: data ?? [] })
})

// GET /api/portal/daily-reports?limit — recent daily reports for this student
app.get('/daily-reports', async (c) => {
  const studentId = c.get('parentStudentId')
  const limit = Math.min(30, Math.max(1, Number(c.req.query('limit') ?? 14)))

  const { data, error } = await supabase
    .from('daily_reports')
    .select(
      'id, report_date, meals_eaten, nap_minutes, toilet_count, mood, activity_note, photo_url, created_at'
    )
    .eq('student_id', studentId)
    .order('report_date', { ascending: false })
    .limit(limit)

  if (error) return c.json({ error: 'Failed to fetch daily reports' }, 500)
  return c.json({ data: data ?? [] })
})

// GET /api/portal/portfolio?term — portfolio entries + report card for this student
app.get('/portfolio', async (c) => {
  const studentId = c.get('parentStudentId')
  const term = c.req.query('term')

  // Fetch all entries to extract available terms, then filter if term specified
  const { data: allEntries, error: entriesError } = await supabase
    .from('portfolio_entries')
    .select('id, domain, observation, photo_url, term, entry_date, created_at')
    .eq('student_id', studentId)
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

export default app
