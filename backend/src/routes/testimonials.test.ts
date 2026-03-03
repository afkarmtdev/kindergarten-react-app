import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import testimonials from './testimonials'

beforeEach(() => clearMockResponses())

// ── GET /public — Public testimonials ────────────────────────────────────────

describe('GET /public — public testimonials', () => {
  test('returns visible testimonials', async () => {
    setMockResponse('testimonials', {
      data: [{ id: '1', parent_name: 'Pn. Siti', quote: 'Great school', is_visible: true }],
      error: null,
    })

    const res = await testimonials.request('/public')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].parent_name).toBe('Pn. Siti')
  })

  test('returns empty array when none visible', async () => {
    setMockResponse('testimonials', { data: [], error: null })

    const res = await testimonials.request('/public')
    const json = await res.json()
    expect(json.data).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setMockResponse('testimonials', {
      data: null,
      error: { message: 'query failed' },
    })

    const res = await testimonials.request('/public')
    expect(res.status).toBe(500)
  })
})

// ── GET / — List testimonials (admin) ────────────────────────────────────────

describe('GET / — list testimonials', () => {
  test('returns paginated response', async () => {
    setMockResponse('testimonials', {
      data: [
        { id: '1', parent_name: 'Pn. Siti', is_visible: true },
        { id: '2', parent_name: 'En. Ahmad', is_visible: false },
      ],
      error: null,
      count: 2,
    })

    const res = await testimonials.request('/')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(2)
  })
})

// ── Pagination behaviour (default 9, max 50) ────────────────────────────────

describe('GET / — pagination', () => {
  test('defaults to page 1, limit 9', async () => {
    setMockResponse('testimonials', { data: [], error: null, count: 0 })

    const res = await testimonials.request('/')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(9)
  })

  test('custom page and limit reflected in meta', async () => {
    setMockResponse('testimonials', { data: [], error: null, count: 25 })

    const res = await testimonials.request('/?page=2&limit=10')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 })
  })

  test('totalPages rounds up', async () => {
    setMockResponse('testimonials', { data: [], error: null, count: 10 })

    const res = await testimonials.request('/?limit=9')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(2)
  })

  test('rejects limit above max (50)', async () => {
    const res = await testimonials.request('/?limit=51')
    expect(res.status).toBe(400)
  })

  test('rejects page < 1', async () => {
    const res = await testimonials.request('/?page=0')
    expect(res.status).toBe(400)
  })
})

// ── GET /:id — Single testimonial ───────────────────────────────────────────

describe('GET /:id — single testimonial', () => {
  test('returns the testimonial', async () => {
    setMockResponse('testimonials', {
      data: { id: '1', parent_name: 'Pn. Siti', quote: 'Excellent' },
      error: null,
    })

    const res = await testimonials.request('/1')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.quote).toBe('Excellent')
  })

  test('returns 404 when not found', async () => {
    setMockResponse('testimonials', {
      data: null,
      error: { message: 'Row not found' },
    })

    const res = await testimonials.request('/bad-id')
    expect(res.status).toBe(404)
  })
})

// ── POST / — Create testimonial ─────────────────────────────────────────────

describe('POST / — create testimonial', () => {
  test('creates with 201', async () => {
    setMockResponse('testimonials', {
      data: { id: 'new-1', parent_name: 'Pn. Lina', quote: 'Wonderful' },
      error: null,
    })

    const res = await testimonials.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_name: 'Pn. Lina', quote: 'Wonderful' }),
    })

    expect(res.status).toBe(201)
  })

  test('rejects missing quote', async () => {
    const res = await testimonials.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_name: 'Pn. Lina' }),
    })

    expect(res.status).toBe(400)
  })
})

// ── PUT /:id — Update testimonial ───────────────────────────────────────────

describe('PUT /:id — update testimonial', () => {
  test('updates and returns testimonial', async () => {
    setMockResponse('testimonials', {
      data: { id: '1', parent_name: 'Pn. Siti', quote: 'Updated quote' },
      error: null,
    })

    const res = await testimonials.request('/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote: 'Updated quote' }),
    })

    expect(res.status).toBe(200)
  })
})

// ── DELETE /:id — Delete testimonial ─────────────────────────────────────────

describe('DELETE /:id — delete testimonial', () => {
  test('returns success message', async () => {
    setMockResponse('testimonials', { data: null, error: null })

    const res = await testimonials.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('Testimonial deleted')
  })
})
