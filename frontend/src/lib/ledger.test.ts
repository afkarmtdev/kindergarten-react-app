import { describe, test, expect } from 'vitest'
import { computeLedgerRows } from './ledger'
import type { FeeRecord } from '@/types'

// Minimal FeeRecord stub
function makeRecord(overrides: Partial<FeeRecord>): FeeRecord {
  return {
    id: 'r1',
    student_id: 's1',
    type: 'tuition',
    description: 'Tuition',
    amount_owed: 0,
    discount_amount: 0,
    amount_paid: 0,
    status: 'unpaid',
    due_date: null,
    created_at: '2025-01-15T00:00:00Z',
    ...overrides,
  } as FeeRecord
}

describe('computeLedgerRows', () => {
  test('returns empty array for no records', () => {
    expect(computeLedgerRows([])).toEqual([])
  })

  test('single unpaid record: charge = owed, balance = owed', () => {
    const rows = computeLedgerRows([
      makeRecord({ amount_owed: 350, amount_paid: 0, discount_amount: 0 }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0].charge).toBe(350)
    expect(rows[0].payment).toBe(0)
    expect(rows[0].running_balance).toBe(350)
  })

  test('single fully paid record: balance = 0', () => {
    const rows = computeLedgerRows([
      makeRecord({ amount_owed: 200, amount_paid: 200, discount_amount: 0 }),
    ])
    expect(rows[0].running_balance).toBe(0)
  })

  test('discount reduces charge', () => {
    const rows = computeLedgerRows([
      makeRecord({ amount_owed: 200, amount_paid: 160, discount_amount: 40 }),
    ])
    expect(rows[0].charge).toBe(160) // 200 - 40
    expect(rows[0].payment).toBe(160)
    expect(rows[0].running_balance).toBe(0)
  })

  test('partial payment leaves positive balance', () => {
    const rows = computeLedgerRows([
      makeRecord({ amount_owed: 300, amount_paid: 100, discount_amount: 0 }),
    ])
    expect(rows[0].running_balance).toBe(200)
  })

  test('running balance accumulates across multiple records', () => {
    const records = [
      makeRecord({
        id: 'r1',
        amount_owed: 100,
        amount_paid: 100,
        discount_amount: 0,
        due_date: '2025-01-01',
      }),
      makeRecord({
        id: 'r2',
        amount_owed: 200,
        amount_paid: 50,
        discount_amount: 0,
        due_date: '2025-02-01',
      }),
      makeRecord({
        id: 'r3',
        amount_owed: 150,
        amount_paid: 0,
        discount_amount: 0,
        due_date: '2025-03-01',
      }),
    ]
    const rows = computeLedgerRows(records)
    expect(rows[0].running_balance).toBe(0) // 100 - 100
    expect(rows[1].running_balance).toBe(150) // 0 + 200 - 50
    expect(rows[2].running_balance).toBe(300) // 150 + 150
  })

  test('records sorted by due_date ascending', () => {
    const records = [
      makeRecord({ id: 'r3', amount_owed: 50, due_date: '2025-03-01' }),
      makeRecord({ id: 'r1', amount_owed: 50, due_date: '2025-01-01' }),
      makeRecord({ id: 'r2', amount_owed: 50, due_date: '2025-02-01' }),
    ]
    const rows = computeLedgerRows(records)
    expect(rows.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
  })

  test('null due_date falls back to created_at for sorting', () => {
    const records = [
      makeRecord({ id: 'rB', due_date: null, created_at: '2025-02-01T00:00:00Z' }),
      makeRecord({ id: 'rA', due_date: null, created_at: '2025-01-01T00:00:00Z' }),
    ]
    const rows = computeLedgerRows(records)
    expect(rows[0].id).toBe('rA')
    expect(rows[1].id).toBe('rB')
  })

  test('due_date sorts before created_at when both present', () => {
    // r1 has an early due_date; r2 has no due_date but an earlier created_at
    const records = [
      makeRecord({
        id: 'r1',
        amount_owed: 100,
        due_date: '2025-01-01',
        created_at: '2025-03-01T00:00:00Z',
      }),
      makeRecord({
        id: 'r2',
        amount_owed: 100,
        due_date: null,
        created_at: '2025-01-15T00:00:00Z',
      }),
    ]
    const rows = computeLedgerRows(records)
    // r1 due_date '2025-01-01' < r2 created_at '2025-01-15...' so r1 comes first
    expect(rows[0].id).toBe('r1')
  })

  test('original records array is not mutated', () => {
    const records = [
      makeRecord({ id: 'r2', due_date: '2025-02-01' }),
      makeRecord({ id: 'r1', due_date: '2025-01-01' }),
    ]
    const original = [records[0].id, records[1].id]
    computeLedgerRows(records)
    expect([records[0].id, records[1].id]).toEqual(original)
  })

  test('closing balance equals last row running_balance', () => {
    const records = [
      makeRecord({ id: 'r1', amount_owed: 100, amount_paid: 60, due_date: '2025-01-01' }),
      makeRecord({ id: 'r2', amount_owed: 80, amount_paid: 80, due_date: '2025-02-01' }),
    ]
    const rows = computeLedgerRows(records)
    const closing = rows.at(-1)?.running_balance ?? 0
    expect(closing).toBe(40) // 100-60=40 carried, then 80-80=0 added → still 40
  })

  test('fully waived record (discount = owed, paid = 0): charge = 0, balance unchanged', () => {
    const rows = computeLedgerRows([
      makeRecord({ amount_owed: 200, amount_paid: 0, discount_amount: 200 }),
    ])
    expect(rows[0].charge).toBe(0)
    expect(rows[0].running_balance).toBe(0)
  })

  test('floating-point: small positive balance stays positive', () => {
    const rows = computeLedgerRows([
      makeRecord({ amount_owed: 100.001, amount_paid: 100, discount_amount: 0 }),
    ])
    expect(rows[0].running_balance).toBeCloseTo(0.001, 5)
  })
})
