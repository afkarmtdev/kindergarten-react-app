import { describe, test, expect, beforeEach, mock } from 'bun:test'
import {
  mockSupabase,
  setMockResponse,
  setRpcMockResponse,
  clearMockResponses,
} from '../test-utils/mockSupabase'

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
  test('returns monthly trend data', async () => {
    setRpcMockResponse('dashboard_attendance_trend', {
      data: [
        { month: '2026-01', total: 500, present: 450, rate: 90 },
        { month: '2026-02', total: 480, present: 432, rate: 90 },
      ],
      error: null,
    })

    const res = await attendance.request('/stats/trend?months=6')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toHaveLength(2)

    const jan = json.find((p: { month: string }) => p.month === '2026-01')
    expect(jan.total).toBe(500)
    expect(jan.present).toBe(450)
    expect(jan.rate).toBe(90)

    const feb = json.find((p: { month: string }) => p.month === '2026-02')
    expect(feb.total).toBe(480)
    expect(feb.present).toBe(432)
    expect(feb.rate).toBe(90)
  })

  test('returns empty array when no data', async () => {
    setRpcMockResponse('dashboard_attendance_trend', { data: [], error: null })

    const res = await attendance.request('/stats/trend?months=3')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setRpcMockResponse('dashboard_attendance_trend', {
      data: null,
      error: { message: 'RPC failed' },
    })

    const res = await attendance.request('/stats/trend?months=6')
    expect(res.status).toBe(500)
  })
})

// ── GET /stats/summary — Monthly summary ─────────────────────────────────────

describe('GET /stats/summary — monthly summary', () => {
  test('returns status counts', async () => {
    setRpcMockResponse('dashboard_attendance_summary', {
      data: { present: 15, absent: 3, late: 2, excused: 1 },
      error: null,
    })

    const res = await attendance.request('/stats/summary?month=3&year=2025')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.present).toBe(15)
    expect(json.absent).toBe(3)
    expect(json.late).toBe(2)
  })

  test('returns empty object when no records', async () => {
    setRpcMockResponse('dashboard_attendance_summary', { data: null, error: null })

    const res = await attendance.request('/stats/summary?month=12&year=2025')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual({})
  })

  test('returns 500 on database error', async () => {
    setRpcMockResponse('dashboard_attendance_summary', {
      data: null,
      error: { message: 'RPC failed' },
    })

    const res = await attendance.request('/stats/summary?month=3&year=2025')
    expect(res.status).toBe(500)
  })
})

// ── POST /bulk — bulk attendance ────────────────────────────────────────────

describe('POST /bulk — bulk attendance', () => {
  test('upserts multiple records and returns data', async () => {
    const records = [
      { student_id: 's1', date: '2025-03-14', status: 'present' },
      { student_id: 's2', date: '2025-03-14', status: 'absent' },
    ]

    setMockResponse('attendance', {
      data: records.map((r, i) => ({ id: String(i + 1), ...r })),
      error: null,
    })

    const res = await attendance.request('/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records),
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveLength(2)
  })

  test('handles empty array', async () => {
    setMockResponse('attendance', { data: [], error: null })

    const res = await attendance.request('/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([]),
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setMockResponse('attendance', {
      data: null,
      error: { message: 'bulk upsert failed' },
    })

    const res = await attendance.request('/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ student_id: 's1', date: '2025-03-14', status: 'present' }]),
    })

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('bulk upsert failed')
  })
})

// ── POST / with notes — attendance with optional notes field ─────────────────

describe('POST / — attendance with notes', () => {
  test('accepts attendance record with notes field', async () => {
    setMockResponse('attendance', {
      data: {
        id: 'new-1',
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        date: '2025-03-01',
        status: 'excused',
        notes: 'Doctor appointment',
      },
      error: null,
    })

    const res = await attendance.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        date: '2025-03-01',
        status: 'excused',
        notes: 'Doctor appointment',
        recorded_by: 'admin-1',
      }),
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.notes).toBe('Doctor appointment')
  })

  test('accepts attendance record without notes field', async () => {
    setMockResponse('attendance', {
      data: {
        id: 'new-2',
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        date: '2025-03-02',
        status: 'present',
      },
      error: null,
    })

    const res = await attendance.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        date: '2025-03-02',
        status: 'present',
        recorded_by: 'admin-1',
      }),
    })

    expect(res.status).toBe(201)
  })
})

// ── POST /bulk with mixed statuses ───────────────────────────────────────────

describe('POST /bulk — mixed statuses', () => {
  test('accepts all four valid statuses in the same batch', async () => {
    const records = [
      { student_id: 's1', date: '2025-03-15', status: 'present' },
      { student_id: 's2', date: '2025-03-15', status: 'absent' },
      { student_id: 's3', date: '2025-03-15', status: 'late' },
      { student_id: 's4', date: '2025-03-15', status: 'excused' },
    ]

    setMockResponse('attendance', {
      data: records.map((r, i) => ({ id: String(i + 1), ...r })),
      error: null,
    })

    const res = await attendance.request('/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records),
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveLength(4)
  })
})

// ── GET /date/:date with status filter ───────────────────────────────────────

describe('GET /date/:date — status filter', () => {
  test('filters by present status', async () => {
    setMockResponse('attendance', {
      data: [{ id: '1', student_id: 's1', date: '2025-03-01', status: 'present' }],
      error: null,
      count: 1,
    })

    const res = await attendance.request('/date/2025-03-01?status=present')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  test('filters by absent status', async () => {
    setMockResponse('attendance', {
      data: [{ id: '2', student_id: 's2', date: '2025-03-01', status: 'absent' }],
      error: null,
      count: 1,
    })

    const res = await attendance.request('/date/2025-03-01?status=absent')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
  })

  test('empty string status is treated as no filter (200, not 400)', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 0 })

    const res = await attendance.request('/date/2025-03-01?status=')
    expect(res.status).toBe(200)
  })

  test('rejects invalid status value', async () => {
    const res = await attendance.request('/date/2025-03-01?status=unknown')
    expect(res.status).toBe(400)
  })
})

// ── GET /date/:date with empty results ───────────────────────────────────────

describe('GET /date/:date — empty results', () => {
  test('returns empty array with total 0 when no attendance for date', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 0 })

    const res = await attendance.request('/date/2025-12-31')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
    expect(json.meta.totalPages).toBe(0)
  })
})

// ── GET /student/:studentId with date range ───────────────────────────────────

describe('GET /student/:studentId — date range filter', () => {
  test('applies fromDate filter', async () => {
    setMockResponse('attendance', {
      data: [
        { id: '1', date: '2025-03-15', status: 'present' },
        { id: '2', date: '2025-03-20', status: 'absent' },
      ],
      error: null,
      count: 2,
    })

    const res = await attendance.request('/student/abc-123?from=2025-03-15')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(2)
  })

  test('applies toDate filter', async () => {
    setMockResponse('attendance', {
      data: [{ id: '1', date: '2025-02-28', status: 'late' }],
      error: null,
      count: 1,
    })

    const res = await attendance.request('/student/abc-123?to=2025-02-28')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
  })

  test('applies both fromDate and toDate filters', async () => {
    setMockResponse('attendance', {
      data: [
        { id: '1', date: '2025-03-10', status: 'present' },
        { id: '2', date: '2025-03-11', status: 'present' },
      ],
      error: null,
      count: 2,
    })

    const res = await attendance.request('/student/abc-123?from=2025-03-10&to=2025-03-15')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta).toEqual({ total: 2, page: 1, limit: 20, totalPages: 1 })
  })

  test('returns empty when no records match date range', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 0 })

    const res = await attendance.request('/student/abc-123?from=2030-01-01&to=2030-01-31')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })
})
