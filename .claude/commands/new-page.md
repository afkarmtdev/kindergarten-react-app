TRIGGER when: user asks to add a new admin page, scaffold a page, create a new section in the admin panel, or add a new list view.

# new-page — Scaffold an Admin List Page

Resource: $ARGUMENTS

Work through every step in order. Do not skip any.

## Step 1 — Zustand Store

Create `frontend/src/store/<resource>Store.ts`:

```ts
import { create } from 'zustand'

interface <Resource>Store {
  page: number
  search: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
  // add modal state, filters as needed
}

export const use<Resource>Store = create<<Resource>Store>((set) => ({
  page: 1,
  search: '',
  setPage: (page) => set({ page }),
  setSearch: (search) => set({ page: 1, search }), // always reset page on search change
}))
```

Filters (classFilter, statusFilter, etc.) must also reset `page` to 1.

## Step 2 — Page Component

Create `frontend/src/pages/<Resource>Page.tsx`. Checklist:

- [ ] `usePageTitle('<Label>')` at the very top of the component
- [ ] Pull UI state from Zustand store
- [ ] React Query `useQuery` with key `['resource', { page, search, ...filters }]`
- [ ] `placeholderData: (prev) => prev` on the query — prevents flash between pages
- [ ] `<SearchBar />` — `className="w-full md:w-72"`
- [ ] `<Pagination />` — fed from `meta.total`, `meta.page`, `meta.limit`, `meta.totalPages`
- [ ] Skeleton (`isLoading`): render skeleton rows/cards instead of real content
- [ ] Dim (`isFetching && !isLoading`): wrap content with `opacity-60 pointer-events-none`
- [ ] All mutations: `onSuccess` → `queryClient.invalidateQueries` + `toast.success`; `onError` → `toast.error`

## Step 3 — Layout Structure

```tsx
<div className="p-4 md:p-8">
  {/* Header row */}
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
      {t('pageTitle')}
    </h1>
    <button className="w-full md:w-auto bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold">
      {t('addSomething')}
    </button>
  </div>

  {/* Search + filters */}
  <SearchBar value={search} onChange={setSearch} className="w-full md:w-72 mb-6" />

  {/* Content */}
  <div className={isFetching && !isLoading ? 'opacity-60 pointer-events-none' : ''}>
    {isLoading ? <SkeletonComponent /> : /* real content */}
  </div>

  <Pagination ... />
</div>
```

## Step 4 — Dark Mode

Every color class needs a `dark:` pair. No exceptions.

| Light | Dark |
|---|---|
| `bg-white` | `dark:bg-gray-900` |
| `text-gray-900` | `dark:text-white` |
| `border-gray-100` | `dark:border-gray-800` |
| `text-gray-500` | `dark:text-gray-400` |

Card base: `bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800`

## Step 5 — Register the Page

**`frontend/src/App.tsx`** inside the admin `<Route>`:

```tsx
<Route path="resource" element={<ErrorBoundary><ResourcePage /></ErrorBoundary>} />
```

**`frontend/src/components/layout/AdminLayout.tsx`** — sidebar nav array:

```ts
{ path: '/admin/resource', label: t('resource'), icon: SomeIcon }
```

Choose an icon from `lucide-react`. No emojis.

## Step 6 — Translations

Add all UI strings to `frontend/src/lib/translations.ts` under both `en` and `ms` keys before use. Use `const t = useT()` in the component — never hardcode visible strings.
