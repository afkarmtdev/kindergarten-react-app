// ─── Inquiries (admin read) ───────────────────────────────────────────────────
// Paginated GET for admins to review enquiries submitted via the landing page.

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { auditUpdate } from '../lib/audit'

const inquiriesAdmin = new Hono()

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
  status: z.enum(['new', 'contacted', 'enrolled', 'closed', '']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

// GET /api/inquiries — paginated, filtered by status/date/search
inquiriesAdmin.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search, status, from, to } = c.req.valid('query')

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
  if (status) query = query.eq('status', status)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to + 'T23:59:59')

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

// PUT /api/inquiries/:id/status — update inquiry status
const statusSchema = z.object({
  status: z.enum(['new', 'contacted', 'enrolled', 'closed']),
})

inquiriesAdmin.put('/:id/status', zValidator('json', statusSchema), async (c) => {
  const { id } = c.req.param()
  const { status } = c.req.valid('json')

  const { data, error } = await supabase
    .from('inquiries')
    .update({ status, ...auditUpdate(c) })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export default inquiriesAdmin
