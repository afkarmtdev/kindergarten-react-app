import { describe, test, expect } from 'vitest'
import { isMalaysiaDay } from './useMalaysiaDay'

describe('isMalaysiaDay', () => {
  test('true from 16 September', () => {
    expect(isMalaysiaDay(new Date(2026, 8, 16, 0, 0, 1))).toBe(true)
    expect(isMalaysiaDay(new Date(2026, 8, 16, 23, 59))).toBe(true)
  })

  test('true through the whole week up to 22 September', () => {
    expect(isMalaysiaDay(new Date(2026, 8, 19))).toBe(true)
    expect(isMalaysiaDay(new Date(2026, 8, 22, 23, 59))).toBe(true)
  })

  test('false before the 16th and after the 22nd', () => {
    expect(isMalaysiaDay(new Date(2026, 8, 15, 23, 59))).toBe(false)
    expect(isMalaysiaDay(new Date(2026, 8, 23))).toBe(false)
  })

  test('false in the same date range of other months', () => {
    expect(isMalaysiaDay(new Date(2026, 7, 16))).toBe(false)
    expect(isMalaysiaDay(new Date(2026, 9, 18))).toBe(false)
  })
})
