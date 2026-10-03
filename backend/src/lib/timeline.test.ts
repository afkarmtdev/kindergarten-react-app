import { describe, test, expect } from 'bun:test'
import {
  pageTimeline,
  parseTimelineCursor,
  shiftDay,
  TIMELINE_CURSOR_RE,
  type TimelineEvent,
} from './timeline'

const ev = (date: string, title: string, type = 'attendance'): TimelineEvent => ({
  type,
  date,
  title,
})

describe('shiftDay', () => {
  test('moves across month and year ends', () => {
    expect(shiftDay('2026-02-28', 1)).toBe('2026-03-01')
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('parseTimelineCursor', () => {
  test('no cursor on the first page', () => {
    expect(parseTimelineCursor(undefined)).toBeNull()
  })

  test('"date|n" continues from that date, skipping n events', () => {
    expect(parseTimelineCursor('2026-03-09|2')).toEqual({ date: '2026-03-09', skip: 2 })
  })

  test('a plain date (old format) means strictly before it', () => {
    expect(parseTimelineCursor('2026-03-01')).toEqual({ date: '2026-02-28', skip: 0 })
  })

  test('the validation regex accepts both formats only', () => {
    expect(TIMELINE_CURSOR_RE.test('2026-03-01')).toBe(true)
    expect(TIMELINE_CURSOR_RE.test('2026-03-01|3')).toBe(true)
    expect(TIMELINE_CURSOR_RE.test('2026-03-01|')).toBe(false)
    expect(TIMELINE_CURSOR_RE.test('yesterday')).toBe(false)
  })
})

describe('pageTimeline', () => {
  test('sorts newest first and keeps same-day events in source order', () => {
    const { events } = pageTimeline(
      [
        ev('2026-03-01', 'a1'),
        ev('2026-03-02', 'p1', 'portfolio'),
        ev('2026-03-02', 'd1', 'daily'),
      ],
      10,
      null
    )
    expect(events.map((e) => e.title)).toEqual(['p1', 'd1', 'a1'])
  })

  test('a page ending part-way through a day records how many of that day were shown', () => {
    const all = [
      ev('2026-03-02', 'x'),
      ev('2026-03-01', 'a'),
      ev('2026-03-01', 'b'),
      ev('2026-03-01', 'c'),
    ]
    const first = pageTimeline(all, 2, null)
    expect(first.events.map((e) => e.title)).toEqual(['x', 'a'])
    expect(first.has_more).toBe(true)
    expect(first.next_cursor).toBe('2026-03-01|1')
  })

  test('the next page picks up the rest of that day instead of skipping it', () => {
    const all = [
      ev('2026-03-02', 'x'),
      ev('2026-03-01', 'a'),
      ev('2026-03-01', 'b'),
      ev('2026-03-01', 'c'),
    ]
    const second = pageTimeline(all, 2, parseTimelineCursor('2026-03-01|1'))
    expect(second.events.map((e) => e.title)).toEqual(['b', 'c'])
    expect(second.has_more).toBe(false)
    expect(second.next_cursor).toBe('2026-03-01|3')
  })

  test('walking every page shows each event exactly once', () => {
    const all = [
      ev('2026-03-03', '1'),
      ev('2026-03-02', '2'),
      ev('2026-03-02', '3'),
      ev('2026-03-02', '4'),
      ev('2026-03-02', '5'),
      ev('2026-03-01', '6'),
      ev('2026-02-28', '7'),
    ]
    const seen: string[] = []
    let cursor: string | undefined
    for (let guard = 0; guard < 10; guard++) {
      const page = pageTimeline(all, 2, parseTimelineCursor(cursor))
      seen.push(...page.events.map((e) => e.title))
      if (!page.has_more) break
      cursor = page.next_cursor
    }
    expect(seen).toEqual(['1', '2', '3', '4', '5', '6', '7'])
  })

  test('leaves out events after the cursor day and events without a date', () => {
    const { events } = pageTimeline(
      [ev('2026-03-05', 'later'), ev('', 'undated'), ev('2026-03-01', 'kept')],
      10,
      { date: '2026-03-02', skip: 0 }
    )
    expect(events.map((e) => e.title)).toEqual(['kept'])
  })

  test('an empty page has no cursor and no more pages', () => {
    expect(pageTimeline([], 20, null)).toEqual({ events: [], has_more: false })
  })
})
