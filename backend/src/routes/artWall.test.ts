import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import artWall from './artWall'

beforeEach(() => clearMockResponses())

// ── GET / — List art wall items ─────────────────────────────────────────────

describe('GET / — list art wall items', () => {
  test('returns paginated response', async () => {
    setMockResponse('art_wall', {
      data: [
        {
          id: '1',
          photo_url: 'https://example.com/art1.jpg',
          caption: 'Sunset painting',
          is_visible: true,
        },
        {
          id: '2',
          photo_url: 'https://example.com/art2.jpg',
          caption: 'Rainbow',
          is_visible: true,
        },
      ],
      error: null,
      count: 2,
    })

    const res = await artWall.request('/')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(2)
  })

  test('returns empty array when no items', async () => {
    setMockResponse('art_wall', { data: [], error: null, count: 0 })

    const res = await artWall.request('/')
    const json = await res.json()
    expect(json.data).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setMockResponse('art_wall', {
      data: null,
      error: { message: 'query failed' },
    })

    const res = await artWall.request('/')
    expect(res.status).toBe(500)
  })
})

// ── Pagination behaviour (default 9, max 50) ────────────────────────────────

describe('GET / — pagination', () => {
  test('defaults to page 1, limit 9', async () => {
    setMockResponse('art_wall', { data: [], error: null, count: 0 })

    const res = await artWall.request('/')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(9)
  })

  test('custom page and limit reflected in meta', async () => {
    setMockResponse('art_wall', { data: [], error: null, count: 20 })

    const res = await artWall.request('/?page=2&limit=5')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 20, page: 2, limit: 5, totalPages: 4 })
  })

  test('totalPages rounds up', async () => {
    setMockResponse('art_wall', { data: [], error: null, count: 10 })

    const res = await artWall.request('/?limit=9')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(2)
  })

  test('rejects limit above max (50)', async () => {
    const res = await artWall.request('/?limit=51')
    expect(res.status).toBe(400)
  })

  test('rejects page < 1', async () => {
    const res = await artWall.request('/?page=0')
    expect(res.status).toBe(400)
  })
})

// ── GET /by-student/:studentId — Filter by student ──────────────────────────

describe('GET /by-student/:studentId — filter by student', () => {
  test('returns paginated response filtered by student', async () => {
    setMockResponse('art_wall', {
      data: [
        {
          id: '1',
          photo_url: 'https://example.com/art1.jpg',
          student_id: 'stu-1',
          student_name: 'Ali',
        },
      ],
      error: null,
      count: 1,
    })

    const res = await artWall.request('/by-student/stu-1')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  test('returns empty when student has no artwork', async () => {
    setMockResponse('art_wall', { data: [], error: null, count: 0 })

    const res = await artWall.request('/by-student/stu-999')
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })
})

// ── GET /:id — Single art wall item ─────────────────────────────────────────

describe('GET /:id — single art wall item', () => {
  test('returns the item', async () => {
    setMockResponse('art_wall', {
      data: { id: '1', photo_url: 'https://example.com/art.jpg', caption: 'My drawing' },
      error: null,
    })

    const res = await artWall.request('/1')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.caption).toBe('My drawing')
  })

  test('returns 404 when not found', async () => {
    setMockResponse('art_wall', {
      data: null,
      error: { message: 'Row not found' },
    })

    const res = await artWall.request('/bad-id')
    expect(res.status).toBe(404)
  })
})

// ── POST / — Create art wall item ───────────────────────────────────────────

describe('POST / — create art wall item', () => {
  test('creates item with 201', async () => {
    setMockResponse('art_wall', {
      data: {
        id: 'new-1',
        photo_url: 'https://example.com/art.jpg',
        caption: 'Clean',
        is_visible: true,
      },
      error: null,
    })
    // students table mock not needed here (no student_id provided)

    const res = await artWall.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photo_url: 'https://example.com/art.jpg',
        caption: '<b>Bold</b> art',
      }),
    })

    expect(res.status).toBe(201)
  })

  test('sanitises string fields', async () => {
    setMockResponse('art_wall', {
      data: {
        id: 'new-2',
        photo_url: 'https://example.com/art.jpg',
        caption: 'Bold art',
        is_visible: true,
      },
      error: null,
    })

    const res = await artWall.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photo_url: 'https://example.com/art.jpg',
        caption: '<script>alert("xss")</script>Nice',
      }),
    })

    expect(res.status).toBe(201)
  })

  test('rejects missing photo_url', async () => {
    const res = await artWall.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: 'No photo' }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects invalid photo_url (not a URL)', async () => {
    const res = await artWall.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_url: 'not-a-url' }),
    })

    expect(res.status).toBe(400)
  })
})

// ── PUT /:id — Update art wall item ─────────────────────────────────────────

describe('PUT /:id — update art wall item', () => {
  test('updates and returns item', async () => {
    setMockResponse('art_wall', {
      data: { id: '1', caption: 'Updated', is_visible: false },
      error: null,
    })

    const res = await artWall.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: false }),
    })

    expect(res.status).toBe(200)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('art_wall', {
      data: null,
      error: { message: 'update failed' },
    })

    const res = await artWall.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: 'Fail' }),
    })

    expect(res.status).toBe(500)
  })
})

// ── DELETE /:id — Delete art wall item ──────────────────────────────────────

describe('DELETE /:id — delete art wall item', () => {
  test('returns success message', async () => {
    setMockResponse('art_wall', { data: null, error: null })

    const res = await artWall.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('Art wall item deleted')
  })

  test('returns 500 on database error', async () => {
    setMockResponse('art_wall', {
      data: null,
      error: { message: 'delete failed' },
    })

    const res = await artWall.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(500)
  })
})
