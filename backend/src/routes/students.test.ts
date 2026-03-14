import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import students from './students'

beforeEach(() => clearMockResponses())

// ── GET / — List students ────────────────────────────────────────────────────

describe('GET / — list students', () => {
  test('returns paginated response with flattened parent', async () => {
    setMockResponse('students', {
      data: [
        {
          id: '1',
          full_name: 'Ali',
          classrooms: { name: 'Rose', academic_year: '2026' },
          parent_students: [{ parents: { full_name: 'Abu', email: 'abu@test.com', phone: '012' } }],
          gender: 'male',
        },
        {
          id: '2',
          full_name: 'Maya',
          classrooms: { name: 'Lily', academic_year: '2026' },
          parent_students: [],
          gender: 'female',
        },
      ],
      error: null,
      count: 2,
    })

    const res = await students.request('/?page=1&limit=12')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.data[0].class_name).toBe('Rose (2026)')
    expect(json.data[0].parent).toEqual({ full_name: 'Abu', email: 'abu@test.com', phone: '012' })
    expect(json.data[1].parent).toBeNull()
    expect(json.meta).toEqual({ total: 2, page: 1, limit: 12, totalPages: 1 })
  })

  test('returns empty data when no students exist', async () => {
    setMockResponse('students', { data: [], error: null, count: 0 })

    const res = await students.request('/')
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })

  test('defaults to page 1, limit 12', async () => {
    setMockResponse('students', { data: [], error: null, count: 0 })

    const res = await students.request('/')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(12)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('students', {
      data: null,
      error: { message: 'connection refused' },
    })

    const res = await students.request('/')
    expect(res.status).toBe(500)
  })
})

// ── Pagination behaviour ────────────────────────────────────────────────────

describe('GET / — pagination', () => {
  test('custom page and limit are reflected in meta', async () => {
    setMockResponse('students', { data: [], error: null, count: 50 })

    const res = await students.request('/?page=3&limit=10')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 50, page: 3, limit: 10, totalPages: 5 })
  })

  test('totalPages rounds up (not down)', async () => {
    setMockResponse('students', { data: [], error: null, count: 25 })

    const res = await students.request('/?limit=10')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(3) // 25/10 = 2.5 → ceil = 3
  })

  test('totalPages is 1 when count equals limit', async () => {
    setMockResponse('students', { data: [], error: null, count: 12 })

    const res = await students.request('/')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(1) // 12/12 = 1
  })

  test('totalPages is 0 when count is 0', async () => {
    setMockResponse('students', { data: [], error: null, count: 0 })

    const res = await students.request('/')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(0) // 0/12 = 0
  })

  test('limit is clamped to max 100', async () => {
    setMockResponse('students', { data: [], error: null, count: 0 })

    const res = await students.request('/?limit=999')
    expect(res.status).toBe(400) // Zod .max(100) rejects
  })

  test('rejects page < 1', async () => {
    const res = await students.request('/?page=0')
    expect(res.status).toBe(400) // Zod .min(1) rejects
  })

  test('rejects negative page', async () => {
    const res = await students.request('/?page=-1')
    expect(res.status).toBe(400)
  })

  test('rejects limit < 1', async () => {
    const res = await students.request('/?limit=0')
    expect(res.status).toBe(400)
  })

  test('page beyond total still returns empty data with correct meta', async () => {
    setMockResponse('students', { data: [], error: null, count: 5 })

    const res = await students.request('/?page=99&limit=12')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta).toEqual({ total: 5, page: 99, limit: 12, totalPages: 1 })
  })

  test('count null is treated as 0', async () => {
    setMockResponse('students', { data: [], error: null })

    const res = await students.request('/')
    const json = await res.json()
    expect(json.meta.total).toBe(0)
    expect(json.meta.totalPages).toBe(0)
  })
})

// ── GET / — Filter params ────────────────────────────────────────────────────

describe('GET / — filter params', () => {
  test('empty string class_id is treated as no filter (200, not 400)', async () => {
    setMockResponse('students', { data: [], error: null, count: 0 })

    const res = await students.request('/?class_id=')
    expect(res.status).toBe(200)
  })

  test('valid UUID class_id is accepted', async () => {
    setMockResponse('students', { data: [], error: null, count: 0 })

    const res = await students.request('/?class_id=00000000-0000-0000-0000-000000000001')
    expect(res.status).toBe(200)
  })

  test('invalid non-empty class_id is rejected (400)', async () => {
    const res = await students.request('/?class_id=not-a-uuid')
    expect(res.status).toBe(400)
  })

  test('empty string gender is treated as no filter (200, not 400)', async () => {
    setMockResponse('students', { data: [], error: null, count: 0 })

    const res = await students.request('/?gender=')
    expect(res.status).toBe(200)
  })
})

// ── GET /:id — Single student ────────────────────────────────────────────────

describe('GET /:id — single student', () => {
  test('returns student with attendance and flattened parent', async () => {
    setMockResponse('students', {
      data: {
        id: '1',
        full_name: 'Ali',
        classrooms: { name: 'Rose', academic_year: '2026' },
        parent_students: [{ parents: { full_name: 'Abu', email: 'abu@test.com', phone: '012' } }],
        attendance: [{ date: '2025-03-01', status: 'present' }],
      },
      error: null,
    })

    const res = await students.request('/abc-123')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.full_name).toBe('Ali')
    expect(json.class_name).toBe('Rose (2026)')
    expect(json.parent).toEqual({ full_name: 'Abu', email: 'abu@test.com', phone: '012' })
    expect(json.attendance).toHaveLength(1)
  })

  test('returns 404 when not found', async () => {
    setMockResponse('students', {
      data: null,
      error: { message: 'Row not found' },
    })

    const res = await students.request('/nonexistent')
    expect(res.status).toBe(404)
  })
})

// ── POST / — Create student ─────────────────────────────────────────────────

describe('POST / — create student', () => {
  const validStudent = {
    full_name: 'Ali bin Abu',
    date_of_birth: '2019-05-10',
    gender: 'male' as const,
    class_id: '00000000-0000-0000-0000-000000000001',
    parent_name: 'Abu bin Ahmad',
    parent_email: 'abu@example.com',
    parent_phone: '0123456789',
  }

  test('creates and returns student with 201', async () => {
    setMockResponse('students', {
      data: { id: 'new-1', ...validStudent },
      error: null,
    })
    // Parent auto-link: existing parent found
    setMockResponse('parents', {
      data: { id: 'parent-1' },
      error: null,
    })
    setMockResponse('parent_students', { data: null, error: null })

    const res = await students.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validStudent),
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.full_name).toBe('Ali bin Abu')
  })

  test('rejects missing required fields', async () => {
    const res = await students.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Ali' }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects invalid email', async () => {
    const res = await students.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validStudent, parent_email: 'not-an-email' }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects invalid gender', async () => {
    const res = await students.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validStudent, gender: 'other' }),
    })

    expect(res.status).toBe(400)
  })
})

// ── POST / — Parent auto-link ────────────────────────────────────────────────

describe('POST / — parent auto-link', () => {
  const validStudent = {
    full_name: 'Ali bin Abu',
    date_of_birth: '2019-05-10',
    gender: 'male' as const,
    parent_name: 'Abu bin Ahmad',
    parent_email: 'abu@example.com',
    parent_phone: '0123456789',
  }

  test('creates student even if parent auto-link fails', async () => {
    setMockResponse('students', {
      data: { id: 'new-1', ...validStudent },
      error: null,
    })
    // Parent lookup fails → auto-link silently fails, student still created
    setMockResponse('parents', { data: null, error: { message: 'DB error' } })

    const res = await students.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validStudent),
    })

    expect(res.status).toBe(201)
  })

  test('links to existing parent by email', async () => {
    setMockResponse('students', {
      data: { id: 'new-1', ...validStudent },
      error: null,
    })
    // Existing parent found by email
    setMockResponse('parents', { data: { id: 'existing-parent' }, error: null })
    setMockResponse('parent_students', { data: null, error: null })

    const res = await students.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validStudent),
    })

    expect(res.status).toBe(201)
  })
})

// ── POST /bulk — Bulk import ─────────────────────────────────────────────────

describe('POST /bulk — bulk import', () => {
  test('imports valid rows and reports failures', async () => {
    setMockResponse('classrooms', {
      data: [{ id: '00000000-0000-0000-0000-000000000001', name: 'Rose' }],
      error: null,
    })
    setMockResponse('students', {
      data: [{ id: 'new-1' }],
      error: null,
    })
    setMockResponse('parents', { data: { id: 'parent-1' }, error: null })
    setMockResponse('parent_students', { data: null, error: null })

    const res = await students.request('/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        students: [
          {
            full_name: 'Ali',
            gender: 'male',
            class_name: 'Rose',
            parent_name: 'Abu',
            parent_email: 'abu@test.com',
            parent_phone: '012',
          },
          {
            full_name: '',
            gender: 'male',
            class_name: 'Rose',
            parent_name: 'Abu',
            parent_email: 'abu@test.com',
            parent_phone: '012',
          },
        ],
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.imported).toBe(1)
    expect(json.failed).toHaveLength(1)
    expect(json.failed[0].reason).toContain('full_name')
  })

  test('returns error for empty students array', async () => {
    const res = await students.request('/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: [] }),
    })

    expect(res.status).toBe(400)
  })
})

// ── PUT /:id — Update student ────────────────────────────────────────────────

describe('PUT /:id — update student', () => {
  test('updates and returns student', async () => {
    setMockResponse('students', {
      data: { id: '1', full_name: 'Ali Updated', class_id: '00000000-0000-0000-0000-000000000002' },
      error: null,
    })

    const res = await students.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Ali Updated' }),
    })

    expect(res.status).toBe(200)
  })
})

// ── PUT /:id — Parent auto-link on update ────────────────────────────────────

describe('PUT /:id — parent auto-link on update', () => {
  test('syncs parent when all three parent fields provided', async () => {
    setMockResponse('students', {
      data: {
        id: '1',
        full_name: 'Ali',
        parent_name: 'Abu Updated',
        parent_email: 'abu@test.com',
        parent_phone: '012',
      },
      error: null,
    })
    setMockResponse('parents', { data: { id: 'parent-1' }, error: null })
    setMockResponse('parent_students', { data: null, error: null })

    const res = await students.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent_name: 'Abu Updated',
        parent_email: 'abu@test.com',
        parent_phone: '012',
      }),
    })

    expect(res.status).toBe(200)
  })

  test('skips parent sync when only partial parent fields provided', async () => {
    setMockResponse('students', {
      data: { id: '1', full_name: 'Ali' },
      error: null,
    })

    const res = await students.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Ali Updated' }),
    })

    expect(res.status).toBe(200)
  })
})

// ── DELETE /:id — Delete student ─────────────────────────────────────────────

describe('DELETE /:id — delete student', () => {
  test('returns success message', async () => {
    setMockResponse('students', { data: null, error: null })

    const res = await students.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('Student deleted')
  })

  test('returns 500 on database error', async () => {
    setMockResponse('students', {
      data: null,
      error: { message: 'foreign key violation' },
    })

    const res = await students.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(500)
  })
})

// ── POST /:id/access-code — generate access code ───────────────────────────

describe('POST /:id/access-code — generate access code', () => {
  test('generates and returns access code', async () => {
    setMockResponse('students', {
      data: { id: '1', access_code: 'KC-2026-1234' },
      error: null,
    })

    const res = await students.request('/1/access-code', { method: 'POST' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.access_code).toBe('KC-2026-1234')
  })

  test('returns 500 on non-unique database error', async () => {
    setMockResponse('students', {
      data: null,
      error: { message: 'some database error' },
    })

    const res = await students.request('/1/access-code', { method: 'POST' })
    expect(res.status).toBe(500)
  })
})

// ── PUT /:id/portal-pin — set portal PIN ────────────────────────────────────

describe('PUT /:id/portal-pin — set portal PIN', () => {
  test('sets PIN and returns ok', async () => {
    setMockResponse('students', { data: null, error: null })

    const res = await students.request('/1/portal-pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '123456' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  test('rejects non-6-digit PIN', async () => {
    const res = await students.request('/1/portal-pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '12345' }),
    })
    expect(res.status).toBe(400)
  })

  test('rejects non-numeric PIN', async () => {
    const res = await students.request('/1/portal-pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'abcdef' }),
    })
    expect(res.status).toBe(400)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('students', {
      data: null,
      error: { message: 'update failed' },
    })

    const res = await students.request('/1/portal-pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '654321' }),
    })

    expect(res.status).toBe(500)
  })
})

// ── DELETE /:id/portal-access — revoke portal access ────────────────────────

describe('DELETE /:id/portal-access — revoke portal access', () => {
  test('revokes access and returns ok', async () => {
    setMockResponse('students', { data: null, error: null })
    setMockResponse('parent_sessions', { data: null, error: null })

    const res = await students.request('/1/portal-access', { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  test('returns 500 on student update error', async () => {
    setMockResponse('students', {
      data: null,
      error: { message: 'student update failed' },
    })
    setMockResponse('parent_sessions', { data: null, error: null })

    const res = await students.request('/1/portal-access', { method: 'DELETE' })
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('student update failed')
  })

  test('returns 500 on session delete error', async () => {
    setMockResponse('students', { data: null, error: null })
    setMockResponse('parent_sessions', {
      data: null,
      error: { message: 'session delete failed' },
    })

    const res = await students.request('/1/portal-access', { method: 'DELETE' })
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('session delete failed')
  })
})

// ── GET /:id/timeline — Student timeline ─────────────────────────────────────

describe('GET /:id/timeline — student timeline', () => {
  function setTimelineMocks(
    overrides: Partial<Record<string, { data: unknown[]; error: null }>> = {}
  ) {
    setMockResponse('attendance', overrides.attendance ?? { data: [], error: null })
    setMockResponse('portfolio_entries', overrides.portfolio_entries ?? { data: [], error: null })
    setMockResponse('art_wall', overrides.art_wall ?? { data: [], error: null })
    setMockResponse('fee_records', overrides.fee_records ?? { data: [], error: null })
    setMockResponse('portfolio_reports', overrides.portfolio_reports ?? { data: [], error: null })
    setMockResponse('daily_reports', overrides.daily_reports ?? { data: [], error: null })
  }

  test('returns empty events when student has no activity', async () => {
    setTimelineMocks()

    const res = await students.request('/abc-123/timeline')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.events).toEqual([])
    expect(json.has_more).toBe(false)
  })

  test('returns attendance events with capitalized status', async () => {
    setTimelineMocks({
      attendance: {
        data: [
          { date: '2026-03-10', status: 'present' },
          { date: '2026-03-09', status: 'absent' },
        ],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline?limit=20')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.events.length).toBe(2)
    expect(json.events[0].type).toBe('attendance')
    expect(json.events[0].title).toBe('Present')
    expect(json.events[0].date).toBe('2026-03-10')
    expect(json.events[1].title).toBe('Absent')
  })

  test('returns portfolio events with domain as title', async () => {
    setTimelineMocks({
      portfolio_entries: {
        data: [
          {
            id: 'p1',
            domain: 'social_emotional',
            observation: 'Plays well with others',
            entry_date: '2026-03-08',
          },
        ],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline')
    const json = await res.json()

    expect(json.events.length).toBe(1)
    expect(json.events[0].type).toBe('portfolio')
    expect(json.events[0].title).toBe('Social emotional')
    expect(json.events[0].subtitle).toBe('Plays well with others')
  })

  test('returns artwork events', async () => {
    setTimelineMocks({
      art_wall: {
        data: [
          { id: 'a1', caption: 'My Family', artwork_date: '2026-03-07' },
          { id: 'a2', caption: '', artwork_date: '2026-03-06' },
        ],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline')
    const json = await res.json()

    expect(json.events.length).toBe(2)
    expect(json.events[0].type).toBe('artwork')
    expect(json.events[0].title).toBe('My Family')
    expect(json.events[1].title).toBe('Artwork')
  })

  test('returns fee payment events with formatted amount', async () => {
    setTimelineMocks({
      fee_records: {
        data: [
          {
            id: 'f1',
            description: 'Tuition Feb',
            amount_paid: 150,
            paid_at: '2026-02-15T10:00:00Z',
          },
        ],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline')
    const json = await res.json()

    expect(json.events.length).toBe(1)
    expect(json.events[0].type).toBe('fee_payment')
    expect(json.events[0].title).toBe('RM 150.00')
    expect(json.events[0].subtitle).toBe('Tuition Feb')
    expect(json.events[0].date).toBe('2026-02-15')
  })

  test('returns report card events', async () => {
    setTimelineMocks({
      portfolio_reports: {
        data: [{ term: 'Term 1 2026', generated_at: '2026-06-01T00:00:00Z' }],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline')
    const json = await res.json()

    expect(json.events.length).toBe(1)
    expect(json.events[0].type).toBe('report_card')
    expect(json.events[0].title).toBe('Report Card: Term 1 2026')
  })

  test('returns daily report events with mood', async () => {
    setTimelineMocks({
      daily_reports: {
        data: [
          {
            id: 'd1',
            report_date: '2026-03-10',
            mood: 'happy',
            activity_note: 'Played with blocks',
          },
          { id: 'd2', report_date: '2026-03-09', mood: null, activity_note: null },
        ],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline')
    const json = await res.json()

    expect(json.events.length).toBe(2)
    expect(json.events[0].type).toBe('daily_report')
    expect(json.events[0].title).toBe('Daily Report - happy')
    expect(json.events[0].subtitle).toBe('Played with blocks')
    expect(json.events[1].title).toBe('Daily Report')
    expect(json.events[1].subtitle).toBeUndefined()
  })

  test('merges and sorts events from multiple sources by date descending', async () => {
    setTimelineMocks({
      attendance: {
        data: [{ date: '2026-03-10', status: 'present' }],
        error: null,
      },
      portfolio_entries: {
        data: [
          { id: 'p1', domain: 'creative', observation: 'Drew a cat', entry_date: '2026-03-12' },
        ],
        error: null,
      },
      fee_records: {
        data: [
          { id: 'f1', description: 'Tuition', amount_paid: 100, paid_at: '2026-03-08T00:00:00Z' },
        ],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline')
    const json = await res.json()

    expect(json.events.length).toBe(3)
    expect(json.events[0].date).toBe('2026-03-12')
    expect(json.events[0].type).toBe('portfolio')
    expect(json.events[1].date).toBe('2026-03-10')
    expect(json.events[1].type).toBe('attendance')
    expect(json.events[2].date).toBe('2026-03-08')
    expect(json.events[2].type).toBe('fee_payment')
  })

  test('respects limit parameter', async () => {
    setTimelineMocks({
      attendance: {
        data: [
          { date: '2026-03-10', status: 'present' },
          { date: '2026-03-09', status: 'absent' },
          { date: '2026-03-08', status: 'late' },
        ],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline?limit=2')
    const json = await res.json()

    expect(json.events.length).toBe(2)
    expect(json.has_more).toBe(true)
    expect(json.next_cursor).toBe('2026-03-09')
  })

  test('has_more is false when all events fit in one page', async () => {
    setTimelineMocks({
      attendance: {
        data: [{ date: '2026-03-10', status: 'present' }],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline?limit=20')
    const json = await res.json()

    expect(json.events.length).toBe(1)
    expect(json.has_more).toBe(false)
  })

  test('rejects limit above 50', async () => {
    const res = await students.request('/abc-123/timeline?limit=51')
    expect(res.status).toBe(400)
  })

  test('rejects limit below 1', async () => {
    const res = await students.request('/abc-123/timeline?limit=0')
    expect(res.status).toBe(400)
  })

  test('accepts before cursor parameter', async () => {
    setTimelineMocks({
      attendance: {
        data: [{ date: '2026-02-28', status: 'present' }],
        error: null,
      },
    })

    const res = await students.request('/abc-123/timeline?before=2026-03-01')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.events.length).toBe(1)
    expect(json.events[0].date).toBe('2026-02-28')
  })
})
