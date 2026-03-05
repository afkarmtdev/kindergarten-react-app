import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import inquiries from './inquiries'

const VALID_BODY = {
  parent_name: 'Pn. Siti Rahimah',
  child_name: 'Aisha',
  child_age: 4,
  phone: '0123456789',
  message: 'Interested in enrolling.',
}

function post(body: unknown, ip = '1.2.3.4') {
  return inquiries.request('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

beforeEach(() => clearMockResponses())

// ── POST / — validation ───────────────────────────────────────────────────────

describe('POST / — validation', () => {
  test('returns 201 on valid submission', async () => {
    setMockResponse('inquiries', { data: null, error: null })
    const res = await post(VALID_BODY)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  test('rejects missing parent_name', async () => {
    const { parent_name: _, ...body } = VALID_BODY
    const res = await post(body, '1.2.3.5')
    expect(res.status).toBe(400)
  })

  test('rejects missing child_name', async () => {
    const { child_name: _, ...body } = VALID_BODY
    const res = await post(body, '1.2.3.6')
    expect(res.status).toBe(400)
  })

  test('rejects missing phone', async () => {
    const { phone: _, ...body } = VALID_BODY
    const res = await post(body, '1.2.3.7')
    expect(res.status).toBe(400)
  })

  test('rejects child_age below minimum (2)', async () => {
    const res = await post({ ...VALID_BODY, child_age: 1 }, '1.2.3.8')
    expect(res.status).toBe(400)
  })

  test('rejects child_age above maximum (7)', async () => {
    const res = await post({ ...VALID_BODY, child_age: 8 }, '1.2.3.9')
    expect(res.status).toBe(400)
  })

  test('accepts missing message (defaults to empty string)', async () => {
    setMockResponse('inquiries', { data: null, error: null })
    const { message: _, ...body } = VALID_BODY
    const res = await post(body, '1.2.3.10')
    expect(res.status).toBe(201)
  })

  test('rejects message exceeding 1000 characters', async () => {
    const res = await post({ ...VALID_BODY, message: 'x'.repeat(1001) }, '1.2.3.11')
    expect(res.status).toBe(400)
  })
})

// ── POST / — database error ───────────────────────────────────────────────────

describe('POST / — database error', () => {
  test('returns 500 on Supabase error', async () => {
    setMockResponse('inquiries', { data: null, error: { message: 'insert failed' } })
    const res = await post(VALID_BODY, '1.2.3.20')
    expect(res.status).toBe(500)
  })
})

// ── POST / — rate limiting ────────────────────────────────────────────────────

describe('POST / — rate limiting', () => {
  test('allows up to 5 submissions from same IP, blocks the 6th', async () => {
    setMockResponse('inquiries', { data: null, error: null })
    const ip = '10.99.99.1' // unique IP to avoid cross-test contamination

    for (let i = 0; i < 5; i++) {
      const res = await post(VALID_BODY, ip)
      expect(res.status).toBe(201)
    }

    const blocked = await post(VALID_BODY, ip)
    expect(blocked.status).toBe(429)
  })

  test('different IPs are tracked independently', async () => {
    setMockResponse('inquiries', { data: null, error: null })
    const ipA = '10.99.99.2'
    const ipB = '10.99.99.3'

    // exhaust ipA
    for (let i = 0; i < 5; i++) await post(VALID_BODY, ipA)
    const blockedA = await post(VALID_BODY, ipA)
    expect(blockedA.status).toBe(429)

    // ipB should still be allowed
    const allowedB = await post(VALID_BODY, ipB)
    expect(allowedB.status).toBe(201)
  })

  test('uses first IP from comma-separated x-forwarded-for', async () => {
    setMockResponse('inquiries', { data: null, error: null })
    const ip = '10.99.99.4'

    for (let i = 0; i < 5; i++) {
      const res = inquiries.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': `${ip}, 10.0.0.1, 192.168.1.1`,
        },
        body: JSON.stringify(VALID_BODY),
      })
      await res
    }

    const blocked = inquiries.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': `${ip}, 10.0.0.2`, // same first IP → should be blocked
      },
      body: JSON.stringify(VALID_BODY),
    })
    expect((await blocked).status).toBe(429)
  })
})
