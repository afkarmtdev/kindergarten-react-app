import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import { createHash } from 'crypto'
import { supabase } from '../db/supabase'

export const parentMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
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
    .select('student_id, expires_at')
    .eq('token_hash', tokenHash)
    .single()

  if (!session) {
    return c.json({ error: 'Session not found or revoked' }, 401)
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('parent_sessions').delete().eq('token_hash', tokenHash)
    return c.json({ error: 'Session expired' }, 401)
  }

  c.set('parentStudentId', session.student_id)
  await next()
})
