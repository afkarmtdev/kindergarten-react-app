import { describe, test, expect, vi, afterEach } from 'vitest'
import { isBirthdayToday } from './utils'

describe('isBirthdayToday', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('returns true when month and day match today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 2, 15)) // March 15 (month is 0-indexed)

    expect(isBirthdayToday('2018-03-15')).toBe(true)
  })

  test('returns true regardless of birth year', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 2, 15))

    expect(isBirthdayToday('2010-03-15')).toBe(true)
    expect(isBirthdayToday('2020-03-15')).toBe(true)
  })

  test('returns false when day does not match', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 2, 15))

    expect(isBirthdayToday('2018-03-16')).toBe(false)
  })

  test('returns false when month does not match', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 2, 15))

    expect(isBirthdayToday('2018-04-15')).toBe(false)
  })

  test('returns false for empty string', () => {
    expect(isBirthdayToday('')).toBe(false)
  })

  test('handles leap day birthday on non-leap year', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 1, 28)) // Feb 28, 2025 (non-leap)

    expect(isBirthdayToday('2020-02-29')).toBe(false)
  })

  test('handles leap day birthday on leap year', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 1, 29)) // Feb 29, 2024 (leap year)

    expect(isBirthdayToday('2020-02-29')).toBe(true)
  })
})
