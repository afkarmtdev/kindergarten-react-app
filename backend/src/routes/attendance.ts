import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'

const attendance = new Hono()

const attendanceSchema = z.object({
  student_id: z.string().uuid(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().optional(),
  recorded_by: z.string(),
})

const datePageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'excused', '']).optional(),
})

// GET attendance by date (paginated)
attendance.get('/date/:date', zValidator('query', datePageSchema), async (c) => {
  const { date } = c.req.param()
  const { page, limit, search, status } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('attendance')
    .select('*, students(full_name, class_name, photo_url)', { count: 'exact' })
    .eq('date', date)
    .order('created_at')
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (search) {
    // filter via students name - requires a join workaround; simplest is to filter post-fetch for small sets
    // For production, use a DB view or RPC. Here we pass through and let the client filter.
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

// GET attendance by student
attendance.get('/student/:studentId', async (c) => {
  const { studentId } = c.req.param()
  const { from: fromDate, to: toDate, page = '1', limit = '20' } = c.req.query()

  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const rangeFrom = (pageNum - 1) * limitNum
  const rangeTo = rangeFrom + limitNum - 1

  let query = supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .range(rangeFrom, rangeTo)

  if (fromDate) query = query.gte('date', fromDate)
  if (toDate) query = query.lte('date', toDate)

  const { data, error, count } = await query
  if (error) return c.json({ error: error.message }, 500)

  return c.json({
    data: data ?? [],
    meta: {
      total: count ?? 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count ?? 0) / limitNum),
    },
  })
})

// POST mark attendance
attendance.post('/', zValidator('json', attendanceSchema), async (c) => {
  const body = c.req.valid('json')

  const { data, error } = await supabase
    .from('attendance')
    .upsert(body, { onConflict: 'student_id,date' })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// POST bulk attendance
attendance.post('/bulk', async (c) => {
  const records = await c.req.json()

  const { data, error } = await supabase
    .from('attendance')
    .upsert(records, { onConflict: 'student_id,date' })
    .select()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// GET summary stats
attendance.get('/stats/summary', async (c) => {
  const { month, year } = c.req.query()
  const targetMonth = month || new Date().getMonth() + 1
  const targetYear = year || new Date().getFullYear()

  const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
  const endDate = new Date(Number(targetYear), Number(targetMonth), 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) return c.json({ error: error.message }, 500)

  const summary = data.reduce(
    (acc, rec) => {
      acc[rec.status] = (acc[rec.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return c.json(summary)
})

// GET attendance trend for charts (non-paginated)
attendance.get(
  '/stats/trend',
  zValidator(
    'query',
    z.object({
      months: z.coerce.number().int().min(1).max(12).default(6),
    })
  ),
  async (c) => {
    const { months } = c.req.valid('query')

    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    const startDate = startMonth.toISOString().split('T')[0]
    const endDate = now.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance')
      .select('date, status')
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) return c.json({ error: error.message }, 500)

    const byMonth: Record<string, { total: number; present: number }> = {}
    for (const row of data ?? []) {
      const month = row.date.substring(0, 7)
      if (!byMonth[month]) byMonth[month] = { total: 0, present: 0 }
      byMonth[month].total++
      if (row.status === 'present' || row.status === 'late') {
        byMonth[month].present++
      }
    }

    const result = Object.entries(byMonth)
      .map(([month, { total, present }]) => ({
        month,
        total,
        present,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return c.json(result)
  }
)

export default attendance
