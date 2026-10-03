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
        {
          ...sampleParent,
          parent_students: [
            { id: '1', students: { deleted_at: null } },
            { id: '2', students: { deleted_at: null } },
          ],
        },
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

  test('children_count leaves out unlinked children and deleted students', async () => {
    setMockResponse('parents', {
      data: [
        {
          ...sampleParent,
          parent_students: [
            { id: '1', deleted_at: null, students: { deleted_at: null } },
            { id: '2', deleted_at: '2026-10-01T00:00:00Z', students: { deleted_at: null } },
            { id: '3', deleted_at: null, students: { deleted_at: '2026-10-01T00:00:00Z' } },
          ],
        },
      ],
      error: null,
      count: 1,
    })

    const res = await parents.request('/')
    const json = await res.json()
    expect(json.data[0].children_count).toBe(1)
  })
})

// ─── GET /by-student/:studentId — Parent shown on the student profile ────────

describe('GET /by-student/:studentId — parent for a student', () => {
  test('returns the live parent, skipping a deleted one', async () => {
    setMockResponse('parent_students', {
      data: [
        { deleted_at: null, parents: { id: 'p-old', deleted_at: '2026-10-01T00:00:00Z' } },
        {
          deleted_at: null,
          parents: {
            id: PARENT_ID,
            full_name: 'John Doe',
            portal_pin_hash: '$argon2id$hash',
            deleted_at: null,
          },
        },
      ],
      error: null,
    })

    const res = await parents.request(`/by-student/${STUDENT_ID}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    // has_pin replaces the hash, which must never reach the browser
    expect(json.data).toEqual({ id: PARENT_ID, full_name: 'John Doe', has_pin: true })
  })

  test('returns has_pin false when no PIN is set', async () => {
    setMockResponse('parent_students', {
      data: [
        { deleted_at: null, parents: { id: PARENT_ID, portal_pin_hash: null, deleted_at: null } },
      ],
      error: null,
    })

    const res = await parents.request(`/by-student/${STUDENT_ID}`)
    const json = await res.json()
    expect(json.data).toEqual({ id: PARENT_ID, has_pin: false })
  })

  test('shows the earliest-linked parent when there are several', async () => {
    setMockResponse('parent_students', {
      data: [
        {
          created_at: '2026-05-01T00:00:00Z',
          deleted_at: null,
          parents: { id: 'p-later', deleted_at: null },
        },
        {
          created_at: '2026-01-01T00:00:00Z',
          deleted_at: null,
          parents: { id: 'p-first', deleted_at: null },
        },
      ],
      error: null,
    })

    const res = await parents.request(`/by-student/${STUDENT_ID}`)
    const json = await res.json()
    expect(json.data.id).toBe('p-first')
  })

  test('returns null when the student has no linked parent', async () => {
    setMockResponse('parent_students', { data: [], error: null })

    const res = await parents.request(`/by-student/${STUDENT_ID}`)
    const json = await res.json()
    expect(json.data).toBeNull()
  })

  test('returns null on database error', async () => {
    setMockResponse('parent_students', { data: null, error: { message: 'DB error' } })

    const res = await parents.request(`/by-student/${STUDENT_ID}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeNull()
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
            deleted_at: null,
            classrooms: { name: 'Rose' },
          },
        },
        {
          relationship: 'parent',
          students: {
            id: 'deleted-child',
            full_name: 'Deleted',
            deleted_at: '2026-10-01T00:00:00Z',
          },
        },
      ],
      error: null,
    })

    const res = await parents.request(`/${PARENT_ID}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe(PARENT_ID)
    // the soft-deleted student is left out
    expect(json.children).toHaveLength(1)
    expect(json.children[0].full_name).toBe('Ahmad Hassan')
    expect(json.children[0].class_name).toBe('Rose')
    expect(json.children[0].relationship).toBe('parent')
  })

  test('returns 404 when parent not found', async () => {
    setMockResponse('parents', { data: null, error: { message: 'not found' } })

    const res = await parents.request('/00000000-0000-0000-0000-0000000000ff')
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

  test('stores the email trimmed and lower-cased so the student form can find the parent', async () => {
    setMockResponse('parents', { data: sampleParent, error: null })

    const inserts: unknown[] = []
    const originalFrom = mockSupabase.from
    mockSupabase.from = (table: string) => {
      const chain = originalFrom(table)
      chain.insert = (row: unknown) => {
        inserts.push(row)
        return chain
      }
      return chain
    }

    try {
      const res = await post('/', {
        full_name: 'Ali Hassan',
        phone: '012',
        email: ' Ali@Example.COM ',
      })
      expect(res.status).toBe(201)
    } finally {
      mockSupabase.from = originalFrom
    }

    expect(inserts).toEqual([expect.objectContaining({ email: 'ali@example.com' })])
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

  test('logs the parent out of the portal by deleting their sessions', async () => {
    setMockResponse('parents', { data: null, error: null })
    setMockResponse('parent_sessions', { data: null, error: null })

    const sessionDeletes: unknown[][] = []
    const originalFrom = mockSupabase.from
    mockSupabase.from = (table: string) => {
      const chain = originalFrom(table)
      if (table === 'parent_sessions') {
        const eq = chain.eq as (...args: unknown[]) => unknown
        chain.delete = () => {
          chain.eq = (...args: unknown[]) => {
            sessionDeletes.push(args)
            return eq(...args)
          }
          return chain
        }
      }
      return chain
    }

    try {
      const res = await del(`/${PARENT_ID}`)
      expect(res.status).toBe(200)
    } finally {
      mockSupabase.from = originalFrom
    }

    expect(sessionDeletes).toEqual([['parent_id', PARENT_ID]])
  })

  test('returns 500 when the sessions cannot be removed', async () => {
    setMockResponse('parents', { data: null, error: null })
    setMockResponse('parent_sessions', { data: null, error: { message: 'DB error' } })

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

  test('upserts with deleted_at cleared so an unlinked pair is re-activated', async () => {
    setMockResponse('students', { data: { id: STUDENT_ID }, error: null })
    setMockResponse('parent_students', {
      data: { id: 'link-1', parent_id: PARENT_ID, student_id: STUDENT_ID, deleted_at: null },
      error: null,
    })

    // Spy on the parent_students chain to see what the route writes
    const upsertCalls: unknown[][] = []
    const originalFrom = mockSupabase.from
    mockSupabase.from = (table: string) => {
      const chain = originalFrom(table)
      if (table === 'parent_students') {
        chain.upsert = (...args: unknown[]) => {
          upsertCalls.push(args)
          return chain
        }
      }
      return chain
    }

    try {
      const res = await post(`/${PARENT_ID}/link-student`, { student_id: STUDENT_ID })
      expect(res.status).toBe(201)
    } finally {
      mockSupabase.from = originalFrom
    }

    expect(upsertCalls).toEqual([
      [
        {
          parent_id: PARENT_ID,
          student_id: STUDENT_ID,
          relationship: 'parent',
          deleted_at: null,
          deleted_by: null,
        },
        { onConflict: 'parent_id,student_id' },
      ],
    ])
  })

  test('returns 500 on database error', async () => {
    setMockResponse('students', { data: { id: STUDENT_ID }, error: null })
    setMockResponse('parent_students', { data: null, error: { message: 'DB error' } })

    const res = await post(`/${PARENT_ID}/link-student`, { student_id: STUDENT_ID })
    expect(res.status).toBe(500)
  })
})

// ─── GET /:id/sessions — List active portal sessions (admin) ────────────────

describe('GET /:id/sessions — list active sessions', () => {
  test('returns active sessions for a parent', async () => {
    const sessions = [
      {
        id: 'sess-1',
        device_label: 'Chrome on Windows',
        created_at: '2026-03-01T00:00:00Z',
        expires_at: '2026-04-01T00:00:00Z',
      },
      {
        id: 'sess-2',
        device_label: 'Safari on iOS',
        created_at: '2026-03-02T00:00:00Z',
        expires_at: '2026-04-02T00:00:00Z',
      },
    ]
    setMockResponse('parent_sessions', { data: sessions, error: null })

    const res = await parents.request(`/${PARENT_ID}/sessions`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeArray()
    expect(body.data.length).toBe(2)
    expect(body.data[0].device_label).toBe('Chrome on Windows')
    expect(body.data[1].device_label).toBe('Safari on iOS')
  })

  test('returns empty array when no active sessions', async () => {
    setMockResponse('parent_sessions', { data: [], error: null })

    const res = await parents.request(`/${PARENT_ID}/sessions`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('parent_sessions', { data: null, error: { message: 'DB error' } })

    const res = await parents.request(`/${PARENT_ID}/sessions`)
    expect(res.status).toBe(500)
  })
})

// ─── DELETE /:id/sessions/:sessionId — Revoke a specific session (admin) ────

describe('DELETE /:id/sessions/:sessionId — revoke session', () => {
  const SESSION_ID = '00000000-0000-0000-0000-000000000aaa'

  test('revokes a session successfully', async () => {
    setMockResponse('parent_sessions', { data: { id: SESSION_ID }, error: null })

    const res = await del(`/${PARENT_ID}/sessions/${SESSION_ID}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  test('returns 404 when session not found', async () => {
    setMockResponse('parent_sessions', { data: null, error: null })

    const res = await del(`/${PARENT_ID}/sessions/00000000-0000-0000-0000-0000000000ff`)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Session not found')
  })

  test('returns 500 on DB error during delete', async () => {
    // First call (select to verify) returns a session; second call (delete) returns error.
    // Since mock is per-table and both queries hit parent_sessions, this tests that
    // when data is found but delete fails, we get 500.
    // Note: the mock returns the same response for both queries — we test the delete error path
    // by setting a session with an error on the delete. The select uses .single() which reads data;
    // the delete awaits the chain. We set error so the delete fails.
    setMockResponse('parent_sessions', { data: { id: SESSION_ID }, error: { message: 'DB error' } })

    const res = await del(`/${PARENT_ID}/sessions/${SESSION_ID}`)
    // The select returns data (session found) but .single() ignores error when data is set.
    // The delete then sees the error and returns 500.
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

// ─── Path id validation ──────────────────────────────────────────────────────

describe('malformed path ids', () => {
  test.each([
    ['GET', '/not-a-uuid'],
    ['GET', '/by-student/not-a-uuid'],
    ['DELETE', '/not-a-uuid'],
    ['DELETE', `/${PARENT_ID}/unlink-student/not-a-uuid`],
    ['DELETE', `/${PARENT_ID}/sessions/not-a-uuid`],
  ])('%s %s returns 400', async (method, path) => {
    const res = await parents.request(path, { method })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid ID')
  })
})
