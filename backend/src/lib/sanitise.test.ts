import { describe, test, expect } from 'bun:test'
import { stripHtml, sanitiseStrings } from './sanitise'

// ── stripHtml ────────────────────────────────────────────────────────────────

describe('stripHtml', () => {
  test('removes simple HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold')
  })

  test('removes nested HTML tags', () => {
    expect(stripHtml('<div><span>nested</span></div>')).toBe('nested')
  })

  test('removes script tags (XSS prevention)', () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")')
  })

  test('returns empty string for tag-only input', () => {
    expect(stripHtml('<br>')).toBe('')
  })

  test('preserves plain text with no HTML', () => {
    expect(stripHtml('hello world')).toBe('hello world')
  })

  test('trims whitespace from result', () => {
    expect(stripHtml('  <p>hello</p>  ')).toBe('hello')
  })

  test('handles empty string', () => {
    expect(stripHtml('')).toBe('')
  })

  test('handles self-closing tags', () => {
    expect(stripHtml('line1<br/>line2')).toBe('line1line2')
  })

  test('removes tags with attributes', () => {
    expect(stripHtml('<a href="http://evil.com">click me</a>')).toBe('click me')
  })
})

// ── sanitiseStrings ──────────────────────────────────────────────────────────

describe('sanitiseStrings', () => {
  test('strips HTML from all string fields', () => {
    const input = { name: '<b>Ali</b>', age: 5 }
    const result = sanitiseStrings(input)
    expect(result.name).toBe('Ali')
    expect(result.age).toBe(5)
  })

  test('leaves non-string fields untouched', () => {
    const input = { count: 42, active: true, tags: null }
    const result = sanitiseStrings(input)
    expect(result).toEqual({ count: 42, active: true, tags: null })
  })

  test('returns a new object (does not mutate original)', () => {
    const input = { name: '<i>test</i>' }
    const result = sanitiseStrings(input)
    expect(result).not.toBe(input)
    expect(input.name).toBe('<i>test</i>')
  })

  test('handles object with no string fields', () => {
    const input = { a: 1, b: false }
    expect(sanitiseStrings(input)).toEqual({ a: 1, b: false })
  })

  test('handles object with all string fields', () => {
    const input = { first: '<b>A</b>', last: '<em>B</em>' }
    expect(sanitiseStrings(input)).toEqual({ first: 'A', last: 'B' })
  })
})
