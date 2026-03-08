import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import students from './students'

beforeEach(() => clearMockResponses())

// ── GET / — List students ────────────────────────────────────────────────────

describe('GET / — list students', () => {
  test('returns paginated response with correct shape', async () => {
    setMockResponse('students', {
      data: [
        { id: '1', full_name: 'Ali', classrooms: { name: 'Rose' }, gender: 'male' },
        { id: '2', full_name: 'Maya', classrooms: { name: 'Lily' }, gender: 'female' },
      ],
      error: null,
      count: 2,
    })

    const res = await students.request('/?page=1&limit=12')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
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
  test('returns student with attendance', async () => {
    setMockResponse('students', {
      data: {
        id: '1',
        full_name: 'Ali',
        classrooms: { name: 'Rose' },
        attendance: [{ date: '2025-03-01', status: 'present' }],
      },
      error: null,
    })

    const res = await students.request('/abc-123')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.full_name).toBe('Ali')
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

// ── POST /bulk — Bulk import ─────────────────────────────────────────────────

describe('POST /bulk — bulk import', () => {
  test('imports valid rows and reports failures', async () => {
    setMockResponse('classrooms', {
      data: [{ id: '00000000-0000-0000-0000-000000000001', name: 'Rose' }],
      error: null,
    })
    setMockResponse('students', { data: null, error: null })

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
