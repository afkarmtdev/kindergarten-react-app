import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import auth from './routes/auth'
import students from './routes/students'
import attendance from './routes/attendance'
import classes from './routes/classes'
import gallery from './routes/gallery'
import { authMiddleware } from './middleware/auth'
import { supabase } from './db/supabase'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Public routes
app.route('/api/auth', auth)

// Public gallery read — no auth required (LandingPage visitors)
app.get('/api/public/gallery', async (c) => {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// Protected routes
app.use('/api/*', authMiddleware)
app.route('/api/students', students)
app.route('/api/attendance', attendance)
app.route('/api/classes', classes)
app.route('/api/gallery', gallery)

// 404 handler
app.notFound((c) => c.json({ error: 'Route not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = Number(process.env.PORT) || 3000

console.log(`Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
