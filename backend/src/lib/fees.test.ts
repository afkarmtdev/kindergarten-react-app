import { describe, test, expect } from 'bun:test'
import { deriveStatus, monthRange } from './fees'

// ── deriveStatus ─────────────────────────────────────────────────────────────

describe('deriveStatus', () => {
  test('returns "unpaid" when nothing is paid and no discount', () => {
    expect(deriveStatus(100, 0, 0)).toBe('unpaid')
  })

  test('returns "paid" when full amount is paid', () => {
    expect(deriveStatus(100, 100, 0)).toBe('paid')
  })

  test('returns "partial" when some amount is paid', () => {
    expect(deriveStatus(100, 50, 0)).toBe('partial')
  })

  test('returns "waived" when discount covers full amount', () => {
    expect(deriveStatus(100, 0, 100)).toBe('waived')
  })

  test('returns "waived" when discount exceeds amount owed', () => {
    expect(deriveStatus(100, 0, 150)).toBe('waived')
  })

  test('returns "paid" when paid equals net after discount', () => {
    expect(deriveStatus(100, 80, 20)).toBe('paid')
  })

  test('returns "partial" when paid is less than net after discount', () => {
    expect(deriveStatus(100, 30, 20)).toBe('partial')
  })

  test('handles floating-point precision (0.001 tolerance)', () => {
    expect(deriveStatus(100, 99.999, 0)).toBe('paid')
  })

  test('handles tiny payment below threshold as "unpaid"', () => {
    expect(deriveStatus(100, 0.0001, 0)).toBe('unpaid')
  })

  test('handles zero amount owed as "waived"', () => {
    expect(deriveStatus(0, 0, 0)).toBe('waived')
  })
})

// ── monthRange ───────────────────────────────────────────────────────────────

describe('monthRange', () => {
  test('returns correct range for a 31-day month', () => {
    expect(monthRange('2025-01')).toEqual({
      start: '2025-01-01',
      end: '2025-01-31',
    })
  })

  test('returns correct range for a 30-day month', () => {
    expect(monthRange('2025-04')).toEqual({
      start: '2025-04-01',
      end: '2025-04-30',
    })
  })

  test('returns correct range for February (non-leap year)', () => {
    expect(monthRange('2025-02')).toEqual({
      start: '2025-02-01',
      end: '2025-02-28',
    })
  })

  test('returns correct range for February (leap year)', () => {
    expect(monthRange('2024-02')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    })
  })

  test('returns correct range for December', () => {
    expect(monthRange('2025-12')).toEqual({
      start: '2025-12-01',
      end: '2025-12-31',
    })
  })
})
