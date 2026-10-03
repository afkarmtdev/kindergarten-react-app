import type { User } from '@supabase/supabase-js'

// Types for the values middleware puts on the Hono context, so c.get() / c.set() are checked
declare module 'hono' {
  interface ContextVariableMap {
    user: User // middleware/auth.ts (admin routes)
    parentId: string // middleware/parentAuth.ts (portal routes)
    parentChildIds: string[] // middleware/parentAuth.ts: linked, non-deleted children
  }
}
