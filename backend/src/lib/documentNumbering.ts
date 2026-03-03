// Pure helpers for document numbering — extracted for testability.
// The route file (routes/documentNumbering.ts) handles DB reads/writes
// and calls these for the actual logic.

export interface DocumentSegment {
  order: number
  type: 'constant' | 'year' | 'month' | 'serial'
  value?: string
  total_chars?: number
  reset_by?: 'no_reset' | 'monthly' | 'yearly'
  start_from?: number
}

/**
 * Determine the next serial number, applying auto-reset when needed.
 *
 * @param currentSerial - The current serial stored in DB
 * @param serialSeg     - The serial segment config (may be undefined if no serial segment)
 * @param lastResetAt   - ISO timestamp of last reset (null if first-ever number)
 * @param now           - Current date
 */
export function resolveNextSerial(
  currentSerial: number,
  serialSeg: DocumentSegment | undefined,
  lastResetAt: string | null,
  now: Date
): number {
  const next = currentSerial + 1

  if (!serialSeg || !serialSeg.reset_by || serialSeg.reset_by === 'no_reset') {
    return next
  }

  if (!lastResetAt) {
    // First-ever number — start from start_from
    return serialSeg.start_from ?? 1
  }

  const lastReset = new Date(lastResetAt)

  if (serialSeg.reset_by === 'monthly') {
    if (now.getFullYear() !== lastReset.getFullYear() || now.getMonth() !== lastReset.getMonth()) {
      return serialSeg.start_from ?? 1
    }
  } else if (serialSeg.reset_by === 'yearly') {
    if (now.getFullYear() !== lastReset.getFullYear()) {
      return serialSeg.start_from ?? 1
    }
  }

  return next
}

/**
 * Assemble a formatted document number from segments.
 *
 * @param segments - Array of segment configs (will be sorted by order)
 * @param serial   - The resolved serial number
 * @param now      - Current date (for year/month segments)
 */
export function assembleNumber(segments: DocumentSegment[], serial: number, now: Date): string {
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')

  let result = ''
  const sorted = [...segments].sort((a, b) => a.order - b.order)
  for (const seg of sorted) {
    if (seg.type === 'constant') result += seg.value ?? ''
    else if (seg.type === 'year') result += year
    else if (seg.type === 'month') result += month
    else if (seg.type === 'serial') result += serial.toString().padStart(seg.total_chars ?? 4, '0')
  }

  return result
}
