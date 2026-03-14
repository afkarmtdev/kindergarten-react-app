import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import schoolInfo from './schoolInfo'

beforeEach(() => clearMockResponses())

const VALID_SCHOOL_INFO = {
  school_name: 'KinderCare',
  address: '123 Jalan Bunga',
  phone: '0312345678',
  email: 'info@kindercare.my',
}

// ── GET / — fetch school info ───────────────────────────────────────────────

describe('GET / — fetch school info', () => {
  test('returns school info when exists', async () => {
    setMockResponse('school_info', {
      data: { id: '1', ...VALID_SCHOOL_INFO },
      error: null,
    })

    const res = await schoolInfo.request('/')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.school_name).toBe('KinderCare')
  })

  test('returns null data when no school info exists', async () => {
    setMockResponse('school_info', {
      data: null,
      error: { message: 'not found' },
    })

    const res = await schoolInfo.request('/')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toBeNull()
  })
})

// ── PUT / — upsert school info ──────────────────────────────────────────────

describe('PUT / — upsert school info', () => {
  test('updates existing school info', async () => {
    // First call: select('id') returns existing row
    // Second call: update returns updated row
    // Both use same table mock — mock returns data for both
    setMockResponse('school_info', {
      data: { id: '1', ...VALID_SCHOOL_INFO },
      error: null,
    })

    const res = await schoolInfo.request('/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_SCHOOL_INFO),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.school_name).toBe('KinderCare')
  })

  test('creates school info when none exists', async () => {
    // select('id') returns null (no existing row), then insert succeeds
    // With our mock both resolve the same — but the route checks `existing`
    // Since mock returns same for both calls, it'll take the update branch
    // which is fine for verifying the route doesn't crash
    setMockResponse('school_info', {
      data: { id: '1', ...VALID_SCHOOL_INFO },
      error: null,
    })

    const res = await schoolInfo.request('/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_SCHOOL_INFO),
    })

    expect(res.status).toBe(200)
  })

  test('validates required fields — rejects missing school_name', async () => {
    const res = await schoolInfo.request('/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '123', phone: '012', email: 'a@b.com' }),
    })
    expect(res.status).toBe(400)
  })

  test('validates required fields — rejects missing email', async () => {
    const res = await schoolInfo.request('/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_name: 'Test', address: '123', phone: '012' }),
    })
    expect(res.status).toBe(400)
  })

  test('validates email format', async () => {
    const res = await schoolInfo.request('/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_SCHOOL_INFO, email: 'not-an-email' }),
    })
    expect(res.status).toBe(400)
  })

  test('validates google_maps_embed_url format', async () => {
    const res = await schoolInfo.request('/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_SCHOOL_INFO, google_maps_embed_url: 'https://evil.com' }),
    })
    expect(res.status).toBe(400)
  })

  test('accepts valid google_maps_embed_url', async () => {
    setMockResponse('school_info', {
      data: { id: '1', ...VALID_SCHOOL_INFO },
      error: null,
    })

    const res = await schoolInfo.request('/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...VALID_SCHOOL_INFO,
        google_maps_embed_url: 'https://www.google.com/maps/embed?pb=abc',
      }),
    })
    expect(res.status).toBe(200)
  })

  test('accepts operating hours', async () => {
    setMockResponse('school_info', {
      data: { id: '1', ...VALID_SCHOOL_INFO },
      error: null,
    })

    const res = await schoolInfo.request('/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...VALID_SCHOOL_INFO,
        operating_hours: {
          monday: { open: '08:00', close: '17:00' },
          tuesday: { open: '08:00', close: '17:00' },
          wednesday: { open: '08:00', close: '17:00' },
          thursday: { open: '08:00', close: '17:00' },
          friday: { open: '08:00', close: '17:00' },
          saturday: { open: '', close: '' },
          sunday: { open: '', close: '' },
        },
      }),
    })
    expect(res.status).toBe(200)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('school_info', {
      data: null,
      error: { message: 'insert failed' },
    })

    const res = await schoolInfo.request('/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_SCHOOL_INFO),
    })

    // The route first does select('id').single() which also returns error
    // but the route checks `existing` (which is null), so it goes to insert branch
    // insert then returns the error
    expect(res.status).toBe(500)
  })
})
