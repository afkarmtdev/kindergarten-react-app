import { describe, test, expect } from 'vitest'
import { CROP_SHAPES, cropOutputSize, cropFileName } from './cropImage'

describe('CROP_SHAPES', () => {
  test('square and round share a 1:1 aspect, only round is circular', () => {
    expect(CROP_SHAPES.square).toEqual({ aspect: 1, round: false })
    expect(CROP_SHAPES.round).toEqual({ aspect: 1, round: true })
  })

  test('landscape is 4:3 and banner is 16:9', () => {
    expect(CROP_SHAPES.landscape.aspect).toBeCloseTo(4 / 3)
    expect(CROP_SHAPES.banner.aspect).toBeCloseTo(16 / 9)
    expect(CROP_SHAPES.landscape.round).toBe(false)
    expect(CROP_SHAPES.banner.round).toBe(false)
  })
})

describe('cropOutputSize', () => {
  test('keeps a crop that already fits', () => {
    expect(cropOutputSize({ width: 800, height: 600 }, 1600)).toEqual({ width: 800, height: 600 })
  })

  test('scales the longest side down to maxSize and keeps the aspect', () => {
    expect(cropOutputSize({ width: 3200, height: 2400 }, 1600)).toEqual({
      width: 1600,
      height: 1200,
    })
    expect(cropOutputSize({ width: 900, height: 3000 }, 1500)).toEqual({ width: 450, height: 1500 })
  })

  test('never upscales a small crop', () => {
    expect(cropOutputSize({ width: 120, height: 120 }, 1600)).toEqual({ width: 120, height: 120 })
  })

  test('never returns a zero dimension', () => {
    expect(cropOutputSize({ width: 0.2, height: 5000 }, 100)).toEqual({ width: 1, height: 100 })
  })
})

describe('cropFileName', () => {
  test('replaces the extension with .jpg', () => {
    expect(cropFileName('IMG_0042.HEIC')).toBe('IMG_0042.jpg')
    expect(cropFileName('team.photo.png')).toBe('team.photo.jpg')
  })

  test('handles names without an extension', () => {
    expect(cropFileName('logo')).toBe('logo.jpg')
  })

  test('falls back to photo.jpg for an extension-only name', () => {
    expect(cropFileName('.png')).toBe('photo.jpg')
  })
})
