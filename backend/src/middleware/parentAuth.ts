import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import { createHash } from 'crypto'
import { supabase } from '../db/supabase'

export const parentMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const deviceId = c.req.header('X-Device-Id')
  if (!deviceId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await verify(token, process.env.PORTAL_JWT_SECRET!, 'HS256')
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { data: session } = await supabase
    .from('parent_sessions')
    .select('parent_id, device_id, expires_at')
    .eq('token_hash', tokenHash)
    .single()

  if (!session) {
    return c.json({ error: 'Session not found or revoked' }, 401)
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('parent_sessions').delete().eq('token_hash', tokenHash)
    return c.json({ error: 'Session expired' }, 401)
  }

  const deviceIdHash = createHash('sha256').update(deviceId).digest('hex')
  if (deviceIdHash !== session.device_id) {
    return c.json({ error: 'Session not valid for this device' }, 401)
  }

  // Fetch child student IDs for this parent
  const { data: links } = await supabase
    .from('parent_students')
    .select('student_id')
    .eq('parent_id', session.parent_id)
    .is('deleted_at', null)

  const childIds = (links ?? []).map((l: { student_id: string }) => l.student_id)

  c.set('parentId', session.parent_id)
  c.set('parentChildIds', childIds)
  await next()
})
