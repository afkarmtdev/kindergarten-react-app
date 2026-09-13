import { describe, test, expect } from 'vitest'
import {
  mergeLandingContent,
  pickText,
  resolveStats,
  DEFAULT_LANDING_CONTENT,
  FEATURE_KEYS,
} from './landingContent'

describe('mergeLandingContent', () => {
  test('returns defaults for null or garbage input', () => {
    expect(mergeLandingContent(null)).toEqual(DEFAULT_LANDING_CONTENT)
    expect(mergeLandingContent('nope')).toEqual(DEFAULT_LANDING_CONTENT)
    expect(mergeLandingContent([])).toEqual(DEFAULT_LANDING_CONTENT)
  })

  test('keeps stored values and fills missing ones', () => {
    const merged = mergeLandingContent({
      hero: { tagline: { en: 'Enrolling now' } },
      stats: { mode: 'manual', students: 42 },
    })
    expect(merged.hero.tagline).toEqual({ en: 'Enrolling now', ms: '' })
    expect(merged.hero.subtitle).toEqual({ en: '', ms: '' })
    expect(merged.stats).toEqual({ mode: 'manual', students: 42, staff: 0, classes: 0, rating: 0 })
    expect(merged.features.enabled).toEqual(FEATURE_KEYS)
    expect(merged.team).toEqual({ enabled: false, members: [] })
  })

  test('drops unknown feature keys and non-string photo urls', () => {
    const merged = mergeLandingContent({
      features: { enabled: ['play', 'robotics', 'learn'] },
      about: { photo_urls: ['https://x.test/a.jpg', 42, null] },
    })
    expect(merged.features.enabled).toEqual(['play', 'learn'])
    expect(merged.about.photo_urls).toEqual(['https://x.test/a.jpg'])
  })

  test('falls back to hidden for an unknown stats mode', () => {
    expect(mergeLandingContent({ stats: { mode: 'sometimes' } }).stats.mode).toBe('hidden')
  })

  test('normalises team members', () => {
    const merged = mergeLandingContent({
      team: { enabled: true, members: [{ id: 'a', name: 'Cikgu Aina', role: { en: 'Lead' } }] },
    })
    expect(merged.team.enabled).toBe(true)
    expect(merged.team.members[0]).toEqual({
      id: 'a',
      name: 'Cikgu Aina',
      role: { en: 'Lead', ms: '' },
      photo_url: null,
    })
  })
})

describe('pickText', () => {
  test('prefers the current language', () => {
    expect(pickText({ en: 'Hello', ms: 'Helo' }, 'ms', 'default')).toBe('Helo')
  })

  test('falls back to English when the current language is blank', () => {
    expect(pickText({ en: 'Hello', ms: '  ' }, 'ms', 'default')).toBe('Hello')
  })

  test('falls back to the default when both are blank', () => {
    expect(pickText({ en: '', ms: '' }, 'en', 'default')).toBe('default')
  })
})

describe('resolveStats', () => {
  test('returns nothing when hidden', () => {
    expect(
      resolveStats({ mode: 'hidden', students: 9, staff: 9, classes: 9, rating: 5 }, null)
    ).toEqual([])
  })

  test('manual mode uses typed values and skips zeros', () => {
    const tiles = resolveStats(
      { mode: 'manual', students: 80, staff: 0, classes: 6, rating: 4.9 },
      null
    )
    expect(tiles.map((s) => s.key)).toEqual(['students', 'classes', 'rating'])
    expect(tiles.find((s) => s.key === 'rating')).toMatchObject({ value: 4.9, decimals: 1 })
  })

  test('live mode takes student and class counts from the API but staff from the school', () => {
    const tiles = resolveStats(
      { mode: 'live', students: 999, staff: 7, classes: 999, rating: 0 },
      { students: 63, classes: 4 }
    )
    expect(tiles).toEqual([
      { key: 'students', value: 63, suffix: '', decimals: 0 },
      { key: 'staff', value: 7, suffix: '', decimals: 0 },
      { key: 'classes', value: 4, suffix: '', decimals: 0 },
    ])
  })

  test('live mode with no API data yet shows only school-entered tiles', () => {
    const tiles = resolveStats({ mode: 'live', students: 0, staff: 3, classes: 0, rating: 5 }, null)
    expect(tiles.map((s) => s.key)).toEqual(['staff', 'rating'])
  })
})
