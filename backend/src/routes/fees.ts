// ─── Fees ─────────────────────────────────────────────────────────────────────
// Fee Plans + Fee Records.
// Exports two Hono apps: feePlans (mounted at /api/fee-plans) and fees
// (mounted at /api/fees).

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { deriveStatus, monthRange } from '../lib/fees'
import { generateNextNumber } from './documentNumbering'

// ── Zod schemas ───────────────────────────────────────────────────────────────
const feeTypeEnum = z.enum(['tuition', 'activity', 'uniform', 'registration', 'other'])

const planSchema = z.object({
  name: z.string().min(1),
  type: feeTypeEnum.default('tuition'),
  amount: z.number().positive(),
  description: z.string().optional(),
})

const recordSchema = z.object({
  student_id: z.string().uuid(),
  type: feeTypeEnum.default('tuition'),
  description: z.string().min(1),
  amount_owed: z.number().positive(),
  discount_amount: z.number().min(0).default(0),
  discount_reason: z.string().optional(),
  due_date: z.string().optional(),
})

const generateSchema = z.object({
  fee_plan_id: z.string().uuid().optional(),
  type: feeTypeEnum.optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  target_class: z.string().optional(), // class name or 'all'
  due_date: z.string().optional(),
})

const paymentSchema = z.object({
  amount: z.number().positive(),
})

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['unpaid', 'partial', 'paid', 'waived', '']).optional(),
  month: z.string().optional(), // YYYY-MM
  class_name: z.string().optional(),
})

// ═════════════════════════════════════════════════════════════════════════════
// Fee Plans
// ═════════════════════════════════════════════════════════════════════════════
export const feePlans = new Hono()

feePlans.get(
  '/',
  zValidator(
    'query',
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(9),
      search: z.string().optional(),
    })
  ),
  async (c) => {
    const { page, limit, search } = c.req.valid('query')
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('fee_plans')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) query = query.ilike('name', `%${search}%`)

    const { data, error, count } = await query
    if (error) return c.json({ error: error.message }, 500)
    return c.json({
      data: data ?? [],
      meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
    })
  }
)

feePlans.post('/', zValidator('json', planSchema), async (c) => {
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase.from('fee_plans').insert(body).select().single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

feePlans.put('/:id', zValidator('json', planSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase
    .from('fee_plans')
    .update(body)
    .eq('id', id)
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

feePlans.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase.from('fee_plans').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Fee plan deleted' })
})

// ═════════════════════════════════════════════════════════════════════════════
// Fee Records
// ═════════════════════════════════════════════════════════════════════════════
const fees = new Hono()

// ── Static paths MUST come before /:id ───────────────────────────────────────

// GET /api/fees/summary?month=YYYY-MM
fees.get('/summary', async (c) => {
  const month = c.req.query('month')

  let query = supabase
    .from('fee_records')
    .select('amount_owed, amount_paid, discount_amount, status, due_date')

  if (month) {
    const { start, end } = monthRange(month)
    query = query.gte('due_date', start).lte('due_date', end)
  }

  const { data, error } = await query
  if (error) return c.json({ error: error.message }, 500)

  const today = new Date().toISOString().split('T')[0]
  const records = data ?? []

  const total_owed = records.reduce((s, r) => s + Number(r.amount_owed), 0)
  const total_paid = records.reduce((s, r) => s + Number(r.amount_paid), 0)
  const total_outstanding = records
    .filter((r) => r.status !== 'paid' && r.status !== 'waived')
    .reduce(
      (s, r) => s + (Number(r.amount_owed) - Number(r.discount_amount) - Number(r.amount_paid)),
      0
    )
  const overdue_count = records.filter(
    (r) => (r.status === 'unpaid' || r.status === 'partial') && r.due_date && r.due_date < today
  ).length

  return c.json({ total_owed, total_paid, total_outstanding, overdue_count })
})

// GET /api/fees/export?month=YYYY-MM
fees.get('/export', async (c) => {
  const month = c.req.query('month')

  let query = supabase
    .from('fee_records')
    .select('*, students(full_name, class_name)')
    .order('due_date', { ascending: true })

  if (month) {
    const { start, end } = monthRange(month)
    query = query.gte('due_date', start).lte('due_date', end)
  }

  const { data, error } = await query
  if (error) return c.json({ error: error.message }, 500)

  const header =
    'Student Name,Class,Type,Description,Due Date,Amount Owed,Discount,Amount Paid,Status,Receipt Number'
  const rows = (data ?? []).map((r) => {
    const s = r.students as { full_name?: string; class_name?: string } | null
    return [
      `"${s?.full_name ?? ''}"`,
      `"${s?.class_name ?? ''}"`,
      r.type,
      `"${r.description}"`,
      r.due_date ?? '',
      Number(r.amount_owed).toFixed(2),
      Number(r.discount_amount).toFixed(2),
      Number(r.amount_paid).toFixed(2),
      r.status,
      r.receipt_number ?? '',
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')
  return c.body(csv, 200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="fees-${month ?? 'all'}.csv"`,
  })
})

// GET /api/fees/statement/:studentId?year=YYYY
fees.get('/statement/:studentId', async (c) => {
  const { studentId } = c.req.param()
  const year = c.req.query('year') ?? new Date().getFullYear().toString()

  const [{ data: student }, { data: records, error }] = await Promise.all([
    supabase
      .from('students')
      .select('full_name, class_name, date_of_birth, parent_name')
      .eq('id', studentId)
      .single(),
    supabase
      .from('fee_records')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${Number(year) + 1}-01-01`)
      .order('due_date', { ascending: true }),
  ])

  if (error) return c.json({ error: error.message }, 500)

  const total_paid = (records ?? []).reduce((s, r) => s + Number(r.amount_paid), 0)
  return c.json({ student, records: records ?? [], year, total_paid })
})

// POST /api/fees/generate
fees.post('/generate', zValidator('json', generateSchema), async (c) => {
  const body = c.req.valid('json')

  let feeType = body.type
  let feeAmount = body.amount
  let feeDesc = body.description

  if (body.fee_plan_id) {
    const { data: plan } = await supabase
      .from('fee_plans')
      .select('*')
      .eq('id', body.fee_plan_id)
      .single()
    if (!plan) return c.json({ error: 'Fee plan not found' }, 404)
    feeType = feeType ?? plan.type
    feeAmount = feeAmount ?? Number(plan.amount)
    feeDesc = feeDesc ?? plan.name
  }

  if (!feeType || !feeAmount) {
    return c.json({ error: 'Type and amount are required when not using a fee plan' }, 400)
  }

  let studentQuery = supabase.from('students').select('id, full_name')
  if (body.target_class && body.target_class !== 'all') {
    studentQuery = studentQuery.eq('class_name', body.target_class)
  }

  const { data: students, error: studentsError } = await studentQuery
  if (studentsError) return c.json({ error: studentsError.message }, 500)
  if (!students || students.length === 0) {
    return c.json({ error: 'No students found for the selected target' }, 400)
  }

  const records = students.map((student) => ({
    student_id: student.id,
    type: feeType,
    description: feeDesc ?? `${feeType} fee`,
    amount_owed: feeAmount,
    amount_paid: 0,
    discount_amount: 0,
    status: 'unpaid',
    due_date: body.due_date ?? null,
  }))

  const { data, error } = await supabase.from('fee_records').insert(records).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ created: data?.length ?? 0 }, 201)
})

// GET /api/fees
fees.get('/', zValidator('query', listSchema), async (c) => {
  const { page, limit, search, status, month, class_name } = c.req.valid('query')

  // Resolve student ID filter from search/class_name
  let studentIdFilter: string[] | null = null
  if (search || class_name) {
    let q = supabase.from('students').select('id')
    if (search) q = q.ilike('full_name', `%${search}%`)
    if (class_name) q = q.eq('class_name', class_name)
    const { data: matched } = await q
    studentIdFilter = matched?.map((s) => s.id) ?? []
    if (studentIdFilter.length === 0) {
      return c.json({ data: [], meta: { total: 0, page, limit, totalPages: 0 } })
    }
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('fee_records')
    .select('*, students(full_name, class_name, photo_url)', { count: 'exact' })
    .order('due_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (studentIdFilter) query = query.in('student_id', studentIdFilter)
  if (status) query = query.eq('status', status)
  if (month) {
    const { start, end } = monthRange(month)
    query = query.gte('due_date', start).lte('due_date', end)
  }

  const { data, error, count } = await query
  if (error) return c.json({ error: error.message }, 500)
  return c.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
  })
})

// POST /api/fees
fees.post('/', zValidator('json', recordSchema), async (c) => {
  const raw = c.req.valid('json')
  const body = sanitiseStrings({ ...raw })
  const status = deriveStatus(Number(body.amount_owed), 0, Number(body.discount_amount ?? 0))
  const { data, error } = await supabase
    .from('fee_records')
    .insert({ ...body, amount_paid: 0, status })
    .select('*, students(full_name, class_name, photo_url)')
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// GET /api/fees/:id
fees.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('fee_records')
    .select('*, students(full_name, class_name, photo_url)')
    .eq('id', id)
    .single()
  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

// PUT /api/fees/:id/payment
fees.put('/:id/payment', zValidator('json', paymentSchema), async (c) => {
  const { id } = c.req.param()
  const { amount } = c.req.valid('json')

  const { data: record, error: fetchError } = await supabase
    .from('fee_records')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError || !record) return c.json({ error: 'Fee record not found' }, 404)

  const balance =
    Number(record.amount_owed) - Number(record.discount_amount) - Number(record.amount_paid)
  if (amount > balance + 0.01) {
    return c.json(
      { error: `Payment amount exceeds outstanding balance of RM ${balance.toFixed(2)}` },
      400
    )
  }

  const newAmountPaid = Number(record.amount_paid) + amount
  const newStatus = deriveStatus(
    Number(record.amount_owed),
    newAmountPaid,
    Number(record.discount_amount)
  )

  let receiptNumber: string
  try {
    receiptNumber = await generateNextNumber('receipt')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Receipt numbering error'
    return c.json({ error: msg }, 400)
  }

  const { data, error } = await supabase
    .from('fee_records')
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
      receipt_number: receiptNumber,
      paid_at: newStatus === 'paid' ? new Date().toISOString() : record.paid_at,
    })
    .eq('id', id)
    .select('*, students(full_name, class_name, photo_url)')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ...data, this_payment: amount })
})

// PUT /api/fees/:id
fees.put(
  '/:id',
  zValidator('json', recordSchema.omit({ student_id: true }).partial()),
  async (c) => {
    const { id } = c.req.param()
    const raw = c.req.valid('json')
    const body = sanitiseStrings({ ...raw })

    // Fetch existing to recalculate status
    const { data: existing } = await supabase
      .from('fee_records')
      .select('amount_owed, amount_paid, discount_amount')
      .eq('id', id)
      .single()
    if (!existing) return c.json({ error: 'Fee record not found' }, 404)

    const newOwed =
      body.amount_owed !== undefined ? Number(body.amount_owed) : Number(existing.amount_owed)
    const newDiscount =
      body.discount_amount !== undefined
        ? Number(body.discount_amount)
        : Number(existing.discount_amount)
    const status = deriveStatus(newOwed, Number(existing.amount_paid), newDiscount)

    const { data, error } = await supabase
      .from('fee_records')
      .update({ ...body, status })
      .eq('id', id)
      .select('*, students(full_name, class_name, photo_url)')
      .single()

    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
  }
)

// DELETE /api/fees/:id — only unpaid records can be deleted
fees.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { data: record } = await supabase.from('fee_records').select('status').eq('id', id).single()

  if (!record) return c.json({ error: 'Fee record not found' }, 404)
  if (record.status !== 'unpaid') {
    return c.json({ error: 'Only unpaid records can be deleted' }, 400)
  }

  const { error } = await supabase.from('fee_records').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Fee record deleted' })
})

export default fees
