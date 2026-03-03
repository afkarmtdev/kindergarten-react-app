import { describe, test, expect } from 'vitest'
import { formatRM } from './constants'

describe('formatRM', () => {
  test('formats a whole number with two decimal places', () => {
    expect(formatRM(50)).toBe('RM 50.00')
  })

  test('formats a decimal number to two places', () => {
    expect(formatRM(99.9)).toBe('RM 99.90')
  })

  test('rounds to two decimal places', () => {
    expect(formatRM(10.999)).toBe('RM 11.00')
  })

  test('formats zero', () => {
    expect(formatRM(0)).toBe('RM 0.00')
  })

  test('formats a string number', () => {
    expect(formatRM('250')).toBe('RM 250.00')
  })

  test('formats a string decimal', () => {
    expect(formatRM('49.5')).toBe('RM 49.50')
  })

  test('formats a large number', () => {
    expect(formatRM(12345.67)).toBe('RM 12345.67')
  })

  test('handles negative values', () => {
    expect(formatRM(-10)).toBe('RM -10.00')
  })

  test('returns "RM NaN" for non-numeric string', () => {
    expect(formatRM('abc')).toBe('RM NaN')
  })
})
