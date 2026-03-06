import { describe, test, expect } from 'vitest'
import { formatOperatingHours } from './formatOperatingHours'
import type { OperatingHours } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CLOSED = { open: '', close: '' }
const FULL = { open: '07:30', close: '18:00' }
const HALF = { open: '07:30', close: '13:00' }

function allDays(hours: { open: string; close: string }): OperatingHours {
  return {
    monday: hours,
    tuesday: hours,
    wednesday: hours,
    thursday: hours,
    friday: hours,
    saturday: hours,
    sunday: hours,
  }
}

// ─── Grouping ─────────────────────────────────────────────────────────────────

describe('formatOperatingHours — grouping', () => {
  test('all 7 days identical → 1 row with Mon – Sun label', () => {
    const rows = formatOperatingHours(allDays(FULL))
    expect(rows).toHaveLength(1)
    expect(rows[0].label).toBe('Mon – Sun')
    expect(rows[0].isClosed).toBe(false)
  })

  test('Mon–Fri same, Sat half-day, Sun closed → 3 rows', () => {
    const hours: OperatingHours = {
      monday: FULL,
      tuesday: FULL,
      wednesday: FULL,
      thursday: FULL,
      friday: FULL,
      saturday: HALF,
      sunday: CLOSED,
    }
    const rows = formatOperatingHours(hours)
    expect(rows).toHaveLength(3)
    expect(rows[0].label).toBe('Mon – Fri')
    expect(rows[1].label).toBe('Sat')
    expect(rows[2].label).toBe('Sun')
  })

  test('mid-week break splits into separate rows', () => {
    const hours: OperatingHours = {
      monday: FULL,
      tuesday: FULL,
      wednesday: HALF, // different
      thursday: FULL,
      friday: FULL,
      saturday: CLOSED,
      sunday: CLOSED,
    }
    const rows = formatOperatingHours(hours)
    expect(rows).toHaveLength(4)
    expect(rows[0].label).toBe('Mon – Tue')
    expect(rows[1].label).toBe('Wed')
    expect(rows[2].label).toBe('Thu – Fri')
    expect(rows[3].label).toBe('Sat – Sun')
  })

  test('all 7 days different → 7 rows with single-day labels', () => {
    const hours: OperatingHours = {
      monday: { open: '07:00', close: '17:00' },
      tuesday: { open: '07:30', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '07:30', close: '18:00' },
      friday: { open: '07:00', close: '18:00' },
      saturday: HALF,
      sunday: CLOSED,
    }
    const rows = formatOperatingHours(hours)
    expect(rows).toHaveLength(7)
    const labels = rows.map((r) => r.label)
    expect(labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  })
})

// ─── isClosed flag ────────────────────────────────────────────────────────────

describe('formatOperatingHours — closed detection', () => {
  test('blank open marks row as closed', () => {
    const rows = formatOperatingHours(allDays({ open: '', close: '18:00' }))
    expect(rows[0].isClosed).toBe(true)
    expect(rows[0].time).toBe('Closed')
  })

  test('blank close marks row as closed', () => {
    const rows = formatOperatingHours(allDays({ open: '07:30', close: '' }))
    expect(rows[0].isClosed).toBe(true)
    expect(rows[0].time).toBe('Closed')
  })

  test('both blank marks row as closed', () => {
    const rows = formatOperatingHours(allDays(CLOSED))
    expect(rows[0].isClosed).toBe(true)
    expect(rows[0].time).toBe('Closed')
  })

  test('open hours are not marked closed', () => {
    const rows = formatOperatingHours(allDays(FULL))
    expect(rows[0].isClosed).toBe(false)
  })
})

// ─── Time formatting ──────────────────────────────────────────────────────────

describe('formatOperatingHours — time formatting', () => {
  test('07:30 – 18:00 formats as 7:30 AM – 6:00 PM', () => {
    const rows = formatOperatingHours(allDays({ open: '07:30', close: '18:00' }))
    expect(rows[0].time).toBe('7:30 AM – 6:00 PM')
  })

  test('12:00 formats as 12:00 PM (noon)', () => {
    const rows = formatOperatingHours(allDays({ open: '12:00', close: '13:00' }))
    expect(rows[0].time).toBe('12:00 PM – 1:00 PM')
  })

  test('00:00 formats as 12:00 AM (midnight)', () => {
    const rows = formatOperatingHours(allDays({ open: '00:00', close: '01:00' }))
    expect(rows[0].time).toBe('12:00 AM – 1:00 AM')
  })

  test('minutes are zero-padded', () => {
    const rows = formatOperatingHours(allDays({ open: '09:05', close: '17:00' }))
    expect(rows[0].time).toContain('9:05 AM')
  })
})
