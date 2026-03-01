/** Strip HTML tags from a string to prevent stored XSS. */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim()
}

/** Apply stripHtml to every string field in a plain object. */
export function sanitiseStrings<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj }
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      ;(result as Record<string, unknown>)[key] = stripHtml(result[key] as string)
    }
  }
  return result
}
