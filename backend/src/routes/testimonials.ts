import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'

const testimonials = new Hono()

const testimonialSchema = z.object({
  parent_name: z.string().min(1),
  parent_role: z.string().optional(),
  quote: z.string().min(1),
  avatar_url: z.string().optional(),
  display_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  search: z.string().optional(),
})

// GET public testimonials — no auth (LandingPage)
testimonials.get('/public', async (c) => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .is('deleted_at', null)
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// GET all testimonials (paginated) — admin
testimonials.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search } = c.req.valid('query')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('testimonials')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`parent_name.ilike.%${search}%,quote.ilike.%${search}%`)
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

// GET single testimonial
testimonials.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .is('deleted_at', null)
    .eq('id', id)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

// POST create testimonial
testimonials.post('/', zValidator('json', testimonialSchema), async (c) => {
  const raw = c.req.valid('json')
  const body = sanitiseStrings({ ...raw })
  const { data, error } = await supabase
    .from('testimonials')
    .insert({ ...body, ...auditCreate(c) })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PUT update testimonial
testimonials.put('/:id', zValidator('json', testimonialSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const raw = c.req.valid('json')
  const body = sanitiseStrings({ ...raw })

  const { data, error } = await supabase
    .from('testimonials')
    .update({ ...body, ...auditUpdate(c) })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE testimonial
testimonials.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase
    .from('testimonials')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Testimonial deleted' })
})

export default testimonials
