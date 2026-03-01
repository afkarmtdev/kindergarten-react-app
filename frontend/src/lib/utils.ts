/**
 * Returns true if today's month and day match the given date string (YYYY-MM-DD).
 * Uses integer comparison to avoid timezone-shift issues with `new Date(dob)`.
 */
export function isBirthdayToday(dob: string): boolean {
  if (!dob) return false
  const today = new Date()
  const [, month, day] = dob.split('-')
  return parseInt(month, 10) === today.getMonth() + 1 && parseInt(day, 10) === today.getDate()
}
