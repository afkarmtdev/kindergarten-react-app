import { describe, test, expect } from 'vitest'
import {
  CURTAIN_HANDOFF_KEY,
  clearCurtainHandoff,
  hasCurtainHandoff,
  isCurtainPath,
  markCurtainHandoff,
} from './reloadCurtain'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  }
}

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

describe('isCurtainPath', () => {
  test('the landing page and the admin app get the curtain', () => {
    expect(isCurtainPath('/')).toBe(true)
    expect(isCurtainPath('')).toBe(true)
    expect(isCurtainPath('/admin')).toBe(true)
    expect(isCurtainPath('/admin/login')).toBe(true)
    expect(isCurtainPath('/admin/students/abc')).toBe(true)
  })

  test('the portal and unknown paths keep the plain reload', () => {
    expect(isCurtainPath('/portal')).toBe(false)
    expect(isCurtainPath('/portal/login')).toBe(false)
    expect(isCurtainPath('/administrator')).toBe(false)
  })
})

describe('markCurtainHandoff', () => {
  test('writes the flag', () => {
    const storage = memoryStorage()
    markCurtainHandoff(storage)
    expect(storage.data.get(CURTAIN_HANDOFF_KEY)).toBe('1')
  })

  test('swallows storage errors and missing storage', () => {
    expect(() => markCurtainHandoff(throwingStorage)).not.toThrow()
    expect(() => markCurtainHandoff(undefined)).not.toThrow()
  })
})

describe('hasCurtainHandoff', () => {
  test('true while the flag is present, and reading does not consume it', () => {
    const storage = memoryStorage({ [CURTAIN_HANDOFF_KEY]: '1' })
    expect(hasCurtainHandoff(storage)).toBe(true)
    // StrictMode calls a useState initializer twice: both must agree
    expect(hasCurtainHandoff(storage)).toBe(true)
  })

  test('false when the flag is absent or has another value', () => {
    expect(hasCurtainHandoff(memoryStorage())).toBe(false)
    expect(hasCurtainHandoff(memoryStorage({ [CURTAIN_HANDOFF_KEY]: 'yes' }))).toBe(false)
  })

  test('false when storage throws or is missing', () => {
    expect(hasCurtainHandoff(throwingStorage)).toBe(false)
    expect(hasCurtainHandoff(undefined)).toBe(false)
  })
})

describe('clearCurtainHandoff', () => {
  test('removes the flag', () => {
    const storage = memoryStorage({ [CURTAIN_HANDOFF_KEY]: '1' })
    clearCurtainHandoff(storage)
    expect(storage.data.has(CURTAIN_HANDOFF_KEY)).toBe(false)
    expect(hasCurtainHandoff(storage)).toBe(false)
  })

  test('swallows storage errors and missing storage', () => {
    expect(() => clearCurtainHandoff(throwingStorage)).not.toThrow()
    expect(() => clearCurtainHandoff(undefined)).not.toThrow()
  })
})
