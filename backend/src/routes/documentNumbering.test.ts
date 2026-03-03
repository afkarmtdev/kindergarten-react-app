import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import documentNumbering, { generateNextNumber } from './documentNumbering'

beforeEach(() => clearMockResponses())

// ── GET /:type ──────────────────────────────────────────────────────────────

describe('GET /:type', () => {
  test('returns config when it exists', async () => {
    setMockResponse('document_numbering', {
      data: {
        id: '1',
        document_type: 'receipt',
        segments: [{ order: 1, type: 'constant', value: 'RC-' }],
        current_serial: 5,
      },
      error: null,
    })

    const res = await documentNumbering.request('/receipt')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.document_type).toBe('receipt')
    expect(json.data.segments).toHaveLength(1)
  })

  test('returns { data: null } when not configured', async () => {
    setMockResponse('document_numbering', {
      data: null,
      error: { message: 'Row not found' },
    })

    const res = await documentNumbering.request('/receipt')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toBeNull()
  })
})

// ── PUT /:type ──────────────────────────────────────────────────────────────

describe('PUT /:type', () => {
  test('upserts config and returns data', async () => {
    // Mock returns existing row (both the "check" and "update" calls hit same mock)
    setMockResponse('document_numbering', {
      data: {
        id: 'existing-1',
        document_type: 'receipt',
        current_serial: 42,
        segments: [
          { order: 1, type: 'constant', value: 'INV-' },
          { order: 2, type: 'serial', total_chars: 4 },
        ],
      },
      error: null,
    })

    const res = await documentNumbering.request('/receipt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segments: [
          { order: 1, type: 'constant', value: 'INV-' },
          { order: 2, type: 'serial', total_chars: 4 },
        ],
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.document_type).toBe('receipt')
  })

  test('returns 500 on database error', async () => {
    setMockResponse('document_numbering', {
      data: null,
      error: { message: 'DB write failed' },
    })

    const res = await documentNumbering.request('/receipt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segments: [{ order: 1, type: 'year' }],
      }),
    })

    expect(res.status).toBe(500)
  })
})

describe('PUT /:type — validation', () => {
  test('rejects empty segments array', async () => {
    const res = await documentNumbering.request('/receipt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segments: [] }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects invalid segment type', async () => {
    const res = await documentNumbering.request('/receipt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segments: [{ order: 1, type: 'invalid_type' }],
      }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects segment with order < 1', async () => {
    const res = await documentNumbering.request('/receipt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segments: [{ order: 0, type: 'year' }],
      }),
    })

    expect(res.status).toBe(400)
  })

  test('rejects missing segments field', async () => {
    const res = await documentNumbering.request('/receipt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(400)
  })
})

// ── generateNextNumber() ────────────────────────────────────────────────────

describe('generateNextNumber()', () => {
  test('generates a formatted number and increments serial', async () => {
    setMockResponse('document_numbering', {
      data: {
        id: '1',
        document_type: 'receipt',
        segments: [
          { order: 1, type: 'constant', value: 'RC-' },
          { order: 2, type: 'serial', total_chars: 4, reset_by: 'no_reset' },
        ],
        current_serial: 5,
        last_reset_at: null,
      },
      error: null,
    })

    const result = await generateNextNumber('receipt')
    // Serial 5 → next is 6 → "0006"
    expect(result).toBe('RC-0006')
  })

  test('throws when config not found', async () => {
    setMockResponse('document_numbering', {
      data: null,
      error: { message: 'Row not found' },
    })

    expect(generateNextNumber('receipt')).rejects.toThrow('Receipt numbering not configured')
  })
})
