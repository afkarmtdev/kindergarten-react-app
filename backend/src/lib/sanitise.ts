/** Strip HTML tags from a string to prevent stored XSS. */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim()
}

/** Recursively strip HTML from every string in a value (object, array, or primitive). */
function sanitiseDeep(value: unknown): unknown {
  if (typeof value === 'string') return stripHtml(value)
  if (Array.isArray(value)) return value.map(sanitiseDeep)
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value)) {
      result[key] = sanitiseDeep((value as Record<string, unknown>)[key])
    }
    return result
  }
  return value
}

/** Apply stripHtml to every string field in a plain object, recursively including nested objects and arrays. */
export function sanitiseStrings<T extends Record<string, unknown>>(obj: T): T {
  return sanitiseDeep(obj) as T
}
