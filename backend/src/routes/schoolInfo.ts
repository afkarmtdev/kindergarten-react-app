// ─── School Info ──────────────────────────────────────────────────────────────
// Single-row config table. GET fetches it; PUT upserts it.

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'

const schoolInfo = new Hono()

const schoolInfoSchema = z.object({
  school_name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  logo_url: z.string().url().nullable().optional(),
})

// ── GET /api/school-info ──────────────────────────────────────────────────────
schoolInfo.get('/', async (c) => {
  const { data, error } = await supabase.from('school_info').select('*').limit(1).single()

  if (error) return c.json({ data: null }, 200)
  return c.json({ data })
})

// ── PUT /api/school-info ──────────────────────────────────────────────────────
schoolInfo.put('/', zValidator('json', schoolInfoSchema), async (c) => {
  const body = sanitiseStrings(c.req.valid('json'))

  const { data: existing } = await supabase.from('school_info').select('id').limit(1).single()

  if (existing) {
    const { data, error } = await supabase
      .from('school_info')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ data })
  }

  const { data, error } = await supabase.from('school_info').insert(body).select().single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data }, 201)
})

export default schoolInfo
