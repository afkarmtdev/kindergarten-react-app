// ─── Careers (public) ─────────────────────────────────────────────────────────
// Public endpoints: submit job application (rate-limited) + list published postings.

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate } from '../lib/audit'
import { logger } from '../lib/logger'

const careers = new Hono()

// ── Rate limiting ────────────────────────────────────────────────────────────

const applicationAttempts = new Map<string, { count: number; resetAt: number }>()

function checkApplicationRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = applicationAttempts.get(ip)
  if (!record || now > record.resetAt) {
    applicationAttempts.set(ip, { count: 1, resetAt: now + 600_000 })
    return true
  }
  if (record.count >= 3) return false
  record.count++
  return true
}

// Purge expired entries every 15 minutes to prevent unbounded Map growth
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of applicationAttempts) {
    if (now > record.resetAt) applicationAttempts.delete(ip)
  }
}, 15 * 60_000).unref()

// ── POST / — Submit job application ─────────────────────────────────────────

const applicationSchema = z.object({
  posting_id: z.string().uuid(),
  applicant_name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(1).max(50),
  resume_url: z.string().url().optional().or(z.literal('')),
  cover_message: z.string().max(2000).optional().or(z.literal('')),
})

careers.post('/', zValidator('json', applicationSchema), async (c) => {
  const ip =
    (c.req.header('x-forwarded-for') ?? '').split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  if (!checkApplicationRateLimit(ip)) {
    return c.json({ error: 'Too many applications. Please try again later.' }, 429)
  }
  const body = sanitiseStrings(c.req.valid('json'))
  const { error } = await supabase.from('job_applications').insert({ ...body, ...auditCreate(c) })
  if (error) {
    logger.error({ error: error.message }, 'Failed to submit application')
    return c.json({ error: 'Failed to submit application' }, 500)
  }
  return c.json({ success: true }, 201)
})

// ── GET /postings — Public listing of published postings ────────────────────

careers.get('/postings', async (c) => {
  const { data, error } = await supabase
    .from('job_postings')
    .select(
      'id, title, type, department, description, requirements, salary_min, salary_max, display_order, status, created_at'
    )
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) {
    logger.error({ error: error.message }, 'Failed to fetch postings')
    return c.json({ error: 'Failed to fetch postings' }, 500)
  }
  return c.json({ data: data ?? [] })
})

export default careers
