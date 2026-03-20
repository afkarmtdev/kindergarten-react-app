import { describe, test, expect, beforeEach, mock } from 'bun:test'
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

beforeEach(() => {
  clearMockResponses()
  setMockResponse('incidents', { data: [], error: null, count: 0 })
  setMockResponse('students', { data: [], error: null, count: 0 })
})

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

  test('accepts status filter', async () => {
    const res = await app.request('/api/incidents?status=open')
    expect(res.status).toBe(200)
  })

  test('accepts resolved status filter', async () => {
    const res = await app.request('/api/incidents?status=resolved')
    expect(res.status).toBe(200)
  })

  test('accepts from_date and to_date range filters', async () => {
    const res = await app.request('/api/incidents?from_date=2026-01-01&to_date=2026-03-31')
    expect(res.status).toBe(200)
  })

  test('accepts from_date alone', async () => {
    const res = await app.request('/api/incidents?from_date=2026-01-01')
    expect(res.status).toBe(200)
  })

  test('accepts to_date alone', async () => {
    const res = await app.request('/api/incidents?to_date=2026-03-31')
    expect(res.status).toBe(200)
  })

  test('rejects invalid type filter', async () => {
    const res = await app.request('/api/incidents?type=invalid')
    expect(res.status).toBe(400)
  })

  test('rejects invalid severity filter', async () => {
    const res = await app.request('/api/incidents?severity=critical')
    expect(res.status).toBe(400)
  })

  test('rejects invalid status filter', async () => {
    const res = await app.request('/api/incidents?status=pending')
    expect(res.status).toBe(400)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('incidents', { data: null, error: { message: 'query failed' }, count: 0 })
    const res = await app.request('/api/incidents')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to fetch incidents')
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

  test('returns 500 on database error', async () => {
    setMockResponse('incidents', { data: null, error: { message: 'db error' }, count: 0 })
    const res = await app.request(`/api/incidents/by-student/${VALID_UUID}`)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to fetch student incidents')
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

  test('rejects missing student_id', async () => {
    const { student_id, ...noStudentId } = validIncident
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noStudentId),
    })
    expect(res.status).toBe(400)
  })

  test('rejects missing type', async () => {
    const { type, ...noType } = validIncident
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noType),
    })
    expect(res.status).toBe(400)
  })

  test('rejects missing severity', async () => {
    const { severity, ...noSeverity } = validIncident
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noSeverity),
    })
    expect(res.status).toBe(400)
  })

  test('rejects missing incident_date', async () => {
    const { incident_date, ...noDate } = validIncident
    const res = await app.request('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noDate),
    })
    expect(res.status).toBe(400)
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
    setMockResponse('incidents', { data: { id: VALID_UUID, status: 'resolved' }, error: null })
    const res = await app.request(`/api/incidents/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('resolved')
  })

  test('accepts full incident update', async () => {
    setMockResponse('incidents', {
      data: { id: VALID_UUID, ...validIncident, follow_up_notes: 'Student recovered well' },
      error: null,
    })
    const res = await app.request(`/api/incidents/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validIncident, follow_up_notes: 'Student recovered well' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.follow_up_notes).toBe('Student recovered well')
  })

  test('returns 400 on invalid UUID', async () => {
    const res = await app.request('/api/incidents/not-a-uuid', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    expect(res.status).toBe(400)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('incidents', { data: null, error: { message: 'update failed' } })
    const res = await app.request(`/api/incidents/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to update incident')
  })
})

describe('DELETE /api/incidents/:id', () => {
  test('returns success message', async () => {
    setMockResponse('incidents', { data: null, error: null })
    const res = await app.request(`/api/incidents/${VALID_UUID}`, { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Incident deleted')
  })

  test('returns 400 on invalid UUID', async () => {
    const res = await app.request('/api/incidents/not-a-uuid', { method: 'DELETE' })
    expect(res.status).toBe(400)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('incidents', { data: null, error: { message: 'delete failed' } })
    const res = await app.request(`/api/incidents/${VALID_UUID}`, { method: 'DELETE' })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to delete incident')
  })
})
