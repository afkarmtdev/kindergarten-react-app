// ─── School Info ──────────────────────────────────────────────────────────────
// Single-row config table. GET fetches it; PUT upserts it.

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings, stripHtml } from '../lib/sanitise'

const schoolInfo = new Hono()

const dayHoursSchema = z.object({
  open: z.string().max(5).optional().default(''),
  close: z.string().max(5).optional().default(''),
})

const operatingHoursSchema = z
  .object({
    monday: dayHoursSchema,
    tuesday: dayHoursSchema,
    wednesday: dayHoursSchema,
    thursday: dayHoursSchema,
    friday: dayHoursSchema,
    saturday: dayHoursSchema,
    sunday: dayHoursSchema,
  })
  .nullable()
  .optional()

const schoolInfoSchema = z.object({
  school_name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  logo_url: z.string().url().nullable().optional(),
  whatsapp_number: z
    .string()
    .regex(/^\d{7,15}$/)
    .or(z.literal(''))
    .optional()
    .default(''),
  operating_hours: operatingHoursSchema,
  google_maps_embed_url: z
    .string()
    .optional()
    .default('')
    .refine(
      (val) =>
        val === '' ||
        val.startsWith('https://www.google.com/maps/embed') ||
        val.startsWith('https://maps.google.com/maps'),
      { message: 'Must be a valid Google Maps embed URL' }
    ),
  facebook_url: z.string().url().or(z.literal('')).optional().default(''),
  instagram_url: z.string().url().or(z.literal('')).optional().default(''),
  principal_name: z.string().max(200).optional().default(''),
  registration_number: z.string().max(100).optional().default(''),
})

// ── GET /api/school-info ──────────────────────────────────────────────────────
schoolInfo.get('/', async (c) => {
  const { data, error } = await supabase.from('school_info').select('*').limit(1).single()

  if (error) return c.json({ data: null }, 200)
  return c.json({ data })
})

// ── PUT /api/school-info ──────────────────────────────────────────────────────
schoolInfo.put('/', zValidator('json', schoolInfoSchema), async (c) => {
  const { operating_hours, principal_name, registration_number, ...stringFields } =
    c.req.valid('json')
  const sanitised = sanitiseStrings({
    ...stringFields,
    principal_name: principal_name ?? '',
    registration_number: registration_number ?? '',
  })
  const sanitisedHours = operating_hours
    ? (Object.fromEntries(
        Object.entries(operating_hours).map(([day, { open, close }]) => [
          day,
          { open: stripHtml(open), close: stripHtml(close) },
        ])
      ) as typeof operating_hours)
    : null
  const body = { ...sanitised, operating_hours: sanitisedHours }

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
