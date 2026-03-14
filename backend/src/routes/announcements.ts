import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'

const announcements = new Hono()

const announcementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.enum(['general', 'holiday', 'event', 'reminder']).default('general'),
  image_url: z.string().optional(),
  is_pinned: z.boolean().default(false),
  expires_at: z.string().optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  search: z.string().optional(),
  category: z.enum(['general', 'holiday', 'event', 'reminder', '']).optional(),
})

// GET all announcements (paginated) — admin
announcements.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search, category } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('announcements')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
  }
  if (category) {
    query = query.eq('category', category)
  }

  const { data, error, count } = await query

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

// GET single announcement
announcements.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .is('deleted_at', null)
    .eq('id', id)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

// POST create announcement
announcements.post('/', zValidator('json', announcementSchema), async (c) => {
  const raw = c.req.valid('json')
  const body = sanitiseStrings({ ...raw })
  const { data, error } = await supabase
    .from('announcements')
    .insert({ ...body, ...auditCreate(c) })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PUT update announcement
announcements.put('/:id', zValidator('json', announcementSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const raw = c.req.valid('json')
  const body = sanitiseStrings({ ...raw })

  const { data, error } = await supabase
    .from('announcements')
    .update({ ...body, ...auditUpdate(c) })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE announcement
announcements.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase
    .from('announcements')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Announcement deleted' })
})

export default announcements
