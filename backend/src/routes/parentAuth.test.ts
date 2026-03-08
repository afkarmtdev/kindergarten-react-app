import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import parentAuth from './parentAuth'

const app = new Hono()
app.route('/api/portal', parentAuth)

const STUDENT_ID = '00000000-0000-0000-0000-000000000001'

// Shared student fixture — portal_pin_hash filled per-test
const baseStudent = {
  id: STUDENT_ID,
  full_name: 'Ali Hassan',
  classrooms: { name: 'Rose' },
  photo_url: null,
}

function post(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  clearMockResponses()
  // parent_sessions insert succeeds by default
  setMockResponse('parent_sessions', { data: null, error: null })
})

// ─── Validation ───────────────────────────────────────────────────────────────

describe('POST /api/portal/login — validation', () => {
  test('rejects missing access_code', async () => {
    const res = await post('/api/portal/login', { pin: '123456' })
    expect(res.status).toBe(400)
  })

  test('rejects missing pin', async () => {
    const res = await post('/api/portal/login', { access_code: 'KC-2024-001' })
    expect(res.status).toBe(400)
  })

  test('rejects PIN shorter than 6 digits', async () => {
    const res = await post('/api/portal/login', { access_code: 'KC-2024-001', pin: '12345' })
    expect(res.status).toBe(400)
  })

  test('rejects PIN longer than 6 digits', async () => {
    const res = await post('/api/portal/login', { access_code: 'KC-2024-001', pin: '1234567' })
    expect(res.status).toBe(400)
  })

  test('rejects non-numeric PIN', async () => {
    const res = await post('/api/portal/login', { access_code: 'KC-2024-001', pin: 'abcdef' })
    expect(res.status).toBe(400)
  })
})

// ─── Auth logic ───────────────────────────────────────────────────────────────

describe('POST /api/portal/login — auth logic', () => {
  test('returns 401 when student not found', async () => {
    setMockResponse('students', { data: null, error: null })

    const res = await post('/api/portal/login', { access_code: 'KC-BAD', pin: '123456' })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid access code or PIN')
  })

  test('returns 401 when student has no PIN set', async () => {
    setMockResponse('students', {
      data: { ...baseStudent, portal_pin_hash: null },
      error: null,
    })

    const res = await post('/api/portal/login', { access_code: 'KC-2024-001', pin: '123456' })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid access code or PIN')
  })

  test('returns 401 when PIN is wrong', async () => {
    // Hash for "654321" — the stored PIN; we'll attempt "123456"
    const pinHash = await Bun.password.hash('654321', { algorithm: 'bcrypt', cost: 4 })
    setMockResponse('students', {
      data: { ...baseStudent, portal_pin_hash: pinHash },
      error: null,
    })

    const res = await post('/api/portal/login', { access_code: 'KC-2024-001', pin: '123456' })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid access code or PIN')
  })

  test('returns 500 when session insert fails', async () => {
    const pinHash = await Bun.password.hash('123456', { algorithm: 'bcrypt', cost: 4 })
    setMockResponse('students', {
      data: { ...baseStudent, portal_pin_hash: pinHash },
      error: null,
    })
    setMockResponse('parent_sessions', { data: null, error: { message: 'DB error' } })

    const res = await post('/api/portal/login', { access_code: 'KC-2024-001', pin: '123456' })
    expect(res.status).toBe(500)
  })

  test('returns token and student on successful login', async () => {
    const pinHash = await Bun.password.hash('123456', { algorithm: 'bcrypt', cost: 4 })
    setMockResponse('students', {
      data: { ...baseStudent, portal_pin_hash: pinHash },
      error: null,
    })

    const res = await post('/api/portal/login', { access_code: 'KC-2024-001', pin: '123456' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.token).toBe('string')
    expect(body.token.length).toBeGreaterThan(0)
    expect(body.student.id).toBe(STUDENT_ID)
    expect(body.student.full_name).toBe('Ali Hassan')
    expect(body.student.class_name).toBe('Rose')
    expect(body.student.photo_url).toBeNull()
  })

  test('student with no class returns class_name: null', async () => {
    const pinHash = await Bun.password.hash('123456', { algorithm: 'bcrypt', cost: 4 })
    setMockResponse('students', {
      data: { ...baseStudent, classrooms: null, portal_pin_hash: pinHash },
      error: null,
    })

    const res = await post('/api/portal/login', { access_code: 'KC-2024-001', pin: '123456' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.student.class_name).toBeNull()
  })
})

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('POST /api/portal/logout', () => {
  test('returns ok: true with Authorization header', async () => {
    const res = await app.request('/api/portal/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer some-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  test('returns ok: true without Authorization header', async () => {
    const res = await app.request('/api/portal/logout', { method: 'POST' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
