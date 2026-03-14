import { z } from 'zod'

// ── Env validation — fail fast before anything else ──────────────────────────
const envSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:5173'),
  PORT: z.coerce.number().int().positive().optional().default(3000),
  PORTAL_JWT_SECRET: z.string().min(32, 'PORTAL_JWT_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .optional()
    .default('info'),
})

const envResult = envSchema.safeParse(process.env)
if (!envResult.success) {
  console.error('Missing or invalid environment variables:')
  for (const [field, messages] of Object.entries(envResult.error.flatten().fieldErrors)) {
    console.error(`  ${field}: ${(messages as string[]).join(', ')}`)
  }
  process.exit(1)
}

// ── Imports ───────────────────────────────────────────────────────────────────
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import auth from './routes/auth'
import students from './routes/students'
import attendance from './routes/attendance'
import classes from './routes/classes'
import gallery from './routes/gallery'
import announcements from './routes/announcements'
import documentNumbering from './routes/documentNumbering'
import fees, { feePlans } from './routes/fees'
import schoolInfo from './routes/schoolInfo'
import testimonials from './routes/testimonials'
import inquiries from './routes/inquiries'
import inquiriesAdmin from './routes/inquiriesAdmin'
import artWall from './routes/artWall'
import dailyReports from './routes/dailyReports'
import portfolioEntries from './routes/portfolioEntries'
import portfolioReports from './routes/portfolioReports'
import parents from './routes/parents'
import parentAuth from './routes/parentAuth'
import portal from './routes/portal'
import { authMiddleware } from './middleware/auth'
import { parentMiddleware } from './middleware/parentAuth'
import { supabase } from './db/supabase'
import { logger } from './lib/logger'

const app = new Hono()

// ── Security headers ──────────────────────────────────────────────────────────
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
})

// ── Global middleware ─────────────────────────────────────────────────────────
app.use('*', honoLogger())
app.use('*', prettyJSON())
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Public routes (no auth) ───────────────────────────────────────────────────
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

// Public testimonials read — visible only (LandingPage visitors)
app.get('/api/public/testimonials', async (c) => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// Public announcements read — non-expired only (LandingPage visitors)
app.get('/api/public/announcements', async (c) => {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// Public school info — no auth required (LandingPage visitors)
app.get('/api/public/school-info', async (c) => {
  const { data, error } = await supabase.from('school_info').select('*').limit(1).single()
  if (error) return c.json({ data: null }, 200)
  return c.json({ data })
})

// Public art wall — visible items only, paginated (LandingPage visitors)
app.get('/api/public/art-wall', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(24, Math.max(1, Number(c.req.query('limit') ?? 8)))
  const offset = (page - 1) * limit
  const { data, error, count } = await supabase
    .from('art_wall')
    .select('*', { count: 'exact' })
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return c.json({ error: error.message }, 500)
  const total = count ?? 0
  return c.json({
    data: data ?? [],
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
})

// Public inquiries — no auth required (LandingPage enrollment form)
app.route('/api/public/inquiries', inquiries)

// Parent portal login/logout — public (must be before authMiddleware)
app.route('/api/portal', parentAuth)

// Parent portal data routes — parentMiddleware only (NOT authMiddleware)
// Skip login/logout (they're public, handled by parentAuth above)
app.use('/api/portal/*', async (c, next) => {
  if (c.req.path === '/api/portal/login' || c.req.path === '/api/portal/logout') return next()
  return parentMiddleware(c, next)
})
app.route('/api/portal', portal)

// ── Protected routes ──────────────────────────────────────────────────────────
// Skip authMiddleware for portal paths — parentMiddleware already handles those
app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/portal/')) return next()
  return authMiddleware(c, next)
})
app.route('/api/students', students)
app.route('/api/attendance', attendance)
app.route('/api/classes', classes)
app.route('/api/gallery', gallery)
app.route('/api/announcements', announcements)
app.route('/api/document-numbering', documentNumbering)
app.route('/api/fee-plans', feePlans)
app.route('/api/fees', fees)
app.route('/api/school-info', schoolInfo)
app.route('/api/testimonials', testimonials)
app.route('/api/inquiries', inquiriesAdmin)
app.route('/api/art-wall', artWall)
app.route('/api/parents', parents)
app.route('/api/daily-reports', dailyReports)
app.route('/api/portfolio-entries', portfolioEntries)
app.route('/api/portfolio-reports', portfolioReports)

// ── 404 handler ───────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Route not found' }, 404))

// ── Error handler ─────────────────────────────────────────────────────────────
app.onError((err, c) => {
  logger.error({ err, path: c.req.path, method: c.req.method }, 'Unhandled error')
  return c.json({ error: 'Internal server error' }, 500)
})

// ── Start ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 3000
logger.info(`Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
