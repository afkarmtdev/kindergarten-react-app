import { describe, test, expect } from 'vitest'
import { resolveLoginBear, GAZE_SPAN_CHARS } from './loginBear'

const idle = { watching: false, hiding: false, oops: false, typedLength: 0 }

describe('resolveLoginBear', () => {
  test('looks straight ahead when nothing is focused', () => {
    expect(resolveLoginBear(idle)).toEqual({ eyeState: 'open', gaze: { x: 0, y: 0 } })
  })

  test('starts at the left of the field when watching an empty input', () => {
    const look = resolveLoginBear({ ...idle, watching: true })
    expect(look.eyeState).toBe('open')
    expect(look.gaze.x).toBe(-1)
    expect(look.gaze.y).toBeGreaterThan(0)
  })

  test('slides the gaze right as the text grows and clamps at 1', () => {
    const half = resolveLoginBear({ ...idle, watching: true, typedLength: GAZE_SPAN_CHARS / 2 })
    expect(half.gaze.x).toBeCloseTo(0)
    const far = resolveLoginBear({ ...idle, watching: true, typedLength: GAZE_SPAN_CHARS * 3 })
    expect(far.gaze.x).toBe(1)
  })

  test('goes half-lidded while the secret field is focused', () => {
    const look = resolveLoginBear({ ...idle, hiding: true, typedLength: 4 })
    expect(look.eyeState).toBe('half')
    expect(look.gaze.x).toBe(0)
  })

  test('hiding wins over watching', () => {
    expect(resolveLoginBear({ ...idle, watching: true, hiding: true }).eyeState).toBe('half')
  })

  test('closes the eyes on a failed login regardless of focus', () => {
    const look = resolveLoginBear({ watching: true, hiding: true, oops: true, typedLength: 9 })
    expect(look).toEqual({ eyeState: 'closed', gaze: { x: 0, y: 0 } })
  })
})
