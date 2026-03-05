import type { DayKey, OperatingHours } from '@/types'

const DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

// Short day labels — used in the compact grouped display
const DAY_SHORT: Record<DayKey, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export interface HoursRow {
  label: string // e.g. "Mon – Fri" or "Wed"
  time: string // e.g. "7:30 AM – 6:00 PM" or "Closed"
  isClosed: boolean
}

/**
 * Groups consecutive days with identical open/close times into ranges.
 * Days with blank open/close are labelled "Closed".
 *
 * Example output:
 *   Mon – Fri   7:30 AM – 6:00 PM
 *   Sat         7:30 AM – 1:00 PM
 *   Sun         Closed
 *
 * If Wednesday differs:
 *   Mon – Tue   7:30 AM – 6:00 PM
 *   Wed         7:30 AM – 3:00 PM
 *   Thu – Fri   7:30 AM – 6:00 PM
 *   Sat         7:30 AM – 1:00 PM
 *   Sun         Closed
 */
export function formatOperatingHours(hours: OperatingHours): HoursRow[] {
  type Group = { days: DayKey[]; open: string; close: string }
  const groups: Group[] = []

  for (const day of DAY_ORDER) {
    const { open = '', close = '' } = hours[day] ?? {}
    const timeKey = `${open}|${close}`
    const last = groups[groups.length - 1]
    const lastKey = last ? `${last.open}|${last.close}` : null

    if (last && timeKey === lastKey) {
      last.days.push(day)
    } else {
      groups.push({ days: [day], open, close })
    }
  }

  return groups.map(({ days, open, close }) => {
    const first = DAY_SHORT[days[0]]
    const last = DAY_SHORT[days[days.length - 1]]
    const label = days.length === 1 ? first : `${first} – ${last}`
    const isClosed = !open || !close
    const time = isClosed ? 'Closed' : `${formatTime(open)} – ${formatTime(close)}`
    return { label, time, isClosed }
  })
}
