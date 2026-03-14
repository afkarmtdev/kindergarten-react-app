import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createHash } from 'crypto'
import { sign } from 'hono/jwt'
import { supabase } from '../db/supabase'
import { MAX_DEVICE_SESSIONS } from '../lib/constants'

const app = new Hono()

function parseDeviceLabel(ua: string): string {
  // Extract browser
  let browser = 'Unknown browser'
  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'

  // Extract OS
  let os = 'Unknown OS'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux')) os = 'Linux'

  return `${browser} on ${os}`
}

// ── Rate limiter: 10 attempts per IP per minute ─────────────────────────────
const portalLoginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkPortalRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = portalLoginAttempts.get(ip)
  if (!record || now > record.resetAt) {
    portalLoginAttempts.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (record.count >= 10) return false
  record.count++
  return true
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of portalLoginAttempts) {
    if (now > record.resetAt) portalLoginAttempts.delete(ip)
  }
}, 5 * 60_000).unref()

const loginSchema = z.object({
  access_code: z.string().min(1),
  pin: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, 'PIN must be 6 digits'),
})

// POST /api/portal/login — public, no auth required
app.post('/login', zValidator('json', loginSchema), async (c) => {
  const ip =
    (c.req.header('x-forwarded-for') ?? '').split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  if (!checkPortalRateLimit(ip)) {
    return c.json({ error: 'Too many login attempts. Please wait a minute and try again.' }, 429)
  }

  const deviceId = c.req.header('X-Device-Id')
  if (!deviceId) {
    return c.json({ error: 'Device ID required' }, 400)
  }

  const { access_code, pin } = c.req.valid('json')

  // Query parents table by access_code
  const { data: parent } = await supabase
    .from('parents')
    .select('id, full_name, email, phone, portal_pin_hash')
    .eq('access_code', access_code)
    .is('deleted_at', null)
    .single()

  if (!parent || !parent.portal_pin_hash) {
    return c.json({ error: 'Invalid access code or PIN' }, 401)
  }

  const valid = await Bun.password.verify(pin, parent.portal_pin_hash)
  if (!valid) {
    return c.json({ error: 'Invalid access code or PIN' }, 401)
  }

  // Enforce per-parent device limit
  const now = new Date().toISOString()
  const { count: activeCount } = await supabase
    .from('parent_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', parent.id)
    .gt('expires_at', now)

  if ((activeCount ?? 0) >= MAX_DEVICE_SESSIONS) {
    return c.json(
      {
        error: 'Device limit reached',
        message: `You can only be logged in on ${MAX_DEVICE_SESSIONS} devices at a time. Please remove a device from your account first.`,
        max_devices: MAX_DEVICE_SESSIONS,
      },
      409
    )
  }

  const deviceLabel = parseDeviceLabel(c.req.header('User-Agent') ?? 'Unknown device')

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  const payload = {
    parent_id: parent.id,
    exp: Math.floor(expiresAt.getTime() / 1000),
  }

  const token = await sign(payload, process.env.PORTAL_JWT_SECRET!, 'HS256')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const deviceIdHash = createHash('sha256').update(deviceId).digest('hex')

  const { error: sessionError } = await supabase.from('parent_sessions').insert({
    parent_id: parent.id,
    token_hash: tokenHash,
    device_id: deviceIdHash,
    device_label: deviceLabel,
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
    .is('deleted_at', null)

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
