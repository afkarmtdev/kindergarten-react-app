import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createHash } from 'crypto'
import { sign } from 'hono/jwt'
import { supabase } from '../db/supabase'

const app = new Hono()

const loginSchema = z.object({
  access_code: z.string().min(1),
  pin: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, 'PIN must be 6 digits'),
})

// POST /api/portal/login — public, no auth required
app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { access_code, pin } = c.req.valid('json')

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, classrooms(name), photo_url, portal_pin_hash')
    .eq('access_code', access_code)
    .single()

  if (!student || !student.portal_pin_hash) {
    return c.json({ error: 'Invalid access code or PIN' }, 401)
  }

  const valid = await Bun.password.verify(pin, student.portal_pin_hash)
  if (!valid) {
    return c.json({ error: 'Invalid access code or PIN' }, 401)
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  const payload = {
    student_id: student.id,
    exp: Math.floor(expiresAt.getTime() / 1000),
  }

  const token = await sign(payload, process.env.PORTAL_JWT_SECRET!, 'HS256')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { error: sessionError } = await supabase.from('parent_sessions').insert({
    student_id: student.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  if (sessionError) {
    return c.json({ error: 'Failed to create session' }, 500)
  }

  const classrooms = student.classrooms as unknown as { name: string } | null

  return c.json({
    token,
    student: {
      id: student.id,
      full_name: student.full_name,
      class_name: classrooms?.name ?? null,
      photo_url: student.photo_url,
    },
  })
})

// POST /api/portal/logout — clears the session row
app.post('/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await supabase.from('parent_sessions').delete().eq('token_hash', tokenHash)
  }
  return c.json({ ok: true })
})

export default app
