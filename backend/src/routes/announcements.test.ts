import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import announcements from './announcements'

beforeEach(() => clearMockResponses())

// ── GET / — List announcements ───────────────────────────────────────────────

describe('GET / — list announcements', () => {
  test('returns paginated response', async () => {
    setMockResponse('announcements', {
      data: [
        { id: '1', title: 'Holiday', category: 'holiday', is_pinned: true },
        { id: '2', title: 'Reminder', category: 'reminder', is_pinned: false },
      ],
      error: null,
      count: 2,
    })

    const res = await announcements.request('/')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(2)
  })

  test('returns empty when no announcements', async () => {
    setMockResponse('announcements', { data: [], error: null, count: 0 })

    const res = await announcements.request('/')
    const json = await res.json()
    expect(json.data).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setMockResponse('announcements', {
      data: null,
      error: { message: 'connection lost' },
    })

    const res = await announcements.request('/')
    expect(res.status).toBe(500)
  })
})

// ── Pagination behaviour (default 9, max 50) ────────────────────────────────

describe('GET / — pagination', () => {
  test('defaults to page 1, limit 9', async () => {
    setMockResponse('announcements', { data: [], error: null, count: 0 })

    const res = await announcements.request('/')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(9)
  })

  test('custom page and limit reflected in meta', async () => {
    setMockResponse('announcements', { data: [], error: null, count: 45 })

    const res = await announcements.request('/?page=3&limit=10')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 45, page: 3, limit: 10, totalPages: 5 })
  })

  test('totalPages rounds up', async () => {
    setMockResponse('announcements', { data: [], error: null, count: 19 })

    const res = await announcements.request('/?limit=9')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(3) // 19/9 = 2.11 → ceil = 3
  })

  test('rejects limit above max (50)', async () => {
    const res = await announcements.request('/?limit=51')
    expect(res.status).toBe(400)
  })

  test('rejects page < 1', async () => {
    const res = await announcements.request('/?page=0')
    expect(res.status).toBe(400)
  })
})

// ── GET /:id — Single announcement ──────────────────────────────────────────

describe('GET /:id — single announcement', () => {
  test('returns the announcement', async () => {
    setMockResponse('announcements', {
      data: { id: '1', title: 'School Closed', body: 'For holiday', category: 'holiday' },
      error: null,
    })

    const res = await announcements.request('/1')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.title).toBe('School Closed')
  })

  test('returns 404 when not found', async () => {
    setMockResponse('announcements', {
      data: null,
      error: { message: 'Row not found' },
    })

    const res = await announcements.request('/nonexistent')
    expect(res.status).toBe(404)
  })
})

// ── POST / — Create announcement ────────────────────────────────────────────

describe('POST / — create announcement', () => {
  const validAnnouncement = {
    title: 'Sports Day',
    body: 'Annual sports day event',
    category: 'event' as const,
  }

  test('creates with 201', async () => {
    setMockResponse('announcements', {
      data: { id: 'new-1', ...validAnnouncement },
      error: null,
    })

    const res = await announcements.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validAnnouncement),
    })

    expect(res.status).toBe(201)
  })

  test('rejects missing title', async () => {
    const res = await announcements.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'No title' }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects invalid category', async () => {
    const res = await announcements.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', body: 'Body', category: 'invalid' }),
    })

    expect(res.status).toBe(400)
  })
})

// ── PUT /:id — Update announcement ──────────────────────────────────────────

describe('PUT /:id — update announcement', () => {
  test('updates and returns announcement', async () => {
    setMockResponse('announcements', {
      data: { id: '1', title: 'Updated Title', is_pinned: true },
      error: null,
    })

    const res = await announcements.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title', is_pinned: true }),
    })

    expect(res.status).toBe(200)
  })
})

// ── DELETE /:id — Delete announcement ────────────────────────────────────────

describe('DELETE /:id — delete announcement', () => {
  test('returns success message', async () => {
    setMockResponse('announcements', { data: null, error: null })

    const res = await announcements.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('Announcement deleted')
  })
})
