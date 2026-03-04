// Integration tests for the classes route.
//
// Key concepts:
//   1. mock.module() — replaces the real Supabase client with our fake
//   2. app.request() — Hono's built-in test helper (no real HTTP server)
//   3. Per-test mock responses — each test sets up what the "database" returns

import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

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
    setMockResponse('students', {
      data: [{ class_name: 'Rose' }, { class_name: 'Rose' }, { class_name: 'Lily' }],
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

  test('rejects limit above max (50)', async () => {
    const res = await classes.request('/?limit=51')
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
        { id: 's1', full_name: 'Ali', class_name: 'Rose' },
        { id: 's2', full_name: 'Maya', class_name: 'Rose' },
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
        teacher_name: 'Ms. Lina',
        capacity: 30,
      }),
    })

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('duplicate key')
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
