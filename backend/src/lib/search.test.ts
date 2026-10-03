import { describe, test, expect } from 'bun:test'
import { orIlike } from './search'

describe('orIlike', () => {
  test('one quoted ilike per column', () => {
    expect(orIlike(['title', 'body'], 'sports day')).toBe(
      'title.ilike."%sports day%",body.ilike."%sports day%"'
    )
  })

  test('keeps commas, dots, colons and brackets inside the quotes', () => {
    expect(orIlike(['name'], 'Rose (2026), K.1: am')).toBe('name.ilike."%Rose (2026), K.1: am%"')
  })

  test('escapes double quotes and backslashes', () => {
    expect(orIlike(['name'], 'say "hi" \\ bye')).toBe('name.ilike."%say \\"hi\\" \\\\ bye%"')
  })
})
