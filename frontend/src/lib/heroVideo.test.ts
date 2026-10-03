import { describe, test, expect } from 'vitest'
import { checkHeroVideo, heroVideoExtension, HERO_VIDEO_MAX_MB } from './heroVideo'

const MB = 1024 * 1024

describe('checkHeroVideo', () => {
  test('accepts MP4 and WebM under the size cap', () => {
    expect(checkHeroVideo({ type: 'video/mp4', size: 8 * MB })).toBeNull()
    expect(checkHeroVideo({ type: 'video/webm', size: HERO_VIDEO_MAX_MB * MB })).toBeNull()
  })

  test('rejects other types, including iPhone .mov', () => {
    expect(checkHeroVideo({ type: 'video/quicktime', size: MB })).toBe('type')
    expect(checkHeroVideo({ type: 'image/jpeg', size: MB })).toBe('type')
    expect(checkHeroVideo({ type: '', size: MB })).toBe('type')
  })

  test('rejects files over the size cap', () => {
    expect(checkHeroVideo({ type: 'video/mp4', size: HERO_VIDEO_MAX_MB * MB + 1 })).toBe('size')
  })
})

describe('heroVideoExtension', () => {
  test('maps the accepted types to a file extension', () => {
    expect(heroVideoExtension('video/webm')).toBe('webm')
    expect(heroVideoExtension('video/mp4')).toBe('mp4')
  })
})
