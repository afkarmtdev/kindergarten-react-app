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
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'

// Flatten nested classrooms + parent_students joins on a student sub-object
function flattenStudentClass(
  s:
    | ({
        classrooms?: { name?: string; academic_year?: string } | null
        parent_students?: { parents?: { full_name?: string } | null }[]
      } & Record<string, unknown>)
    | null
    | undefined
): Record<string, unknown> | null {
  if (!s) return null
  const { classrooms, parent_students, ...rest } = s
  const parentLink = Array.isArray(parent_students) ? parent_students[0] : undefined
  return {
    ...rest,
    class_name: classrooms?.name ? `${classrooms.name} (${classrooms.academic_year ?? ''})` : null,
    parent_name: parentLink?.parents?.full_name ?? null,
  }
}

type StudentSubrow = Parameters<typeof flattenStudentClass>[0]

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
  target_class_id: z.string().uuid().optional(), // classroom UUID; omit for all students
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
  class_id: z.preprocess((v) => (!v ? undefined : v), z.string().uuid().optional()),
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
      .is('deleted_at', null)
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
  const { data, error } = await supabase
    .from('fee_plans')
    .insert({ ...body, ...auditCreate(c) })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

feePlans.put('/:id', zValidator('json', planSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = sanitiseStrings(c.req.valid('json'))
  const { data, error } = await supabase
    .from('fee_plans')
    .update({ ...body, ...auditUpdate(c) })
    .eq('id', id)
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

feePlans.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { error } = await supabase
    .from('fee_plans')
    .update(auditDelete(c))
    .eq('id', id)
    .is('deleted_at', null)
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

  let startDate: string | null = null
  let endDate: string | null = null
  if (month) {
    const { start, end } = monthRange(month)
    startDate = start
    endDate = end
  }

  const { data, error } = await supabase.rpc('dashboard_fees_summary', {
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? { total_owed: 0, total_paid: 0, total_outstanding: 0, overdue_count: 0 })
})

// GET /api/fees/trend?months=6
fees.get(
  '/trend',
  zValidator(
    'query',
    z.object({
      months: z.coerce.number().int().min(1).max(12).default(6),
    })
  ),
  async (c) => {
    const { months } = c.req.valid('query')

    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    const startDate = startMonth.toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const endDate = endOfMonth.toISOString().split('T')[0]

    const { data, error } = await supabase.rpc('dashboard_fees_trend', {
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) return c.json({ error: error.message }, 500)
    return c.json(data ?? [])
  }
)

// Wrap a value in double-quotes and prefix with ' if it starts with a formula trigger
// character (=, +, -, @, tab, CR) to prevent CSV formula injection in Excel/LibreOffice.
function csvStr(v: string | null | undefined): string {
  const s = String(v ?? '').replace(/"/g, '""')
  return `"${/^[=+\-@\t\r]/.test(s) ? `'${s}` : s}"`
}

// GET /api/fees/export?month=YYYY-MM
fees.get('/export', async (c) => {
  const month = c.req.query('month')

  let query = supabase
    .from('fee_records')
    .select('*, students(full_name, classrooms(name, academic_year))')
    .is('deleted_at', null)
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
    const s = r.students as { full_name?: string; classrooms?: { name?: string } | null } | null
    return [
      csvStr(s?.full_name),
      csvStr(s?.classrooms?.name),
      csvStr(r.type),
      csvStr(r.description),
      csvStr(r.due_date),
      Number(r.amount_owed).toFixed(2),
      Number(r.discount_amount).toFixed(2),
      Number(r.amount_paid).toFixed(2),
      csvStr(r.status),
      csvStr(r.receipt_number),
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')
  return c.body(csv, 200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="fees-${month ?? 'all'}.csv"`,
  })
})

// GET /api/fees/statement/:studentId?year=YYYY
// TODO: Add per-student ownership check before introducing parent-scoped JWTs (IDOR risk).
fees.get('/statement/:studentId', async (c) => {
  const { studentId } = c.req.param()
  const year = c.req.query('year') ?? new Date().getFullYear().toString()

  const [{ data: student }, { data: records, error }] = await Promise.all([
    supabase
      .from('students')
      .select(
        'full_name, classrooms(name, academic_year), date_of_birth, parent_students(parents(full_name))'
      )
      .eq('id', studentId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('fee_records')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${Number(year) + 1}-01-01`)
      .order('due_date', { ascending: true }),
  ])

  if (error) return c.json({ error: error.message }, 500)

  const total_paid = (records ?? []).reduce((s, r) => s + Number(r.amount_paid), 0)
  return c.json({
    student: flattenStudentClass(student as StudentSubrow),
    records: records ?? [],
    year,
    total_paid,
  })
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
      .is('deleted_at', null)
      .single()
    if (!plan) return c.json({ error: 'Fee plan not found' }, 404)
    feeType = feeType ?? plan.type
    feeAmount = feeAmount ?? Number(plan.amount)
    feeDesc = feeDesc ?? plan.name
  }

  if (!feeType || !feeAmount) {
    return c.json({ error: 'Type and amount are required when not using a fee plan' }, 400)
  }

  let studentQuery = supabase.from('students').select('id, full_name').is('deleted_at', null)
  studentQuery = studentQuery.eq('status', 'active')
  if (body.target_class_id) {
    studentQuery = studentQuery.eq('class_id', body.target_class_id)
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
    ...auditCreate(c),
  }))

  const { data, error } = await supabase.from('fee_records').insert(records).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ created: data?.length ?? 0 }, 201)
})

// GET /api/fees
fees.get('/', zValidator('query', listSchema), async (c) => {
  const { page, limit, search, status, month, class_id } = c.req.valid('query')

  // Resolve student ID filter from search/class_id
  let studentIdFilter: string[] | null = null
  if (search || class_id) {
    let q = supabase.from('students').select('id').is('deleted_at', null)
    if (search) q = q.ilike('full_name', `%${search}%`)
    if (class_id) q = q.eq('class_id', class_id)
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
    .select(
      '*, students(full_name, classrooms(name, academic_year), photo_url, parent_students(parents(full_name)))',
      { count: 'exact' }
    )
    .is('deleted_at', null)
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
    data: (data ?? []).map((r) => ({
      ...r,
      students: flattenStudentClass(r.students as StudentSubrow),
    })),
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
    .insert({ ...body, amount_paid: 0, status, ...auditCreate(c) })
    .select(
      '*, students(full_name, classrooms(name, academic_year), photo_url, parent_students(parents(full_name)))'
    )
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(
    { ...data, students: flattenStudentClass((data as { students?: StudentSubrow })?.students) },
    201
  )
})

// GET /api/fees/class-sheet?class_name=...&month=YYYY-MM
fees.get(
  '/class-sheet',
  zValidator(
    'query',
    z.object({
      class_id: z.string().uuid(),
      month: z.string().regex(/^\d{4}-\d{2}$/),
    })
  ),
  async (c) => {
    const { class_id, month } = c.req.valid('query')
    const { start, end } = monthRange(month)

    // Look up class name for the report header
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('name')
      .eq('id', class_id)
      .is('deleted_at', null)
      .single()
    const class_name = classroom?.name ?? ''

    // Fetch all students in this class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('class_id', class_id)
      .is('deleted_at', null)
      .order('full_name', { ascending: true })

    if (studentsError) return c.json({ error: studentsError.message }, 500)
    if (!students || students.length === 0) {
      return c.json({
        class_name,
        month,
        students: [],
        totals: { amount_owed: 0, amount_paid: 0, balance: 0 },
      })
    }

    const studentIds = students.map((s) => s.id)

    const { data: records, error: recordsError } = await supabase
      .from('fee_records')
      .select(
        'id, student_id, description, type, due_date, amount_owed, discount_amount, amount_paid, status'
      )
      .in('student_id', studentIds)
      .is('deleted_at', null)
      .gte('due_date', start)
      .lte('due_date', end)
      .order('due_date', { ascending: true })

    if (recordsError) return c.json({ error: recordsError.message }, 500)

    const recordsByStudent: Record<string, typeof records> = {}
    for (const r of records ?? []) {
      if (!recordsByStudent[r.student_id]) recordsByStudent[r.student_id] = []
      recordsByStudent[r.student_id].push(r)
    }

    const studentRows = students.map((s) => ({
      student_id: s.id,
      student_name: s.full_name,
      records: (recordsByStudent[s.id] ?? []).map((r) => ({
        id: r.id,
        description: r.description,
        type: r.type,
        due_date: r.due_date,
        amount_owed: Number(r.amount_owed),
        discount_amount: Number(r.discount_amount),
        amount_paid: Number(r.amount_paid),
        status: r.status,
      })),
    }))

    const allRecords = records ?? []
    const totals = {
      amount_owed: allRecords.reduce((s, r) => s + Number(r.amount_owed), 0),
      amount_paid: allRecords.reduce((s, r) => s + Number(r.amount_paid), 0),
      balance: allRecords.reduce(
        (s, r) => s + (Number(r.amount_owed) - Number(r.discount_amount) - Number(r.amount_paid)),
        0
      ),
    }

    return c.json({ class_name, month, students: studentRows, totals })
  }
)

// GET /api/fees/monthly-report?month=YYYY-MM
fees.get(
  '/monthly-report',
  zValidator(
    'query',
    z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/),
    })
  ),
  async (c) => {
    const { month } = c.req.valid('query')
    const { start, end } = monthRange(month)

    const { data: records, error } = await supabase
      .from('fee_records')
      .select(
        'id, student_id, type, description, amount_owed, discount_amount, amount_paid, status, due_date, students(full_name, classrooms(name, academic_year))'
      )
      .is('deleted_at', null)
      .gte('due_date', start)
      .lte('due_date', end)

    if (error) return c.json({ error: error.message }, 500)

    const all = records ?? []

    // Overall totals
    const totalCharged = all.reduce((s, r) => s + Number(r.amount_owed), 0)
    const totalCollected = all.reduce((s, r) => s + Number(r.amount_paid), 0)
    const totalOutstanding = all
      .filter((r) => r.status !== 'paid' && r.status !== 'waived')
      .reduce(
        (s, r) => s + (Number(r.amount_owed) - Number(r.discount_amount) - Number(r.amount_paid)),
        0
      )

    // By class
    const byClassMap: Record<
      string,
      {
        student_ids: Set<string>
        charged: number
        collected: number
        discount: number
        outstanding: number
        unpaid_count: number
        partial_count: number
      }
    > = {}

    for (const r of all) {
      const cls =
        (r.students as { classrooms?: { name?: string } | null } | null)?.classrooms?.name ??
        'Unknown'
      if (!byClassMap[cls]) {
        byClassMap[cls] = {
          student_ids: new Set(),
          charged: 0,
          collected: 0,
          discount: 0,
          outstanding: 0,
          unpaid_count: 0,
          partial_count: 0,
        }
      }
      byClassMap[cls].student_ids.add(r.student_id)
      byClassMap[cls].charged += Number(r.amount_owed)
      byClassMap[cls].collected += Number(r.amount_paid)
      byClassMap[cls].discount += Number(r.discount_amount)
      if (r.status !== 'paid' && r.status !== 'waived') {
        byClassMap[cls].outstanding +=
          Number(r.amount_owed) - Number(r.discount_amount) - Number(r.amount_paid)
      }
      if (r.status === 'unpaid') byClassMap[cls].unpaid_count++
      if (r.status === 'partial') byClassMap[cls].partial_count++
    }

    const by_class = Object.entries(byClassMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([class_name, v]) => ({
        class_name,
        student_count: v.student_ids.size,
        charged: v.charged,
        collected: v.collected,
        discount: v.discount,
        outstanding: v.outstanding,
        unpaid_count: v.unpaid_count,
        partial_count: v.partial_count,
      }))

    // By type
    const byTypeMap: Record<string, { charged: number; collected: number; outstanding: number }> =
      {}
    for (const r of all) {
      if (!byTypeMap[r.type]) byTypeMap[r.type] = { charged: 0, collected: 0, outstanding: 0 }
      byTypeMap[r.type].charged += Number(r.amount_owed)
      byTypeMap[r.type].collected += Number(r.amount_paid)
      if (r.status !== 'paid' && r.status !== 'waived') {
        byTypeMap[r.type].outstanding +=
          Number(r.amount_owed) - Number(r.discount_amount) - Number(r.amount_paid)
      }
    }

    const by_type = Object.entries(byTypeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, v]) => ({ type, ...v }))

    // Outstanding accounts
    const outstanding_accounts = all
      .filter((r) => r.status === 'unpaid' || r.status === 'partial')
      .map((r) => {
        const s = r.students as { full_name?: string; classrooms?: { name?: string } | null } | null
        return {
          student_name: s?.full_name ?? '—',
          class_name: s?.classrooms?.name ?? '—',
          description: r.description,
          due_date: r.due_date,
          amount_owed: Number(r.amount_owed),
          amount_paid: Number(r.amount_paid),
          balance: Number(r.amount_owed) - Number(r.discount_amount) - Number(r.amount_paid),
        }
      })
      .sort(
        (a, b) =>
          a.class_name.localeCompare(b.class_name) || a.student_name.localeCompare(b.student_name)
      )

    return c.json({
      month,
      totals: {
        charged: totalCharged,
        collected: totalCollected,
        outstanding: totalOutstanding,
        record_count: all.length,
      },
      by_class,
      by_type,
      outstanding_accounts,
    })
  }
)

// GET /api/fees/annual-report?year=YYYY
fees.get(
  '/annual-report',
  zValidator(
    'query',
    z.object({
      year: z.coerce.number().int().min(2020).max(2099).default(new Date().getFullYear()),
    })
  ),
  async (c) => {
    const { year } = c.req.valid('query')

    const { data, error } = await supabase
      .from('fee_records')
      .select('id, type, amount_owed, amount_paid, discount_amount, status, due_date, created_at')
      .is('deleted_at', null)
      .gte('due_date', `${year}-01-01`)
      .lte('due_date', `${year}-12-31`)

    if (error) return c.json({ error: error.message }, 500)

    const records = data ?? []
    const today = new Date().toISOString().split('T')[0]

    // Group by type
    const byTypeMap: Record<
      string,
      { total_owed: number; total_paid: number; total_discounts: number; outstanding: number }
    > = {}

    for (const r of records) {
      if (!byTypeMap[r.type]) {
        byTypeMap[r.type] = { total_owed: 0, total_paid: 0, total_discounts: 0, outstanding: 0 }
      }
      byTypeMap[r.type].total_owed += Number(r.amount_owed)
      byTypeMap[r.type].total_paid += Number(r.amount_paid)
      byTypeMap[r.type].total_discounts += Number(r.discount_amount)
      if (r.status !== 'paid' && r.status !== 'waived') {
        byTypeMap[r.type].outstanding +=
          Number(r.amount_owed) - Number(r.discount_amount) - Number(r.amount_paid)
      }
    }

    const by_type = Object.entries(byTypeMap).map(([type, v]) => ({ type, ...v }))

    const total_owed = records.reduce((s, r) => s + Number(r.amount_owed), 0)
    const total_paid = records.reduce((s, r) => s + Number(r.amount_paid), 0)
    const total_discounts = records.reduce((s, r) => s + Number(r.discount_amount), 0)
    const outstanding = records
      .filter((r) => r.status !== 'paid' && r.status !== 'waived')
      .reduce(
        (s, r) => s + (Number(r.amount_owed) - Number(r.discount_amount) - Number(r.amount_paid)),
        0
      )
    const record_count = records.length
    const paid_count = records.filter((r) => r.status === 'paid').length
    const overdue_count = records.filter(
      (r) => (r.status === 'unpaid' || r.status === 'partial') && r.due_date && r.due_date < today
    ).length

    return c.json({
      year,
      by_type,
      totals: {
        total_owed,
        total_paid,
        total_discounts,
        outstanding,
        record_count,
        paid_count,
        overdue_count,
      },
    })
  }
)

// GET /api/fees/:id
fees.get('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('fee_records')
    .select(
      '*, students(full_name, classrooms(name, academic_year), photo_url, parent_students(parents(full_name)))'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) return c.json({ error: error.message }, 404)
  return c.json({
    ...data,
    students: flattenStudentClass((data as { students?: StudentSubrow })?.students),
  })
})

// PUT /api/fees/:id/payment
fees.put('/:id/payment', zValidator('json', paymentSchema), async (c) => {
  const { id } = c.req.param()
  const { amount } = c.req.valid('json')

  const { data: record, error: fetchError } = await supabase
    .from('fee_records')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (fetchError || !record) return c.json({ error: 'Fee record not found' }, 404)

  const balance =
    Number(record.amount_owed) - Number(record.discount_amount) - Number(record.amount_paid)
  if (amount > balance + 0.001) {
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
      ...auditUpdate(c),
    })
    .eq('id', id)
    .select(
      '*, students(full_name, classrooms(name, academic_year), photo_url, parent_students(parents(full_name)))'
    )
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({
    ...data,
    students: flattenStudentClass((data as { students?: StudentSubrow })?.students),
    this_payment: amount,
  })
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
      .is('deleted_at', null)
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
      .update({ ...body, status, ...auditUpdate(c) })
      .eq('id', id)
      .select(
        '*, students(full_name, classrooms(name, academic_year), photo_url, parent_students(parents(full_name)))'
      )
      .single()

    if (error) return c.json({ error: error.message }, 500)
    return c.json({
      ...data,
      students: flattenStudentClass((data as { students?: StudentSubrow })?.students),
    })
  }
)

// DELETE /api/fees/:id — only unpaid records can be deleted
fees.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { data: record } = await supabase
    .from('fee_records')
    .select('status')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!record) return c.json({ error: 'Fee record not found' }, 404)
  if (record.status !== 'unpaid') {
    return c.json({ error: 'Only unpaid records can be deleted' }, 400)
  }

  const { error } = await supabase.from('fee_records').update(auditDelete(c)).eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ message: 'Fee record deleted' })
})

export default fees
