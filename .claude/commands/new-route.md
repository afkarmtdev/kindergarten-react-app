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
  .range(from, to)

return c.json({
  data,
  meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
})
```

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
app.use('/api/*', authMiddleware)         // authMiddleware line
```

Use `publicApi` (no-auth Axios instance in `frontend/src/lib/api.ts`) to call public endpoints from the frontend.

## Security — Already Global

These are applied to every response in `index.ts` — do NOT re-add them in route files:
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, etc.)
- CORS middleware

Rate limiting is only on the login route (`routes/auth.ts`) — do not add it elsewhere unless specifically requested.
