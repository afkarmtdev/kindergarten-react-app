import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'

const inquiries = new Hono()

const inquirySchema = z.object({
  parent_name: z.string().min(1).max(200),
  child_name: z.string().min(1).max(200),
  child_age: z.coerce.number().int().min(2).max(7),
  phone: z.string().min(1).max(50),
  message: z.string().max(1000).optional().default(''),
})

const inquiryAttempts = new Map<string, { count: number; resetAt: number }>()

function checkInquiryRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = inquiryAttempts.get(ip)
  if (!record || now > record.resetAt) {
    inquiryAttempts.set(ip, { count: 1, resetAt: now + 600_000 })
    return true
  }
  if (record.count >= 5) return false
  record.count++
  return true
}

// Purge expired entries every 15 minutes to prevent unbounded Map growth
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of inquiryAttempts) {
    if (now > record.resetAt) inquiryAttempts.delete(ip)
  }
}, 15 * 60_000).unref()

inquiries.post('/', zValidator('json', inquirySchema), async (c) => {
  const ip =
    (c.req.header('x-forwarded-for') ?? '').split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  if (!checkInquiryRateLimit(ip)) {
    return c.json({ error: 'Too many requests. Please try again later.' }, 429)
  }
  const body = sanitiseStrings(c.req.valid('json'))
  const { error } = await supabase.from('inquiries').insert(body)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true }, 201)
})

export default inquiries
