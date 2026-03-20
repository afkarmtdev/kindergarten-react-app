import { describe, test, expect, beforeEach, mock } from 'bun:test'
import {
  mockSupabase,
  setMockResponse,
  setRpcMockResponse,
  clearMockResponses,
} from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

// fees.ts exports two Hono apps: feePlans and the default (fee records)
import fees, { feePlans } from './fees'

beforeEach(() => clearMockResponses())

// ═════════════════════════════════════════════════════════════════════════════
// Fee Plans
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Plans — GET /', () => {
  test('returns paginated fee plans', async () => {
    setMockResponse('fee_plans', {
      data: [
        { id: '1', name: 'Monthly Tuition', type: 'tuition', amount: 350 },
        { id: '2', name: 'Uniform Fee', type: 'uniform', amount: 120 },
      ],
      error: null,
      count: 2,
    })

    const res = await feePlans.request('/')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(2)
  })

  test('returns empty when no plans', async () => {
    setMockResponse('fee_plans', { data: [], error: null, count: 0 })

    const res = await feePlans.request('/')
    const json = await res.json()
    expect(json.data).toEqual([])
  })
})

describe('Fee Plans — pagination (default 9, max 100)', () => {
  test('defaults to page 1, limit 9', async () => {
    setMockResponse('fee_plans', { data: [], error: null, count: 0 })

    const res = await feePlans.request('/')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(9)
  })

  test('custom page and limit reflected in meta', async () => {
    setMockResponse('fee_plans', { data: [], error: null, count: 30 })

    const res = await feePlans.request('/?page=2&limit=10')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 30, page: 2, limit: 10, totalPages: 3 })
  })

  test('rejects limit above max (100)', async () => {
    const res = await feePlans.request('/?limit=101')
    expect(res.status).toBe(400)
  })

  test('rejects page < 1', async () => {
    const res = await feePlans.request('/?page=0')
    expect(res.status).toBe(400)
  })
})

describe('Fee Plans — POST /', () => {
  test('creates plan with 201', async () => {
    setMockResponse('fee_plans', {
      data: { id: 'new-1', name: 'Activity Fee', type: 'activity', amount: 50 },
      error: null,
    })

    const res = await feePlans.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Activity Fee', type: 'activity', amount: 50 }),
    })

    expect(res.status).toBe(201)
  })

  test('rejects missing name', async () => {
    const res = await feePlans.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'tuition', amount: 100 }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects negative amount', async () => {
    const res = await feePlans.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', amount: -50 }),
    })

    expect(res.status).toBe(400)
  })
})

describe('Fee Plans — DELETE /:id', () => {
  test('returns success message', async () => {
    setMockResponse('fee_plans', { data: null, error: null })

    const res = await feePlans.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('Fee plan deleted')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Fee Records
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Records — GET /', () => {
  test('returns paginated fee records', async () => {
    // Mock both students (for search filter) and fee_records
    setMockResponse('fee_records', {
      data: [{ id: '1', student_id: 's1', amount_owed: 350, amount_paid: 0, status: 'unpaid' }],
      error: null,
      count: 1,
    })

    const res = await fees.request('/?page=1&limit=20')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  test('returns empty when search matches no students', async () => {
    setMockResponse('students', { data: [], error: null })

    const res = await fees.request('/?search=nonexistent')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })
})

describe('Fee Records — pagination (default 20, max 100)', () => {
  test('defaults to page 1, limit 20', async () => {
    setMockResponse('fee_records', { data: [], error: null, count: 0 })

    const res = await fees.request('/')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(20)
  })

  test('custom page and limit reflected in meta', async () => {
    setMockResponse('fee_records', { data: [], error: null, count: 100 })

    const res = await fees.request('/?page=3&limit=25')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 100, page: 3, limit: 25, totalPages: 4 })
  })

  test('rejects limit above max (100)', async () => {
    const res = await fees.request('/?limit=101')
    expect(res.status).toBe(400)
  })

  test('rejects page < 1', async () => {
    const res = await fees.request('/?page=0')
    expect(res.status).toBe(400)
  })
})

describe('Fee Records — filter params', () => {
  test('empty string class_id is treated as no filter (200, not 400)', async () => {
    setMockResponse('fee_records', { data: [], error: null, count: 0 })

    const res = await fees.request('/?class_id=')
    expect(res.status).toBe(200)
  })

  test('valid UUID class_id is accepted', async () => {
    setMockResponse('fee_records', { data: [], error: null, count: 0 })

    const res = await fees.request('/?class_id=00000000-0000-0000-0000-000000000001')
    expect(res.status).toBe(200)
  })

  test('invalid non-empty class_id is rejected (400)', async () => {
    const res = await fees.request('/?class_id=not-a-uuid')
    expect(res.status).toBe(400)
  })
})

describe('Fee Records — GET /:id', () => {
  test('returns fee record', async () => {
    setMockResponse('fee_records', {
      data: { id: '1', student_id: 's1', amount_owed: 350, status: 'unpaid' },
      error: null,
    })

    const res = await fees.request('/abc-123')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.amount_owed).toBe(350)
  })

  test('returns 404 when not found', async () => {
    setMockResponse('fee_records', {
      data: null,
      error: { message: 'Row not found' },
    })

    const res = await fees.request('/bad-id')
    expect(res.status).toBe(404)
  })
})

describe('Fee Records — POST /', () => {
  test('creates record with derived status', async () => {
    setMockResponse('fee_records', {
      data: { id: 'new-1', amount_owed: 100, amount_paid: 0, status: 'unpaid' },
      error: null,
    })

    const res = await fees.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'tuition',
        description: 'March tuition',
        amount_owed: 100,
      }),
    })

    expect(res.status).toBe(201)
  })

  test('rejects missing required fields', async () => {
    const res = await fees.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: '550e8400-e29b-41d4-a716-446655440000' }),
    })

    expect(res.status).toBe(400)
  })
})

describe('Fee Records — POST /generate', () => {
  test('generates fee records for a class', async () => {
    setMockResponse('fee_plans', {
      data: { id: 'p1', name: 'Monthly', type: 'tuition', amount: 350 },
      error: null,
    })
    setMockResponse('students', {
      data: [
        { id: 's1', full_name: 'Ali' },
        { id: 's2', full_name: 'Maya' },
      ],
      error: null,
    })
    setMockResponse('fee_records', {
      data: [{}, {}],
      error: null,
    })

    const res = await fees.request('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fee_plan_id: '550e8400-e29b-41d4-a716-446655440000',
        target_class_id: '00000000-0000-0000-0000-000000000001',
      }),
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.created).toBe(2)
  })

  test('returns 400 when no students found', async () => {
    setMockResponse('fee_plans', {
      data: { id: 'p1', name: 'Monthly', type: 'tuition', amount: 350 },
      error: null,
    })
    setMockResponse('students', { data: [], error: null })

    const res = await fees.request('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fee_plan_id: '550e8400-e29b-41d4-a716-446655440000',
        target_class_id: '00000000-0000-0000-0000-000000000099',
      }),
    })

    expect(res.status).toBe(400)
  })
})

describe('Fee Records — GET /summary', () => {
  test('returns fee summary totals', async () => {
    setRpcMockResponse('dashboard_fees_summary', {
      data: { total_owed: 5000, total_paid: 3000, total_outstanding: 2000, overdue_count: 5 },
      error: null,
    })

    const res = await fees.request('/summary?month=2025-03')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.total_owed).toBe(5000)
    expect(json.total_paid).toBe(3000)
    expect(json.total_outstanding).toBe(2000)
    expect(json.overdue_count).toBe(5)
  })

  test('returns zeros when no records', async () => {
    setRpcMockResponse('dashboard_fees_summary', {
      data: { total_owed: 0, total_paid: 0, total_outstanding: 0, overdue_count: 0 },
      error: null,
    })

    const res = await fees.request('/summary')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.total_owed).toBe(0)
    expect(json.total_paid).toBe(0)
    expect(json.total_outstanding).toBe(0)
    expect(json.overdue_count).toBe(0)
  })

  test('returns 500 on database error', async () => {
    setRpcMockResponse('dashboard_fees_summary', {
      data: null,
      error: { message: 'RPC failed' },
    })

    const res = await fees.request('/summary?month=2025-03')
    expect(res.status).toBe(500)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Fee Collection Trend
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Records — GET /trend', () => {
  test('returns monthly owed/collected data', async () => {
    setRpcMockResponse('dashboard_fees_trend', {
      data: [
        { month: '2026-01', owed: 5000, collected: 3000 },
        { month: '2026-02', owed: 4500, collected: 4000 },
      ],
      error: null,
    })

    const res = await fees.request('/trend?months=6')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toHaveLength(2)

    const jan = json.find((p: { month: string }) => p.month === '2026-01')
    expect(jan.owed).toBe(5000)
    expect(jan.collected).toBe(3000)

    const feb = json.find((p: { month: string }) => p.month === '2026-02')
    expect(feb.owed).toBe(4500)
    expect(feb.collected).toBe(4000)
  })

  test('returns empty array when no data', async () => {
    setRpcMockResponse('dashboard_fees_trend', { data: [], error: null })

    const res = await fees.request('/trend?months=3')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setRpcMockResponse('dashboard_fees_trend', {
      data: null,
      error: { message: 'RPC failed' },
    })

    const res = await fees.request('/trend?months=6')
    expect(res.status).toBe(500)
  })
})

describe('Fee Records — GET /export', () => {
  test('returns CSV content', async () => {
    setMockResponse('fee_records', {
      data: [
        {
          type: 'tuition',
          description: 'March',
          due_date: '2025-03-01',
          amount_owed: 100,
          discount_amount: 0,
          amount_paid: 100,
          status: 'paid',
          receipt_number: 'RC-001',
          students: { full_name: 'Ali', classrooms: { name: 'Rose' } },
        },
      ],
      error: null,
    })

    const res = await fees.request('/export?month=2025-03')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/csv')

    const csv = await res.text()
    expect(csv).toContain('Student Name')
    expect(csv).toContain('Ali')
    expect(csv).toContain('RC-001')
  })
})

describe('Fee Records — DELETE /:id', () => {
  test('deletes unpaid record', async () => {
    setMockResponse('fee_records', { data: { status: 'unpaid' }, error: null })

    const res = await fees.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('Fee record deleted')
  })

  test('rejects deleting paid record', async () => {
    setMockResponse('fee_records', { data: { status: 'paid' }, error: null })

    const res = await fees.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toContain('Only unpaid')
  })

  test('returns 404 when record not found', async () => {
    setMockResponse('fee_records', { data: null, error: null })

    const res = await fees.request('/bad-id', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Class Collection Sheet
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Records — GET /class-sheet', () => {
  test('requires class_id and month', async () => {
    const res = await fees.request('/class-sheet')
    expect(res.status).toBe(400)
  })

  test('requires valid month format (YYYY-MM)', async () => {
    const res = await fees.request(
      '/class-sheet?class_id=00000000-0000-0000-0000-000000000001&month=2025'
    )
    expect(res.status).toBe(400)
  })

  test('returns empty result when class has no students', async () => {
    setMockResponse('classrooms', { data: { name: 'EmptyClass' }, error: null })
    setMockResponse('students', { data: [], error: null })

    const res = await fees.request(
      '/class-sheet?class_id=00000000-0000-0000-0000-000000000001&month=2025-03'
    )
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.students).toEqual([])
    expect(json.totals).toEqual({ amount_owed: 0, amount_paid: 0, balance: 0 })
    expect(json.class_name).toBe('EmptyClass')
    expect(json.month).toBe('2025-03')
  })

  test('returns grouped students with records and totals', async () => {
    setMockResponse('classrooms', { data: { name: 'Rose' }, error: null })
    setMockResponse('students', {
      data: [
        { id: 's1', full_name: 'Ali' },
        { id: 's2', full_name: 'Mia' },
      ],
      error: null,
    })
    setMockResponse('fee_records', {
      data: [
        {
          id: 'r1',
          student_id: 's1',
          description: 'Tuition',
          type: 'tuition',
          due_date: '2025-03-01',
          amount_owed: 350,
          discount_amount: 0,
          amount_paid: 350,
          status: 'paid',
        },
        {
          id: 'r2',
          student_id: 's2',
          description: 'Tuition',
          type: 'tuition',
          due_date: '2025-03-01',
          amount_owed: 350,
          discount_amount: 0,
          amount_paid: 0,
          status: 'unpaid',
        },
      ],
      error: null,
    })

    const res = await fees.request(
      '/class-sheet?class_id=00000000-0000-0000-0000-000000000001&month=2025-03'
    )
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.students).toHaveLength(2)
    expect(json.students[0].student_id).toBe('s1')
    expect(json.students[0].records).toHaveLength(1)
    expect(json.totals.amount_owed).toBe(700)
    expect(json.totals.amount_paid).toBe(350)
    expect(json.totals.balance).toBe(350)
  })

  test('student with no fees for the month has empty records array', async () => {
    setMockResponse('classrooms', { data: { name: 'Rose' }, error: null })
    setMockResponse('students', {
      data: [{ id: 's1', full_name: 'Ali' }],
      error: null,
    })
    setMockResponse('fee_records', { data: [], error: null })

    const res = await fees.request(
      '/class-sheet?class_id=00000000-0000-0000-0000-000000000001&month=2025-03'
    )
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.students[0].records).toEqual([])
    expect(json.totals).toEqual({ amount_owed: 0, amount_paid: 0, balance: 0 })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Monthly Collection Report
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Records — GET /monthly-report', () => {
  test('requires month param', async () => {
    const res = await fees.request('/monthly-report')
    expect(res.status).toBe(400)
  })

  test('requires YYYY-MM format', async () => {
    const res = await fees.request('/monthly-report?month=March')
    expect(res.status).toBe(400)
  })

  test('returns zeros when no records', async () => {
    setMockResponse('fee_records', { data: [], error: null })

    const res = await fees.request('/monthly-report?month=2025-03')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.totals).toEqual({ charged: 0, collected: 0, outstanding: 0, record_count: 0 })
    expect(json.by_class).toEqual([])
    expect(json.by_type).toEqual([])
    expect(json.outstanding_accounts).toEqual([])
  })

  test('aggregates by class correctly', async () => {
    setMockResponse('fee_records', {
      data: [
        {
          id: 'r1',
          student_id: 's1',
          type: 'tuition',
          description: 'Tuition',
          amount_owed: 350,
          discount_amount: 0,
          amount_paid: 350,
          status: 'paid',
          due_date: '2025-03-01',
          students: { full_name: 'Ali', classrooms: { name: 'Rose' } },
        },
        {
          id: 'r2',
          student_id: 's2',
          type: 'tuition',
          description: 'Tuition',
          amount_owed: 350,
          discount_amount: 0,
          amount_paid: 0,
          status: 'unpaid',
          due_date: '2025-03-01',
          students: { full_name: 'Mia', classrooms: { name: 'Rose' } },
        },
        {
          id: 'r3',
          student_id: 's3',
          type: 'activity',
          description: 'Activity',
          amount_owed: 80,
          discount_amount: 0,
          amount_paid: 80,
          status: 'paid',
          due_date: '2025-03-01',
          students: { full_name: 'Tom', classrooms: { name: 'Lily' } },
        },
      ],
      error: null,
    })

    const res = await fees.request('/monthly-report?month=2025-03')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.totals.charged).toBe(780)
    expect(json.totals.collected).toBe(430)
    expect(json.totals.record_count).toBe(3)

    // by_class sorted alphabetically
    expect(json.by_class[0].class_name).toBe('Lily')
    expect(json.by_class[1].class_name).toBe('Rose')
    expect(json.by_class[1].charged).toBe(700)
    expect(json.by_class[1].outstanding).toBe(350)
    expect(json.by_class[1].unpaid_count).toBe(1)
  })

  test('aggregates by type correctly', async () => {
    setMockResponse('fee_records', {
      data: [
        {
          id: 'r1',
          student_id: 's1',
          type: 'tuition',
          description: 'Tuition',
          amount_owed: 200,
          discount_amount: 0,
          amount_paid: 200,
          status: 'paid',
          due_date: '2025-03-01',
          students: { full_name: 'A', classrooms: { name: 'Rose' } },
        },
        {
          id: 'r2',
          student_id: 's2',
          type: 'tuition',
          description: 'Tuition',
          amount_owed: 200,
          discount_amount: 0,
          amount_paid: 100,
          status: 'partial',
          due_date: '2025-03-01',
          students: { full_name: 'B', classrooms: { name: 'Rose' } },
        },
      ],
      error: null,
    })

    const res = await fees.request('/monthly-report?month=2025-03')
    const json = await res.json()

    expect(json.by_type).toHaveLength(1)
    expect(json.by_type[0].type).toBe('tuition')
    expect(json.by_type[0].charged).toBe(400)
    expect(json.by_type[0].collected).toBe(300)
    expect(json.by_type[0].outstanding).toBe(100)
  })

  test('outstanding_accounts contains only unpaid/partial records', async () => {
    setMockResponse('fee_records', {
      data: [
        {
          id: 'r1',
          student_id: 's1',
          type: 'tuition',
          description: 'Tuition',
          amount_owed: 100,
          discount_amount: 0,
          amount_paid: 100,
          status: 'paid',
          due_date: '2025-03-01',
          students: { full_name: 'Paid', classrooms: { name: 'Rose' } },
        },
        {
          id: 'r2',
          student_id: 's2',
          type: 'tuition',
          description: 'Tuition',
          amount_owed: 100,
          discount_amount: 0,
          amount_paid: 0,
          status: 'unpaid',
          due_date: '2025-03-01',
          students: { full_name: 'Owing', classrooms: { name: 'Rose' } },
        },
      ],
      error: null,
    })

    const res = await fees.request('/monthly-report?month=2025-03')
    const json = await res.json()

    expect(json.outstanding_accounts).toHaveLength(1)
    expect(json.outstanding_accounts[0].student_name).toBe('Owing')
    expect(json.outstanding_accounts[0].balance).toBe(100)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Annual Report
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Records — GET /annual-report', () => {
  test('rejects year below 2020', async () => {
    const res = await fees.request('/annual-report?year=2019')
    expect(res.status).toBe(400)
  })

  test('rejects year above 2099', async () => {
    const res = await fees.request('/annual-report?year=2100')
    expect(res.status).toBe(400)
  })

  test('returns zeros when no records', async () => {
    setMockResponse('fee_records', { data: [], error: null })

    const res = await fees.request('/annual-report?year=2025')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.year).toBe(2025)
    expect(json.totals.total_owed).toBe(0)
    expect(json.totals.total_paid).toBe(0)
    expect(json.totals.record_count).toBe(0)
    expect(json.by_type).toEqual([])
  })

  test('aggregates by type with correct totals', async () => {
    setMockResponse('fee_records', {
      data: [
        {
          id: 'r1',
          type: 'tuition',
          amount_owed: 350,
          amount_paid: 350,
          discount_amount: 0,
          status: 'paid',
          due_date: '2025-03-01',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'r2',
          type: 'tuition',
          amount_owed: 350,
          amount_paid: 0,
          discount_amount: 0,
          status: 'unpaid',
          due_date: '2025-04-01',
          created_at: '2025-04-01T00:00:00Z',
        },
        {
          id: 'r3',
          type: 'registration',
          amount_owed: 200,
          amount_paid: 200,
          discount_amount: 0,
          status: 'paid',
          due_date: '2025-01-01',
          created_at: '2025-01-01T00:00:00Z',
        },
      ],
      error: null,
    })

    const res = await fees.request('/annual-report?year=2025')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.totals.total_owed).toBe(900)
    expect(json.totals.total_paid).toBe(550)
    expect(json.totals.record_count).toBe(3)
    expect(json.totals.paid_count).toBe(2)

    const tuition = json.by_type.find((t: { type: string }) => t.type === 'tuition')
    expect(tuition.total_owed).toBe(700)
    expect(tuition.total_paid).toBe(350)
    expect(tuition.outstanding).toBe(350)

    const reg = json.by_type.find((t: { type: string }) => t.type === 'registration')
    expect(reg.total_owed).toBe(200)
    expect(reg.outstanding).toBe(0)
  })

  test('discounts are totalled separately', async () => {
    setMockResponse('fee_records', {
      data: [
        {
          id: 'r1',
          type: 'tuition',
          amount_owed: 350,
          amount_paid: 300,
          discount_amount: 50,
          status: 'paid',
          due_date: '2025-03-01',
          created_at: '2025-03-01T00:00:00Z',
        },
      ],
      error: null,
    })

    const res = await fees.request('/annual-report?year=2025')
    const json = await res.json()
    expect(json.totals.total_discounts).toBe(50)
    expect(json.by_type[0].total_discounts).toBe(50)
  })

  test('uses current year when year param omitted', async () => {
    setMockResponse('fee_records', { data: [], error: null })

    const res = await fees.request('/annual-report')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.year).toBe(new Date().getFullYear())
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Payment
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Records — PUT /:id/payment', () => {
  const validConfig = {
    id: 'cfg1',
    document_type: 'receipt',
    segments: [
      { order: 1, type: 'constant', value: 'RC-' },
      { order: 2, type: 'serial', total_chars: 4, reset_by: 'no_reset', start_from: 1 },
    ],
    current_serial: 5,
    last_reset_at: null,
    updated_at: null,
  }

  test('returns 404 when fee record not found', async () => {
    setMockResponse('fee_records', { data: null, error: { message: 'Row not found' } })

    const res = await fees.request('/abc-123/payment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100 }),
    })
    expect(res.status).toBe(404)
  })

  test('rejects payment that exceeds outstanding balance', async () => {
    setMockResponse('fee_records', {
      data: { id: 'r1', amount_owed: 100, amount_paid: 80, discount_amount: 0, status: 'partial' },
      error: null,
    })
    // balance = 100 - 0 - 80 = 20; payment 50 > 20
    const res = await fees.request('/r1/payment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 50 }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('outstanding balance')
  })

  test('rejects negative payment amount', async () => {
    const res = await fees.request('/r1/payment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: -10 }),
    })
    expect(res.status).toBe(400)
  })

  test('returns 400 when receipt numbering not configured', async () => {
    setMockResponse('fee_records', {
      data: { id: 'r1', amount_owed: 100, amount_paid: 0, discount_amount: 0, status: 'unpaid' },
      error: null,
    })
    // No document_numbering config — mock returns null
    setMockResponse('document_numbering', { data: null, error: { message: 'Not found' } })

    const res = await fees.request('/r1/payment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100 }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('not configured')
  })

  test('records payment, assigns receipt number, returns updated record', async () => {
    setMockResponse('fee_records', {
      data: {
        id: 'r1',
        amount_owed: 350,
        amount_paid: 0,
        discount_amount: 0,
        status: 'unpaid',
        students: {
          full_name: 'Ali',
          classrooms: { name: 'Rose' },
          photo_url: null,
          parent_name: 'Abu',
        },
      },
      error: null,
    })
    setMockResponse('document_numbering', { data: validConfig, error: null })

    const res = await fees.request('/r1/payment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 350 }),
    })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.this_payment).toBe(350)
  })

  test('partial payment keeps status as partial', async () => {
    setMockResponse('fee_records', {
      data: {
        id: 'r1',
        amount_owed: 200,
        amount_paid: 0,
        discount_amount: 0,
        status: 'unpaid',
        students: {
          full_name: 'Ali',
          classrooms: { name: 'Rose' },
          photo_url: null,
          parent_name: 'Abu',
        },
      },
      error: null,
    })
    setMockResponse('document_numbering', { data: validConfig, error: null })

    const res = await fees.request('/r1/payment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100 }),
    })
    // 100 < 200 → partial; response comes from mock (status unpaid) but this_payment should be 100
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.this_payment).toBe(100)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Summary — no month param (all-time)
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Records — GET /summary without month param', () => {
  test('returns all-time summary when no month is supplied', async () => {
    setRpcMockResponse('dashboard_fees_summary', {
      data: { total_owed: 12000, total_paid: 9000, total_outstanding: 3000, overdue_count: 8 },
      error: null,
    })

    const res = await fees.request('/summary')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.total_owed).toBe(12000)
    expect(json.total_paid).toBe(9000)
    expect(json.total_outstanding).toBe(3000)
    expect(json.overdue_count).toBe(8)
  })

  test('returns default zeros when RPC returns null and no month param', async () => {
    setRpcMockResponse('dashboard_fees_summary', {
      data: null,
      error: null,
    })

    const res = await fees.request('/summary')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.total_owed).toBe(0)
    expect(json.total_paid).toBe(0)
    expect(json.total_outstanding).toBe(0)
    expect(json.overdue_count).toBe(0)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Trend — custom months param and error case
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Records — GET /trend with custom months', () => {
  test('returns 3 months of data when months=3 is supplied', async () => {
    setRpcMockResponse('dashboard_fees_trend', {
      data: [
        { month: '2026-01', owed: 4000, collected: 3500 },
        { month: '2026-02', owed: 4200, collected: 4000 },
        { month: '2026-03', owed: 3800, collected: 3600 },
      ],
      error: null,
    })

    const res = await fees.request('/trend?months=3')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toHaveLength(3)
    expect(json[0].month).toBe('2026-01')
    expect(json[2].month).toBe('2026-03')
  })

  test('rejects months=0 (below min)', async () => {
    const res = await fees.request('/trend?months=0')
    expect(res.status).toBe(400)
  })

  test('rejects months=13 (above max)', async () => {
    const res = await fees.request('/trend?months=13')
    expect(res.status).toBe(400)
  })
})

describe('Fee Records — GET /trend error case', () => {
  test('returns 500 when RPC fails', async () => {
    setRpcMockResponse('dashboard_fees_trend', {
      data: null,
      error: { message: 'database connection lost' },
    })

    const res = await fees.request('/trend?months=3')
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('database connection lost')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /:id — paid record rejection
// ═════════════════════════════════════════════════════════════════════════════

describe('Fee Records — DELETE /:id paid/partial record', () => {
  test('rejects deleting a partial record', async () => {
    setMockResponse('fee_records', { data: { status: 'partial' }, error: null })

    const res = await fees.request('/r1', { method: 'DELETE' })
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toContain('Only unpaid')
  })

  test('rejects deleting a waived record', async () => {
    setMockResponse('fee_records', { data: { status: 'waived' }, error: null })

    const res = await fees.request('/r1', { method: 'DELETE' })
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toContain('Only unpaid')
  })
})
