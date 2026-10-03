// Cursor pagination for GET /students/:id/timeline — pure, tested in timeline.test.ts.
//
// Events run newest day first. Events on the same day keep a fixed order (source order, then
// each source's own DB order with an id tie-break), so a page can safely end part-way through
// a day. The cursor "<date>|<n>" means: continue from <date>, skipping the first <n> events of
// that date, which earlier pages already showed. A plain "<date>" (the old format) means
// everything strictly before <date>.

export type TimelineEvent = { type: string; date: string; title: string; subtitle?: string }
export type TimelineCursor = { date: string; skip: number }

/** Matches both cursor formats; use it to validate the `before` query param. */
export const TIMELINE_CURSOR_RE = /^\d{4}-\d{2}-\d{2}(\|\d+)?$/

/** 'YYYY-MM-DD' shifted by whole days (UTC, so no DST drift). */
export function shiftDay(date: string, days: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000
  return new Date(ms).toISOString().slice(0, 10)
}

export function parseTimelineCursor(before: string | undefined): TimelineCursor | null {
  if (!before) return null
  const [date, skip] = before.split('|')
  if (skip === undefined) return { date: shiftDay(date, -1), skip: 0 }
  return { date, skip: Number(skip) }
}

/**
 * One page of events from all sources merged. Each source must have been fetched with at most
 * `limit + 1 + cursor.skip` rows on or before the cursor date; that is enough for the page to be
 * exact, because a source cut short already fills the page with its own rows.
 */
export function pageTimeline(
  events: TimelineEvent[],
  limit: number,
  cursor: TimelineCursor | null
): { events: TimelineEvent[]; has_more: boolean; next_cursor?: string } {
  // Stable sort: same-day events keep the order they were pushed in
  const sorted = events
    .filter((e) => e.date && (!cursor || e.date <= cursor.date))
    .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))

  // The cursor day comes first after sorting; drop the part of it already shown
  let dropped = 0
  const remaining = sorted.filter((e) => {
    if (cursor && dropped < cursor.skip && e.date === cursor.date) {
      dropped++
      return false
    }
    return true
  })

  const page = remaining.slice(0, limit)
  const last = page[page.length - 1]
  if (!last) return { events: page, has_more: false }

  const shownBefore = cursor && cursor.date === last.date ? cursor.skip : 0
  const shownOnLastDay = page.filter((e) => e.date === last.date).length + shownBefore
  return {
    events: page,
    has_more: remaining.length > limit,
    next_cursor: `${last.date}|${shownOnLastDay}`,
  }
}
