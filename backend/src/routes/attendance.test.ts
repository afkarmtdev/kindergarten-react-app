import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import attendance from './attendance'

beforeEach(() => clearMockResponses())

// ── GET /date/:date — Attendance by date ─────────────────────────────────────

describe('GET /date/:date — attendance by date', () => {
  test('returns paginated attendance records', async () => {
    setMockResponse('attendance', {
      data: [
        { id: '1', student_id: 's1', date: '2025-03-01', status: 'present' },
        { id: '2', student_id: 's2', date: '2025-03-01', status: 'absent' },
      ],
      error: null,
      count: 2,
    })

    const res = await attendance.request('/date/2025-03-01?page=1&limit=20')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta).toEqual({ total: 2, page: 1, limit: 20, totalPages: 1 })
  })

  test('returns empty when no attendance for date', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 0 })

    const res = await attendance.request('/date/2025-12-25')
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('attendance', {
      data: null,
      error: { message: 'query failed' },
    })

    const res = await attendance.request('/date/2025-03-01')
    expect(res.status).toBe(500)
  })
})

// ── Pagination behaviour (default 20, max 1000) ─────────────────────────────

describe('GET /date/:date — pagination', () => {
  test('defaults to page 1, limit 20', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 0 })

    const res = await attendance.request('/date/2025-03-01')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(20)
  })

  test('custom page and limit reflected in meta', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 200 })

    const res = await attendance.request('/date/2025-03-01?page=3&limit=50')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 200, page: 3, limit: 50, totalPages: 4 })
  })

  test('allows high limit up to 1000', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 500 })

    const res = await attendance.request('/date/2025-03-01?limit=999')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.meta.limit).toBe(999)
  })

  test('rejects limit above max (1000)', async () => {
    const res = await attendance.request('/date/2025-03-01?limit=1001')
    expect(res.status).toBe(400)
  })

  test('rejects page < 1', async () => {
    const res = await attendance.request('/date/2025-03-01?page=0')
    expect(res.status).toBe(400)
  })
})

// ── GET /student/:studentId — Attendance by student ──────────────────────────

describe('GET /student/:studentId — attendance by student', () => {
  test('returns paginated history for student', async () => {
    setMockResponse('attendance', {
      data: [
        { id: '1', date: '2025-03-01', status: 'present' },
        { id: '2', date: '2025-02-28', status: 'late' },
      ],
      error: null,
      count: 15,
    })

    const res = await attendance.request('/student/abc-123?page=1&limit=10')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(15)
    expect(json.meta.totalPages).toBe(2) // 15 records, 10 per page
  })
})

// ── POST / — Mark attendance ─────────────────────────────────────────────────

describe('POST / — mark attendance', () => {
  test('creates attendance with 201', async () => {
    setMockResponse('attendance', {
      data: {
        id: 'new-1',
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        date: '2025-03-01',
        status: 'present',
      },
      error: null,
    })

    const res = await attendance.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        date: '2025-03-01',
        status: 'present',
        recorded_by: 'admin-1',
      }),
    })

    expect(res.status).toBe(201)
  })

  test('rejects invalid status', async () => {
    const res = await attendance.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        date: '2025-03-01',
        status: 'sleeping',
        recorded_by: 'admin-1',
      }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects non-UUID student_id', async () => {
    const res = await attendance.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'not-a-uuid',
        date: '2025-03-01',
        status: 'present',
        recorded_by: 'admin-1',
      }),
    })

    expect(res.status).toBe(400)
  })
})

// ── POST /bulk — Bulk attendance ─────────────────────────────────────────────

describe('POST /bulk — bulk attendance', () => {
  test('upserts records and returns 201', async () => {
    setMockResponse('attendance', {
      data: [
        { id: '1', student_id: 's1', status: 'present' },
        { id: '2', student_id: 's2', status: 'absent' },
      ],
      error: null,
    })

    const res = await attendance.request('/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { student_id: 's1', date: '2025-03-01', status: 'present', recorded_by: 'admin' },
        { student_id: 's2', date: '2025-03-01', status: 'absent', recorded_by: 'admin' },
      ]),
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveLength(2)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('attendance', {
      data: null,
      error: { message: 'upsert failed' },
    })

    const res = await attendance.request('/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([]),
    })

    expect(res.status).toBe(500)
  })
})

// ── GET /stats/trend — Attendance trend ──────────────────────────────────────

describe('GET /stats/trend — attendance trend', () => {
  test('returns monthly trend data with correct grouping and rate calculation', async () => {
    setMockResponse('attendance', {
      data: [
        { date: '2025-01-10', status: 'present' },
        { date: '2025-01-11', status: 'late' },
        { date: '2025-01-12', status: 'absent' },
        { date: '2025-01-13', status: 'excused' },
        { date: '2025-02-05', status: 'present' },
        { date: '2025-02-06', status: 'present' },
      ],
      error: null,
    })

    const res = await attendance.request('/stats/trend?months=6')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toHaveLength(2)

    // Jan: 4 total, 2 present (present + late), rate = 50
    const jan = json.find((p: { month: string }) => p.month === '2025-01')
    expect(jan.total).toBe(4)
    expect(jan.present).toBe(2)
    expect(jan.rate).toBe(50)

    // Feb: 2 total, 2 present, rate = 100
    const feb = json.find((p: { month: string }) => p.month === '2025-02')
    expect(feb.total).toBe(2)
    expect(feb.present).toBe(2)
    expect(feb.rate).toBe(100)
  })

  test('returns empty array when no data', async () => {
    setMockResponse('attendance', { data: [], error: null })

    const res = await attendance.request('/stats/trend?months=3')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setMockResponse('attendance', {
      data: null,
      error: { message: 'query failed' },
    })

    const res = await attendance.request('/stats/trend?months=6')
    expect(res.status).toBe(500)
  })
})

// ── GET /stats/summary — Monthly summary ─────────────────────────────────────

describe('GET /stats/summary — monthly summary', () => {
  test('returns status counts', async () => {
    setMockResponse('attendance', {
      data: [
        { status: 'present' },
        { status: 'present' },
        { status: 'absent' },
        { status: 'late' },
      ],
      error: null,
    })

    const res = await attendance.request('/stats/summary?month=3&year=2025')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.present).toBe(2)
    expect(json.absent).toBe(1)
    expect(json.late).toBe(1)
  })

  test('returns empty object when no records', async () => {
    setMockResponse('attendance', { data: [], error: null })

    const res = await attendance.request('/stats/summary?month=12&year=2025')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual({})
  })
})
