import { describe, test, expect, vi, afterEach } from 'vitest'
import { isExpired, formatDate } from './constants'

// ── isExpired ────────────────────────────────────────────────────────────────

describe('isExpired', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('returns false when expiresAt is undefined', () => {
    expect(isExpired(undefined)).toBe(false)
  })

  test('returns false when expiresAt is not provided', () => {
    expect(isExpired()).toBe(false)
  })

  test('returns true when expiry date is in the past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15)) // June 15, 2025

    expect(isExpired('2025-06-10')).toBe(true)
  })

  test('returns false when expiry date is in the future', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15)) // June 15, 2025

    expect(isExpired('2025-06-20')).toBe(false)
  })

  test('returns false when expiry date is today (not yet expired)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15)) // June 15, 2025

    // The function compares against new Date(new Date().toDateString()),
    // which strips time — so "today" means the expiry date is NOT less than
    // today's midnight, so it should be false (expires at end of day)
    expect(isExpired('2025-06-15')).toBe(false)
  })

  test('returns true when expiry was yesterday', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15)) // June 15, 2025

    expect(isExpired('2025-06-14')).toBe(true)
  })

  test('handles year boundary (expired last year)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 5)) // Jan 5, 2025

    expect(isExpired('2024-12-31')).toBe(true)
  })
})

// ── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  test('formats a standard date string', () => {
    const result = formatDate('2025-03-15')
    // en-MY locale: "15 Mar 2025"
    expect(result).toBe('15 Mar 2025')
  })

  test('formats a date with single-digit day', () => {
    const result = formatDate('2025-01-05')
    expect(result).toBe('5 Jan 2025')
  })

  test('formats December date', () => {
    const result = formatDate('2025-12-25')
    expect(result).toBe('25 Dec 2025')
  })

  test('formats a date with time portion (ignores time)', () => {
    const result = formatDate('2025-06-01T14:30:00Z')
    // May render as 1 Jun or 2 Jun depending on timezone, but format is consistent
    expect(result).toMatch(/^\d{1,2} Jun 2025$/)
  })

  test('formats leap day', () => {
    const result = formatDate('2024-02-29')
    expect(result).toBe('29 Feb 2024')
  })
})
