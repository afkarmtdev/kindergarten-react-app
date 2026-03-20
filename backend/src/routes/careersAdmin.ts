// ─── Careers Admin ────────────────────────────────────────────────────────────
// CRUD for job postings + job applications management (admin-only, auth required).

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'

const careersAdmin = new Hono()

// ── Job Postings ─────────────────────────────────────────────────────────────

const postingsPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  status: z.enum(['draft', 'published', 'closed', '']).optional(),
})

// GET /postings — paginated list
careersAdmin.get('/postings', zValidator('query', postingsPaginationSchema), async (c) => {
  const { page, limit, search, status } = c.req.valid('query')

  let query = supabase
    .from('job_postings')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }
  if (status) query = query.eq('status', status)

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

const postingTypeEnum = z.enum(['full_time', 'part_time', 'contract', 'internship'])
const postingStatusEnum = z.enum(['draft', 'published', 'closed'])

const createPostingSchema = z.object({
  title: z.string().min(1).max(200),
  type: postingTypeEnum,
  department: z.string().max(200).optional().or(z.literal('')),
  description: z.string().min(1).max(5000),
  requirements: z.string().max(5000).optional().or(z.literal('')),
  salary_min: z.coerce.number().min(0).optional().nullable(),
  salary_max: z.coerce.number().min(0).optional().nullable(),
  status: postingStatusEnum.default('draft'),
  display_order: z.coerce.number().int().optional(),
})

// POST /postings — create posting
careersAdmin.post('/postings', zValidator('json', createPostingSchema), async (c) => {
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase
    .from('job_postings')
    .insert({ ...body, ...auditCreate(c) })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

const updatePostingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: postingTypeEnum.optional(),
  department: z.string().max(200).optional().or(z.literal('')),
  description: z.string().min(1).max(5000).optional(),
  requirements: z.string().max(5000).optional().or(z.literal('')),
  salary_min: z.coerce.number().min(0).optional().nullable(),
  salary_max: z.coerce.number().min(0).optional().nullable(),
  status: postingStatusEnum.optional(),
  display_order: z.coerce.number().int().optional(),
})

// PUT /postings/:id — update posting
careersAdmin.put('/postings/:id', zValidator('json', updatePostingSchema), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase
    .from('job_postings')
    .update({ ...body, ...auditUpdate(c) })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE /postings/:id — soft-delete
careersAdmin.delete('/postings/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase
    .from('job_postings')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// ── Job Applications ─────────────────────────────────────────────────────────

const applicationsPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['new', 'reviewed', 'interviewed', 'hired', 'rejected', '']).optional(),
  posting_id: z.string().uuid().optional(),
})

// GET /applications — paginated list
careersAdmin.get('/applications', zValidator('query', applicationsPaginationSchema), async (c) => {
  const { page, limit, search, status, posting_id } = c.req.valid('query')

  let query = supabase
    .from('job_applications')
    .select('*, job_postings(title)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `applicant_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }
  if (status) query = query.eq('status', status)
  if (posting_id) query = query.eq('posting_id', posting_id)

  const { data, count, error } = await query.range((page - 1) * limit, page * limit - 1)
  if (error) return c.json({ error: error.message }, 500)

  const mapped = (data ?? []).map((row: Record<string, unknown>) => {
    const { job_postings, ...rest } = row
    return {
      ...rest,
      posting_title: (job_postings as { title?: string } | null)?.title ?? null,
    }
  })

  return c.json({
    data: mapped,
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
})

// GET /applications/:id — single application
careersAdmin.get('/applications/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('job_applications')
    .select('*, job_postings(title)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return c.json({ error: 'Not found' }, 404)
    return c.json({ error: error.message }, 500)
  }

  const { job_postings, ...rest } = data as Record<string, unknown>
  return c.json({
    ...rest,
    posting_title: (job_postings as { title?: string } | null)?.title ?? null,
  })
})

// PUT /applications/:id/status — update application status
const applicationStatusSchema = z.object({
  status: z.enum(['new', 'reviewed', 'interviewed', 'hired', 'rejected']),
})

careersAdmin.put(
  '/applications/:id/status',
  zValidator('json', applicationStatusSchema),
  async (c) => {
    const { id } = c.req.param()
    const { status } = c.req.valid('json')

    const { data, error } = await supabase
      .from('job_applications')
      .update({ status, ...auditUpdate(c) })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
  }
)

// DELETE /applications/:id — soft-delete
careersAdmin.delete('/applications/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase
    .from('job_applications')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

export default careersAdmin
