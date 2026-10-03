// Builds the PostgREST `or` filter for a list page's free-text search — tested in search.test.ts.
//
// Interpolating the raw search into `.or()` breaks on PostgREST's reserved characters: a search
// like "Ali, Abu" or "Rose (2026)" split the filter and the list request failed. Double-quoting
// the value is PostgREST's way to keep , . : ( ) literal; " and \ inside it are backslash-escaped.

/** `col1.ilike."%search%",col2.ilike."%search%"` for `query.or(...)`. */
export function orIlike(columns: string[], search: string): string {
  const quoted = `"%${search.replace(/["\\]/g, '\\$&')}%"`
  return columns.map((column) => `${column}.ilike.${quoted}`).join(',')
}
