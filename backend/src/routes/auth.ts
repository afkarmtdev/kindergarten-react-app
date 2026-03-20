import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'

const auth = new Hono()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// ── Simple in-memory rate limiter: 10 attempts per IP per minute ──────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (record.count >= 10) return false
  record.count++
  return true
}

// Purge expired entries every 5 minutes to prevent unbounded Map growth
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of loginAttempts) {
    if (now > record.resetAt) loginAttempts.delete(ip)
  }
}, 5 * 60_000).unref()

// POST login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const ip =
    (c.req.header('x-forwarded-for') ?? '').split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Too many login attempts. Please wait a minute and try again.' }, 429)
  }

  const { email, password } = c.req.valid('json')

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return c.json({ error: error.message }, 401)

  return c.json({
    user: data.user,
    session: data.session,
  })
})

// POST logout
auth.post('/logout', async (c) => {
  // No need to call supabase.auth.signOut() here — the frontend clears the
  // local Supabase session, and JWT tokens are stateless (they expire naturally).
  // The backend service-role client doesn't hold user sessions.
  return c.json({ message: 'Logged out' })
})

// GET me
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'No token' }, 401)

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) return c.json({ error: 'Invalid token' }, 401)
  return c.json(user)
})

export default auth
