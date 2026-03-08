// Integration tests for the parents CRUD route.
//
// Tests cover: list, detail, create, update, delete, access-code generation,
// PIN setting, portal access revocation, student linking/unlinking.

import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import parents from './parents'

beforeEach(() => {
  clearMockResponses()
})

const PARENT_ID = '00000000-0000-0000-0000-000000000099'
const STUDENT_ID = '00000000-0000-0000-0000-000000000001'

const sampleParent = {
  id: PARENT_ID,
  full_name: 'Ali Hassan',
  email: 'ali@example.com',
  phone: '012-345-6789',
  access_code: null,
  created_at: '2026-01-01T00:00:00Z',
}

function post(path: string, body: unknown) {
  return parents.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function put(path: string, body: unknown) {
  return parents.request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function del(path: string) {
  return parents.request(path, { method: 'DELETE' })
}

// ─── GET / — List parents ─────────────────────────────────────────────────────

describe('GET / — list parents', () => {
  test('returns paginated response with children_count', async () => {
    setMockResponse('parents', {
      data: [
        { ...sampleParent, parent_students: [{ id: '1' }, { id: '2' }] },
        { ...sampleParent, id: '2', full_name: 'Jane Doe', parent_students: [] },
      ],
      error: null,
      count: 2,
    })

    const res = await parents.request('/?page=1&limit=12')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.meta).toEqual({ total: 2, page: 1, limit: 12, totalPages: 1 })
    expect(json.data).toHaveLength(2)
    expect(json.data[0].children_count).toBe(2)
    expect(json.data[1].children_count).toBe(0)
  })

  test('returns empty array when no parents exist', async () => {
    setMockResponse('parents', { data: [], error: null, count: 0 })

    const res = await parents.request('/?page=1&limit=12')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('parents', { data: null, error: { message: 'DB error' } })

    const res = await parents.request('/?page=1&limit=12')
    expect(res.status).toBe(500)
  })

  test('defaults to page=1 limit=12', async () => {
    setMockResponse('parents', { data: [], error: null, count: 0 })

    const res = await parents.request('/')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(12)
  })

  test('clamps limit to max 100', async () => {
    setMockResponse('parents', { data: [], error: null, count: 0 })

    const res = await parents.request('/?limit=200')
    expect(res.status).toBe(400) // zod rejects > 100
  })
})

// ─── GET /:id — Single parent ─────────────────────────────────────────────────

describe('GET /:id — single parent', () => {
  test('returns parent with children array', async () => {
    setMockResponse('parents', { data: sampleParent, error: null })
    setMockResponse('parent_students', {
      data: [
        {
          relationship: 'parent',
          students: {
            id: STUDENT_ID,
            full_name: 'Ahmad Hassan',
            photo_url: null,
            classrooms: { name: 'Rose' },
          },
        },
      ],
      error: null,
    })

    const res = await parents.request(`/${PARENT_ID}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe(PARENT_ID)
    expect(json.children).toHaveLength(1)
    expect(json.children[0].full_name).toBe('Ahmad Hassan')
    expect(json.children[0].class_name).toBe('Rose')
    expect(json.children[0].relationship).toBe('parent')
  })

  test('returns 404 when parent not found', async () => {
    setMockResponse('parents', { data: null, error: { message: 'not found' } })

    const res = await parents.request('/nonexistent-id')
    expect(res.status).toBe(404)
  })

  test('returns empty children array when no links exist', async () => {
    setMockResponse('parents', { data: sampleParent, error: null })
    setMockResponse('parent_students', { data: [], error: null })

    const res = await parents.request(`/${PARENT_ID}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.children).toEqual([])
  })

  test('handles child with no classroom', async () => {
    setMockResponse('parents', { data: sampleParent, error: null })
    setMockResponse('parent_students', {
      data: [
        {
          relationship: 'guardian',
          students: {
            id: STUDENT_ID,
            full_name: 'Ahmad Hassan',
            photo_url: null,
            classrooms: null,
          },
        },
      ],
      error: null,
    })

    const res = await parents.request(`/${PARENT_ID}`)
    const json = await res.json()
    expect(json.children[0].class_name).toBeNull()
    expect(json.children[0].relationship).toBe('guardian')
  })
})

// ─── POST / — Create parent ──────────────────────────────────────────────────

describe('POST / — create parent', () => {
  test('creates parent and returns 201', async () => {
    setMockResponse('parents', { data: sampleParent, error: null })

    const res = await post('/', {
      full_name: 'Ali Hassan',
      phone: '012-345-6789',
      email: 'ali@example.com',
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.full_name).toBe('Ali Hassan')
  })

  test('rejects missing full_name', async () => {
    const res = await post('/', { phone: '012-345-6789' })
    expect(res.status).toBe(400)
  })

  test('rejects missing phone', async () => {
    const res = await post('/', { full_name: 'Ali' })
    expect(res.status).toBe(400)
  })

  test('allows missing email (optional)', async () => {
    setMockResponse('parents', { data: { ...sampleParent, email: null }, error: null })

    const res = await post('/', { full_name: 'Ali Hassan', phone: '012-345-6789' })
    expect(res.status).toBe(201)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('parents', { data: null, error: { message: 'DB error' } })

    const res = await post('/', {
      full_name: 'Ali Hassan',
      phone: '012-345-6789',
    })
    expect(res.status).toBe(500)
  })
})

// ─── PUT /:id — Update parent ────────────────────────────────────────────────

describe('PUT /:id — update parent', () => {
  test('updates parent successfully', async () => {
    setMockResponse('parents', {
      data: { ...sampleParent, full_name: 'Ali Updated' },
      error: null,
    })

    const res = await put(`/${PARENT_ID}`, { full_name: 'Ali Updated' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.full_name).toBe('Ali Updated')
  })

  test('allows partial updates', async () => {
    setMockResponse('parents', { data: sampleParent, error: null })

    const res = await put(`/${PARENT_ID}`, { phone: '011-111-1111' })
    expect(res.status).toBe(200)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('parents', { data: null, error: { message: 'DB error' } })

    const res = await put(`/${PARENT_ID}`, { full_name: 'Updated' })
    expect(res.status).toBe(500)
  })
})

// ─── DELETE /:id — Delete parent ─────────────────────────────────────────────

describe('DELETE /:id — delete parent', () => {
  test('deletes parent and returns success message', async () => {
    setMockResponse('parents', { data: null, error: null })

    const res = await del(`/${PARENT_ID}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('Parent deleted')
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('parents', { data: null, error: { message: 'FK violation' } })

    const res = await del(`/${PARENT_ID}`)
    expect(res.status).toBe(500)
  })
})

// ─── POST /:id/access-code — Generate access code ───────────────────────────

describe('POST /:id/access-code — generate access code', () => {
  test('generates KC-YYYY-NNNN format code', async () => {
    const year = new Date().getFullYear()
    setMockResponse('parents', {
      data: { id: PARENT_ID, access_code: `KC-${year}-1234` },
      error: null,
    })

    const res = await post(`/${PARENT_ID}/access-code`, {})
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.access_code).toMatch(/^KC-\d{4}-\d{4}$/)
  })

  test('returns 500 on non-unique-constraint DB error', async () => {
    setMockResponse('parents', { data: null, error: { message: 'something went wrong' } })

    const res = await post(`/${PARENT_ID}/access-code`, {})
    expect(res.status).toBe(500)
  })
})

// ─── PUT /:id/portal-pin — Set PIN ──────────────────────────────────────────

describe('PUT /:id/portal-pin — set PIN', () => {
  test('sets PIN successfully', async () => {
    setMockResponse('parents', { data: null, error: null })

    const res = await put(`/${PARENT_ID}/portal-pin`, { pin: '123456' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  test('rejects PIN shorter than 6 digits', async () => {
    const res = await put(`/${PARENT_ID}/portal-pin`, { pin: '12345' })
    expect(res.status).toBe(400)
  })

  test('rejects PIN longer than 6 digits', async () => {
    const res = await put(`/${PARENT_ID}/portal-pin`, { pin: '1234567' })
    expect(res.status).toBe(400)
  })

  test('rejects non-numeric PIN', async () => {
    const res = await put(`/${PARENT_ID}/portal-pin`, { pin: 'abcdef' })
    expect(res.status).toBe(400)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('parents', { data: null, error: { message: 'DB error' } })

    const res = await put(`/${PARENT_ID}/portal-pin`, { pin: '123456' })
    expect(res.status).toBe(500)
  })
})

// ─── DELETE /:id/portal-access — Revoke portal access ───────────────────────

describe('DELETE /:id/portal-access — revoke portal access', () => {
  test('revokes access successfully', async () => {
    setMockResponse('parents', { data: null, error: null })
    setMockResponse('parent_sessions', { data: null, error: null })

    const res = await del(`/${PARENT_ID}/portal-access`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  test('returns 500 on parents table error', async () => {
    setMockResponse('parents', { data: null, error: { message: 'DB error' } })
    setMockResponse('parent_sessions', { data: null, error: null })

    const res = await del(`/${PARENT_ID}/portal-access`)
    expect(res.status).toBe(500)
  })

  test('returns 500 on sessions table error', async () => {
    setMockResponse('parents', { data: null, error: null })
    setMockResponse('parent_sessions', { data: null, error: { message: 'DB error' } })

    const res = await del(`/${PARENT_ID}/portal-access`)
    expect(res.status).toBe(500)
  })
})

// ─── POST /:id/link-student — Link student ──────────────────────────────────

describe('POST /:id/link-student — link student', () => {
  test('links student with default relationship', async () => {
    setMockResponse('students', { data: { id: STUDENT_ID }, error: null })
    setMockResponse('parent_students', {
      data: { id: 'link-1', parent_id: PARENT_ID, student_id: STUDENT_ID, relationship: 'parent' },
      error: null,
    })

    const res = await post(`/${PARENT_ID}/link-student`, { student_id: STUDENT_ID })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.parent_id).toBe(PARENT_ID)
    expect(json.student_id).toBe(STUDENT_ID)
    expect(json.relationship).toBe('parent')
  })

  test('links student with custom relationship', async () => {
    setMockResponse('students', { data: { id: STUDENT_ID }, error: null })
    setMockResponse('parent_students', {
      data: {
        id: 'link-2',
        parent_id: PARENT_ID,
        student_id: STUDENT_ID,
        relationship: 'guardian',
      },
      error: null,
    })

    const res = await post(`/${PARENT_ID}/link-student`, {
      student_id: STUDENT_ID,
      relationship: 'guardian',
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.relationship).toBe('guardian')
  })

  test('returns 404 when student does not exist', async () => {
    setMockResponse('students', { data: null, error: { message: 'not found' } })

    const res = await post(`/${PARENT_ID}/link-student`, { student_id: STUDENT_ID })
    expect(res.status).toBe(404)
  })

  test('rejects invalid student_id format', async () => {
    const res = await post(`/${PARENT_ID}/link-student`, { student_id: 'not-a-uuid' })
    expect(res.status).toBe(400)
  })

  test('rejects invalid relationship', async () => {
    const res = await post(`/${PARENT_ID}/link-student`, {
      student_id: STUDENT_ID,
      relationship: 'unknown',
    })
    expect(res.status).toBe(400)
  })

  test('returns 500 on duplicate link', async () => {
    setMockResponse('students', { data: { id: STUDENT_ID }, error: null })
    setMockResponse('parent_students', { data: null, error: { message: 'unique constraint' } })

    const res = await post(`/${PARENT_ID}/link-student`, { student_id: STUDENT_ID })
    expect(res.status).toBe(500)
  })
})

// ─── DELETE /:parentId/unlink-student/:studentId — Unlink student ────────────

describe('DELETE /:parentId/unlink-student/:studentId — unlink student', () => {
  test('unlinks student successfully', async () => {
    setMockResponse('parent_students', { data: null, error: null })

    const res = await del(`/${PARENT_ID}/unlink-student/${STUDENT_ID}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('Student unlinked')
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('parent_students', { data: null, error: { message: 'DB error' } })

    const res = await del(`/${PARENT_ID}/unlink-student/${STUDENT_ID}`)
    expect(res.status).toBe(500)
  })
})
