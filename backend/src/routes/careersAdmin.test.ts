import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Hono } from 'hono'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import careersAdmin from './careersAdmin'

// Wrap careersAdmin with fake auth middleware
const app = new Hono()
app.use('*', async (c, next) => {
  c.set('user' as never, { id: 'user-1', email: 'test@example.com' })
  await next()
})
app.route('/', careersAdmin)

const VALID_POSTING_ID = '00000000-0000-0000-0000-000000000001'
const VALID_APPLICATION_ID = '00000000-0000-0000-0000-000000000002'

const VALID_POSTING = {
  title: 'Kindergarten Teacher',
  type: 'full_time',
  description: 'We are looking for an enthusiastic teacher.',
  department: 'Education',
  requirements: 'Diploma in Early Childhood Education',
  salary_min: 2500,
  salary_max: 3500,
}

const SAMPLE_POSTINGS = [
  {
    id: 'p-1',
    title: 'Kindergarten Teacher',
    type: 'full_time',
    department: 'Education',
    description: 'Teaching role',
    status: 'published',
    display_order: 1,
    created_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'p-2',
    title: 'Admin Assistant',
    type: 'part_time',
    department: 'Administration',
    description: 'Office support',
    status: 'draft',
    display_order: 2,
    created_at: '2025-06-02T10:00:00Z',
  },
]

const SAMPLE_APPLICATIONS = [
  {
    id: 'a-1',
    posting_id: 'p-1',
    applicant_name: 'Ali Hassan',
    email: 'ali@example.com',
    phone: '012-345-6789',
    cover_message: 'Interested in teaching.',
    status: 'new',
    created_at: '2025-07-01T10:00:00Z',
    job_postings: { title: 'Kindergarten Teacher' },
  },
  {
    id: 'a-2',
    posting_id: 'p-2',
    applicant_name: 'Siti Aminah',
    email: 'siti@example.com',
    phone: '019-876-5432',
    cover_message: 'Looking for admin work.',
    status: 'reviewed',
    created_at: '2025-07-02T10:00:00Z',
    job_postings: { title: 'Admin Assistant' },
  },
]

beforeEach(() => {
  clearMockResponses()
  setMockResponse('job_postings', { data: SAMPLE_POSTINGS, error: null, count: 2 })
  setMockResponse('job_applications', { data: SAMPLE_APPLICATIONS, error: null, count: 2 })
})

// ── Job Postings ────────────────────────────────────────────────────────────

describe('GET /postings — paginated list', () => {
  test('returns paginated response with meta', async () => {
    const res = await app.request('/postings')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(2)
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(12)
    expect(json.meta.totalPages).toBe(1)
    expect(json.data[0].title).toBe('Kindergarten Teacher')
  })

  test('handles search filter', async () => {
    setMockResponse('job_postings', {
      data: [SAMPLE_POSTINGS[0]],
      error: null,
      count: 1,
    })

    const res = await app.request('/postings?search=Teacher')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('job_postings', { data: null, error: { message: 'query failed' }, count: 0 })

    const res = await app.request('/postings')
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Failed to fetch postings')
  })
})

describe('POST /postings — create posting', () => {
  test('creates posting and returns 201', async () => {
    setMockResponse('job_postings', {
      data: { id: 'p-new', ...VALID_POSTING, status: 'draft' },
      error: null,
    })

    const res = await app.request('/postings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_POSTING),
    })
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.title).toBe('Kindergarten Teacher')
  })

  test('rejects missing title', async () => {
    const { title: _, ...body } = VALID_POSTING
    const res = await app.request('/postings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    expect(res.status).toBe(400)
  })

  test('rejects invalid type enum', async () => {
    const res = await app.request('/postings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_POSTING, type: 'freelance' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('PUT /postings/:id — update posting', () => {
  test('updates posting and returns 200', async () => {
    setMockResponse('job_postings', {
      data: { ...SAMPLE_POSTINGS[0], title: 'Senior Teacher' },
      error: null,
    })

    const res = await app.request(`/postings/${VALID_POSTING_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Senior Teacher' }),
    })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.title).toBe('Senior Teacher')
  })

  test('returns 400 on invalid UUID', async () => {
    const res = await app.request('/postings/not-a-uuid', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Senior Teacher' }),
    })
    expect(res.status).toBe(400)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('job_postings', { data: null, error: { message: 'update failed' } })

    const res = await app.request(`/postings/${VALID_POSTING_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Senior Teacher' }),
    })
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Failed to update posting')
  })
})

describe('DELETE /postings/:id — soft-delete posting', () => {
  test('soft-deletes posting and returns 200', async () => {
    setMockResponse('job_postings', { data: null, error: null })

    const res = await app.request(`/postings/${VALID_POSTING_ID}`, { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
  })

  test('returns 400 on invalid UUID', async () => {
    const res = await app.request('/postings/not-a-uuid', { method: 'DELETE' })
    expect(res.status).toBe(400)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('job_postings', { data: null, error: { message: 'delete failed' } })

    const res = await app.request(`/postings/${VALID_POSTING_ID}`, { method: 'DELETE' })
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Failed to delete posting')
  })
})

// ── Job Applications ────────────────────────────────────────────────────────

describe('GET /applications — paginated list', () => {
  test('returns paginated list with posting_title', async () => {
    const res = await app.request('/applications')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.meta.total).toBe(2)
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(20)
    expect(json.data[0].posting_title).toBe('Kindergarten Teacher')
    expect(json.data[1].posting_title).toBe('Admin Assistant')
    // job_postings nested object should be flattened out
    expect(json.data[0].job_postings).toBeUndefined()
  })

  test('filters by status', async () => {
    setMockResponse('job_applications', {
      data: [SAMPLE_APPLICATIONS[0]],
      error: null,
      count: 1,
    })

    const res = await app.request('/applications?status=new')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
    expect(json.data[0].status).toBe('new')
  })

  test('filters by posting_id', async () => {
    setMockResponse('job_applications', {
      data: [SAMPLE_APPLICATIONS[0]],
      error: null,
      count: 1,
    })

    const res = await app.request('/applications?posting_id=00000000-0000-0000-0000-000000000001')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('job_applications', {
      data: null,
      error: { message: 'query failed' },
      count: 0,
    })

    const res = await app.request('/applications')
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Failed to fetch applications')
  })
})

describe('GET /applications/:id — single application', () => {
  test('returns single application with posting_title', async () => {
    setMockResponse('job_applications', {
      data: SAMPLE_APPLICATIONS[0],
      error: null,
    })

    const res = await app.request(`/applications/${VALID_APPLICATION_ID}`)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.applicant_name).toBe('Ali Hassan')
    expect(json.posting_title).toBe('Kindergarten Teacher')
    expect(json.job_postings).toBeUndefined()
  })

  test('returns 400 on invalid UUID', async () => {
    const res = await app.request('/applications/not-a-uuid')
    expect(res.status).toBe(400)
  })

  test('returns 404 when not found', async () => {
    setMockResponse('job_applications', {
      data: null,
      error: { message: 'Row not found', code: 'PGRST116' },
    })

    const res = await app.request(`/applications/${VALID_APPLICATION_ID}`)
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.error).toBe('Not found')
  })
})

describe('PUT /applications/:id/status — update status', () => {
  test('updates status and returns 200', async () => {
    setMockResponse('job_applications', {
      data: { ...SAMPLE_APPLICATIONS[0], status: 'reviewed' },
      error: null,
    })

    const res = await app.request(`/applications/${VALID_APPLICATION_ID}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'reviewed' }),
    })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.status).toBe('reviewed')
  })

  test('accepts all valid status values', async () => {
    for (const status of ['new', 'reviewed', 'interviewed', 'hired', 'rejected']) {
      setMockResponse('job_applications', {
        data: { ...SAMPLE_APPLICATIONS[0], status },
        error: null,
      })

      const res = await app.request(`/applications/${VALID_APPLICATION_ID}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      expect(res.status).toBe(200)
    }
  })

  test('returns 400 on invalid UUID', async () => {
    const res = await app.request('/applications/not-a-uuid/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'reviewed' }),
    })
    expect(res.status).toBe(400)
  })

  test('rejects invalid status value', async () => {
    const res = await app.request(`/applications/${VALID_APPLICATION_ID}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'invalid' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /applications/:id — soft-delete application', () => {
  test('soft-deletes application and returns 200', async () => {
    setMockResponse('job_applications', { data: null, error: null })

    const res = await app.request(`/applications/${VALID_APPLICATION_ID}`, { method: 'DELETE' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
  })

  test('returns 400 on invalid UUID', async () => {
    const res = await app.request('/applications/not-a-uuid', { method: 'DELETE' })
    expect(res.status).toBe(400)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('job_applications', { data: null, error: { message: 'delete failed' } })

    const res = await app.request(`/applications/${VALID_APPLICATION_ID}`, { method: 'DELETE' })
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Failed to delete application')
  })
})
