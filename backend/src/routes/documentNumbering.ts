// ─── Document Numbering ───────────────────────────────────────────────────────
// Stores segment-based number format configs (e.g. receipt number format).
// Also exports generateNextNumber() used by fees.ts at payment time.

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'

const documentNumbering = new Hono()

// ── Types ─────────────────────────────────────────────────────────────────────
interface DocumentSegment {
  order: number
  type: 'constant' | 'year' | 'month' | 'serial'
  value?: string
  total_chars?: number
  reset_by?: 'no_reset' | 'monthly' | 'yearly'
  start_from?: number
}

// ── Zod schemas ───────────────────────────────────────────────────────────────
const segmentSchema = z.object({
  order: z.number().int().min(1),
  type: z.enum(['constant', 'year', 'month', 'serial']),
  value: z.string().optional(),
  total_chars: z.number().int().min(1).max(20).optional(),
  reset_by: z.enum(['no_reset', 'monthly', 'yearly']).optional(),
  start_from: z.number().int().min(1).optional(),
})

const configSchema = z.object({
  segments: z.array(segmentSchema).min(1),
})

// ── GET /api/document-numbering/:type ────────────────────────────────────────
documentNumbering.get('/:type', async (c) => {
  const { type } = c.req.param()
  const { data, error } = await supabase
    .from('document_numbering')
    .select('*')
    .eq('document_type', type)
    .single()

  if (error) return c.json({ data: null }, 200)
  return c.json({ data })
})

// ── PUT /api/document-numbering/:type ────────────────────────────────────────
documentNumbering.put('/:type', zValidator('json', configSchema), async (c) => {
  const { type } = c.req.param()
  const { segments } = c.req.valid('json')

  // Upsert the config; preserve current_serial if format already exists
  const { data: existing } = await supabase
    .from('document_numbering')
    .select('id, current_serial')
    .eq('document_type', type)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('document_numbering')
      .update({ segments, updated_at: new Date().toISOString() })
      .eq('document_type', type)
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ data })
  }

  const { data, error } = await supabase
    .from('document_numbering')
    .insert({ document_type: type, segments, current_serial: 0 })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data }, 201)
})

// ── generateNextNumber (exported, used by fees.ts) ────────────────────────────
export async function generateNextNumber(documentType: string): Promise<string> {
  const { data: config, error } = await supabase
    .from('document_numbering')
    .select('*')
    .eq('document_type', documentType)
    .single()

  if (error || !config) {
    throw new Error(
      `Receipt numbering not configured. Please set it up in Settings before recording payments.`
    )
  }

  const segments = config.segments as DocumentSegment[]
  const serialSeg = segments.find((s) => s.type === 'serial')

  const now = new Date()
  let newSerial = (config.current_serial ?? 0) + 1

  // Auto-reset logic
  if (serialSeg && serialSeg.reset_by && serialSeg.reset_by !== 'no_reset') {
    if (config.last_reset_at) {
      const lastReset = new Date(config.last_reset_at)
      if (serialSeg.reset_by === 'monthly') {
        if (
          now.getFullYear() !== lastReset.getFullYear() ||
          now.getMonth() !== lastReset.getMonth()
        ) {
          newSerial = serialSeg.start_from ?? 1
        }
      } else if (serialSeg.reset_by === 'yearly') {
        if (now.getFullYear() !== lastReset.getFullYear()) {
          newSerial = serialSeg.start_from ?? 1
        }
      }
    } else {
      // First-ever number — start from start_from
      newSerial = serialSeg.start_from ?? 1
    }
  }

  // Assemble the formatted number
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')

  let result = ''
  const sorted = [...segments].sort((a, b) => a.order - b.order)
  for (const seg of sorted) {
    if (seg.type === 'constant') result += seg.value ?? ''
    else if (seg.type === 'year') result += year
    else if (seg.type === 'month') result += month
    else if (seg.type === 'serial')
      result += newSerial.toString().padStart(seg.total_chars ?? 4, '0')
  }

  // Persist updated serial
  await supabase
    .from('document_numbering')
    .update({
      current_serial: newSerial,
      last_reset_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('document_type', documentType)

  return result
}

export default documentNumbering
