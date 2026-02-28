# KinderCare — Project Memory for Claude

## What This Project Is

A full-stack kindergarten management system. Built for a school to manage students, classes, and daily attendance.

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
│       │   ├── gallery.ts     # CRUD + paginated GET (?page, limit, search)
│       │   └── announcements.ts # CRUD + paginated GET (?page, limit, search, category); pinned-first ordering
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
│       │   ├── LandingPage.tsx     # Public marketing page (hero, stats, features, gallery+lightbox, notices, testimonials carousel, CTA)
│       │   ├── LoginPage.tsx       # Admin login form (dark mode aware)
│       │   ├── DashboardPage.tsx   # Stats + today attendance + monthly summary + today's birthdays widget
│       │   ├── StudentsPage.tsx    # Grid, 12/page, search+filter, add/edit modal wired
│       │   ├── AttendancePage.tsx  # Table, 20 students/page, bulk mark, status tabs, CSV export
│       │   ├── ClassesPage.tsx     # Grid, 9/page, capacity bar, add/edit modal wired
│       │   ├── GalleryPage.tsx     # Grid, 9/page, photo thumbnail, visible badge, add/edit modal wired
│       │   ├── AnnouncementsPage.tsx # Grid, 9/page, search+category filter, pinned/expired badges, add/edit modal wired
│       │   └── StudentProfilePage.tsx # /admin/students/:id — student info card, attendance history, quick stats
│       ├── store/
│       │   ├── studentsStore.ts    # page, search, classFilter, genderFilter, modal state
│       │   ├── classesStore.ts     # page, search, modal state
│       │   ├── attendanceStore.ts  # selectedDate, page, statusFilter, pendingChanges
│       │   ├── galleryStore.ts         # page, search
│       │   ├── announcementsStore.ts   # page, search, categoryFilter
│       │   └── settingsStore.ts        # darkMode (bool), lang ('en'|'ms'), persisted to localStorage
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Skeletons.tsx      # StudentCardSkeleton, ClassCardSkeleton, AnnouncementCardSkeleton, TableRowSkeleton, StatCardSkeleton, CuteLoader (rotating fun messages), EmptyState
│       │   │   ├── Pagination.tsx     # Smart pagination with ellipsis, dark mode aware
│       │   │   ├── SearchBar.tsx      # Debounced 350ms, dark mode aware
│       │   │   └── ErrorBoundary.tsx  # Class component; wraps each admin page in App.tsx; shows "Try again" card
│       │   ├── admin/
│       │   │   ├── StudentModal.tsx  # Add/Edit student form — full validation, dark mode, i18n
│       │   │   ├── ClassModal.tsx    # Add/Edit classroom form — full validation, dark mode, i18n
│       │   │   ├── GalleryModal.tsx       # Add/Edit gallery photo — file upload, caption, order, visibility
│       │   │   └── AnnouncementModal.tsx  # Add/Edit announcement — title, body, category, banner upload, pinned, expiry
│       │   └── layout/
│       │       ├── AdminLayout.tsx     # Sidebar nav + mobile hamburger drawer + settings panel + Outlet
│       │       └── ProtectedRoute.tsx  # Redirects to /admin/login if no user
│       ├── hooks/
│       │   ├── useAuth.tsx    # AuthContext: user, loading, login(), logout()
│       │   └── useT.ts        # Translation hook: const t = useT(); t('key', { vars })
│       ├── lib/
│       │   ├── api.ts             # Axios instance + studentsApi, attendanceApi, classesApi, authApi, galleryApi, announcementsApi; publicApi (no-auth instance for landing page)
│       │   ├── supabaseClient.ts  # Supabase browser client (anon key) — used for Storage uploads only
│       │   ├── translations.ts    # Full EN/MS translation map (~106 keys)
│       │   ├── utils.ts           # isBirthdayToday(dob) — timezone-safe month+day comparison
│       │   └── version.ts         # APP_VERSION + APP_NAME (brand name single source of truth)
│       └── types/
│           └── index.ts       # Student, AttendanceRecord, ClassRoom, AttendanceSummary, GalleryItem, Announcement
│
└── supabase-schema.sql        # Tables: students, classrooms, attendance, gallery_items, announcements + RLS policies
```

## Database Schema

```sql
students       (id, full_name, date_of_birth, gender, class_name, parent_name, parent_email, parent_phone, photo_url, created_at)
classrooms     (id, name, teacher_name, capacity, created_at)
attendance     (id, student_id→students, date, status[present|absent|late|excused], notes, recorded_by, created_at)
               UNIQUE(student_id, date)
gallery_items  (id, photo_url, caption, display_order, is_visible, created_at)
               RLS: authenticated users → full CRUD; anon users → SELECT WHERE is_visible = true
announcements  (id, title, body, category[general|holiday|event|reminder], image_url, is_pinned, expires_at, created_at)
               RLS: authenticated users → full CRUD; anon users → SELECT WHERE expires_at IS NULL OR expires_at >= today
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
- Three Storage buckets required (all must be created as **public** in the Supabase dashboard):
  - `student-photos` — student profile photo uploads (StudentModal)
  - `gallery-photos` — landing page gallery photo uploads (GalleryModal)
  - `announcement-banners` — announcement banner image uploads (AnnouncementModal)

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
```

- Config files: `eslint.config.mjs` (root, flat config), `.prettierrc` (root), `.prettierignore`
- Pre-commit hook: `lefthook` → `lint-staged` — only staged files are linted + formatted on `git commit`
- `lint-staged` config lives in root `package.json` under the `"lint-staged"` key
- `useAuth.tsx` has `// eslint-disable-next-line react-refresh/only-export-components` — context + hook co-location is intentional, suppress is correct

## Planned Modules — Ready to Build

These two modules have been fully designed and approved. Implement them in the order listed below.

---

### 1. Document Numbering Module (build first — fee module depends on it)

Admins configure their own receipt number format via a segment builder UI. No hardcoded format.

**Where it lives:** New page `/admin/settings` (sidebar nav item "Settings", `Settings` icon from lucide-react). Starts with just Document Numbering; expandable to school info etc. later.

**DB table: `document_numbering`**

```sql
id              uuid PK DEFAULT gen_random_uuid()
document_type   text UNIQUE    -- 'receipt' (extensible: 'invoice', etc.)
segments        jsonb          -- ordered array of segment config objects (see below)
current_serial  integer DEFAULT 0
last_reset_at   timestamptz    -- used to detect when to auto-reset the serial
updated_at      timestamptz DEFAULT now()
```

Segments JSONB — array of objects in display order, concatenated to form the number:

```json
[
  { "order": 1, "type": "constant", "value": "RCP-" },
  { "order": 2, "type": "year" },
  { "order": 3, "type": "month" },
  { "order": 4, "type": "serial", "total_chars": 4, "reset_by": "monthly", "start_from": 1 }
]
```

**Segment types (all optional — admins add only what they need, in any order):**
| Type | Output example | Configurable fields |
|------|---------------|---------------------|
| `constant` | `RCP-` | `value` (free text, e.g. "RCP-", "INV/", "-"); **not required** — skip entirely for numeric-only formats |
| `year` | `2026` | none (always 4 chars) |
| `month` | `02` | none (always 2 chars) |
| `serial` | `0001` | `total_chars` (zero-padded), `reset_by` (no_reset/monthly/yearly), `start_from` |

**Example configs (constant is absent in some):**

- `RCP-` + year + `-` + serial(3, yearly) → `RCP-2026-001`
- year + month + serial(5, monthly) → `202602-00001`
- serial(6, no_reset) → `000001`
- `INV/` + serial(6, no_reset) → `INV/000001`

**Backend routes** (`backend/src/routes/documentNumbering.ts`):

- `GET /api/document-numbering/:type` — fetch config for a document type
- `PUT /api/document-numbering/:type` — save config (warns if receipts already exist)
- Internal exported function `generateNextNumber(type: string): Promise<string>` — called by the fees route at payment time; handles auto-reset logic + increments `current_serial` atomically

**Auto-reset logic in `generateNextNumber`:**

- Load config; check `reset_by` on the serial segment
- `monthly`: if `last_reset_at` is from a different year+month → reset `current_serial` to `start_from - 1`
- `yearly`: if `last_reset_at` is from a different year → reset `current_serial` to `start_from - 1`
- Increment `current_serial` by 1, then assemble and return the formatted string
- Update `last_reset_at = now()` and `current_serial` in one UPDATE call

**Frontend UI — Segment Builder:**

- Live **Summary** preview at top (e.g. `RCP-2026-001`) — updates as admin edits segments
- Numbered rows, each with: Type dropdown → dynamic fields appear based on type:
  - `constant`: Value text input
  - `year` / `month`: read-only "Auto" indicator
  - `serial`: Total Chars number input + Reset By dropdown (No Reset / Monthly / Yearly) + Start From number input
- `+` button adds a new segment row; trash icon removes a row (min 1)
- Save button — if `current_serial > 0`, show warning toast: "Changing format won't renumber existing receipts"
- On save, call `PUT /api/document-numbering/receipt`

**New files for this module:**

```
backend/src/routes/documentNumbering.ts   # routes + exported generateNextNumber()
frontend/src/pages/SettingsPage.tsx        # /admin/settings — Document Numbering section
frontend/src/store/settingsPageStore.ts    # minimal — just tracks any local form dirty state
```

---

### 2. Fee Collection Module (build second)

Front-office fee collection only — records payments received, generates receipts, tracks outstanding balances. Not a full accounting system.

**Selected features (approved):**

1. Partial payments — track `amount_paid` vs `amount_owed`; status auto-derives
2. Sibling discount / fee waiver — `discount_amount` + `discount_reason` fields
3. Annual fee statement — printable per-student, useful for Malaysia LHDN child education tax relief
4. Sequential receipt numbers — assigned at payment time via Document Numbering module
5. ~~WhatsApp reminders~~ — **deferred**, not in scope
6. Outstanding balance dashboard card — shows current month totals + overdue count on DashboardPage

**DB tables:**

`fee_plans` — reusable templates; admins create once and apply to a whole class in bulk:

```sql
id           uuid PK DEFAULT gen_random_uuid()
name         text           -- "Monthly Tuition Jan 2026"
type         text           -- tuition | activity | uniform | registration | other
amount       numeric(10,2)
description  text
created_at   timestamptz DEFAULT now()
```

`fee_records` — the actual ledger; one row per student per charge:

```sql
id              uuid PK DEFAULT gen_random_uuid()
student_id      uuid REFERENCES students(id) ON DELETE CASCADE
type            text           -- tuition | activity | uniform | registration | other
description     text           -- "January 2026 Tuition — Aisha binti Ahmad"
amount_owed     numeric(10,2)
amount_paid     numeric(10,2) DEFAULT 0       -- Feature 1: partial payments
discount_amount numeric(10,2) DEFAULT 0       -- Feature 2: sibling discount / waiver
discount_reason text                          -- "Sibling discount", "Waived – financial hardship"
receipt_number  text UNIQUE                   -- Feature 4: assigned at payment; null until first payment
status          text DEFAULT 'unpaid'         -- unpaid | partial | paid | waived
due_date        date
paid_at         timestamptz
created_at      timestamptz DEFAULT now()
```

Status derivation rule (enforced in backend, not a DB trigger):

- `waived` → discount_amount >= amount_owed
- `paid` → amount_paid >= (amount_owed - discount_amount)
- `partial` → amount_paid > 0
- `unpaid` → amount_paid = 0

**Backend routes** (`backend/src/routes/fees.ts`):

| Method | Path                             | Description                                                                                                      |
| ------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/fee-plans`                 | List plans (paginated)                                                                                           |
| POST   | `/api/fee-plans`                 | Create plan                                                                                                      |
| PUT    | `/api/fee-plans/:id`             | Edit plan                                                                                                        |
| DELETE | `/api/fee-plans/:id`             | Delete plan                                                                                                      |
| GET    | `/api/fees`                      | List records — ?page, limit, search, status, month, student_id                                                   |
| POST   | `/api/fees`                      | Create single fee record                                                                                         |
| POST   | `/api/fees/generate`             | Bulk-generate records from a plan for a class or all students                                                    |
| PUT    | `/api/fees/:id`                  | Edit record (description, amount_owed, discount, due_date)                                                       |
| PUT    | `/api/fees/:id/payment`          | Record a payment — adds to amount_paid, recalcs status, assigns receipt number via generateNextNumber('receipt') |
| DELETE | `/api/fees/:id`                  | Delete record (only if status = unpaid)                                                                          |
| GET    | `/api/fees/statement/:studentId` | Annual statement — all records for a student in ?year=2026                                                       |
| GET    | `/api/fees/export`               | Monthly CSV — ?month=2026-02                                                                                     |
| GET    | `/api/fees/summary`              | Dashboard card — ?month=2026-02 → { total_owed, total_paid, total_outstanding, overdue_count }                   |

**Admin UI — 2 new pages:**

`/admin/fees` — Fee Records (table, not grid — fees are tabular):

- Columns: Student | Class | Type | Description | Due Date | Owed | Discount | Paid | Status badge | Actions
- Status badges: unpaid=red, partial=yellow, paid=green, waived=gray
- Filters: status dropdown + month picker + class filter + search by student name
- Row actions: "Record Payment" button | Edit | Print Receipt | Delete (unpaid only)
- Top bar buttons: "Generate Fees" (bulk modal) + "Export CSV" + search

`/admin/fee-plans` — Fee Plans (card grid, 9/page):

- Cards show: plan name, type badge, amount, description
- "Use Plan" button → opens GenerateFeesModal pre-filled
- Standard add/edit/delete pattern

**Modals:**

- `FeeRecordModal` — add/edit single record: student picker (autocomplete), type select, description, amount_owed, discount_amount, discount_reason, due_date
- `GenerateFeesModal` — 3 steps: (1) pick plan or enter ad hoc amount+type+description, (2) pick target — all students or one class, (3) preview count + confirm → bulk POST
- `RecordPaymentModal` — shows balance remaining = amount_owed - discount_amount - amount_paid; amount input (max = remaining); assigns receipt number on submit
- `ReceiptView` — printable receipt: school name, receipt number, date, student name, class, description, amount table (owed / discount / paid), footer "Thank you"; `window.print()` + `@media print` CSS (no new deps)
- Annual statement: rendered inline on a `/admin/fees/statement/:studentId?year=YYYY` route or a dedicated print page; same `window.print()` approach

**Feature 6 — Dashboard card:**

- New stat card on DashboardPage: "Fee Collection — [current month]"
- Shows: Total Charged | Total Collected | Outstanding | Overdue count
- Uses `GET /api/fees/summary?month=YYYY-MM`
- Overdue = status unpaid or partial AND due_date < today

**New files for this module:**

```
backend/src/routes/fees.ts
frontend/src/pages/FeesPage.tsx
frontend/src/pages/FeePlansPage.tsx
frontend/src/store/feesStore.ts            # page, search, statusFilter, monthFilter
frontend/src/store/feePlansStore.ts        # page, search
frontend/src/components/admin/FeeRecordModal.tsx
frontend/src/components/admin/GenerateFeesModal.tsx
frontend/src/components/admin/RecordPaymentModal.tsx
frontend/src/components/admin/ReceiptView.tsx
```

Two new sidebar nav items (Settings, Fees — and fee-plans accessible from Fees page top bar).
Add `feesApi` + `feePlansApi` + `documentNumberingApi` to `frontend/src/lib/api.ts`.
Add new types (`FeeRecord`, `FeePlan`, `DocumentNumberingConfig`, `FeesSummary`) to `frontend/src/types/index.ts`.
Add new translation keys for all UI strings to `frontend/src/lib/translations.ts`.
Add `supabase-schema.sql` entries for both new tables + RLS (authenticated only — no public access).

**Suggested build order:**

1. DB schema (both tables) + `supabase-schema.sql` update
2. Document Numbering backend (`documentNumbering.ts`) + `generateNextNumber` function
3. Settings page frontend (segment builder UI)
4. Fee Plans backend + frontend (simpler, no payment logic)
5. Fee Records backend (all routes including `/payment` which calls `generateNextNumber`)
6. Fee Records frontend — FeesPage table + all modals
7. Dashboard card (add `GET /api/fees/summary` call to DashboardPage)

---

## Remaining Backlog (prioritised)

### Medium Priority

- [ ] Email notifications to parents for absences (Supabase Edge Functions or Resend)
- [ ] Role-based access (superadmin vs teacher — schema has AdminUser.role already)
- [ ] Real-time attendance updates (Supabase Realtime subscriptions)
- [ ] Parent portal (public-facing, read-only view for parents to check their child's attendance)
- [ ] Sentry crash logging — needs a Sentry project DSN; `@sentry/react` on frontend, Sentry Bun SDK on backend

- [ ] Newsletter/Posts module — full-page TipTap WYSIWYG editor (StarterKit), draft/published states, auto-slug from title, cover image + photo gallery strip, public `/posts` listing + `/posts/:slug` reader pages, DOMPurify or `sanitize-html` for HTML sanitization on save; separate from Announcements (short notices stay as-is)

### Low Priority / Nice to Have

- [ ] Attendance heatmap on student profile — GitHub contribution-grid style; each cell = 1 school day, coloured by status (green=present, red=absent, yellow=late, blue=excused, gray=no record); last 12 weeks visible; pure frontend, no new backend endpoint (data already exists in attendance history)
- [ ] Dashboard charts (recharts — monthly trend line, class breakdown pie)
- [ ] Print-friendly attendance sheet
- [ ] PWA / installable app for teachers marking attendance on phones
- [ ] Global search (Cmd+K) — command palette to jump to any student by name

## Known Conventions

- **One component per file** — every React component goes in its own `.tsx` file. Never define multiple exported components in one file. If a feature needs several sub-components, create a subfolder (e.g. `arcade/`) and give each sub-component its own file. The parent/orchestrator file imports from that subfolder.
- No emojis anywhere in the codebase — not in UI, not in console.log, not in comments, not in documentation. Use lucide-react icons instead.
- **Brand name** (`APP_NAME`) and **version** (`APP_VERSION`) are exported from `frontend/src/lib/version.ts` — the single source of truth. Never hardcode the school name anywhere else; always import and reference `APP_NAME`.
- All new routes must be added to `backend/src/index.ts` and protected with `authMiddleware` unless public
- **Public API endpoints** (needed by LandingPage or other unauthenticated views) must be registered as `app.get('/api/public/...')` BEFORE the `app.use('/api/*', authMiddleware)` line in `index.ts`. Use `publicApi` (no-auth Axios instance in `api.ts`) to call them from the frontend.
- New pages must be registered in `App.tsx` and added to the sidebar nav array in `AdminLayout.tsx`
- New list pages must: use Zustand for UI state, React Query for data, include `Pagination` and `SearchBar`, show skeleton on `isLoading`, dim on `isFetching`
- Mutations call `queryClient.invalidateQueries({ queryKey: ['resource'] })` on success
- All new UI strings go into `lib/translations.ts` under both `en` and `ms` keys before use
- All components must include `dark:` variants for every color/background/border class
- All new pages must be mobile-responsive: `p-4 md:p-8` container padding, `text-2xl md:text-3xl` headings, header rows use `flex flex-col gap-4 md:flex-row md:items-center md:justify-between`, action buttons `w-full md:w-auto`, SearchBars `w-full md:w-72`
- **AdminLayout mobile nav**: desktop sidebar is `hidden lg:flex`; mobile gets a top bar (hamburger + logo) + slide-in drawer with dark backdrop overlay. `sidebarOpen` state controls drawer visibility.
- **Page titles**: every page must call `usePageTitle` from `frontend/src/hooks/usePageTitle.ts` at the top of its component. Admin pages pass the page label (e.g. `usePageTitle('Dashboard')`) → tab shows `"Dashboard — KinderCare"`. Landing page passes no argument → tab shows just `APP_NAME`. StudentProfilePage passes `student?.full_name` (reactive — updates when data loads).
