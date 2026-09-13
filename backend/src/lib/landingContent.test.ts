import { describe, test, expect } from 'bun:test'
import {
  landingContentPatchSchema,
  sanitiseLandingPatch,
  mergeLandingContent,
  FEATURE_KEYS,
} from './landingContent'

describe('landingContentPatchSchema', () => {
  test('accepts an empty patch', () => {
    expect(landingContentPatchSchema.safeParse({}).success).toBe(true)
  })

  test('fills bilingual defaults for a partial hero', () => {
    const parsed = landingContentPatchSchema.parse({ hero: { tagline: { en: 'Hi' } } })
    expect(parsed.hero?.tagline).toEqual({ en: 'Hi', ms: '' })
    expect(parsed.hero?.subtitle).toEqual({ en: '', ms: '' })
  })

  test('rejects unknown feature keys', () => {
    const result = landingContentPatchSchema.safeParse({ features: { enabled: ['robotics'] } })
    expect(result.success).toBe(false)
  })

  test('rejects rating above 5 and founded_year out of range', () => {
    expect(landingContentPatchSchema.safeParse({ stats: { rating: 6 } }).success).toBe(false)
    expect(landingContentPatchSchema.safeParse({ about: { founded_year: 1800 } }).success).toBe(
      false
    )
  })

  test('rejects non-URL photo values', () => {
    expect(
      landingContentPatchSchema.safeParse({ about: { photo_urls: ['not a url'] } }).success
    ).toBe(false)
    expect(
      landingContentPatchSchema.safeParse({
        team: { members: [{ id: 'a', name: 'Cikgu Aina', photo_url: 'javascript:alert(1)' }] },
      }).success
    ).toBe(false)
  })

  test('caps team size at 24 and about photos at 3', () => {
    const members = Array.from({ length: 25 }, (_, i) => ({ id: String(i), name: `T${i}` }))
    expect(landingContentPatchSchema.safeParse({ team: { members } }).success).toBe(false)
    const photo_urls = Array(4).fill('https://x.test/a.jpg')
    expect(landingContentPatchSchema.safeParse({ about: { photo_urls } }).success).toBe(false)
  })
})

describe('sanitiseLandingPatch', () => {
  test('strips HTML from every text field', () => {
    const patch = landingContentPatchSchema.parse({
      hero: { tagline: { en: '<b>Enrol</b> now', ms: '<i>Daftar</i>' } },
      about: { story: { en: '<em>Our</em> Story' } },
      team: { members: [{ id: 'm1', name: '<img src=x>Cikgu', role: { en: '<u>Lead</u>' } }] },
    })
    const clean = sanitiseLandingPatch(patch)
    expect(clean.hero?.tagline).toEqual({ en: 'Enrol now', ms: 'Daftar' })
    expect(clean.about?.story.en).toBe('Our Story')
    expect(clean.team?.members[0].name).toBe('Cikgu')
    expect(clean.team?.members[0].role.en).toBe('Lead')
  })

  test('de-duplicates feature keys while preserving order', () => {
    const patch = landingContentPatchSchema.parse({
      features: { enabled: ['play', 'learn', 'play'] },
    })
    expect(sanitiseLandingPatch(patch).features?.enabled).toEqual(['play', 'learn'])
  })

  test('only emits sections present in the patch', () => {
    const clean = sanitiseLandingPatch(landingContentPatchSchema.parse({ stats: { mode: 'live' } }))
    expect(Object.keys(clean)).toEqual(['stats'])
  })
})

describe('mergeLandingContent', () => {
  test('replaces only the patched section', () => {
    const existing = { hero: { tagline: { en: 'Old', ms: '' } }, stats: { mode: 'hidden' } }
    const merged = mergeLandingContent(existing, {
      stats: { mode: 'live', students: 0, staff: 0, classes: 0, rating: 0 },
    })
    expect(merged.hero).toEqual(existing.hero)
    expect((merged.stats as { mode: string }).mode).toBe('live')
  })

  test('works when nothing is stored yet', () => {
    const merged = mergeLandingContent(null, { features: { enabled: [...FEATURE_KEYS] } })
    expect(Object.keys(merged)).toEqual(['features'])
  })
})
