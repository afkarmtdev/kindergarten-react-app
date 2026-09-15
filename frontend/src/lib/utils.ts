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

/**
 * Splits "Meet the team" into ["Meet the ", "team"] so a heading's last word
 * can carry an accent. A single word comes back as ["", word].
 */
export function splitLastWord(title: string): [string, string] {
  const idx = title.lastIndexOf(' ')
  return idx === -1 ? ['', title] : [title.slice(0, idx + 1), title.slice(idx + 1)]
}
