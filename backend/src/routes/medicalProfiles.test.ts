import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import medicalProfiles from './medicalProfiles'
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

setMockResponse('student_medical', { data: null, error: null, count: 0 })

const app = new Hono()
app.use('*', async (c, next) => {
  c.set('user' as never, { id: 'user-1', email: 'test@example.com' })
  await next()
})
app.route('/api/medical-profiles', medicalProfiles)

const VALID_UUID = '00000000-0000-0000-0000-000000000001'

describe('GET /api/medical-profiles/:studentId', () => {
  test('returns data for valid student id', async () => {
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
  })
})

describe('PUT /api/medical-profiles/:studentId', () => {
  test('accepts valid medical profile data', async () => {
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blood_type: 'O+',
        allergies: ['peanuts', 'shellfish'],
        emergency_contacts: [
          { name: 'Jane Doe', relationship: 'Mother', phone: '012-3456789', is_primary: true },
        ],
      }),
    })
    expect(res.status).toBe(200)
  })

  test('rejects invalid blood type', async () => {
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blood_type: 'X+' }),
    })
    expect(res.status).toBe(400)
  })

  test('rejects emergency contact missing name', async () => {
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emergency_contacts: [{ relationship: 'Father', phone: '012-3456789' }],
      }),
    })
    expect(res.status).toBe(400)
  })

  test('rejects invalid vaccination date format', async () => {
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vaccination_records: [{ name: 'MMR', date: '01-01-2024' }],
      }),
    })
    expect(res.status).toBe(400)
  })

  test('accepts empty body (all defaults)', async () => {
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/medical-profiles/:studentId', () => {
  test('returns success', async () => {
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Medical profile deleted')
  })
})
