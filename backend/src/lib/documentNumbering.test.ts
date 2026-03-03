import { describe, test, expect } from 'bun:test'
import { resolveNextSerial, assembleNumber, type DocumentSegment } from './documentNumbering'

// ── resolveNextSerial ────────────────────────────────────────────────────────

describe('resolveNextSerial', () => {
  // --- no reset / no serial segment ---

  test('increments by 1 when there is no serial segment', () => {
    expect(resolveNextSerial(5, undefined, null, new Date())).toBe(6)
  })

  test('increments by 1 when reset_by is no_reset', () => {
    const seg: DocumentSegment = {
      order: 3,
      type: 'serial',
      reset_by: 'no_reset',
      total_chars: 4,
    }
    expect(resolveNextSerial(10, seg, '2025-01-15T00:00:00Z', new Date())).toBe(11)
  })

  test('increments by 1 when reset_by is undefined', () => {
    const seg: DocumentSegment = { order: 3, type: 'serial', total_chars: 4 }
    expect(resolveNextSerial(7, seg, null, new Date())).toBe(8)
  })

  // --- first-ever number (no last_reset_at) ---

  test('uses start_from on first-ever number with monthly reset', () => {
    const seg: DocumentSegment = {
      order: 3,
      type: 'serial',
      reset_by: 'monthly',
      start_from: 100,
      total_chars: 4,
    }
    expect(resolveNextSerial(0, seg, null, new Date())).toBe(100)
  })

  test('defaults to 1 on first-ever number when start_from is not set', () => {
    const seg: DocumentSegment = {
      order: 3,
      type: 'serial',
      reset_by: 'yearly',
      total_chars: 4,
    }
    expect(resolveNextSerial(0, seg, null, new Date())).toBe(1)
  })

  // --- monthly reset ---

  test('resets when month changes (monthly)', () => {
    const seg: DocumentSegment = {
      order: 3,
      type: 'serial',
      reset_by: 'monthly',
      start_from: 1,
      total_chars: 4,
    }
    const now = new Date(2025, 2, 1) // March 2025
    const lastReset = '2025-02-15T00:00:00Z' // February 2025
    expect(resolveNextSerial(50, seg, lastReset, now)).toBe(1)
  })

  test('does not reset when still in the same month (monthly)', () => {
    const seg: DocumentSegment = {
      order: 3,
      type: 'serial',
      reset_by: 'monthly',
      start_from: 1,
      total_chars: 4,
    }
    const now = new Date(2025, 2, 20) // March 20
    const lastReset = '2025-03-10T00:00:00Z' // March 10
    expect(resolveNextSerial(50, seg, lastReset, now)).toBe(51)
  })

  test('resets when year changes even with monthly reset', () => {
    const seg: DocumentSegment = {
      order: 3,
      type: 'serial',
      reset_by: 'monthly',
      start_from: 1,
      total_chars: 4,
    }
    const now = new Date(2026, 0, 5) // Jan 2026
    const lastReset = '2025-12-20T00:00:00Z' // Dec 2025
    expect(resolveNextSerial(99, seg, lastReset, now)).toBe(1)
  })

  // --- yearly reset ---

  test('resets when year changes (yearly)', () => {
    const seg: DocumentSegment = {
      order: 3,
      type: 'serial',
      reset_by: 'yearly',
      start_from: 1,
      total_chars: 4,
    }
    const now = new Date(2026, 0, 1) // Jan 2026
    const lastReset = '2025-11-30T00:00:00Z' // Nov 2025
    expect(resolveNextSerial(200, seg, lastReset, now)).toBe(1)
  })

  test('does not reset when still in the same year (yearly)', () => {
    const seg: DocumentSegment = {
      order: 3,
      type: 'serial',
      reset_by: 'yearly',
      start_from: 1,
      total_chars: 4,
    }
    const now = new Date(2025, 6, 1) // July 2025
    const lastReset = '2025-03-15T00:00:00Z' // March 2025
    expect(resolveNextSerial(30, seg, lastReset, now)).toBe(31)
  })

  test('uses custom start_from on yearly reset', () => {
    const seg: DocumentSegment = {
      order: 3,
      type: 'serial',
      reset_by: 'yearly',
      start_from: 500,
      total_chars: 4,
    }
    const now = new Date(2026, 0, 1)
    const lastReset = '2025-12-31T00:00:00Z'
    expect(resolveNextSerial(999, seg, lastReset, now)).toBe(500)
  })

  // --- edge: serial at 0 ---

  test('increments from 0 to 1 with no reset', () => {
    expect(resolveNextSerial(0, undefined, null, new Date())).toBe(1)
  })
})

// ── assembleNumber ───────────────────────────────────────────────────────────

describe('assembleNumber', () => {
  const march2025 = new Date(2025, 2, 15) // March 15, 2025

  test('assembles a typical receipt number: RC-2025-03-0001', () => {
    const segments: DocumentSegment[] = [
      { order: 1, type: 'constant', value: 'RC-' },
      { order: 2, type: 'year' },
      { order: 3, type: 'constant', value: '-' },
      { order: 4, type: 'month' },
      { order: 5, type: 'constant', value: '-' },
      { order: 6, type: 'serial', total_chars: 4 },
    ]
    expect(assembleNumber(segments, 1, march2025)).toBe('RC-2025-03-0001')
  })

  test('pads serial to specified total_chars', () => {
    const segments: DocumentSegment[] = [{ order: 1, type: 'serial', total_chars: 6 }]
    expect(assembleNumber(segments, 42, march2025)).toBe('000042')
  })

  test('defaults to 4-char padding when total_chars is not set', () => {
    const segments: DocumentSegment[] = [{ order: 1, type: 'serial' }]
    expect(assembleNumber(segments, 7, march2025)).toBe('0007')
  })

  test('does not pad when serial exceeds total_chars', () => {
    const segments: DocumentSegment[] = [{ order: 1, type: 'serial', total_chars: 3 }]
    expect(assembleNumber(segments, 12345, march2025)).toBe('12345')
  })

  test('handles constant-only segments', () => {
    const segments: DocumentSegment[] = [{ order: 1, type: 'constant', value: 'INV' }]
    expect(assembleNumber(segments, 0, march2025)).toBe('INV')
  })

  test('handles constant with missing value', () => {
    const segments: DocumentSegment[] = [{ order: 1, type: 'constant' }]
    expect(assembleNumber(segments, 0, march2025)).toBe('')
  })

  test('sorts segments by order regardless of array position', () => {
    const segments: DocumentSegment[] = [
      { order: 3, type: 'serial', total_chars: 3 },
      { order: 1, type: 'constant', value: 'A' },
      { order: 2, type: 'constant', value: 'B' },
    ]
    expect(assembleNumber(segments, 5, march2025)).toBe('AB005')
  })

  test('uses correct year from the date', () => {
    const segments: DocumentSegment[] = [{ order: 1, type: 'year' }]
    expect(assembleNumber(segments, 0, new Date(2030, 0, 1))).toBe('2030')
  })

  test('pads single-digit months to 2 chars', () => {
    const segments: DocumentSegment[] = [{ order: 1, type: 'month' }]
    expect(assembleNumber(segments, 0, new Date(2025, 0, 1))).toBe('01') // January
    expect(assembleNumber(segments, 0, new Date(2025, 8, 1))).toBe('09') // September
  })

  test('does not pad double-digit months', () => {
    const segments: DocumentSegment[] = [{ order: 1, type: 'month' }]
    expect(assembleNumber(segments, 0, new Date(2025, 11, 1))).toBe('12') // December
  })

  test('handles empty segments array', () => {
    expect(assembleNumber([], 1, march2025)).toBe('')
  })

  test('assembles a complex real-world format: KCR/2025/03/0001', () => {
    const segments: DocumentSegment[] = [
      { order: 1, type: 'constant', value: 'KCR/' },
      { order: 2, type: 'year' },
      { order: 3, type: 'constant', value: '/' },
      { order: 4, type: 'month' },
      { order: 5, type: 'constant', value: '/' },
      { order: 6, type: 'serial', total_chars: 4 },
    ]
    expect(assembleNumber(segments, 1, march2025)).toBe('KCR/2025/03/0001')
  })
})
