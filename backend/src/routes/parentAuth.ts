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

  // Query parents table by access_code
  const { data: parent } = await supabase
    .from('parents')
    .select('id, full_name, email, phone, portal_pin_hash')
    .eq('access_code', access_code)
    .single()

  if (!parent || !parent.portal_pin_hash) {
    return c.json({ error: 'Invalid access code or PIN' }, 401)
  }

  const valid = await Bun.password.verify(pin, parent.portal_pin_hash)
  if (!valid) {
    return c.json({ error: 'Invalid access code or PIN' }, 401)
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  const payload = {
    parent_id: parent.id,
    exp: Math.floor(expiresAt.getTime() / 1000),
  }

  const token = await sign(payload, process.env.PORTAL_JWT_SECRET!, 'HS256')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { error: sessionError } = await supabase.from('parent_sessions').insert({
    parent_id: parent.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  if (sessionError) {
    return c.json({ error: 'Failed to create session' }, 500)
  }

  // Fetch children via parent_students join
  const { data: links } = await supabase
    .from('parent_students')
    .select(
      'relationship, students(id, full_name, date_of_birth, gender, photo_url, classrooms(name))'
    )
    .eq('parent_id', parent.id)

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

  return c.json({
    token,
    parent: {
      id: parent.id,
      full_name: parent.full_name,
      email: parent.email,
      phone: parent.phone,
      children,
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
