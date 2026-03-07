import type { FeeRecord } from '@/types'

export interface LedgerRow extends FeeRecord {
  charge: number
  payment: number
  running_balance: number
}

/**
 * Sort fee records by due_date (falling back to created_at) and compute a
 * running balance. Returns one LedgerRow per record with charge, payment, and
 * running_balance fields appended.
 */
export function computeLedgerRows(records: FeeRecord[]): LedgerRow[] {
  const sorted = [...records].sort((a, b) => {
    const da = (a.due_date ?? a.created_at ?? '').slice(0, 10)
    const db = (b.due_date ?? b.created_at ?? '').slice(0, 10)
    return da.localeCompare(db)
  })

  let runningBalance = 0
  return sorted.map((r) => {
    const charge = Number(r.amount_owed) - Number(r.discount_amount)
    const payment = Number(r.amount_paid)
    runningBalance = runningBalance + charge - payment
    return { ...r, charge, payment, running_balance: runningBalance }
  })
}
