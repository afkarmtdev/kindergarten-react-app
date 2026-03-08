import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'

const dailyReports = new Hono()

const reportSchema = z.object({
  meals_eaten: z.enum(['all', 'most', 'some', 'none']).nullable().optional(),
  nap_minutes: z.number().int().min(0).max(480).nullable().optional(),
  toilet_count: z.number().int().min(0).max(30).nullable().optional(),
  mood: z.enum(['happy', 'okay', 'tired', 'upset']).nullable().optional(),
  activity_note: z.string().max(1000).nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
})

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  class_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

// GET /api/daily-reports?date=YYYY-MM-DD&class_id=UUID
// Returns all students for the given date with their report (null if not filled)
dailyReports.get('/', zValidator('query', querySchema), async (c) => {
  const { date, class_id, page, limit } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Fetch students
  let studentQuery = supabase
    .from('students')
    .select('id, full_name, classrooms(name), photo_url', { count: 'exact' })
    .order('full_name')
    .range(from, to)

  if (class_id) studentQuery = studentQuery.eq('class_id', class_id)

  const { data: students, error: studentError, count } = await studentQuery
  if (studentError) return c.json({ error: studentError.message }, 500)

  if (!students || students.length === 0) {
    return c.json({
      data: [],
      meta: { total: 0, page, limit, totalPages: 0 },
    })
  }

  const studentIds = students.map((s) => s.id)

  // Fetch existing reports for these students on this date
  const { data: reports, error: reportError } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('report_date', date)
    .in('student_id', studentIds)

  if (reportError) return c.json({ error: reportError.message }, 500)

  const reportMap = new Map((reports ?? []).map((r) => [r.student_id, r]))

  const data = students.map((s) => {
    const { classrooms, ...rest } = s as Record<string, unknown>
    const cls = classrooms as { name: string } | null
    return {
      student: { ...rest, class_name: cls?.name ?? null },
      report: reportMap.get(s.id) ?? null,
    }
  })

  const total = count ?? 0
  return c.json({
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
})

// PUT /api/daily-reports/:studentId/:date — upsert a report
dailyReports.put('/:studentId/:date', zValidator('json', reportSchema), async (c) => {
  const { studentId, date } = c.req.param()
  const user = c.get('user' as never) as { email?: string } | undefined
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('daily_reports')
    .upsert(
      {
        student_id: studentId,
        report_date: date,
        ...body,
        recorded_by: user?.email ?? null,
      },
      { onConflict: 'student_id,report_date' }
    )
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE /api/daily-reports/:id
dailyReports.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase.from('daily_reports').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Report deleted' })
})

export default dailyReports
