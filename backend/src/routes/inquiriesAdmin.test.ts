import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import inquiriesAdmin from './inquiriesAdmin'

const SAMPLE_INQUIRIES = [
  {
    id: '1',
    parent_name: 'Pn. Siti',
    child_name: 'Aisha',
    child_age: 4,
    phone: '0123456789',
    message: 'Interested',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: '2',
    parent_name: 'En. Ahmad',
    child_name: 'Haziq',
    child_age: 5,
    phone: '0187654321',
    message: '',
    created_at: '2025-01-02T10:00:00Z',
  },
]

beforeEach(() => clearMockResponses())

// ── GET / — list inquiries ────────────────────────────────────────────────────

describe('GET / — list inquiries', () => {
  test('returns paginated response', async () => {
    setMockResponse('inquiries', { data: SAMPLE_INQUIRIES, error: null, count: 2 })

    const res = await inquiriesAdmin.request('/')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(2)
    expect(json.data[0].parent_name).toBe('Pn. Siti')
  })

  test('returns 500 on database error', async () => {
    setMockResponse('inquiries', { data: null, error: { message: 'query failed' }, count: 0 })

    const res = await inquiriesAdmin.request('/')
    expect(res.status).toBe(500)
  })

  test('returns empty data array when no inquiries', async () => {
    setMockResponse('inquiries', { data: [], error: null, count: 0 })

    const res = await inquiriesAdmin.request('/')
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
    expect(json.meta.totalPages).toBe(0)
  })
})

// ── GET / — pagination ────────────────────────────────────────────────────────

describe('GET / — pagination', () => {
  test('defaults to page 1, limit 20', async () => {
    setMockResponse('inquiries', { data: [], error: null, count: 0 })

    const res = await inquiriesAdmin.request('/')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(20)
  })

  test('custom page and limit reflected in meta', async () => {
    setMockResponse('inquiries', { data: [], error: null, count: 45 })

    const res = await inquiriesAdmin.request('/?page=2&limit=10')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 45, page: 2, limit: 10, totalPages: 5 })
  })

  test('totalPages rounds up', async () => {
    setMockResponse('inquiries', { data: [], error: null, count: 21 })

    const res = await inquiriesAdmin.request('/?limit=20')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(2)
  })

  test('rejects limit above 50', async () => {
    const res = await inquiriesAdmin.request('/?limit=100')
    expect(res.status).toBe(400)
  })

  test('rejects page below 1', async () => {
    const res = await inquiriesAdmin.request('/?page=0')
    expect(res.status).toBe(400)
  })
})

// ── GET / — search ────────────────────────────────────────────────────────────

describe('GET / — search', () => {
  test('returns matching results when search param provided', async () => {
    setMockResponse('inquiries', {
      data: [SAMPLE_INQUIRIES[0]],
      error: null,
      count: 1,
    })

    const res = await inquiriesAdmin.request('/?search=Siti')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  test('returns empty results when search matches nothing', async () => {
    setMockResponse('inquiries', { data: [], error: null, count: 0 })

    const res = await inquiriesAdmin.request('/?search=nonexistent')
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })
})

// ── PUT /:id/status — update inquiry status ─────────────────────────────────

describe('PUT /:id/status — update inquiry status', () => {
  test('updates status and returns updated inquiry', async () => {
    setMockResponse('inquiries', {
      data: { ...SAMPLE_INQUIRIES[0], status: 'contacted' },
      error: null,
    })

    const res = await inquiriesAdmin.request('/1/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'contacted' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('contacted')
  })

  test('accepts all valid status values', async () => {
    for (const status of ['new', 'contacted', 'enrolled', 'closed']) {
      setMockResponse('inquiries', {
        data: { ...SAMPLE_INQUIRIES[0], status },
        error: null,
      })

      const res = await inquiriesAdmin.request('/1/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      expect(res.status).toBe(200)
    }
  })

  test('rejects invalid status value', async () => {
    const res = await inquiriesAdmin.request('/1/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'invalid' }),
    })
    expect(res.status).toBe(400)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('inquiries', {
      data: null,
      error: { message: 'update failed' },
    })

    const res = await inquiriesAdmin.request('/1/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'contacted' }),
    })

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('update failed')
  })
})
