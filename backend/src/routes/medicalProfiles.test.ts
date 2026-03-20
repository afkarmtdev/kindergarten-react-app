import { describe, test, expect, beforeEach, mock } from 'bun:test'
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

const FULL_MEDICAL_PROFILE = {
  id: 'med-1',
  student_id: VALID_UUID,
  blood_type: 'B+',
  allergies: ['peanuts', 'latex'],
  medical_conditions: ['asthma'],
  medications: [{ name: 'Ventolin', dosage: '100mcg', frequency: 'as needed' }],
  vaccination_records: [
    { name: 'MMR', date: '2022-06-15' },
    { name: 'Hepatitis B', date: '2021-03-10' },
  ],
  emergency_contacts: [
    { name: 'Jane Doe', relationship: 'Mother', phone: '012-3456789', is_primary: true },
    { name: 'John Doe', relationship: 'Father', phone: '012-9876543', is_primary: false },
  ],
  doctor_name: 'Dr. Lim Wei Ming',
  doctor_phone: '03-12345678',
  insurance_info: 'AIA policy #12345',
  medical_notes: 'Student uses inhaler before PE class',
  created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  clearMockResponses()
  setMockResponse('student_medical', { data: null, error: null, count: 0 })
})

describe('GET /api/medical-profiles/:studentId', () => {
  test('returns data for valid student id (null profile)', async () => {
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body.data).toBeNull()
  })

  test('returns full medical profile when one exists', async () => {
    setMockResponse('student_medical', { data: FULL_MEDICAL_PROFILE, error: null })
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).not.toBeNull()
    expect(body.data.blood_type).toBe('B+')
    expect(body.data.allergies).toEqual(['peanuts', 'latex'])
    expect(body.data.medications).toHaveLength(1)
    expect(body.data.medications[0].name).toBe('Ventolin')
    expect(body.data.vaccination_records).toHaveLength(2)
    expect(body.data.emergency_contacts).toHaveLength(2)
    expect(body.data.doctor_name).toBe('Dr. Lim Wei Ming')
    expect(body.data.medical_notes).toBe('Student uses inhaler before PE class')
  })

  test('returns 500 on database error', async () => {
    setMockResponse('student_medical', { data: null, error: { message: 'query failed' } })
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to fetch medical profile')
  })
})

describe('PUT /api/medical-profiles/:studentId', () => {
  test('accepts valid medical profile data', async () => {
    setMockResponse('student_medical', {
      data: { student_id: VALID_UUID, blood_type: 'O+', allergies: ['peanuts', 'shellfish'] },
      error: null,
    })
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

  test('accepts all valid blood types', async () => {
    for (const blood_type of ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']) {
      setMockResponse('student_medical', {
        data: { student_id: VALID_UUID, blood_type },
        error: null,
      })
      const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blood_type }),
      })
      expect(res.status).toBe(200)
    }
  })

  test('accepts empty arrays for allergies, medications, emergency_contacts, vaccination_records', async () => {
    setMockResponse('student_medical', {
      data: {
        student_id: VALID_UUID,
        allergies: [],
        medications: [],
        emergency_contacts: [],
        vaccination_records: [],
      },
      error: null,
    })
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allergies: [],
        medications: [],
        emergency_contacts: [],
        vaccination_records: [],
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
    setMockResponse('student_medical', {
      data: { student_id: VALID_UUID, allergies: [], medications: [] },
      error: null,
    })
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(200)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('student_medical', { data: null, error: { message: 'upsert failed' } })
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blood_type: 'O+' }),
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to update medical profile')
  })
})

describe('DELETE /api/medical-profiles/:studentId', () => {
  test('returns success', async () => {
    setMockResponse('student_medical', { data: null, error: null })
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Medical profile deleted')
  })

  test('returns 500 on database error', async () => {
    setMockResponse('student_medical', { data: null, error: { message: 'delete failed' } })
    const res = await app.request(`/api/medical-profiles/${VALID_UUID}`, { method: 'DELETE' })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to delete medical profile')
  })
})
