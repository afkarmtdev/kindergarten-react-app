// Helpers for parent_students rows read through nested selects.
// Unlinking soft-deletes the parent_students row and deleting a parent or student
// soft-deletes that row, but nested selects return them all, so they are skipped here.

type SoftDeleted = { deleted_at?: string | null }

export type ParentLink<P> = SoftDeleted & {
  created_at?: string | null
  parents?: (P & SoftDeleted) | null
}

/**
 * The parent shown for a student, from `parent_students(created_at, deleted_at, parents(..., deleted_at))`:
 * the earliest live link whose parent is not deleted, without its deleted_at; null if none.
 * Earliest-first keeps every screen (and the student form) on the same parent when there are several.
 */
export function activeParent<P extends object>(
  links: ParentLink<P>[] | null | undefined
): Omit<P, 'deleted_at'> | null {
  if (!Array.isArray(links)) return null
  const live = links
    .filter((link) => !link.deleted_at && link.parents && !link.parents.deleted_at)
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
  if (!live[0]?.parents) return null
  const { deleted_at: _deletedAt, ...parent } = live[0].parents
  return parent
}

/**
 * True when a live parent_students row points at a student that is not deleted.
 * Takes `students` as unknown because untyped supabase-js infers nested selects as arrays
 * even for many-to-one joins, which return a single object.
 */
export function hasLiveStudent(link: { deleted_at?: unknown; students?: unknown }): boolean {
  const student = link.students as SoftDeleted | null | undefined
  return !link.deleted_at && !!student && !student.deleted_at
}
