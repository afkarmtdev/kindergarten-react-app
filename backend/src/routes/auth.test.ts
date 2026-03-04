// Integration tests for the auth route.
//
// Tests login (with rate limiting), logout, and GET /me.

import { describe, test, expect, beforeEach, mock } from 'bun:test'
import {
  mockSupabase,
  setAuthGetUser,
  setAuthLogin,
  setAuthSignOutError,
  clearMockResponses,
} from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import auth from './auth'

beforeEach(() => clearMockResponses())

const validUser = { id: 'user-1', email: 'admin@school.my' }
const validSession = { access_token: 'tok-123', expires_at: 9999999999 }

// ── POST /login ──────────────────────────────────────────────────────────────

describe('POST /login', () => {
  test('returns user and session on valid credentials', async () => {
    setAuthLogin({
      data: { user: validUser, session: validSession },
      error: null,
    })

    const res = await auth.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school.my', password: 'secret123' }),
    })

    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.user.email).toBe('admin@school.my')
    expect(json.session.access_token).toBe('tok-123')
  })

  test('returns 401 on invalid credentials', async () => {
    setAuthLogin({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const res = await auth.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school.my', password: 'wrongpass' }),
    })

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Invalid login credentials')
  })

  test('rejects missing email', async () => {
    const res = await auth.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'secret123' }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects invalid email format', async () => {
    const res = await auth.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'secret123' }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects password shorter than 6 chars', async () => {
    const res = await auth.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school.my', password: '12345' }),
    })

    expect(res.status).toBe(400)
  })

  test('returns 429 after 10 rapid attempts from same IP', async () => {
    setAuthLogin({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    // Fire 10 requests (rate limit allows 10 per minute)
    for (let i = 0; i < 10; i++) {
      await auth.request('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.99',
        },
        body: JSON.stringify({ email: 'admin@school.my', password: 'wrongpass' }),
      })
    }

    // 11th should be rate limited
    const res = await auth.request('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.99',
      },
      body: JSON.stringify({ email: 'admin@school.my', password: 'wrongpass' }),
    })

    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toContain('Too many')
  })
})

// ── POST /logout ─────────────────────────────────────────────────────────────

describe('POST /logout', () => {
  test('returns success message', async () => {
    const res = await auth.request('/logout', { method: 'POST' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toBe('Logged out')
  })

  test('returns 500 when signOut fails', async () => {
    setAuthSignOutError({ message: 'session not found' })

    const res = await auth.request('/logout', { method: 'POST' })
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('session not found')
  })
})

// ── GET /me ──────────────────────────────────────────────────────────────────

describe('GET /me', () => {
  test('returns user when token is valid', async () => {
    setAuthGetUser({
      data: { user: validUser },
      error: null,
    })

    const res = await auth.request('/me', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.email).toBe('admin@school.my')
  })

  test('returns 401 when no token provided', async () => {
    const res = await auth.request('/me')
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json.error).toBe('No token')
  })

  test('returns 401 when token is invalid', async () => {
    setAuthGetUser({
      data: { user: null },
      error: { message: 'Token expired' },
    })

    const res = await auth.request('/me', {
      headers: { Authorization: 'Bearer bad-token' },
    })

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Invalid token')
  })
})
