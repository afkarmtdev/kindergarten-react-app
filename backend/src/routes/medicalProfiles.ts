import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditUpsert, auditDelete } from '../lib/audit'

const medicalProfiles = new Hono()

const medicalSchema = z.object({
  blood_type: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'])
    .nullable()
    .optional(),
  allergies: z.array(z.string().max(200)).max(20).default([]),
  medical_conditions: z.array(z.string().max(200)).max(20).default([]),
  medications: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        dosage: z.string().max(200),
        frequency: z.string().max(200),
      })
    )
    .max(20)
    .default([]),
  vaccination_records: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .max(50)
    .default([]),
  emergency_contacts: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        relationship: z.string().min(1).max(100),
        phone: z.string().min(1).max(50),
        is_primary: z.boolean().default(false),
      })
    )
    .max(10)
    .default([]),
  doctor_name: z.string().max(200).nullable().optional(),
  doctor_phone: z.string().max(50).nullable().optional(),
  insurance_info: z.string().max(500).nullable().optional(),
  medical_notes: z.string().max(2000).nullable().optional(),
})

// GET /api/medical-profiles/:studentId
medicalProfiles.get('/:studentId', async (c) => {
  const { studentId } = c.req.param()
  const { data, error } = await supabase
    .from('student_medical')
    .select('*')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .single()

  if (error && error.code !== 'PGRST116') return c.json({ error: error.message }, 500)
  return c.json({ data: data ?? null })
})

// PUT /api/medical-profiles/:studentId — upsert
medicalProfiles.put('/:studentId', zValidator('json', medicalSchema), async (c) => {
  const { studentId } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))

  const { data, error } = await supabase
    .from('student_medical')
    .upsert({ student_id: studentId, ...body, ...auditUpsert(c) }, { onConflict: 'student_id' })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE /api/medical-profiles/:studentId — soft delete
medicalProfiles.delete('/:studentId', async (c) => {
  const { studentId } = c.req.param()
  const { error } = await supabase
    .from('student_medical')
    .update(auditDelete(c))
    .eq('student_id', studentId)
    .is('deleted_at', null)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Medical profile deleted' })
})

export default medicalProfiles
