import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import gallery from './gallery'

beforeEach(() => clearMockResponses())

// ── GET / — List gallery items ───────────────────────────────────────────────

describe('GET / — list gallery items', () => {
  test('returns paginated response', async () => {
    setMockResponse('gallery_items', {
      data: [
        { id: '1', photo_url: '/photo1.jpg', caption: 'Fun day', is_visible: true },
        { id: '2', photo_url: '/photo2.jpg', caption: 'Sports', is_visible: false },
      ],
      error: null,
      count: 2,
    })

    const res = await gallery.request('/')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(2)
  })

  test('returns empty array when no items', async () => {
    setMockResponse('gallery_items', { data: [], error: null, count: 0 })

    const res = await gallery.request('/')
    const json = await res.json()
    expect(json.data).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setMockResponse('gallery_items', {
      data: null,
      error: { message: 'query failed' },
    })

    const res = await gallery.request('/')
    expect(res.status).toBe(500)
  })
})

// ── Pagination behaviour (default 9, max 50) ────────────────────────────────

describe('GET / — pagination', () => {
  test('defaults to page 1, limit 9', async () => {
    setMockResponse('gallery_items', { data: [], error: null, count: 0 })

    const res = await gallery.request('/')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(9)
  })

  test('custom page and limit reflected in meta', async () => {
    setMockResponse('gallery_items', { data: [], error: null, count: 20 })

    const res = await gallery.request('/?page=2&limit=5')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 20, page: 2, limit: 5, totalPages: 4 })
  })

  test('totalPages rounds up', async () => {
    setMockResponse('gallery_items', { data: [], error: null, count: 10 })

    const res = await gallery.request('/?limit=9')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(2)
  })

  test('rejects limit above max (50)', async () => {
    const res = await gallery.request('/?limit=51')
    expect(res.status).toBe(400)
  })

  test('rejects page < 1', async () => {
    const res = await gallery.request('/?page=0')
    expect(res.status).toBe(400)
  })
})

// ── GET /:id — Single gallery item ──────────────────────────────────────────

describe('GET /:id — single gallery item', () => {
  test('returns the item', async () => {
    setMockResponse('gallery_items', {
      data: { id: '1', photo_url: '/photo.jpg', caption: 'Hello' },
      error: null,
    })

    const res = await gallery.request('/1')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.caption).toBe('Hello')
  })

  test('returns 404 when not found', async () => {
    setMockResponse('gallery_items', {
      data: null,
      error: { message: 'Row not found' },
    })

    const res = await gallery.request('/bad-id')
    expect(res.status).toBe(404)
  })
})

// ── POST / — Create gallery item ────────────────────────────────────────────

describe('POST / — create gallery item', () => {
  test('creates item with 201', async () => {
    setMockResponse('gallery_items', {
      data: { id: 'new-1', photo_url: '/photo.jpg', caption: 'Clean', is_visible: true },
      error: null,
    })

    const res = await gallery.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_url: '/photo.jpg', caption: '<b>Bold</b>' }),
    })

    expect(res.status).toBe(201)
  })

  test('rejects missing photo_url', async () => {
    const res = await gallery.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: 'No photo' }),
    })

    expect(res.status).toBe(400)
  })
})

// ── PUT /:id — Update gallery item ──────────────────────────────────────────

describe('PUT /:id — update gallery item', () => {
  test('updates and returns item', async () => {
    setMockResponse('gallery_items', {
      data: { id: '1', caption: 'Updated', is_visible: false },
      error: null,
    })

    const res = await gallery.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: false }),
    })

    expect(res.status).toBe(200)
  })
})

// ── DELETE /:id — Delete gallery item ────────────────────────────────────────

describe('DELETE /:id — delete gallery item', () => {
  test('returns success message', async () => {
    setMockResponse('gallery_items', { data: null, error: null })

    const res = await gallery.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('Gallery item deleted')
  })
})
