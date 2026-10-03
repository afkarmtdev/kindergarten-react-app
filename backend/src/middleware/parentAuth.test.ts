// Tests for parentMiddleware: token + session + device checks, and the child list it sets
// (parentChildIds), which decides which students' data the portal can read.

import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { createHash } from 'crypto'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import { parentMiddleware } from './parentAuth'

const PARENT_ID = '00000000-0000-0000-0000-000000000099'
const LIVE_CHILD = '00000000-0000-0000-0000-000000000001'
const DELETED_CHILD = '00000000-0000-0000-0000-000000000002'
const DEVICE_ID = 'device-abc'

const app = new Hono()
app.use('*', parentMiddleware)
app.get('/whoami', (c) =>
  c.json({ parentId: c.get('parentId'), childIds: c.get('parentChildIds') })
)

async function request(headers: Record<string, string> = {}) {
  return app.request('/whoami', { headers })
}

async function authHeaders() {
  const token = await sign({ parent_id: PARENT_ID }, process.env.PORTAL_JWT_SECRET!)
  return { Authorization: `Bearer ${token}`, 'X-Device-Id': DEVICE_ID }
}

beforeEach(() => {
  clearMockResponses()
  setMockResponse('parent_sessions', {
    data: {
      parent_id: PARENT_ID,
      device_id: createHash('sha256').update(DEVICE_ID).digest('hex'),
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    },
    error: null,
  })
})

describe('parentMiddleware', () => {
  test('rejects a request without a token', async () => {
    const res = await request({ 'X-Device-Id': DEVICE_ID })
    expect(res.status).toBe(401)
  })

  test('rejects a session bound to another device', async () => {
    const headers = await authHeaders()
    const res = await request({ ...headers, 'X-Device-Id': 'other-device' })
    expect(res.status).toBe(401)
  })

  test('sets parentChildIds without soft-deleted students', async () => {
    setMockResponse('parent_students', {
      data: [
        { student_id: LIVE_CHILD, students: { deleted_at: null } },
        { student_id: DELETED_CHILD, students: { deleted_at: '2026-10-01T00:00:00Z' } },
      ],
      error: null,
    })

    const res = await request(await authHeaders())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ parentId: PARENT_ID, childIds: [LIVE_CHILD] })
  })
})
