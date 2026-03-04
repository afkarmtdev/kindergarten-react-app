// Integration tests for the auth middleware.
//
// We create a minimal Hono app with the middleware applied to a test route,
// then verify it blocks/passes requests based on the Authorization header
// and supabase.auth.getUser() response.

import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Hono } from 'hono'
import { mockSupabase, setAuthGetUser, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import { authMiddleware } from './auth'

// Build a tiny app: middleware → handler that returns the user
const app = new Hono()
app.use('/*', authMiddleware)
app.get('/protected', (c) => {
  const user = c.get('user')
  return c.json({ message: 'OK', user })
})

beforeEach(() => clearMockResponses())

const validUser = { id: 'user-1', email: 'admin@school.my', role: 'admin' }

// ── Missing / malformed header ───────────────────────────────────────────────

describe('missing or malformed Authorization header', () => {
  test('returns 401 when no Authorization header', async () => {
    const res = await app.request('/protected')
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  test('returns 401 when header does not start with Bearer', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Token abc123' },
    })
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  test('returns 401 when header is just "Bearer" with no token', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer ' },
    })
    expect(res.status).toBe(401)
  })
})

// ── Invalid token ────────────────────────────────────────────────────────────

describe('invalid token', () => {
  test('returns 401 when supabase rejects the token', async () => {
    setAuthGetUser({
      data: { user: null },
      error: { message: 'Token expired' },
    })

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer expired-token' },
    })
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json.error).toBe('Invalid token')
  })

  test('returns 401 when supabase returns no user and no error', async () => {
    setAuthGetUser({
      data: { user: null },
      error: null,
    })

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer ghost-token' },
    })
    expect(res.status).toBe(401)
  })
})

// ── Valid token ──────────────────────────────────────────────────────────────

describe('valid token', () => {
  test('passes through to the handler and sets user', async () => {
    setAuthGetUser({
      data: { user: validUser },
      error: null,
    })

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer valid-token-123' },
    })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('OK')
    expect(json.user.id).toBe('user-1')
    expect(json.user.email).toBe('admin@school.my')
  })
})
