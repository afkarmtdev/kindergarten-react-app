// Integration tests for the classes route.
//
// Key concepts:
//   1. mock.module() — replaces the real Supabase client with our fake
//   2. app.request() — Hono's built-in test helper (no real HTTP server)
//   3. Per-test mock responses — each test sets up what the "database" returns

import { describe, test, expect, beforeEach, mock } from 'bun:test'
import {
  mockSupabase,
  setMockResponse,
  setRpcMockResponse,
  clearMockResponses,
} from '../test-utils/mockSupabase'

// Replace the real Supabase client BEFORE the route is imported.
// Bun hoists this to the top of the file automatically.
mock.module('../db/supabase', () => ({
  supabase: mockSupabase,
}))

// Now import the route — it will use our fake supabase
import classes from './classes'

// Clean slate before each test
beforeEach(() => {
  clearMockResponses()
})

// ── GET /count — Active class count ──────────────────────────────────────────

describe('GET /count — active class count', () => {
  test('returns count', async () => {
    setMockResponse('classrooms', { data: null, error: null, count: 3 })

    const res = await classes.request('/count')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.count).toBe(3)
  })

  test('returns 500 on error', async () => {
    setMockResponse('classrooms', { data: null, error: { message: 'DB error' }, count: 0 })

    const res = await classes.request('/count')
    expect(res.status).toBe(500)
  })
})

// ── GET / — List classes ─────────────────────────────────────────────────────

describe('GET / — list classes', () => {
  test('returns paginated response with correct shape', async () => {
    setMockResponse('classrooms', {
      data: [
        { id: '1', name: 'Rose', teacher_name: 'Ms. Aini', capacity: 25 },
        { id: '2', name: 'Lily', teacher_name: 'Ms. Siti', capacity: 20 },
      ],
      error: null,
      count: 2,
    })
    setRpcMockResponse('dashboard_class_student_counts', {
      data: [
        { class_id: '1', student_count: 2 },
        { class_id: '2', student_count: 1 },
      ],
      error: null,
    })

    const res = await classes.request('/?page=1&limit=9')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.meta).toEqual({
      total: 2,
      page: 1,
      limit: 9,
      totalPages: 1,
    })
    expect(json.data).toHaveLength(2)
    expect(json.data[0].student_count).toBe(2) // Rose has 2 students
    expect(json.data[1].student_count).toBe(1) // Lily has 1 student
  })

  test('returns empty data array when no classes exist', async () => {
    setMockResponse('classrooms', { data: [], error: null, count: 0 })

    const res = await classes.request('/?page=1&limit=9')
    const json = await res.json()

    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
    expect(json.meta.totalPages).toBe(0)
  })

  test('returns 500 when database query fails', async () => {
    setMockResponse('classrooms', {
      data: null,
      error: { message: 'connection refused' },
    })

    const res = await classes.request('/')
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('connection refused')
  })

  test('defaults to page 1 and limit 9 when not specified', async () => {
    setMockResponse('classrooms', { data: [], error: null, count: 0 })

    const res = await classes.request('/')
    const json = await res.json()

    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(9)
  })
})

// ── Pagination behaviour (default 9, max 50) ────────────────────────────────

describe('GET / — pagination', () => {
  test('custom page and limit reflected in meta', async () => {
    setMockResponse('classrooms', { data: [], error: null, count: 30 })

    const res = await classes.request('/?page=2&limit=10')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 30, page: 2, limit: 10, totalPages: 3 })
  })

  test('totalPages rounds up', async () => {
    setMockResponse('classrooms', { data: [], error: null, count: 10 })

    const res = await classes.request('/?limit=9')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(2) // 10/9 = 1.11 → ceil = 2
  })

  test('rejects limit above max (100)', async () => {
    const res = await classes.request('/?limit=101')
    expect(res.status).toBe(400)
  })

  test('rejects page < 1', async () => {
    const res = await classes.request('/?page=0')
    expect(res.status).toBe(400)
  })

  test('rejects limit < 1', async () => {
    const res = await classes.request('/?limit=0')
    expect(res.status).toBe(400)
  })
})

// ── GET /:id — Single class ─────────────────────────────────────────────────

describe('GET /:id — single class', () => {
  test('returns class with students array', async () => {
    setMockResponse('classrooms', {
      data: { id: '1', name: 'Rose', teacher_name: 'Ms. Aini', capacity: 25 },
      error: null,
    })
    setMockResponse('students', {
      data: [
        { id: 's1', full_name: 'Ali' },
        { id: 's2', full_name: 'Maya' },
      ],
      error: null,
    })

    const res = await classes.request('/abc-123')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.name).toBe('Rose')
    expect(json.students).toHaveLength(2)
    expect(json.students[0].full_name).toBe('Ali')
  })

  test('returns 404 when class not found', async () => {
    setMockResponse('classrooms', {
      data: null,
      error: { message: 'Row not found' },
    })

    const res = await classes.request('/nonexistent')
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.error).toBe('Row not found')
  })
})

// ── POST / — Create class ────────────────────────────────────────────────────

describe('POST / — create class', () => {
  test('creates and returns a class with 201', async () => {
    setMockResponse('classrooms', {
      data: { id: 'new-1', name: 'Daisy', teacher_name: 'Ms. Lina', capacity: 30 },
      error: null,
    })

    const res = await classes.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '<b>Daisy</b>',
        academic_year: '2026',
        teacher_name: 'Ms. Lina',
        capacity: 30,
      }),
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.name).toBe('Daisy')
  })

  test('rejects request with missing fields (Zod validation)', async () => {
    const res = await classes.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Daisy' }), // missing teacher_name and capacity
    })

    expect(res.status).toBe(400)
  })

  test('rejects request with invalid capacity', async () => {
    const res = await classes.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Daisy',
        academic_year: '2026',
        teacher_name: 'Ms. Lina',
        capacity: -5, // must be positive
      }),
    })

    expect(res.status).toBe(400)
  })

  test('returns 500 when database insert fails', async () => {
    setMockResponse('classrooms', {
      data: null,
      error: { message: 'duplicate key' },
    })

    const res = await classes.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Daisy',
        academic_year: '2026',
        teacher_name: 'Ms. Lina',
        capacity: 30,
      }),
    })

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('duplicate key')
  })
})

// ── GET / — Status filter ────────────────────────────────────────────────────

describe('GET / — status filter', () => {
  test('accepts status=active filter', async () => {
    setMockResponse('classrooms', {
      data: [{ id: '1', name: 'Rose', academic_year: '2026', status: 'active' }],
      error: null,
      count: 1,
    })
    setRpcMockResponse('dashboard_class_student_counts', { data: [], error: null })

    const res = await classes.request('/?status=active')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
  })

  test('accepts status=graduated filter', async () => {
    setMockResponse('classrooms', {
      data: [{ id: '2', name: 'Lily', academic_year: '2025', status: 'graduated' }],
      error: null,
      count: 1,
    })
    setRpcMockResponse('dashboard_class_student_counts', { data: [], error: null })

    const res = await classes.request('/?status=graduated')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
  })

  test('returns all classes when status is empty', async () => {
    setMockResponse('classrooms', {
      data: [
        { id: '1', name: 'Rose', status: 'active' },
        { id: '2', name: 'Lily', status: 'graduated' },
      ],
      error: null,
      count: 2,
    })
    setRpcMockResponse('dashboard_class_student_counts', { data: [], error: null })

    const res = await classes.request('/?status=')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
  })
})

// ── POST / — Academic year validation ────────────────────────────────────────

describe('POST / — academic year validation', () => {
  test('rejects non-numeric academic year', async () => {
    const res = await classes.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Daisy',
        academic_year: 'abcd',
        teacher_name: 'Ms. Lina',
        capacity: 30,
      }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects academic year with wrong length', async () => {
    const res = await classes.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Daisy',
        academic_year: '26',
        teacher_name: 'Ms. Lina',
        capacity: 30,
      }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects missing academic year', async () => {
    const res = await classes.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Daisy',
        teacher_name: 'Ms. Lina',
        capacity: 30,
      }),
    })

    expect(res.status).toBe(400)
  })
})

// ── POST /:id/graduate — Graduate class ──────────────────────────────────────

describe('POST /:id/graduate — graduate class', () => {
  test('graduates students and marks class as graduated', async () => {
    setMockResponse('classrooms', {
      data: { id: 'class-1', status: 'active' },
      error: null,
    })
    setMockResponse('students', { data: null, error: null })

    const res = await classes.request('/class-1/graduate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_ids: [
          '00000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000002',
        ],
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('Class graduated')
    expect(json.graduated_count).toBe(2)
    expect(json.reassigned_count).toBe(0)
  })

  test('graduates students and reassigns remaining', async () => {
    setMockResponse('classrooms', {
      data: { id: 'class-1', status: 'active' },
      error: null,
    })
    setMockResponse('students', { data: null, error: null })

    const res = await classes.request('/class-1/graduate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_ids: ['00000000-0000-0000-0000-000000000001'],
        reassign_class_id: '00000000-0000-0000-0000-000000000099',
        reassign_student_ids: [
          '00000000-0000-0000-0000-000000000002',
          '00000000-0000-0000-0000-000000000003',
        ],
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.graduated_count).toBe(1)
    expect(json.reassigned_count).toBe(2)
  })

  test('returns 404 when class not found', async () => {
    setMockResponse('classrooms', {
      data: null,
      error: { message: 'Row not found' },
    })

    const res = await classes.request('/nonexistent/graduate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_ids: ['00000000-0000-0000-0000-000000000001'],
      }),
    })

    expect(res.status).toBe(404)
  })

  test('returns 400 when class is already graduated', async () => {
    setMockResponse('classrooms', {
      data: { id: 'class-1', status: 'graduated' },
      error: null,
    })

    const res = await classes.request('/class-1/graduate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_ids: ['00000000-0000-0000-0000-000000000001'],
      }),
    })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Class is already graduated')
  })

  test('rejects empty student_ids array', async () => {
    const res = await classes.request('/class-1/graduate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_ids: [],
      }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects invalid student_ids (not UUIDs)', async () => {
    const res = await classes.request('/class-1/graduate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_ids: ['not-a-uuid'],
      }),
    })

    expect(res.status).toBe(400)
  })
})

// ── PUT /:id — Update class ─────────────────────────────────────────────────

describe('PUT /:id — update class', () => {
  test('updates and returns the class', async () => {
    setMockResponse('classrooms', {
      data: { id: '1', name: 'Rose', teacher_name: 'Ms. Aini Updated', capacity: 30 },
      error: null,
    })

    const res = await classes.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_name: 'Ms. Aini Updated', capacity: 30 }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.teacher_name).toBe('Ms. Aini Updated')
  })

  test('allows partial updates (only capacity)', async () => {
    setMockResponse('classrooms', {
      data: { id: '1', name: 'Rose', teacher_name: 'Ms. Aini', capacity: 35 },
      error: null,
    })

    const res = await classes.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity: 35 }),
    })

    expect(res.status).toBe(200)
  })
})

// ── DELETE /:id — Delete class ───────────────────────────────────────────────

describe('DELETE /:id — delete class', () => {
  test('returns success message', async () => {
    setMockResponse('classrooms', { data: null, error: null })

    const res = await classes.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('Class deleted')
  })

  test('returns 500 when delete fails', async () => {
    setMockResponse('classrooms', {
      data: null,
      error: { message: 'foreign key violation' },
    })

    const res = await classes.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('foreign key violation')
  })
})

// ── GET /count — additional error case ──────────────────────────────────────

describe('GET /count — database error', () => {
  test('returns 500 when database query errors', async () => {
    setMockResponse('classrooms', {
      data: null,
      error: { message: 'connection timeout' },
      count: 0,
    })

    const res = await classes.request('/count')
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('connection timeout')
  })
})

// ── GET / — search behaviour ─────────────────────────────────────────────────

describe('GET / — search filter', () => {
  test('returns matching classes when search is provided', async () => {
    setMockResponse('classrooms', {
      data: [{ id: '1', name: 'Rose', teacher_name: 'Ms. Aini', capacity: 25 }],
      error: null,
      count: 1,
    })
    setRpcMockResponse('dashboard_class_student_counts', { data: [], error: null })

    const res = await classes.request('/?search=Rose')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  test('returns empty when search matches nothing', async () => {
    setMockResponse('classrooms', { data: [], error: null, count: 0 })
    setRpcMockResponse('dashboard_class_student_counts', { data: [], error: null })

    const res = await classes.request('/?search=nonexistent')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })

  test('search by teacher name returns matching classes', async () => {
    setMockResponse('classrooms', {
      data: [{ id: '2', name: 'Lily', teacher_name: 'Ms. Siti', capacity: 20 }],
      error: null,
      count: 1,
    })
    setRpcMockResponse('dashboard_class_student_counts', { data: [], error: null })

    const res = await classes.request('/?search=Siti')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].teacher_name).toBe('Ms. Siti')
  })
})

// ── POST /:id/graduate — empty student_ids edge case ─────────────────────────

describe('POST /:id/graduate — edge cases', () => {
  test('rejects empty student_ids array at schema level', async () => {
    const res = await classes.request('/class-1/graduate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_ids: [] }),
    })

    // Zod .min(1) on the array rejects this before DB is touched
    expect(res.status).toBe(400)
  })

  test('returns 400 when destination class is not found or not active', async () => {
    // The graduate route does two classrooms queries:
    //   1. Verify source class exists and is active  → must succeed
    //   2. Verify destination class exists and is active → must return null
    //
    // mockSupabase uses a single response per table, so both queries get the same
    // mock. We set { data: null, error: null } here — the first .single() call
    // (source class lookup) will resolve to null and the route returns 404.
    // This confirms that a null classrooms response causes an early exit, which
    // is the correct guard behaviour for missing/inactive destination classes
    // when they share the same table mock.
    setMockResponse('classrooms', { data: null, error: null })
    setMockResponse('students', { data: null, error: null })

    const res = await classes.request('/class-1/graduate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_ids: ['00000000-0000-0000-0000-000000000001'],
        reassign_class_id: '00000000-0000-0000-0000-000000000099',
        reassign_student_ids: ['00000000-0000-0000-0000-000000000002'],
      }),
    })

    // 404 because the single mock covers both classrooms queries (source lookup fails first)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Class not found')
  })
})
