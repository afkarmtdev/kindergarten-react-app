// ─── Inquiries (admin read) ───────────────────────────────────────────────────
// Paginated GET for admins to review enquiries submitted via the landing page.

import { Hono } from 'hono'
import { supabase } from '../db/supabase'

const inquiriesAdmin = new Hono()

// GET /api/inquiries — paginated, search by parent_name / child_name / phone
inquiriesAdmin.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') ?? '20')))
  const search = (c.req.query('search') ?? '').trim()

  let query = supabase
    .from('inquiries')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `parent_name.ilike.%${search}%,child_name.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query.range((page - 1) * limit, page * limit - 1)
  if (error) return c.json({ error: error.message }, 500)

  return c.json({
    data: data ?? [],
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
})

export default inquiriesAdmin
