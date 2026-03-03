/** Derive the display status of a fee record from its financial fields. */
export function deriveStatus(
  amountOwed: number,
  amountPaid: number,
  discountAmount: number
): string {
  if (discountAmount >= amountOwed - 0.001) return 'waived'
  const net = amountOwed - discountAmount
  if (amountPaid >= net - 0.001) return 'paid'
  if (amountPaid > 0.001) return 'partial'
  return 'unpaid'
}

/** Given a "YYYY-MM" string, return the first and last date of that month. */
export function monthRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split('-')
  const lastDay = new Date(Number(year), Number(mon), 0).getDate()
  return {
    start: `${year}-${mon.padStart(2, '0')}-01`,
    end: `${year}-${mon.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`,
  }
}
