import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'

const portfolioReports = new Hono()

const reportSchema = z.object({
  teacher_comment: z.string().max(3000).nullable().optional(),
  principal_comment: z.string().max(3000).nullable().optional(),
})

// PUT /api/portfolio-reports/:studentId/:term — upsert report card comments
portfolioReports.put('/:studentId/:term', zValidator('json', reportSchema), async (c) => {
  const { studentId, term } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('portfolio_reports')
    .upsert(
      {
        student_id: studentId,
        term,
        ...body,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,term' }
    )
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export default portfolioReports
