import { describe, test, expect } from 'bun:test'
import { activeParent, hasLiveStudent } from './parentLinks'

const abu = { full_name: 'Abu', email: 'abu@test.com', phone: '012' }
const siti = { full_name: 'Siti', email: 'siti@test.com', phone: '013' }

describe('activeParent', () => {
  test('returns null for missing or empty links', () => {
    expect(activeParent(undefined)).toBeNull()
    expect(activeParent(null)).toBeNull()
    expect(activeParent([])).toBeNull()
  })

  test('returns the linked parent without deleted_at', () => {
    expect(activeParent([{ deleted_at: null, parents: { ...abu, deleted_at: null } }])).toEqual(abu)
  })

  test('skips an unlinked parent and returns the next live one', () => {
    const links = [
      { deleted_at: '2026-10-01T00:00:00Z', parents: { ...abu, deleted_at: null } },
      { deleted_at: null, parents: { ...siti, deleted_at: null } },
    ]
    expect(activeParent(links)).toEqual(siti)
  })

  test('skips a deleted parent even when the link is live', () => {
    const links = [{ deleted_at: null, parents: { ...abu, deleted_at: '2026-10-01T00:00:00Z' } }]
    expect(activeParent(links)).toBeNull()
  })

  test('skips a link whose parent did not join', () => {
    expect(activeParent([{ deleted_at: null, parents: null }])).toBeNull()
  })

  test('treats links without deleted_at fields as live', () => {
    expect(activeParent([{ parents: abu }])).toEqual(abu)
  })
})

describe('activeParent — several live parents', () => {
  test('picks the earliest link, whatever order the rows come in', () => {
    const links = [
      {
        created_at: '2026-05-01T00:00:00Z',
        deleted_at: null,
        parents: { ...siti, deleted_at: null },
      },
      {
        created_at: '2026-01-01T00:00:00Z',
        deleted_at: null,
        parents: { ...abu, deleted_at: null },
      },
    ]
    expect(activeParent(links)).toEqual(abu)
  })
})

describe('hasLiveStudent', () => {
  test('true for a live link to a live student', () => {
    expect(hasLiveStudent({ deleted_at: null, students: { deleted_at: null } })).toBe(true)
  })

  test('false when the student is soft-deleted', () => {
    expect(hasLiveStudent({ deleted_at: null, students: { deleted_at: '2026-10-01' } })).toBe(false)
  })

  test('false when the link itself is unlinked', () => {
    expect(hasLiveStudent({ deleted_at: '2026-10-01', students: { deleted_at: null } })).toBe(false)
  })

  test('false when the student did not join', () => {
    expect(hasLiveStudent({ deleted_at: null, students: null })).toBe(false)
  })

  test('link rows selected without deleted_at count as live', () => {
    expect(hasLiveStudent({ students: { deleted_at: null } })).toBe(true)
  })
})
