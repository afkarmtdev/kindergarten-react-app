import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import incidents from './incidents'
import {
  mockSupabase,
  setMockResponse,
  setAuthGetUser,
  clearMockResponses,
} from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

setAuthGetUser({
  data: { user: { id: 'user-1', email: 'test@example.com' } },
  error: null,
})

setMockResponse('incidents', { data: [], error: null, count: 0 })
setMockResponse('students', { data: [], error: null, count: 0 })

const app = new Hono()
app.use('*', async (c, next) => {
  c.set('user' as never, { id: 'user-1', email: 'test@example.com' })
  await next()
})
app.route('/api/incidents', incidents)

const VALID_UUID = '00000000-0000-0000-0000-000000000001'

const validIncident = {
  student_id: VALID_UUID,
  incident_date: '2026-03-18',
  type: 'injury' as const,
  severity: 'minor' as const,
  description: 'Fell on the playground',
  action_taken: 'Applied ice pack, comforted student',
}

describe('GET /api/incidents', () => {
  test('returns paginated list with meta', async () => {
    const res = await app.request('/api/incidents')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
  })

  test('accepts type filter', async () => {
    const res = await app.request('/api/incidents?type=injury')
    expect(res.status).toBe(200)
  })

  test('accepts severity filter', async () => {
    const res = await app.request('/api/incidents?severity=serious')
    expect(res.status).toBe(200)
  })

  test('rejects invalid type filter', async () => {
    const res = await app.request('/api/incidents?type=invalid')
    expect(res.status).toBe(400)
  })
})

describe('GET /api/incidents/by-student/:studentId', () => {
  test('returns paginated incidents for student', async () => {
    const res = await app.request(`/api/incidents/by-student/${VALID_UUID}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
  })
})

describe('POST /api/incidents', () => {
  test('accepts valid incident', async () => {
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validIncident),
    })
    expect(res.status).toBe(201)
  })

  test('rejects missing description', async () => {
    const { description, ...noDesc } = validIncident
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noDesc),
    })
    expect(res.status).toBe(400)
  })

  test('rejects missing action_taken', async () => {
    const { action_taken, ...noAction } = validIncident
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noAction),
    })
    expect(res.status).toBe(400)
  })

  test('rejects invalid type', async () => {
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validIncident, type: 'unknown' }),
    })
    expect(res.status).toBe(400)
  })

  test('rejects invalid severity', async () => {
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validIncident, severity: 'catastrophic' }),
    })
    expect(res.status).toBe(400)
  })

  test('rejects invalid date format', async () => {
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validIncident, incident_date: '18-03-2026' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/incidents/:id', () => {
  test('accepts partial update', async () => {
    const res = await app.request('/api/incidents/some-id', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/incidents/:id', () => {
  test('returns success', async () => {
    const res = await app.request('/api/incidents/some-id', { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Incident deleted')
  })
})
