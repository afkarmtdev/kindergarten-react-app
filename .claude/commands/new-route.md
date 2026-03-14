TRIGGER when: user asks to create a new backend route, add an API endpoint, or build a new backend module.

# new-route — Scaffold a Backend Route

Resource: $ARGUMENTS

Work through every step in order.

## Step 1 — Create the Route File

Create `backend/src/routes/<resource>.ts`.

Required imports:

```ts
import { Hono } from 'hono'
import { supabase } from '../db/supabase'
import { sanitiseStrings } from '../lib/sanitise'
import { auditCreate, auditUpdate, auditDelete } from '../lib/audit'
// For upsert routes, also import: auditUpsert
```

## Step 2 — Paginated List Response Shape

All list endpoints return this exact shape — never deviate:

```json
{
  "data": [...],
  "meta": { "total": 100, "page": 1, "limit": 12, "totalPages": 9 }
}
```

Implementation pattern:

```ts
const page = parseInt(c.req.query('page') || '1')
const limit = parseInt(c.req.query('limit') || '12')
const from = (page - 1) * limit
const to = from + limit - 1

const { data, count } = await supabase
  .from('table')
  .select('*', { count: 'exact' })
  .is('deleted_at', null) // exclude soft-deleted rows
  .range(from, to)

return c.json({
  data,
  meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
})
```

## Step 2.5 — Audit Trail & Soft Delete (Required)

All CRUD operations must use audit helpers from `backend/src/lib/audit.ts`:

```ts
// CREATE — spread auditCreate(c) to set created_by (user UUID)
await supabase.from('table').insert({ ...clean, ...auditCreate(c) })

// UPDATE — spread auditUpdate(c) to set modified_at + modified_by
await supabase
  .from('table')
  .update({ ...clean, ...auditUpdate(c) })
  .eq('id', id)

// UPSERT — spread auditUpsert(c) to set both create + update fields
await supabase.from('table').upsert({ ...clean, ...auditUpsert(c) }, { onConflict: '...' })

// SOFT DELETE — never use .delete(); update with auditDelete(c) instead
await supabase.from('table').update(auditDelete(c)).eq('id', id).is('deleted_at', null)
```

Rules:

- **Every SELECT query** on a soft-deletable table must include `.is('deleted_at', null)`
- DELETE handlers return `{ message: 'Resource deleted' }` (same 200 response, just no physical removal)
- Guard soft-delete with `.is('deleted_at', null)` to prevent re-deleting already-deleted records
- Exceptions (no soft-delete): `parent_sessions`, `attendance`, config tables (`document_numbering`, `school_info`)

## Step 3 — Input Sanitisation (Required on Every POST/PUT)

```ts
const body = await c.req.json()
const clean = sanitiseStrings(body)
// For HTML content fields only (e.g. gallery caption): stripHtml(field)
```

Never pass raw request body to Supabase.

## Step 4 — Error Handling

No `console.log` in route files. Return error responses:

```ts
try {
  // ...
} catch (_err) {
  return c.json({ error: 'Failed to process request' }, 500)
}
```

## Step 5 — Register in index.ts

```ts
// In backend/src/index.ts
import resourceRoutes from './routes/resource'
app.route('/api/resource', resourceRoutes)
```

Register AFTER the `app.use('/api/*', authMiddleware)` line — this protects the route automatically.

**Public routes** (no auth needed): register BEFORE the authMiddleware line, prefix with `/api/public/`:

```ts
app.get('/api/public/resource', handler) // before authMiddleware
app.use('/api/*', authMiddleware) // authMiddleware line
```

Use `publicApi` (no-auth Axios instance in `frontend/src/lib/api.ts`) to call public endpoints from the frontend.

## Step 6 — Unit Tests

If the route has pure helper functions (status derivation, date calculations, formatting, validation logic), extract them into `backend/src/lib/<resource>.ts` and create `backend/src/lib/<resource>.test.ts`.

```ts
// backend/src/lib/<resource>.test.ts
import { describe, test, expect } from 'bun:test'
import { helperFunction } from './<resource>'

describe('helperFunction', () => {
  test('describes expected behaviour', () => {
    expect(helperFunction(input)).toBe(expectedOutput)
  })
})
```

Rules:

- Import from `bun:test` (backend uses Bun's built-in runner)
- Test file lives next to the source file in `lib/`
- Cover all branches: happy path, edge cases, boundary values, error cases
- Run `bun run test:backend` to verify before committing

## Step 7 — Integration Tests

Create `backend/src/routes/<resource>.test.ts` to test the HTTP request/response cycle with a mocked database.

```ts
// backend/src/routes/<resource>.test.ts
import { describe, test, expect, beforeEach, mock } from 'bun:test'
import {
  mockSupabase,
  setMockResponse,
  clearMockResponses,
} from '../test-utils/mockSupabase'

// Replace real Supabase BEFORE route is imported
mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import resource from './<resource>'

beforeEach(() => clearMockResponses())

describe('GET / — list', () => {
  test('returns paginated response', async () => {
    setMockResponse('<table>', { data: [...], error: null, count: 2 })
    const res = await resource.request('/?page=1&limit=9')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.meta.total).toBe(2)
  })
})
```

Cover at minimum:

- List (paginated shape, empty data, DB error)
- Pagination (defaults, custom page/limit in meta, totalPages rounds up, limit above max → 400, page < 1 → 400)
- GET by ID (found, not found)
- POST (valid body → 201, missing fields → 400, DB error → 500)
- PUT (update, partial update)
- DELETE / soft-delete (success message, DB error)

**Test setup**: mock user must include `id` for audit trail:

```ts
app.use('*', async (c, next) => {
  c.set('user' as never, { id: 'user-1', email: 'test@example.com' })
  await next()
})
```

Pagination test template (adjust default/max per route):

```ts
describe('GET / — pagination', () => {
  test('defaults to page 1, limit <DEFAULT>', async () => {
    setMockResponse('<table>', { data: [], error: null, count: 0 })
    const res = await resource.request('/')
    const json = await res.json()
    expect(json.meta.page).toBe(1)
    expect(json.meta.limit).toBe(<DEFAULT>)
  })

  test('custom page and limit reflected in meta', async () => {
    setMockResponse('<table>', { data: [], error: null, count: 50 })
    const res = await resource.request('/?page=3&limit=10')
    const json = await res.json()
    expect(json.meta).toEqual({ total: 50, page: 3, limit: 10, totalPages: 5 })
  })

  test('totalPages rounds up', async () => {
    setMockResponse('<table>', { data: [], error: null, count: 25 })
    const res = await resource.request('/?limit=10')
    const json = await res.json()
    expect(json.meta.totalPages).toBe(3)
  })

  test('rejects limit above max (<MAX>)', async () => {
    const res = await resource.request('/?limit=<MAX+1>')
    expect(res.status).toBe(400)
  })

  test('rejects page < 1', async () => {
    const res = await resource.request('/?page=0')
    expect(res.status).toBe(400)
  })
})
```

## Security — Already Global

These are applied to every response in `index.ts` — do NOT re-add them in route files:

- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, etc.)
- CORS middleware

Rate limiting is only on the login route (`routes/auth.ts`) — do not add it elsewhere unless specifically requested.
