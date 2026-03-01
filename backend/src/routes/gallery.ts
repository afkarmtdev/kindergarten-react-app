import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { stripHtml } from '../lib/sanitise'

const gallery = new Hono()

const gallerySchema = z.object({
  photo_url: z.string().min(1),
  caption: z.string().optional(),
  display_order: z.number().int().min(0).default(0),
  is_visible: z.boolean().default(true),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  search: z.string().optional(),
})

// GET all gallery items (paginated) — admin
gallery.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('gallery_items')
    .select('*', { count: 'exact' })
    .order('display_order', { ascending: true })
    .range(from, to)

  if (search) {
    query = query.ilike('caption', `%${search}%`)
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

// GET single gallery item
gallery.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase.from('gallery_items').select('*').eq('id', id).single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

// POST create gallery item
gallery.post('/', zValidator('json', gallerySchema), async (c) => {
  const raw = c.req.valid('json')
  const body = { ...raw, caption: raw.caption ? stripHtml(raw.caption) : raw.caption }
  const { data, error } = await supabase.from('gallery_items').insert(body).select().single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PUT update gallery item
gallery.put('/:id', zValidator('json', gallerySchema.partial()), async (c) => {
  const { id } = c.req.param()
  const raw = c.req.valid('json')
  const body = { ...raw, caption: raw.caption ? stripHtml(raw.caption) : raw.caption }

  const { data, error } = await supabase
    .from('gallery_items')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE gallery item
gallery.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase.from('gallery_items').delete().eq('id', id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Gallery item deleted' })
})

export default gallery
