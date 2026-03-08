import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'

const portfolioEntries = new Hono()

const entrySchema = z.object({
  student_id: z.string().uuid(),
  domain: z.enum(['physical', 'cognitive', 'language', 'social_emotional', 'creative']),
  observation: z.string().min(1).max(2000),
  photo_url: z.string().url().nullable().optional(),
  term: z.string().min(1).max(20),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const querySchema = z.object({
  student_id: z.string().uuid(),
  term: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// GET /api/portfolio-entries?student_id=X&term=2024-T1
portfolioEntries.get('/', zValidator('query', querySchema), async (c) => {
  const { student_id, term, page, limit } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('portfolio_entries')
    .select('*', { count: 'exact' })
    .eq('student_id', student_id)
    .order('entry_date', { ascending: false })
    .range(from, to)

  if (term) query = query.eq('term', term)

  const { data, error, count } = await query
  if (error) return c.json({ error: error.message }, 500)

  return c.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
  })
})

// GET /api/portfolio-entries/:studentId/report/:term
// Returns entries grouped by domain + portfolio_report row for that student+term
portfolioEntries.get('/:studentId/report/:term', async (c) => {
  const { studentId, term } = c.req.param()

  const [entriesResult, reportResult] = await Promise.all([
    supabase
      .from('portfolio_entries')
      .select('*')
      .eq('student_id', studentId)
      .eq('term', term)
      .order('entry_date', { ascending: false }),
    supabase
      .from('portfolio_reports')
      .select('*')
      .eq('student_id', studentId)
      .eq('term', term)
      .single(),
  ])

  if (entriesResult.error) return c.json({ error: entriesResult.error.message }, 500)

  return c.json({
    entries: entriesResult.data ?? [],
    report: reportResult.data ?? null,
    term,
  })
})

// POST /api/portfolio-entries
portfolioEntries.post('/', zValidator('json', entrySchema), async (c) => {
  const user = c.get('user' as never) as { email?: string } | undefined
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('portfolio_entries')
    .insert({ ...body, recorded_by: user?.email ?? null })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PUT /api/portfolio-entries/:id
portfolioEntries.put('/:id', zValidator('json', entrySchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('portfolio_entries')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE /api/portfolio-entries/:id
portfolioEntries.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase.from('portfolio_entries').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Entry deleted' })
})

export default portfolioEntries
