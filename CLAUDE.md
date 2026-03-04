# KinderCare — Project Memory for Claude

## What This Project Is

A full-stack kindergarten management system. Built for a school to manage students, classes, and daily attendance.

## Knowledge Routing

Every time new knowledge surfaces during a session — a discovered pattern, a convention, a complex workflow, a user preference — Claude must decide where it belongs before the session ends. Always evaluate and place it; never leave it floating.

**Use this decision tree:**

```
Is it a reusable, invocable task with complex/arcane steps
that would be easy to forget or get wrong?
  YES → Create or update a skill file in .claude/commands/
         Good signals: multiple easy-to-miss steps, critical gotchas,
         benefits from auto-triggering on keywords, multi-file scaffolding

  NO ↓

Is it a stable project-wide convention that every Claude session
needs to know upfront — architecture, design rules, security patterns?
  YES → Add to CLAUDE.md (this file)
         Good signals: applies to ALL tasks, governs how code is written,
         won't change unless the project architecture changes

  NO ↓

Is it a session-learned insight — a debugging solution, a user
preference, a pattern discovered during work, something project-specific
but not universal enough for CLAUDE.md?
  YES → Write to memory/ (MEMORY.md or a topic file)
         Good signals: "I learned this during a session", recurring problem,
         user workflow preference, narrowly scoped fix or workaround
```

**Quick reference:**

| Where                       | What goes here                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `CLAUDE.md`                 | Stable conventions, architecture, design system, security rules, project structure     |
| `memory/`                   | Session learnings, debugging wins, user preferences, narrowly scoped patterns          |
| `.claude/commands/skill.md` | Complex repeatable tasks — scaffold a page, build the bear mascot, add a backend route |

**When in doubt, say so.** If new knowledge comes up and it's unclear where it belongs, tell the user which bucket you think it fits and why, then ask for confirmation before writing.

## Tech Stack

| Layer          | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Runtime        | Bun                                                        |
| Backend        | Hono + TypeScript                                          |
| Frontend       | React + Vite + TypeScript                                  |
| Styling        | Tailwind CSS (Nunito font, custom kinder-\* color palette) |
| State (server) | React Query (`@tanstack/react-query`)                      |
| State (UI)     | Zustand                                                    |
| Database       | Supabase (PostgreSQL)                                      |
| Auth           | Supabase Auth (JWT via Bearer token)                       |

## Project Structure

```
kindergarten-app/
├── backend/
│   └── src/
│       ├── index.ts           # Hono app entry, CORS, middleware registration
│       ├── routes/
│       │   ├── auth.ts        # POST /api/auth/login (rate-limited), /logout, GET /me
│       │   ├── students.ts    # CRUD + paginated GET (?page, limit, search, class_name, gender); POST /bulk
│       │   ├── attendance.ts  # GET by date (paginated), bulk POST, stats summary
│       │   ├── classes.ts     # CRUD + paginated GET (?page, limit, search)
│       │   ├── gallery.ts           # CRUD + paginated GET (?page, limit, search)
│       │   ├── announcements.ts     # CRUD + paginated GET (?page, limit, search, category); pinned-first ordering
│       │   ├── documentNumbering.ts # GET/PUT /api/document-numbering/:type; exports generateNextNumber()
│       │   └── fees.ts              # CRUD for fee_plans + fee_records; /payment, /generate, /export, /summary
│       ├── middleware/
│       │   └── auth.ts        # Validates Supabase JWT, sets c.set('user', user)
│       ├── lib/
│       │   ├── logger.ts      # pino instance (pino-pretty in dev, JSON in prod)
│       │   └── sanitise.ts    # stripHtml(str) + sanitiseStrings(obj) — applied before all inserts
│       ├── db/
│       │   └── supabase.ts    # Supabase service-role client
│       └── types/
│           └── index.ts       # Student, AttendanceRecord, ClassRoom, AdminUser, GalleryItem, Announcement
│
├── frontend/
│   └── src/
│       ├── App.tsx            # Router, QueryClient config (staleTime 30s, gcTime 5min, no refetchOnWindowFocus)
│       ├── pages/
│       │   ├── landing/
│       │   │   ├── LandingPage.tsx  # Public marketing page (hero, stats, features, gallery+lightbox, notices, testimonials, CTA)
│       │   │   ├── constants.ts     # FEATURES, TESTIMONIALS, GALLERY_PLACEHOLDERS, NOTICE_CATEGORY_COLORS/GRADIENTS, KEYFRAMES
│       │   │   └── components/
│       │   │       ├── Wave.tsx         # SVG decorative wave divider
│       │   │       └── StatCounter.tsx  # Animated number counter with intersection observer
│       │   ├── dashboard/
│       │   │   ├── DashboardPage.tsx    # Stats + today attendance + monthly summary + today's birthdays widget
│       │   │   └── components/
│       │   │       └── StatCard.tsx     # Icon + label + value + optional sub-label card
│       │   ├── students/
│       │   │   ├── StudentsPage.tsx     # Grid, 12/page, search+filter, add/edit modal wired
│       │   │   └── components/
│       │   │       └── StudentCard.tsx  # Student photo, name, class, birthday badge, edit/delete actions
│       │   ├── attendance/
│       │   │   ├── AttendancePage.tsx   # Table, 20 students/page, bulk mark, status tabs, CSV export
│       │   │   ├── constants.ts         # STATUS_CONFIG map, Status type
│       │   │   └── components/
│       │   │       └── AttendanceRow.tsx # Single student table row with status-mark buttons
│       │   ├── announcements/
│       │   │   ├── AnnouncementsPage.tsx # Grid, 9/page, search+category filter, pinned/expired badges
│       │   │   ├── constants.ts          # CATEGORY_COLORS, CATEGORY_GRADIENTS, isExpired(), formatDate()
│       │   │   └── components/
│       │   │       └── AnnouncementCard.tsx # Card with category badge, pin/expiry, edit/delete
│       │   ├── student-profile/
│       │   │   ├── StudentProfilePage.tsx # /admin/students/:id — orchestrator
│       │   │   ├── constants.ts           # STATUS_CONFIG, Status type
│       │   │   └── components/
│       │   │       ├── StudentInfoCard.tsx        # Photo, name, class, parent contact, quick stats
│       │   │       └── AttendanceHistoryTable.tsx # Paginated history with status badges
│       │   ├── fees/
│       │   │   ├── FeesPage.tsx    # Fee records table, 20/page, filters, payment/receipt modals
│       │   │   ├── constants.ts    # STATUS_STYLES, TYPE_STYLES, typeLabel(), formatRM()
│       │   │   └── components/
│       │   │       └── FeeTableRow.tsx # Fee record row with pay/receipt/edit/delete actions
│       │   ├── settings/
│       │   │   ├── SettingsPage.tsx   # /admin/settings — mini-nav orchestrator (NAV_SECTIONS config)
│       │   │   └── components/
│       │   │       ├── DocumentNumberingSection.tsx  # Segment builder + preview + save
│       │   │       ├── SchoolInfoSection.tsx         # Logo upload, school name, address, phone, email
│       │   │       └── AppearanceSection.tsx         # Dark mode toggle + EN/BM language picker
│       │   ├── testimonials/
│       │   │   ├── TestimonialsPage.tsx # Grid, 9/page, search, add/edit modal wired
│       │   │   └── components/
│       │   │       └── TestimonialCard.tsx # Quote, avatar (photo or initials), visible badge, edit/delete
│       │   ├── LoginPage.tsx        # Admin login form (dark mode aware)
│       │   ├── ClassesPage.tsx      # Grid, 9/page, capacity bar, add/edit modal wired
│       │   ├── GalleryPage.tsx      # Grid, 9/page, photo thumbnail, visible badge, add/edit modal wired
│       │   ├── FeePlansPage.tsx     # Fee plan cards, 9/page, add/edit/delete, "Use Plan" action
│       │   └── FeeStatementPage.tsx # /admin/fees/statement/:studentId — annual printable statement
│       ├── store/
│       │   ├── studentsStore.ts      # page, search, classFilter, genderFilter, modal state
│       │   ├── classesStore.ts       # page, search, modal state
│       │   ├── attendanceStore.ts    # selectedDate, page, statusFilter, pendingChanges
│       │   ├── galleryStore.ts       # page, search
│       │   ├── announcementsStore.ts # page, search, categoryFilter
│       │   ├── feesStore.ts          # page, search, statusFilter, monthFilter, classFilter
│       │   ├── feePlansStore.ts      # page, search
│       │   ├── testimonialsStore.ts  # page, search
│       │   └── settingsStore.ts      # darkMode (bool), lang ('en'|'ms'), persisted to localStorage
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Skeletons.tsx      # StudentCardSkeleton, ClassCardSkeleton, AnnouncementCardSkeleton, TableRowSkeleton, StatCardSkeleton, CuteLoader (rotating fun messages), EmptyState
│       │   │   ├── Pagination.tsx     # Smart pagination with ellipsis, dark mode aware
│       │   │   ├── SearchBar.tsx      # Debounced 350ms, dark mode aware
│       │   │   └── ErrorBoundary.tsx  # Class component; wraps each admin page in App.tsx; shows "Try again" card
│       │   ├── admin/
│       │   │   ├── StudentModal.tsx       # Add/Edit student form — full validation, dark mode, i18n
│       │   │   ├── ClassModal.tsx         # Add/Edit classroom form — full validation, dark mode, i18n
│       │   │   ├── GalleryModal.tsx       # Add/Edit gallery photo — file upload, caption, order, visibility
│       │   │   ├── AnnouncementModal.tsx  # Add/Edit announcement — title, body, category, banner upload, pinned, expiry
│       │   │   ├── FeeRecordModal.tsx     # Add/Edit fee record — student picker, type, amount, discount, due date
│       │   │   ├── GenerateFeesModal.tsx  # 3-step: pick plan → pick target (class/all) → confirm bulk generate
│       │   │   ├── RecordPaymentModal.tsx # Record payment — shows balance, amount input, assigns receipt number
│       │   │   ├── ReceiptView.tsx        # Printable receipt — window.print() + @media print CSS
│       │   │   ├── AdminBearIcon.tsx      # Pixel-art SVG bear (viewBox 24×26); eyeState?: 'open'|'half'|'closed'
│       │   │   ├── AdminBearSpeechBubble.tsx  # Admin-only bubble; variant: 'sleeping'|'waking'|'hidden'; sleeping animates z/z/Z
│       │   │   └── AdminBearLogo.tsx      # Idle doze easter egg — wraps AdminBearIcon + AdminBearSpeechBubble with 4-state machine
│       │   └── layout/
│       │       ├── AdminLayout.tsx     # Sidebar nav + mobile hamburger drawer + settings panel + Outlet; uses AdminBearLogo (desktop) + AdminBearIcon (mobile)
│       │       └── ProtectedRoute.tsx  # Redirects to /admin/login if no user
│       ├── hooks/
│       │   ├── useAuth.tsx    # AuthContext: user, loading, login(), logout()
│       │   └── useT.ts        # Translation hook: const t = useT(); t('key', { vars })
│       ├── lib/
│       │   ├── api.ts             # Axios instance + studentsApi, attendanceApi, classesApi, authApi, galleryApi, announcementsApi, feesApi, feePlansApi, documentNumberingApi; publicApi (no-auth)
│       │   ├── supabaseClient.ts  # Supabase browser client (anon key) — used for Storage uploads only
│       │   ├── translations.ts    # Full EN/MS translation map (~106 keys)
│       │   ├── utils.ts           # isBirthdayToday(dob) — timezone-safe month+day comparison
│       │   └── version.ts         # APP_VERSION + APP_NAME (brand name single source of truth)
│       └── types/
│           └── index.ts       # Student, AttendanceRecord, ClassRoom, AttendanceSummary, GalleryItem, Announcement, FeeRecord, FeePlan, DocumentNumberingConfig, FeesSummary
│
└── supabase-schema.sql        # Tables: students, classrooms, attendance, gallery_items, announcements, document_numbering, fee_plans, fee_records + RLS policies
```

## Database Schema

```sql
students       (id, full_name, date_of_birth, gender, class_name, parent_name, parent_email, parent_phone, photo_url, created_at)
classrooms     (id, name, teacher_name, capacity, created_at)
attendance     (id, student_id→students, date, status[present|absent|late|excused], notes, recorded_by, created_at)
               UNIQUE(student_id, date)
gallery_items  (id, photo_url, caption, display_order, is_visible, created_at)
               RLS: authenticated users → full CRUD; anon users → SELECT WHERE is_visible = true
announcements      (id, title, body, category[general|holiday|event|reminder], image_url, is_pinned, expires_at, created_at)
                   RLS: authenticated users → full CRUD; anon users → SELECT WHERE expires_at IS NULL OR expires_at >= today
document_numbering (id, document_type UNIQUE, segments jsonb, current_serial int, last_reset_at timestamptz, updated_at)
                   RLS: authenticated only
fee_plans          (id, name, type[tuition|activity|uniform|registration|other], amount, description, created_at)
                   RLS: authenticated only
fee_records        (id, student_id→students, type, description, amount_owed, amount_paid, discount_amount, discount_reason, receipt_number UNIQUE, status[unpaid|partial|paid|waived], due_date, paid_at, created_at)
                   RLS: authenticated only
                   Status derivation (backend): waived if discount>=owed; paid if paid>=(owed-discount); partial if paid>0; unpaid otherwise
```

## API Response Format

All list endpoints return paginated responses:

```json
{
  "data": [...],
  "meta": { "total": 100, "page": 1, "limit": 12, "totalPages": 9 }
}
```

## State Management Pattern

- **Zustand** stores hold UI state only (page number, search string, filters, modal open/close, unsaved attendance changes)
- **React Query** handles all server data with cache keys like `['students', { page, search, class_name, gender }]`
- `placeholderData: (prev) => prev` is used on all list queries so old data shows while new page loads (no flash)
- Zustand `setSearch` and `setClassFilter` always reset `page` to 1

## Design System

- Font: Nunito (Google Fonts)
- Colors: `kinder-orange` (#FF6B35), `kinder-blue` (#4D96FF), `kinder-green` (#6BCB77), `kinder-yellow` (#FFD93D), `kinder-purple` (#C77DFF), `kinder-pink` (#FF85A2)
- Border radius: heavy use of `rounded-2xl`, `rounded-3xl`
- Cards: `bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800`
- Primary action buttons: `bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold`
- Skeleton animation: CSS `animate-shimmer` defined in `index.css` using `bg-[length:200%_100%]`
- All components are fully dark-mode aware using Tailwind `dark:` variants
- All components are mobile-responsive using Tailwind breakpoint variants (`sm:`, `md:`, `lg:`)

## Settings & i18n Architecture

- **settingsStore** (`store/settingsStore.ts`) — Zustand + `persist` middleware. Stores `darkMode` (bool) and `lang` (`'en' | 'ms'`). On `toggleDark()`, it directly adds/removes the `dark` class from `document.documentElement`. Settings are restored from `localStorage` on app load via `onRehydrateStorage`.
- **Tailwind dark mode** — `darkMode: 'class'` in `tailwind.config.js`. All components use `dark:` variants. Transitions handled with `transition-colors duration-200`.
- **translations.ts** (`lib/translations.ts`) — flat key/value map for `en` and `ms`. Every UI string that users see is translated.
- **useT hook** (`hooks/useT.ts`) — `const t = useT()` returns a typed function `t(key, vars?)`. Variable interpolation: `t('ofStudents', { n: 30 })` → `"of 30 students"`.
- Settings UI lives in **AdminLayout sidebar footer** — a chevron button above the user row expands a panel with the dark mode toggle (pill switch) and language toggle (EN/BM segmented button). Persisted so users don't have to set it every session.

## Modal Architecture

- **StudentModal** (`components/admin/StudentModal.tsx`) — full add/edit form with client-side validation, dark mode, i18n. Opens from StudentsPage with `editingStudent` state (`null` = add mode, `Student` = edit mode).
- **ClassModal** (`components/admin/ClassModal.tsx`) — same pattern for classrooms.
- **GalleryModal** (`components/admin/GalleryModal.tsx`) — photo upload (Supabase Storage → `gallery-photos`), caption, display_order, is_visible toggle. Same add/edit pattern.
- **AnnouncementModal** (`components/admin/AnnouncementModal.tsx`) — title, body, category select, banner upload (Supabase Storage → `announcement-banners`), pinned toggle (yellow), expiry date with clear button. Invalidates both `['announcements']` and `['announcements-public']` on success.
- All modals use `useMutation` → `onSuccess`: `queryClient.invalidateQueries` + `toast.success`; `onError`: `toast.error`.
- **Delete confirmation**: never use native `window.confirm()` for deletions. Use `DeleteDialog` (`components/ui/DeleteDialog.tsx`) instead. Props: `show`, `itemName?` (displayed in dialog so user knows what they're deleting), `onConfirm`, `onCancel`. Two placement patterns:
  - **Card/row components** (e.g. StudentCard, TestimonialCard, FeeTableRow): add local `const [showDelete, setShowDelete] = useState(false)`, change trash button to `onClick={() => setShowDelete(true)}`, and place `<DeleteDialog>` either as last child of the wrapper `<div>`, or outside via Fragment `<>...<DeleteDialog /></>` when the wrapper is a `<Link>` or `<tr>`.
  - **Page-level inline delete** (e.g. ClassesPage, GalleryPage, FeePlansPage): add `const [deletingX, setDeletingX] = useState<Type | null>(null)`, change button to `onClick={() => setDeletingX(item)}`, add `setDeletingX(null)` in `deleteMutation.onSuccess`, and render `<DeleteDialog show={!!deletingX} itemName={deletingX?.name} onConfirm={() => deletingX && deleteMutation.mutate(deletingX.id)} onCancel={() => setDeletingX(null)} />` alongside other modals.
- **Optimistic deletion**: all `deleteMutation` instances use optimistic removal so the item disappears instantly. Standard pattern (applied to all 7 delete mutations):
  ```ts
  onMutate: async (id: string) => {
    await queryClient.cancelQueries({ queryKey: ['resource'] })
    const snapshot = queryClient.getQueriesData({ queryKey: ['resource'] })
    queryClient.setQueriesData({ queryKey: ['resource'] }, (old: any) =>
      old?.data ? { ...old, data: old.data.filter((item: any) => item.id !== id), meta: { ...old.meta, total: Math.max(0, (old.meta?.total ?? 1) - 1) } } : old
    )
    return { snapshot }
  },
  onSuccess: () => { toast.success('X removed') },
  onError: (_err, _id, ctx: any) => {
    ctx?.snapshot?.forEach(([key, data]: any) => queryClient.setQueryData(key, data))
    toast.error('Failed to remove X. Please try again.')
  },
  onSettled: () => { queryClient.invalidateQueries({ queryKey: ['resource'] }) },
  ```
  Key rules: `onMutate` cancels in-flight queries and snapshots the cache; `onError` rolls back; **invalidation moves to `onSettled`** (not `onSuccess`) so it always runs. For pages that invalidate two keys (e.g. announcements + announcements-public), both go in `onSettled`. The `DeleteDialog` `onConfirm` always closes the dialog immediately before firing the mutation to prevent double-clicks.
- **Discard guard**: every modal that has editable form state must use `useDiscardGuard` (`hooks/useDiscardGuard.ts`) + `DiscardDialog` (`components/ui/DiscardDialog.tsx`). Pattern:
  1. `const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } = useDiscardGuard(onClose)`
  2. Call `markDirty()` in every field setter / onChange handler
  3. Call `resetDirty()` at the end of the `useEffect` that resets form state on open
  4. Replace `onClick={onClose}` with `onClick={requestClose}` on the X button, backdrop div, and Cancel button (mutation `onSuccess` keeps calling `onClose()` directly)
  5. Render `<DiscardDialog show={showConfirm} onConfirm={confirmDiscard} onCancel={cancelDiscard} />` as the **last child inside** the outermost `<div className="fixed inset-0 ...">` wrapper — never as a sibling after `</div>`

## Toast Notifications

- Library: `sonner` (installed in frontend). `<Toaster position="top-right" richColors duration={3000} />` lives in `App.tsx` outside the Router.
- Every `useMutation` must have both `onSuccess` (with `toast.success`) and `onError` (with `toast.error`).
- Toast messages are short English strings — not translated through `useT` (toasts are ephemeral, translation can be added later).
- Pattern: `toast.success('Student updated')` / `toast.error('Failed to save student. Please try again.')`

## Error Handling

- `ErrorBoundary` class component (`components/ui/ErrorBoundary.tsx`) wraps every admin page route in `App.tsx`.
- Renders a "Try again" reset card on uncaught render errors; logs to `console.error` for dev.
- Does NOT wrap LandingPage or LoginPage (public pages handle their own errors).

## Backend Security Conventions

- **Input sanitisation**: all string fields in POST/PUT routes must be passed through `sanitiseStrings(body)` (from `lib/sanitise.ts`) before inserting into Supabase. For gallery caption only: use `stripHtml(caption)`.
- **Rate limiting**: login route uses an in-memory Map (`loginAttempts`) — 10 attempts per IP per minute, returns 429. Reset is time-based (no external dep).
- **Env validation**: zod schema at the top of `index.ts` validates all required env vars on startup; calls `process.exit(1)` with a clear message if any are missing/malformed.
- **Security headers**: applied via `app.use('*', ...)` middleware on every response: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- **Logger**: use `logger` from `lib/logger.ts` (pino) in `index.ts`; pino-pretty in dev, JSON in prod. Route files do not use `console.log` — they return error responses instead.

## Supabase Plan

This project runs on the **free tier**. Key limits:

- 500 MB database storage, 1 GB file storage, 50 MB max upload size
- No automatic backups / point-in-time recovery
- Four Storage buckets required (all must be created as **public** in the Supabase dashboard):
  - `student-photos` — student profile photo uploads (StudentModal)
  - `gallery-photos` — landing page gallery photo uploads (GalleryModal)
  - `announcement-banners` — announcement banner image uploads (AnnouncementModal)
  - `testimonial-avatars` — optional parent avatar uploads (TestimonialModal); 2 MB limit

## Environment Variables

**Backend** (`.env`):

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=http://localhost:5173
PORT=3000
```

**Frontend** (`.env`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Running the Project

```bash
# Install all workspaces + set up git hook (once, from root)
bun install   # triggers `lefthook install` via prepare script

# Backend
cd backend && bun dev   # → http://localhost:3000

# Frontend
cd frontend && bun dev  # → http://localhost:5173
```

## Code Quality

```bash
# Run from project root
bun run lint          # ESLint v9 across frontend/src, backend/src, packages
bun run format        # Prettier 3 — rewrite all files in place
bun run format:check  # Prettier — dry-run (CI-safe)
bun run test          # All tests (backend bun test + frontend vitest)
bun run test:backend  # Backend only
bun run test:frontend # Frontend only
```

- Config files: `eslint.config.mjs` (root, flat config), `.prettierrc` (root), `.prettierignore`
- Pre-commit hook: `lefthook` → `lint-staged` + `bun run test` — staged files are linted/formatted AND all tests run on `git commit`
- `lint-staged` config lives in root `package.json` under the `"lint-staged"` key
- `useAuth.tsx` has `// eslint-disable-next-line react-refresh/only-export-components` — context + hook co-location is intentional, suppress is correct

## Testing

- **Backend**: `bun test` (built-in runner, zero deps) — test files live next to source as `*.test.ts`
- **Frontend**: Vitest — config at `frontend/vitest.config.ts`, test files co-located with source
- **Testability pattern**: when a route has pure business logic (status derivation, formatting, date calculations), extract it into `backend/src/lib/<resource>.ts` and test in `backend/src/lib/<resource>.test.ts`. The route file imports from the lib; tests import from the lib without touching Supabase.
- **Integration tests**: route handlers tested via `app.request()` (Hono's built-in test client) + mocked Supabase (`backend/src/test-utils/mockSupabase.ts`). `backend/bunfig.toml` preloads dummy env vars via `backend/src/test-utils/setup.ts`.
- **Backend test imports**: always `import { describe, test, expect } from 'bun:test'`
- **Frontend test imports**: always `import { describe, test, expect } from 'vitest'` (plus `vi` for fake timers)
- **New backend routes must include tests** — Step 6 in the `/new-route` skill covers this

## Built Modules

### Document Numbering

Admins configure receipt number format via a segment builder UI (`pages/settings/components/DocumentNumberingSection.tsx`). Segment types: `constant` (free text prefix/suffix), `year` (4-char auto), `month` (2-char auto), `serial` (zero-padded, reset_by: no_reset/monthly/yearly). Live preview updates as segments change.

- Backend: `backend/src/routes/documentNumbering.ts` — `GET/PUT /api/document-numbering/:type` + exported `generateNextNumber(type: string): Promise<string>` (handles auto-reset + atomic serial increment)
- Frontend: `pages/settings/components/DocumentNumberingSection.tsx`
- DB: `document_numbering` (see Database Schema)

### Fee Collection

Front-office fee collection — records payments, generates receipts, tracks balances. Not a full accounting system.

- Backend: `backend/src/routes/fees.ts` — CRUD for `fee_plans` + `fee_records`; `PUT /payment` (records payment + assigns receipt via `generateNextNumber`); `POST /generate` (bulk from plan); `GET /export` (CSV); `GET /summary` (dashboard card); `GET /statement/:studentId` (annual printable)
- Frontend: `pages/fees/FeesPage.tsx` (table, 20/page) + `FeePlansPage.tsx` (card grid, 9/page) + `FeeStatementPage.tsx` (printable)
- Modals: `FeeRecordModal` (add/edit), `GenerateFeesModal` (3-step: plan → target → confirm), `RecordPaymentModal` (balance + amount input), `ReceiptView` (window.print())
- Dashboard: Fee summary card on DashboardPage via `GET /api/fees/summary?month=YYYY-MM` (total owed/paid/outstanding, overdue count)
- DB: `fee_plans` + `fee_records` (see Database Schema); status derived in backend: waived→paid→partial→unpaid

### Testimonials

Admin-managed parent testimonials shown on the landing page carousel.

- Backend: `backend/src/routes/testimonials.ts` — CRUD + `GET /public` (no auth, visible only, ordered by display_order)
- Public endpoint: registered as `GET /api/public/testimonials` in `index.ts` before `authMiddleware`
- Frontend: `pages/testimonials/TestimonialsPage.tsx` (grid, 9/page, search) + `TestimonialModal` (add/edit, optional avatar upload to `testimonial-avatars` bucket)
- Landing page: `LandingPage.tsx` fetches `['testimonials-public']` via `testimonialsApi.getPublic()`; section hidden entirely when DB returns 0 visible testimonials
- DB: `testimonials` table — `parent_name`, `parent_role?`, `quote`, `avatar_url?`, `display_order`, `is_visible`; anon RLS on `is_visible = true`

## Remaining Backlog (prioritised)

### Medium Priority

- [ ] Email notifications to parents for absences (Supabase Edge Functions or Resend)
- [ ] Role-based access (superadmin vs teacher — schema has AdminUser.role already)
- [x] Real-time attendance updates — implemented in `hooks/useAttendanceRealtime.ts`
- [ ] Parent portal (public-facing, read-only view for parents to check their child's attendance)
- [ ] Sentry crash logging — needs a Sentry project DSN; `@sentry/react` on frontend, Sentry Bun SDK on backend

- [ ] Newsletter/Posts module — full-page TipTap WYSIWYG editor (StarterKit), draft/published states, auto-slug from title, cover image + photo gallery strip, public `/posts` listing + `/posts/:slug` reader pages, DOMPurify or `sanitize-html` for HTML sanitization on save; separate from Announcements (short notices stay as-is)

### Low Priority / Nice to Have

- [x] Attendance heatmap on student profile — implemented in `pages/student-profile/components/AttendanceHeatmap.tsx`
- [ ] Dashboard charts (recharts — monthly trend line, class breakdown pie)
- [x] Print-friendly attendance sheet — implemented in `pages/attendance/components/AttendancePrintView.tsx`
- [x] PWA / installable app for teachers marking attendance on phones — implemented with offline shell caching
- [ ] Global search (Cmd+K) — command palette to jump to any student by name

## Admin Bear (Sidebar Easter Egg)

Full implementation details — eye states, idle machine timing, critical timer pattern, bubble positioning, mobile vs desktop rules — live in the `/build-a-bear` skill (`.claude/commands/build-a-bear.md`). Use `/build-a-bear` whenever modifying the bear mascot.

## Known Conventions

- **Version bump — always update both files in sync**: `frontend/src/lib/version.ts` (bundled into JS) AND `frontend/public/version.json` (served live, never cached). Vite forbids importing from `public/` as a JS module, so they cannot share a source — bump both manually. `useVersionCheck` fetches `/version.json` (`cache: 'no-store'`) and compares against the bundled `APP_VERSION` — mismatch shows the `UpdateBanner` prompting a hard reload.

- **One component, one purpose, one file** — every React component goes in its own `.tsx` file with a single exported component. Never define multiple exported components in one file.
- **Page folder structure** — any page that has sub-components uses a folder named after the page. The orchestrator sits at the folder root; sub-components live in a `components/` subfolder inside it:
  ```
  pages/
    settings/
      SettingsPage.tsx          ← orchestrator only (nav, routing between panels)
      components/
        SchoolInfoSection.tsx   ← one component, one purpose
        AppearanceSection.tsx
        DocumentNumberingSection.tsx
  ```
  Simple pages with no sub-components stay as a flat `.tsx` file directly in `pages/` (e.g. `LoginPage.tsx`, `ClassesPage.tsx`, `GalleryPage.tsx`). Upgrade to a folder only when a `components/` subfolder is actually needed.
- No emojis anywhere in the codebase — not in UI, not in console.log, not in comments, not in documentation. Use lucide-react icons instead.
- **Brand name** (`APP_NAME`) and **version** (`APP_VERSION`) are exported from `frontend/src/lib/version.ts` — the single source of truth. Never hardcode the school name anywhere else; always import and reference `APP_NAME`.
- All new routes must be added to `backend/src/index.ts` and protected with `authMiddleware` unless public
- **Public API endpoints** (needed by LandingPage or other unauthenticated views) must be registered as `app.get('/api/public/...')` BEFORE the `app.use('/api/*', authMiddleware)` line in `index.ts`. Use `publicApi` (no-auth Axios instance in `api.ts`) to call them from the frontend.
- New pages must be registered in `App.tsx` and added to the sidebar nav array in `AdminLayout.tsx`
- New admin list pages follow the full scaffold checklist in the `/new-page` skill — Zustand store, React Query, Pagination, SearchBar, skeleton, dim, dark mode, mobile responsive, registration
- New backend routes follow the full checklist in the `/new-route` skill — sanitisation, paginated response shape, no console.log, register in index.ts
- Mutations call `queryClient.invalidateQueries({ queryKey: ['resource'] })` on success
- All new UI strings go into `lib/translations.ts` under both `en` and `ms` keys before use
- All components must include `dark:` variants for every color/background/border class
- All new pages must be mobile-responsive: `p-4 md:p-8` container padding, `text-2xl md:text-3xl` headings, header rows use `flex flex-col gap-4 md:flex-row md:items-center md:justify-between`, action buttons `w-full md:w-auto`, SearchBars `w-full md:w-72`
- **AdminLayout mobile nav**: desktop sidebar is `hidden lg:flex`; mobile gets a top bar (hamburger + logo) + slide-in drawer with dark backdrop overlay. `sidebarOpen` state controls drawer visibility.
- **Page titles**: every page must call `usePageTitle` from `frontend/src/hooks/usePageTitle.ts` at the top of its component. Admin pages pass the page label (e.g. `usePageTitle('Dashboard')`) → tab shows `"Dashboard — KinderCare"`. Landing page passes no argument → tab shows just `APP_NAME`. StudentProfilePage passes `student?.full_name` (reactive — updates when data loads).
