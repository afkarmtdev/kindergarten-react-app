import type { Context } from 'hono'

/**
 * Extract the authenticated actor's ID from the Hono context.
 * Admin routes: uses c.get('user').id (Supabase Auth UUID).
 * Portal routes: uses c.get('parentId') (parent UUID).
 * Falls back to null for unauthenticated contexts (e.g. public endpoints).
 */
export function getActor(c: Context): string | null {
  const user = c.get('user') as { id?: string } | undefined
  if (user?.id) return user.id
  const parentId = c.get('parentId') as string | undefined
  if (parentId) return parentId
  return null
}

/** Fields to spread into an INSERT payload. */
export function auditCreate(c: Context) {
  return { created_by: getActor(c) }
}

/** Fields to spread into an UPDATE payload. */
export function auditUpdate(c: Context) {
  return {
    modified_at: new Date().toISOString(),
    modified_by: getActor(c),
  }
}

/** Fields to use when soft-deleting (UPDATE instead of DELETE). */
export function auditDelete(c: Context) {
  return {
    deleted_at: new Date().toISOString(),
    deleted_by: getActor(c),
  }
}

/**
 * Fields to spread into an UPSERT payload.
 * On first insert: created_by is set. On conflict update: modified_at/modified_by are refreshed.
 * Note: on conflict, created_by gets overwritten — acceptable for upsert semantics.
 */
export function auditUpsert(c: Context) {
  return { ...auditCreate(c), ...auditUpdate(c) }
}

/** Supabase filter to exclude soft-deleted rows. Chain onto any .select() query. */
export const notDeleted = { column: 'deleted_at', value: null } as const
