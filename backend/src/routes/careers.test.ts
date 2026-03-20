import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import careers from './careers'

const VALID_APPLICATION = {
  posting_id: '00000000-0000-0000-0000-000000000001',
  applicant_name: 'Ali Hassan',
  email: 'ali@example.com',
  phone: '012-345-6789',
  cover_message: 'I am interested in this position.',
}

const SAMPLE_POSTINGS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Kindergarten Teacher',
    type: 'full_time',
    department: 'Education',
    description: 'Teaching role',
    status: 'published',
    display_order: 1,
    created_at: '2025-06-01T10:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Admin Assistant',
    type: 'part_time',
    department: 'Administration',
    description: 'Office support',
    status: 'published',
    display_order: 2,
    created_at: '2025-06-02T10:00:00Z',
  },
]

function post(body: unknown, ip = '1.2.3.4') {
  return careers.request('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  clearMockResponses()
  // Pre-set defaults for both tables
  setMockResponse('job_postings', { data: SAMPLE_POSTINGS, error: null })
  setMockResponse('job_applications', { data: null, error: null })
})

// ── GET /postings — public listing ──────────────────────────────────────────

describe('GET /postings — public listing', () => {
  test('returns published postings list', async () => {
    const res = await careers.request('/postings')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.data[0].title).toBe('Kindergarten Teacher')
    expect(json.data[1].title).toBe('Admin Assistant')
  })

  test('returns empty array when no postings', async () => {
    setMockResponse('job_postings', { data: [], error: null })

    const res = await careers.request('/postings')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setMockResponse('job_postings', { data: null, error: { message: 'query failed' } })

    const res = await careers.request('/postings')
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('query failed')
  })
})

// ── POST / — submit application ─────────────────────────────────────────────

describe('POST / — submit application', () => {
  test('accepts valid application (201)', async () => {
    const res = await post(VALID_APPLICATION, '10.50.1.1')
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
  })

  test('rejects missing applicant_name', async () => {
    const { applicant_name: _, ...body } = VALID_APPLICATION
    const res = await post(body, '10.50.1.2')
    expect(res.status).toBe(400)
  })

  test('rejects missing email', async () => {
    const { email: _, ...body } = VALID_APPLICATION
    const res = await post(body, '10.50.1.3')
    expect(res.status).toBe(400)
  })

  test('rejects invalid email', async () => {
    const res = await post({ ...VALID_APPLICATION, email: 'not-an-email' }, '10.50.1.4')
    expect(res.status).toBe(400)
  })

  test('rejects missing phone', async () => {
    const { phone: _, ...body } = VALID_APPLICATION
    const res = await post(body, '10.50.1.5')
    expect(res.status).toBe(400)
  })

  test('rejects missing posting_id', async () => {
    const { posting_id: _, ...body } = VALID_APPLICATION
    const res = await post(body, '10.50.1.6')
    expect(res.status).toBe(400)
  })

  test('rejects invalid posting_id (not uuid)', async () => {
    const res = await post({ ...VALID_APPLICATION, posting_id: 'not-a-uuid' }, '10.50.1.7')
    expect(res.status).toBe(400)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('job_applications', { data: null, error: { message: 'insert failed' } })
    const res = await post(VALID_APPLICATION, '10.50.1.8')
    expect(res.status).toBe(500)
  })

  test('rejects cover_message longer than 2000 characters', async () => {
    const res = await post({ ...VALID_APPLICATION, cover_message: 'a'.repeat(2001) }, '10.50.1.9')
    expect(res.status).toBe(400)
  })
})
