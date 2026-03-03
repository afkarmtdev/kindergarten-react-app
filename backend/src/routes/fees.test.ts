import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

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
        target_class: 'Rose',
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
        target_class: 'Nonexistent',
      }),
    })

    expect(res.status).toBe(400)
  })
})

describe('Fee Records — GET /summary', () => {
  test('returns fee summary totals', async () => {
    setMockResponse('fee_records', {
      data: [
        {
          amount_owed: 100,
          amount_paid: 100,
          discount_amount: 0,
          status: 'paid',
          due_date: '2025-03-01',
        },
        {
          amount_owed: 200,
          amount_paid: 50,
          discount_amount: 0,
          status: 'partial',
          due_date: '2025-03-15',
        },
        {
          amount_owed: 150,
          amount_paid: 0,
          discount_amount: 0,
          status: 'unpaid',
          due_date: '2025-02-01',
        },
      ],
      error: null,
    })

    const res = await fees.request('/summary?month=2025-03')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.total_owed).toBe(450)
    expect(json.total_paid).toBe(150)
  })

  test('returns zeros when no records', async () => {
    setMockResponse('fee_records', { data: [], error: null })

    const res = await fees.request('/summary')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.total_owed).toBe(0)
    expect(json.total_paid).toBe(0)
    expect(json.total_outstanding).toBe(0)
    expect(json.overdue_count).toBe(0)
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
          students: { full_name: 'Ali', class_name: 'Rose' },
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
