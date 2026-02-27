import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'

const auth = new Hono()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// POST login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
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
  const { error } = await supabase.auth.signOut()
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Logged out' })
})

// GET me
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'No token' }, 401)

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) return c.json({ error: 'Invalid token' }, 401)
  return c.json(user)
})

export default auth
