TRIGGER when: user asks to add a new portal page, portal tab, parent portal section, or build a new page inside the /portal/\* route tree.

# portal-page — Build a Parent Portal Page

Page description: $ARGUMENTS

Work through every step in order.

---

## Architecture Overview

Portal pages are **read-only** views for parents. They differ from admin pages:

| Aspect       | Admin Pages                 | Portal Pages                          |
| ------------ | --------------------------- | ------------------------------------- |
| Auth         | `useAuth()` — Supabase user | `useParentAuth()` — parent + children |
| Data scoping | All records                 | Only selected child's records         |
| Layout       | Sidebar (`AdminLayout`)     | Tab bar (`PortalLayout`)              |
| State        | Zustand stores              | Local `useState` (simpler)            |
| Mutations    | Full CRUD                   | None (read-only)                      |
| Styling      | Desktop-first responsive    | Mobile-first (`max-w-lg mx-auto`)     |

---

## Step 1 — Backend: Portal Endpoint

Add to `backend/src/routes/portal.ts`:

```ts
// GET /api/portal/<resource>
portal.get('/<resource>', async (c) => {
  const parentChildIds = c.get('parentChildIds') as string[]
  const studentId = c.req.query('student_id')

  // Validate student_id belongs to this parent's children
  if (studentId && !parentChildIds.includes(studentId)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  const targetId = studentId || parentChildIds[0]
  if (!targetId) return c.json({ error: 'No linked children' }, 400)

  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? 20)))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('<table>')
    .select('*', { count: 'exact' })
    .eq('student_id', targetId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return c.json({ error: error.message }, 500)

  return c.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
  })
})
```

Key rules:

- **Always validate `student_id`** against `parentChildIds` — never trust client-supplied IDs
- Fall back to first child if no `student_id` provided
- Include `.is('deleted_at', null)` on all soft-deletable tables
- Return paginated response shape (same as admin endpoints)
- No mutations — portal routes are read-only

---

## Step 2 — Frontend: API Method

Add to `portalDataApi` in `frontend/src/lib/api.ts`:

```ts
get<Resource>: (params?: { page?: number; limit?: number; student_id?: string }) =>
  portalApi.get('/api/portal/<resource>', { params }).then((r) => r.data),
```

The `portalApi` axios instance automatically adds the `portal_token` from localStorage.

---

## Step 3 — Frontend: Page Component

Create `frontend/src/pages/portal/Portal<Resource>Page.tsx`:

### Imports

```tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SomeIcon } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { ResourceType } from '../../types'
```

### Component Structure

```tsx
export default function Portal<Resource>Page() {
  usePageTitle('<Page Title>')
  const { selectedChild } = useParentAuth()
  const t = useT()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['portal-<resource>', selectedChild?.id, { page }],
    queryFn: () =>
      portalDataApi.get<Resource>({ page, limit: 20, student_id: selectedChild?.id }),
    enabled: !!selectedChild,  // don't fetch until a child is selected
  })

  const records = (data?.data as ResourceType[] | undefined) ?? []
  const meta = data?.meta

  return (
    <div className="max-w-lg mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-kinder-<color>/10 rounded-xl flex items-center justify-center">
          <SomeIcon size={16} className="text-kinder-<color>" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          {t('<pageTitle>')}
        </h1>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-shimmer bg-[length:200%_100%]" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && records.length === 0 && (
        <div className="text-center py-12">
          <SomeIcon size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('noRecordsFound')}</p>
        </div>
      )}

      {/* Records list */}
      {!isLoading && records.length > 0 && (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
            >
              {/* Record content */}
            </div>
          ))}
        </div>
      )}

      {/* Simple pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40"
          >
            {t('previous')}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## Step 4 — Status Badges (common pattern)

Portal pages frequently display status badges. Define icon/color maps at the top of the file:

```tsx
const STATUS_ICON: Record<string, LucideIcon> = {
  present: CalendarCheck2,
  absent: CalendarX2,
  // ...
}

const STATUS_COLOR: Record<string, string> = {
  present: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  absent: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  // ...
}
```

Badge component:

```tsx
function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICON[status]
  const color = STATUS_COLOR[status] ?? 'text-gray-500 bg-gray-50 dark:bg-gray-800'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {Icon && <Icon size={12} />}
      {status}
    </span>
  )
}
```

---

## Step 5 — Register the Route

In `frontend/src/App.tsx`, add inside the portal `<Route>` tree:

```tsx
<Route path="/portal" element={<PortalLayout />}>
  <Route index element={<PortalDashboardPage />} />
  {/* existing tabs... */}
  <Route path="<resource>" element={<Portal<Resource> Page />} />
</Route>
```

Portal pages are lazy-loaded:

```tsx
const Portal<Resource>Page = lazy(() => import('@/pages/portal/Portal<Resource>Page'))
```

---

## Step 6 — Add Tab to PortalLayout

In `frontend/src/pages/portal/PortalLayout.tsx`, add to the navigation tabs array:

```tsx
{ path: '/portal/<resource>', label: t('<resourceLabel>'), icon: SomeIcon }
```

The tab bar renders at the bottom on mobile (`fixed bottom-0`) and horizontally on desktop.

---

## Step 7 — Translations

Add to BOTH `en` and `ms` in `frontend/src/lib/translations.ts`:

- Page title key
- Empty state message
- Any status labels specific to this resource

---

## Design Rules

- **Container**: `max-w-lg mx-auto` — narrow, phone-optimized width
- **Padding**: `p-4 md:p-6` on the page container (PortalLayout provides outer padding)
- **Cards**: `bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800`
- **Spacing**: `space-y-3` between cards
- **Typography**: `text-sm` for content, `text-lg font-bold` for headers
- **No Zustand** — portal pages use local `useState` for pagination (simpler, no cross-page state needed)
- **No mutations** — portal is read-only. No edit/delete buttons, no modals, no optimistic updates.
- **`enabled: !!selectedChild`** — all queries must wait for child selection (parent might have multiple children)
- **Currency**: use inline `formatRM()` — `RM ${n.toFixed(2)}`
- **Dates**: use native `toLocaleDateString('en-MY', { ... })` — no date-fns in portal pages

---

## Gotchas

- **Child switcher**: `PortalLayout` renders a dropdown when parent has multiple children. When the selected child changes, all queries re-fetch automatically (cache key includes `selectedChild?.id`).
- **Query key must include `selectedChild?.id`** — otherwise switching children shows stale data from the previous child.
- **`portalDataApi` vs `portalAuthApi`** — use `portalDataApi` for data endpoints, `portalAuthApi` only for login/logout.
- **No `ErrorBoundary` wrapper** — portal pages handle their own errors (empty states, loading skeletons). The portal layout doesn't use ErrorBoundary like admin pages.
- **Dashboard summary** — if the new page's data should appear on `PortalDashboardPage`, also add a summary query there (latest 1-3 records, compact card).

---

## Existing Portal Pages (Reference)

| Page          | File                          | Query Key              | Data Source                     |
| ------------- | ----------------------------- | ---------------------- | ------------------------------- |
| Dashboard     | `PortalDashboardPage.tsx`     | multiple               | aggregates from all tabs        |
| Attendance    | `PortalAttendancePage.tsx`    | `portal-attendance`    | `GET /api/portal/attendance`    |
| Fees          | `PortalFeesPage.tsx`          | `portal-fees`          | `GET /api/portal/fees`          |
| Announcements | `PortalAnnouncementsPage.tsx` | `portal-announcements` | `GET /api/portal/announcements` |
| Daily Reports | `PortalDailyReportPage.tsx`   | `portal-daily-reports` | `GET /api/portal/daily-reports` |
| Portfolio     | `PortalPortfolioPage.tsx`     | `portal-portfolio`     | `GET /api/portal/portfolio`     |
