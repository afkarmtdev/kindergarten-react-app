TRIGGER when: user mentions parent portal, portal login, daily activity report, daily report, child portfolio, learning portfolio, KSPK report card, or portfolio report card.

# parent-portal — Build Parent Portal, Daily Reports & Portfolio

Full spec: `memory/parent-portal-plan.md` (checklist with tick boxes)
Detailed architecture: `C:\Users\Afkar\.claude\plans\resilient-waddling-rocket.md`

Work through every phase in strict order. Do NOT start a later phase until the earlier one is verified working.

---

## Critical Decisions (locked in — do not redesign)

- **Auth:** Access Code + 6-digit PIN. `Bun.password.hash()` / `Bun.password.verify()` for PIN — built-in, zero new deps. Separate `PORTAL_JWT_SECRET` env var (NOT the same as Supabase JWT secret).
- **Sessions:** `parent_sessions` table stores `token_hash` (SHA-256 of JWT). Every portal request checks this table — allows instant revocation by deleting the row.
- **Data isolation:** All `/api/portal/*` routes extract `student_id` from the verified session, then query ONLY that student's data. Never trust a client-supplied student_id.
- **No Supabase Auth for parents** — service role client used for session lookup; parents are NOT Supabase Auth users.
- **Daily report UI:** Inline table (one row per student), not per-student modal. Same pattern as AttendancePage.
- **Report card:** Editable + printable on the same page. Auto-save on textarea blur. `@media print` hides edit controls.

---

## Phase 0 — Database Schema

Run ALL of this in Supabase SQL editor before writing any code. Add to `supabase-schema.sql`.

```sql
-- Extend students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS access_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS portal_pin_hash text;

-- Parent sessions (for JWT revocation)
CREATE TABLE IF NOT EXISTS parent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE parent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages parent sessions" ON parent_sessions
  FOR ALL TO authenticated USING (true);

-- Daily activity reports
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  meals_eaten text CHECK (meals_eaten IN ('all','most','some','none')),
  nap_minutes integer,
  toilet_count integer,
  mood text CHECK (mood IN ('happy','okay','tired','upset')),
  activity_note text,
  photo_url text,
  recorded_by text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, report_date)
);
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages daily reports" ON daily_reports
  FOR ALL TO authenticated USING (true);

-- Portfolio entries
CREATE TABLE IF NOT EXISTS portfolio_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  domain text NOT NULL CHECK (domain IN ('physical','cognitive','language','social_emotional','creative')),
  observation text NOT NULL,
  photo_url text,
  term text NOT NULL,
  recorded_by text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE portfolio_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages portfolio entries" ON portfolio_entries
  FOR ALL TO authenticated USING (true);

-- Termly report cards
CREATE TABLE IF NOT EXISTS portfolio_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term text NOT NULL,
  teacher_comment text,
  principal_comment text,
  generated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, term)
);
ALTER TABLE portfolio_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages portfolio reports" ON portfolio_reports
  FOR ALL TO authenticated USING (true);
```

Also create `portfolio-photos` storage bucket in Supabase dashboard (public).

---

## Phase 1 — Parent Auth Backend

### Step 1.1 — Environment

Add to `backend/.env`:

```
PORTAL_JWT_SECRET=<generate a long random string>
```

Add to the zod env schema in `backend/src/index.ts`:

```ts
PORTAL_JWT_SECRET: z.string().min(32),
```

### Step 1.2 — parentAuth route

Create `backend/src/routes/parentAuth.ts`:

```ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { createHash } from 'crypto'
import { sign } from 'hono/jwt'

const app = new Hono()

const loginSchema = z.object({
  access_code: z.string().min(1),
  pin: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
})

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { access_code, pin } = c.req.valid('json')

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, class_name, photo_url, portal_pin_hash')
    .eq('access_code', access_code)
    .single()

  if (!student || !student.portal_pin_hash) {
    return c.json({ error: 'Invalid access code or PIN' }, 401)
  }

  const valid = await Bun.password.verify(pin, student.portal_pin_hash)
  if (!valid) return c.json({ error: 'Invalid access code or PIN' }, 401)

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  const payload = { student_id: student.id, exp: Math.floor(expiresAt.getTime() / 1000) }
  const token = await sign(payload, process.env.PORTAL_JWT_SECRET!)

  const tokenHash = createHash('sha256').update(token).digest('hex')
  await supabase
    .from('parent_sessions')
    .insert({ student_id: student.id, token_hash: tokenHash, expires_at: expiresAt.toISOString() })

  return c.json({
    token,
    student: {
      id: student.id,
      full_name: student.full_name,
      class_name: student.class_name,
      photo_url: student.photo_url,
    },
  })
})

app.post('/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await supabase.from('parent_sessions').delete().eq('token_hash', tokenHash)
  }
  return c.json({ ok: true })
})

export default app
```

### Step 1.3 — parentMiddleware

Create `backend/src/middleware/parentAuth.ts`:

```ts
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import { createHash } from 'crypto'
import { supabase } from '../db/supabase'

export const parentMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const payload = await verify(token, process.env.PORTAL_JWT_SECRET!)
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const { data: session } = await supabase
      .from('parent_sessions')
      .select('student_id, expires_at')
      .eq('token_hash', tokenHash)
      .single()

    if (!session || new Date(session.expires_at) < new Date()) {
      return c.json({ error: 'Session expired' }, 401)
    }

    c.set('parentStudentId', session.student_id)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})
```

### Step 1.4 — Portal data routes

Create `backend/src/routes/portal.ts`. Every handler must use `c.get('parentStudentId')` — never trust a query param for student_id:

- `GET /api/portal/me` — student profile
- `GET /api/portal/attendance?page&limit` — paginated attendance for this student only
- `GET /api/portal/fees` — fee records for this student (omit discount_reason, internal notes)
- `GET /api/portal/announcements` — non-expired announcements (reuse public logic)
- `GET /api/portal/daily-reports?limit=14` — recent daily reports for this student
- `GET /api/portal/portfolio?term=` — portfolio entries + report for this student

### Step 1.5 — Admin: student portal management endpoints

Add to `backend/src/routes/students.ts`:

```ts
// Generate access code
app.post('/:id/access-code', async (c) => {
  const { id } = c.req.param()
  // Generate KC-YYYY-NNN format, check uniqueness
  const accessCode = `KC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  await supabase.from('students').update({ access_code: accessCode }).eq('id', id)
  return c.json({ access_code: accessCode })
})

// Set PIN
app.put(
  '/:id/portal-pin',
  zValidator(
    'json',
    z.object({
      pin: z
        .string()
        .length(6)
        .regex(/^\d{6}$/),
    })
  ),
  async (c) => {
    const { id } = c.req.param()
    const { pin } = c.req.valid('json')
    const hash = await Bun.password.hash(pin)
    await supabase.from('students').update({ portal_pin_hash: hash }).eq('id', id)
    return c.json({ ok: true })
  }
)

// Revoke all parent access for a student
app.delete('/:id/portal-access', async (c) => {
  const { id } = c.req.param()
  await supabase.from('students').update({ access_code: null, portal_pin_hash: null }).eq('id', id)
  await supabase.from('parent_sessions').delete().eq('student_id', id)
  return c.json({ ok: true })
})
```

### Step 1.6 — Register in index.ts

```ts
// BEFORE authMiddleware:
import parentAuthRoute from './routes/parentAuth'
app.route('/api/portal', parentAuthRoute) // handles /api/portal/login and /api/portal/logout

// AFTER authMiddleware (existing line), but BEFORE other routes:
import { parentMiddleware } from './middleware/parentAuth'
import portalRoute from './routes/portal'
app.use('/api/portal/*', parentMiddleware) // protects all /api/portal/* except login/logout above
app.route('/api/portal', portalRoute)
```

---

## Phase 1 — Portal Shell Frontend

### New files to create (in order):

1. `frontend/src/hooks/useParentAuth.tsx` — `ParentAuthContext` with `{ student, token, login(), logout(), loading }`. Read token from `localStorage('portal_token')`. On mount, call `GET /api/portal/me` to rehydrate session; on 401, clear token.

2. `frontend/src/lib/api.ts` — add `portalApi` axios instance:

   ```ts
   export const portalApi = axios.create({ baseURL: import.meta.env.VITE_API_URL })
   portalApi.interceptors.request.use((cfg) => {
     const token = localStorage.getItem('portal_token')
     if (token) cfg.headers.Authorization = `Bearer ${token}`
     return cfg
   })
   ```

3. `frontend/src/components/portal/PortalProtectedRoute.tsx` — redirects to `/portal/login` if no parent token.

4. `frontend/src/pages/portal/PortalLoginPage.tsx` — two fields: Access Code + PIN. On submit: call `portalApi.post('/api/portal/login')`, store token, navigate to `/portal`. Error state for 401.

5. `frontend/src/pages/portal/PortalLayout.tsx` — top bar: child photo + name + logout button. Bottom tab nav on mobile (Home / Attendance / Fees / Updates). Uses `<Outlet />`.

6. Portal tab pages (all read-only, dark mode, mobile-first):
   - `PortalDashboardPage.tsx` — today attendance chip, outstanding fee amount, today's daily report card, latest 2 pinned announcements
   - `PortalAttendancePage.tsx` — paginated table of attendance records
   - `PortalFeesPage.tsx` — fee records (status badge, amount owed, amount paid, due date)
   - `PortalAnnouncementsPage.tsx` — grid of non-expired announcements
   - `PortalDailyReportPage.tsx` — last 14 days as cards (mood icon, meals, nap, note)
   - `PortalPortfolioPage.tsx` — entries by domain + report card download button

7. `frontend/src/App.tsx` — add routes:

   ```tsx
   <Route path="/portal/login" element={<PortalLoginPage />} />
   <Route element={<PortalProtectedRoute />}>
     <Route path="/portal" element={<PortalLayout />}>
       <Route index element={<PortalDashboardPage />} />
       <Route path="attendance" element={<PortalAttendancePage />} />
       <Route path="fees" element={<PortalFeesPage />} />
       <Route path="announcements" element={<PortalAnnouncementsPage />} />
       <Route path="daily-reports" element={<PortalDailyReportPage />} />
       <Route path="portfolio" element={<PortalPortfolioPage />} />
     </Route>
   </Route>
   ```

   All portal pages: `React.lazy()` + `<Suspense fallback={<CuteLoader />}>`. Wrap `<App>` with `<ParentAuthProvider>`.

8. `frontend/src/components/admin/GeneratePortalAccessModal.tsx` — shows the generated access code + PIN input + copy-to-clipboard. Opens from StudentProfilePage "Portal Access" card.

9. Add "Portal Access" section to `frontend/src/pages/student-profile/StudentProfilePage.tsx` — shows current access_code or "Not set"; buttons: Generate Code / Reset PIN / Revoke Access.

---

## Phase 2 — Daily Activity Report

### Backend

Create `backend/src/routes/dailyReports.ts`:

- `GET /?date=YYYY-MM-DD&class_name=X&page&limit` — returns students for the class with their report (null if not filled). Join pattern: fetch students by class_name, fetch reports by student_ids + date, merge in JS.
- `PUT /:studentId/:date` — upsert (INSERT ... ON CONFLICT DO UPDATE). `sanitiseStrings()` on body. Validates mood + meals_eaten against allowed values.
- `DELETE /:id` — delete a report.

Create `backend/src/routes/dailyReports.test.ts` — cover upsert idempotency, validation of mood/meals enum, auth guard (401 without token).

Register: `app.route('/api/daily-reports', dailyReportsRoute)` AFTER authMiddleware.

### Frontend

1. `frontend/src/store/dailyReportsStore.ts` — `selectedDate` (default today), `classFilter`, `pendingChanges: Record<studentId, Partial<DailyReport>>`, setters.

2. `frontend/src/components/admin/MoodPicker.tsx` — 4 buttons: `Smile` (happy/green), `Meh` (okay/yellow), `Coffee` (tired/orange), `Frown` (upset/red). Selected = filled bg. Unselected = ghost border. Dark mode aware.

3. `frontend/src/pages/daily-reports/DailyReportsPage.tsx`:
   - Date picker + class filter dropdown at top
   - Table: student photo + name | MoodPicker | meals select | nap minutes input | toilet count input | activity note textarea
   - Track changes in `pendingChanges` store; "Save All" fires `PUT` for each changed row
   - Call `usePageTitle('Daily Reports')`
   - Skeleton: `TableRowSkeleton` while loading

4. Add to `AdminLayout.tsx` navItems: `{ to: '/admin/daily-reports', icon: ClipboardList, label: t('dailyReports') }`

5. Add types to `packages/types/index.ts`:
   ```ts
   export interface DailyReport {
     id: string
     student_id: string
     report_date: string
     meals_eaten: 'all' | 'most' | 'some' | 'none' | null
     nap_minutes: number | null
     toilet_count: number | null
     mood: 'happy' | 'okay' | 'tired' | 'upset' | null
     activity_note: string | null
     photo_url: string | null
     recorded_by: string | null
     created_at: string
   }
   ```

---

## Phase 3 — Child Learning Portfolio + Report Card

### Backend

Create `backend/src/routes/portfolioEntries.ts`:

- `GET /?student_id=X&term=2024-T1&page&limit`
- `POST /` — create entry; `sanitiseStrings()` on body
- `PUT /:id` — update
- `DELETE /:id` — optimistic delete pattern (see CLAUDE.md)
- `GET /:studentId/report/:term` — entries grouped by domain + portfolio_report row

Create `backend/src/routes/portfolioReports.ts`:

- `PUT /:studentId/:term` — upsert `teacher_comment` + `principal_comment`

Write tests for both. Register both after authMiddleware.

### Frontend

1. Add "Portfolio" tab to `StudentProfilePage.tsx`:
   - Term selector dropdown (list distinct terms from entries)
   - 5 domain accordion sections, each with: domain icon + label + entry count badge + entry cards + "+ Add Entry" button
   - "View Report Card" button → navigate to `/admin/students/:id/portfolio/:term`

2. `frontend/src/components/admin/PortfolioEntryModal.tsx`:
   - Fields: domain (select), observation (textarea), entry_date (date input), photo (file upload → `portfolio-photos` bucket)
   - Standard modal pattern: createPortal, discard guard, dark mode, i18n
   - Add/edit mode based on `editingEntry` prop

3. `frontend/src/pages/portfolio/PortfolioReportPage.tsx`:
   - Route: `/admin/students/:id/portfolio/:term`
   - Call `usePageTitle(student?.full_name ? \`${student.full_name} — Report Card\` : 'Report Card')`
   - Header: `useSchoolInfo()` logo + school name + "Student Progress Report"
   - Student photo + name + class + term
   - 5 domain sections, each with:
     - Entry count badge
     - Editable textarea for teacher domain summary (auto-saves on blur via `PUT /api/portfolio-reports/:studentId/:term`)
   - Overall teacher comment + principal comment (both auto-save on blur)
   - "Print Report Card" button → `window.print()`
   - `@media print`: hide button + textareas; show `.print-only` static text divs instead

### KSPK Domain Icons

| Domain           | Icon (lucide)   | Color         |
| ---------------- | --------------- | ------------- |
| physical         | `Dumbbell`      | kinder-orange |
| cognitive        | `Brain`         | kinder-blue   |
| language         | `MessageSquare` | kinder-purple |
| social_emotional | `Heart`         | kinder-pink   |
| creative         | `Palette`       | kinder-green  |

---

## Translation Keys to Add

Add to BOTH `en` and `ms` in `frontend/src/lib/translations.ts`:

```ts
// Portal
portalLogin / 'Parent Portal' / 'Portal Ibu Bapa'
accessCode / 'Access Code' / 'Kod Akses'
portalPin / 'PIN' / 'PIN'
generateAccessCode / 'Generate Access Code' / 'Jana Kod Akses'
resetPin / 'Reset PIN' / 'Tetapkan Semula PIN'
revokeAccess / 'Revoke Access' / 'Batalkan Akses'
todaysReport / "Today's Report" / 'Laporan Hari Ini'

// Daily Reports
dailyReports / 'Daily Reports' / 'Laporan Harian'
mealsEaten / 'Meals' / 'Makan'
napMinutes / 'Nap (min)' / 'Tidur Siang (min)'
toiletCount / 'Toilet' / 'Tandas'
mood / 'Mood' / 'Mood'
activityNote / 'Activity Note' / 'Nota Aktiviti'
moodHappy / 'Happy' / 'Gembira'
moodOkay / 'Okay' / 'Biasa'
moodTired / 'Tired' / 'Mengantuk'
moodUpset / 'Upset' / 'Sedih'
mealsAll / 'All' / 'Habis'
mealsMost / 'Most' / 'Hampir Habis'
mealsSome / 'Some' / 'Sedikit'
mealsNone / 'None' / 'Tidak Makan'
saveAll / 'Save All' / 'Simpan Semua'

// Portfolio
portfolio / 'Portfolio' / 'Portfolio'
addEntry / 'Add Entry' / 'Tambah Catatan'
domain / 'Domain' / 'Domain'
observation / 'Observation' / 'Pemerhatian'
term / 'Term' / 'Penggal'
reportCard / 'Report Card' / 'Kad Laporan'
teacherComment / 'Teacher Comment' / 'Komen Guru'
principalComment / 'Principal Comment' / 'Komen Pengetua'
viewReportCard / 'View Report Card' / 'Lihat Kad Laporan'
printReportCard / 'Print Report Card' / 'Cetak Kad Laporan'
domainPhysical / 'Physical' / 'Fizikal'
domainCognitive / 'Cognitive' / 'Kognitif'
domainLanguage / 'Language' / 'Bahasa'
domainSocialEmotional / 'Social-Emotional' / 'Sosial & Emosi'
domainCreative / 'Creative' / 'Kreativiti'
```

---

## Gotchas

- `Bun.password.hash()` is async — always `await` it
- `parentMiddleware` must be registered AFTER the `/api/portal/login` and `/api/portal/logout` routes or those routes will require a token to log in
- Portal pages live at `/portal/*` — completely separate from `/admin/*`. Do NOT add portal pages to AdminLayout's navItems.
- `portalApi` axios instance reads from `localStorage('portal_token')` — different key from admin's Supabase session
- Report card `@media print` — use Tailwind `print:hidden` and `print:block` classes, or inline `<style>{\`@media print { ... }\`}</style>` if Tailwind print variants aren't configured
- Access code uniqueness: retry generation if insert fails with unique constraint violation
- PIN must be exactly 6 digits — validate at both backend (zod) and frontend (input maxLength=6, pattern=\d{6})
- Update the checklist in `memory/parent-portal-plan.md` as each phase is completed
