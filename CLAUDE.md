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
│       ├── index.ts           # Hono app entry, CORS, middleware registration, public endpoints
│       ├── routes/
│       │   ├── auth.ts        # POST /api/auth/login (rate-limited), /logout, GET /me
│       │   ├── students.ts    # CRUD + paginated GET (?page, limit, search, class_id, gender, status); POST /bulk; GET /:id/timeline (cursor-paginated); portal access management
│       │   ├── attendance.ts  # GET by date (paginated), bulk POST, stats summary, trend
│       │   ├── classes.ts     # CRUD + paginated GET (?page, limit, search)
│       │   ├── gallery.ts           # CRUD + paginated GET (?page, limit, search)
│       │   ├── announcements.ts     # CRUD + paginated GET (?page, limit, search, category); pinned-first ordering
│       │   ├── documentNumbering.ts # GET/PUT /api/document-numbering/:type; exports generateNextNumber()
│       │   ├── fees.ts              # CRUD for fee_plans + fee_records; /payment, /generate, /export, /summary; report endpoints (class-sheet, monthly-report, annual-report)
│       │   ├── testimonials.ts      # CRUD + GET /public (no auth, visible only)
│       │   ├── artWall.ts           # CRUD + /by-student/:studentId; public endpoint in index.ts
│       │   ├── parents.ts           # CRUD + link/unlink students, access code, PIN, portal access management
│       │   ├── inquiries.ts         # Public POST (rate-limited 5/IP/10min) — enrollment enquiries
│       │   ├── inquiriesAdmin.ts    # Authenticated GET (paginated list) + PUT /:id/status for admin review
│       │   ├── parentAuth.ts        # POST /api/portal/login (public), /logout — access code + PIN auth, issues JWT
│       │   ├── portal.ts            # GET /api/portal/me|attendance|fees|announcements|daily-reports|portfolio — parent-auth protected
│       │   ├── dailyReports.ts      # GET/?date&class_id, PUT/:studentId/:date (upsert), DELETE/:id
│       │   ├── portfolioEntries.ts  # CRUD + GET /:studentId/report/:term (entries + report row)
│       │   ├── portfolioReports.ts  # PUT /:studentId/:term — upsert teacher/principal comments
│       │   └── schoolInfo.ts        # GET/PUT /api/school-info — school branding, contact, hours; PUT /landing patches landing_content (schema in lib/landingContent.ts)
│       ├── middleware/
│       │   ├── auth.ts        # Validates Supabase JWT, sets c.set('user', user)
│       │   └── parentAuth.ts  # Validates portal Bearer token via parent_sessions table, sets c.set('parentId') + c.set('parentChildIds')
│       ├── lib/
│       │   ├── audit.ts       # Audit trail helpers: auditCreate, auditUpdate, auditDelete, auditUpsert, getActor
│       │   ├── logger.ts      # pino instance (pino-pretty in dev, JSON in prod)
│       │   ├── sanitise.ts    # stripHtml(str) + sanitiseStrings(obj) — applied before all inserts
│       │   ├── landingContent.ts # Zod schema + sanitiser + merge for school_info.landing_content — tested independently
│       │   └── fees.ts        # Pure functions: deriveStatus(), monthRange() — tested independently
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
│       │   │   ├── LandingPage.tsx  # Public marketing page (hero, stats, features, gallery+lightbox, art wall, notices, testimonials, CTA)
│       │   │   ├── constants.ts     # FEATURES, GALLERY_PLACEHOLDERS, NOTICE_CATEGORY_COLORS/GRADIENTS, KEYFRAMES
│       │   │   └── components/
│       │   │       ├── Wave.tsx            # SVG decorative wave divider
│       │   │       ├── StatCounter.tsx     # Animated number counter with intersection observer
│       │   │       ├── WhatsAppButton.tsx  # Fixed bottom-left WhatsApp link (when configured)
│       │   │       ├── LocationSection.tsx # Google Maps embed + contact + operating hours
│       │   │       ├── LandingFooter.tsx   # Contact grid + hours + social links + copyright
│       │   │       ├── InquiryForm.tsx     # Public enrollment enquiry form (rate-limited)
│       │   │       ├── AboutSection.tsx    # "Our Story" — founded year, story, approach, principal message + photos (school-written)
│       │   │       ├── TeamSection.tsx     # "Meet the team" — member cards with photo/name/role (school-written)
│       │   │       └── LandingArtCard.tsx  # Art wall grid preview card
│       │   ├── dashboard/
│       │   │   ├── DashboardPage.tsx    # Stats + today attendance + monthly summary + today's birthdays + charts
│       │   │   └── components/
│       │   │       ├── StatCard.tsx              # Icon + label + value + optional sub-label card
│       │   │       ├── AttendanceTrendChart.tsx  # Monthly line chart (recharts)
│       │   │       └── FeeCollectionChart.tsx    # Monthly bar chart (recharts)
│       │   ├── students/
│       │   │   ├── StudentsPage.tsx     # Grid, 12/page, search+filter, add/edit modal wired
│       │   │   └── components/
│       │   │       └── StudentCard.tsx  # Student photo, name, class, birthday badge, edit/delete actions
│       │   ├── attendance/
│       │   │   ├── AttendancePage.tsx   # Table, 20 students/page, bulk mark, status tabs, CSV export
│       │   │   ├── constants.ts         # STATUS_CONFIG map, Status type
│       │   │   └── components/
│       │   │       ├── AttendanceRow.tsx       # Single student table row with status-mark buttons
│       │   │       └── AttendancePrintView.tsx # Print-friendly attendance sheet
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
│       │   │       ├── AttendanceHistoryTable.tsx # Paginated history with status badges
│       │   │       ├── AttendanceHeatmap.tsx      # Calendar heatmap visualization
│       │   │       ├── StudentArtwork.tsx         # Mini art gallery on student profile
│       │   │       ├── PortalAccessCard.tsx       # Parent access code/PIN management
│       │   │       └── StudentTimeline.tsx        # Paginated activity timeline (cursor-based, 6 data sources)
│       │   ├── art-wall/
│       │   │   ├── ArtWallPage.tsx     # Cork board grid, search, pagination
│       │   │   ├── constants.ts        # getRotation(), getPushpinColor(), PUSHPIN_COLORS
│       │   │   └── components/
│       │   │       └── ArtworkCard.tsx  # Pinned artwork card with pushpin + rotation
│       │   ├── fees/
│       │   │   ├── FeesPage.tsx    # Fee records table, 20/page, filters, payment/receipt/invoice modals
│       │   │   ├── constants.ts    # STATUS_STYLES, TYPE_STYLES, typeLabel(), formatRM()
│       │   │   └── components/
│       │   │       ├── FeeTableRow.tsx         # Fee record row with pay/receipt/edit/delete actions
│       │   │       └── ClassCollectionSheet.tsx # Printable class fee collection sheet
│       │   ├── settings/
│       │   │   ├── SettingsPage.tsx   # /admin/settings — mini-nav orchestrator (NAV_SECTIONS config)
│       │   │   └── components/
│       │   │       ├── DocumentNumberingSection.tsx  # Segment builder + preview + save
│       │   │       ├── SchoolInfoSection.tsx         # Logo upload, school name, address, phone, email
│       │   │       ├── AppearanceSection.tsx         # Dark mode toggle + EN/BM language picker
│       │   │       ├── WebsiteHeroSection.tsx        # Website > Hero Copy — bilingual tagline/headline/subtitle + live preview
│       │   │       ├── WebsiteStorySection.tsx       # Website > Our Story — toggle, founded year, story, approach, principal message/photo, 3 photos
│       │   │       ├── WebsiteStatsSection.tsx       # Website > Numbers — live/manual/hidden mode + values
│       │   │       ├── WebsiteProgrammesSection.tsx  # Website > Programmes — pick + order the 6 built-in feature cards
│       │   │       ├── WebsiteTeamSection.tsx        # Website > Team — member list with photo/name/bilingual role
│       │   │       ├── WebsiteSectionCard.tsx        # Shared card chrome for Website panels (heading, loading, save bar, "save General first" notice)
│       │   │       ├── BilingualField.tsx            # One label, EN + BM inputs (text or textarea)
│       │   │       ├── ToggleSwitch.tsx              # Pill switch row with label
│       │   │       └── PhotoUploadTile.tsx           # Dashed upload tile → school-logo bucket via lib/uploadSchoolMedia.ts
│       │   ├── testimonials/
│       │   │   ├── TestimonialsPage.tsx # Grid, 9/page, search, add/edit modal wired
│       │   │   └── components/
│       │   │       └── TestimonialCard.tsx # Quote, avatar (photo or initials), visible badge, edit/delete
│       │   ├── LoginPage.tsx          # Admin login form (dark mode aware)
│       │   ├── ClassesPage.tsx        # Grid, 9/page, capacity bar, add/edit modal wired
│       │   ├── GalleryPage.tsx        # Grid, 9/page, photo thumbnail, visible badge, add/edit modal wired
│       │   ├── FeePlansPage.tsx       # Fee plan cards, 9/page, add/edit/delete, "Use Plan" action
│       │   ├── FeeStatementPage.tsx   # /admin/fees/statement/:studentId — annual printable statement + ledger toggle
│       │   ├── AnnualReportPage.tsx   # /admin/fees/annual-report — school-wide annual financial summary
│       │   ├── InquiriesPage.tsx      # Table, 20/page, search — admin view of enrollment enquiries
│       │   ├── daily-reports/
│       │   │   └── DailyReportsPage.tsx # Date picker + class filter; inline mood/meals/nap/toilet/note per student; Save All
│       │   ├── portfolio/
│       │   │   ├── PortfolioReportPage.tsx # /admin/students/:id/portfolio/:term — editable report card; auto-saves on blur
│       │   │   └── PortfolioReportPDF.tsx  # @react-pdf/renderer Document; downloaded via PDFDownloadLink (no print dialog)
│       │   └── portal/              # Parent-facing pages (separate auth, no sidebar)
│       │       ├── PortalLoginPage.tsx
│       │       ├── PortalLayout.tsx
│       │       ├── PortalDashboardPage.tsx
│       │       ├── PortalAttendancePage.tsx
│       │       ├── PortalFeesPage.tsx
│       │       ├── PortalAnnouncementsPage.tsx
│       │       ├── PortalDailyReportPage.tsx
│       │       └── PortalPortfolioPage.tsx
│       ├── store/
│       │   ├── studentsStore.ts      # page, search, classFilter, genderFilter, modal state
│       │   ├── classesStore.ts       # page, search, modal state
│       │   ├── attendanceStore.ts    # selectedDate, page, statusFilter, pendingChanges (includes notes)
│       │   ├── galleryStore.ts       # page, search
│       │   ├── announcementsStore.ts # page, search, categoryFilter
│       │   ├── feesStore.ts          # page, search, statusFilter, monthFilter, classFilter
│       │   ├── feePlansStore.ts      # page, search
│       │   ├── testimonialsStore.ts  # page, search
│       │   ├── dailyReportsStore.ts  # selectedDate, classFilter, page, pendingChanges
│       │   ├── artWallStore.ts       # page, search
│       │   ├── inquiriesStore.ts     # page, search
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
│       │   │   ├── FeeInvoice.tsx         # Printable invoice + overdue notice variant
│       │   │   ├── EnrollmentLetterView.tsx    # Printable enrollment confirmation letter
│       │   │   ├── MonthlyCollectionReport.tsx # Printable monthly fee collection summary
│       │   │   ├── ArtWallModal.tsx       # Add/Edit artwork — photo upload, student picker, caption, date, visibility
│       │   │   ├── MoodPicker.tsx         # 4-button mood selector (happy/okay/tired/upset) with lucide icons
│       │   │   ├── PortfolioEntryModal.tsx      # Add/Edit portfolio entry — domain, observation, photo, term, date
│       │   │   ├── GeneratePortalAccessModal.tsx # Generate access code + set PIN for parent portal; copy-to-clipboard
│       │   │   ├── AdminBearIcon.tsx      # Pixel-art SVG bear (viewBox 24×26); eyeState?: 'open'|'half'|'closed'
│       │   │   ├── AdminBearSpeechBubble.tsx  # Admin-only bubble; variant: 'sleeping'|'waking'|'hidden'; sleeping animates z/z/Z
│       │   │   └── AdminBearLogo.tsx      # Idle doze easter egg — wraps AdminBearIcon + AdminBearSpeechBubble with 4-state machine
│       │   ├── portal/
│       │   │   └── PortalProtectedRoute.tsx  # Redirects to /portal/login if no parent token
│       │   └── layout/
│       │       ├── AdminLayout.tsx     # Sidebar nav + mobile hamburger drawer + settings panel + Outlet; uses AdminBearLogo (desktop) + AdminBearIcon (mobile)
│       │       └── ProtectedRoute.tsx  # Redirects to /admin/login if no user
│       ├── hooks/
│       │   ├── useAuth.tsx       # AuthContext: user, loading, login(), logout()
│       │   ├── useParentAuth.tsx # ParentAuthContext: parent, children, selectedChild, token, login(), logout(), selectChild()
│       │   ├── useT.ts           # Translation hook: const t = useT(); t('key', { vars })
│       │   ├── usePageTitle.ts   # Sets document.title — usePageTitle('Dashboard') → "Dashboard — KinderCare"
│       │   ├── useSchoolInfo.ts  # Fetches school_info; useSchoolInfo({ public: true }) for unauthenticated contexts; exposes merged landingContent
│       │   ├── useLandingContent.ts # Resolves landing_content for the current lang with fallbacks → hero strings, about, stats tiles, feature cards, team
│       │   ├── useLandingSection.ts # Settings: local edit state + save for ONE landing_content section (hero|about|stats|features|team)
│       │   ├── useDiscardGuard.ts # Unsaved changes guard for modals
│       │   └── useAttendanceRealtime.ts # Supabase realtime subscription for live attendance updates
│       ├── lib/
│       │   ├── api.ts             # Axios instance + all admin APIs; portalApi (separate instance with portal_token interceptor) + portalAuthApi + portalDataApi
│       │   ├── supabaseClient.ts  # Supabase browser client (anon key) — used for Storage uploads only
│       │   ├── translations.ts    # Full EN/MS translation map (~160 keys)
│       │   ├── utils.ts           # isBirthdayToday(dob) — timezone-safe month+day comparison
│       │   ├── landingContent.ts  # DEFAULT_LANDING_CONTENT, mergeLandingContent(), pickText(), resolveStats(), FEATURE_META — tested
│       │   ├── uploadSchoolMedia.ts # Uploads principal/about/team photos to school-logo bucket under a folder prefix
│       │   └── version.ts         # APP_VERSION + APP_NAME (brand name single source of truth)
│       └── types/
│           └── index.ts       # Student, AttendanceRecord, ClassRoom, GalleryItem, Announcement, FeeRecord, FeePlan, DailyReport, PortfolioEntry, PortfolioReport, ArtWallItem, Parent, Inquiry, AuditFields, SchoolInfo + finance report types
│
├── packages/
│   └── types/
│       └── index.ts           # Shared types used by both backend and frontend; all resource types extend AuditFields
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql        # Base schema: tables, RLS policies
│   │   ├── 002_parents.sql               # Parent-level accounts migration
│   │   ├── 003_audit_trail.sql           # Audit trail: created_by, modified_by, deleted_at etc.
│   │   ├── 004_student_status.sql        # Student status field
│   │   ├── 005_classroom_status.sql      # Classroom status field
│   │   └── 006_inquiry_status.sql        # Inquiry status field
│   └── seeds/
│       ├── students.sql                  # Sample student data
│       ├── art_wall.sql                  # Sample art wall data
│       ├── art_wall_2.sql               # Additional art wall data
│       └── landing_content.sql           # Fills school_info.landing_content (hero, story, stats, features, team) — run after school_info.sql
```

## Database Schema

All tables with business data include **audit columns** (see Audit Trail section below):
`created_by`, `modified_at`, `modified_by`, `deleted_at`, `deleted_by`

```sql
students       (id, full_name, date_of_birth, gender, class_id→classrooms, status[active|graduated|inactive], parent_name, parent_email, parent_phone, photo_url, access_code UNIQUE, portal_pin_hash, created_at, +audit)
               NOTE: class_name is NOT stored — derive via .select('*, classrooms(name)') join, then flattenClassroom() in backend
classrooms     (id, name, academic_year, status[active|graduated], teacher_name, capacity, created_at, +audit)
attendance     (id, student_id→students, date, status[present|absent|late|excused], notes, recorded_by, created_at, +audit)
               UNIQUE(student_id, date); has audit columns but NO soft-delete (daily records are overwritten, not deleted)
gallery_items  (id, photo_url, caption, display_order, is_visible, created_at, +audit)
               RLS: authenticated users → full CRUD; anon users → SELECT WHERE is_visible = true
announcements      (id, title, body, category[general|holiday|event|reminder], image_url, is_pinned, expires_at, created_at, +audit)
                   RLS: authenticated users → full CRUD; anon users → SELECT WHERE expires_at IS NULL OR expires_at >= today
testimonials       (id, parent_name, parent_role, quote, avatar_url, display_order, is_visible, created_at, +audit)
                   RLS: authenticated users → full CRUD; anon users → SELECT WHERE is_visible = true
art_wall           (id, photo_url, caption, student_id→students, student_name, artwork_date, display_order, is_visible, created_at, +audit)
                   RLS: authenticated users → full CRUD; anon users → SELECT WHERE is_visible = true
                   student_name is denormalised — artwork persists if student is deleted
document_numbering (id, document_type UNIQUE, segments jsonb, current_serial int, last_reset_at timestamptz, updated_at, created_by, modified_by)
                   RLS: authenticated only; no soft-delete (config table)
fee_plans          (id, name, type[tuition|activity|uniform|registration|other], amount, description, created_at, +audit)
                   RLS: authenticated only
fee_records        (id, student_id→students, type, description, amount_owed, amount_paid, discount_amount, discount_reason, receipt_number UNIQUE, status[unpaid|partial|paid|waived], due_date, paid_at, created_at, +audit)
                   RLS: authenticated only
                   Status derivation (backend): waived if discount>=owed; paid if paid>=(owed-discount); partial if paid>0; unpaid otherwise
parents            (id, full_name, email UNIQUE, phone, access_code UNIQUE, portal_pin_hash, created_at, +audit)
                   Parent-level portal accounts; one parent can have multiple children
parent_students    (id, parent_id→parents, student_id→students, relationship[parent|guardian|step_parent|other], created_at, deleted_at, deleted_by)
                   Junction table; soft-delete for unlinking audit
parent_sessions    (id, parent_id→parents, token_hash UNIQUE, device_id, device_label, expires_at, created_at)
                   RLS: authenticated only; NO soft-delete (sessions are ephemeral, hard delete on logout/revoke)
inquiries          (id, parent_name, child_name, child_age, phone, message, status[new|contacted|enrolled|closed], created_at, modified_at, modified_by, deleted_at, deleted_by)
                   Public INSERT (rate-limited); authenticated SELECT + PUT status
school_info        (id, school_name, address, phone, email, logo_url, principal_name, registration_number, whatsapp_number, operating_hours jsonb, google_maps_embed_url, facebook_url, instagram_url, landing_content jsonb, updated_at, created_by, modified_by)
                   Single-row config; no soft-delete
                   landing_content = { hero, about, stats, features, team } — see LandingContent in packages/types; validated by backend/src/lib/landingContent.ts
daily_reports      (id, student_id→students, report_date date, meals_eaten, nap_minutes, toilet_count, mood, activity_note, photo_url, recorded_by, created_at, +audit)
                   UNIQUE(student_id, report_date); RLS: authenticated only
portfolio_entries  (id, student_id→students, domain[physical|cognitive|language|social_emotional|creative], observation, photo_url, term, recorded_by, entry_date, created_at, +audit)
                   RLS: authenticated only
portfolio_reports  (id, student_id→students, term, teacher_comment, principal_comment, generated_at, created_by, modified_at, modified_by)
                   UNIQUE(student_id, term); RLS: authenticated only; no soft-delete (upsert-only)
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
- **React Query** handles all server data with cache keys like `['students', { page, search, class_id, gender }]`
- `placeholderData: (prev) => prev` is used on all list queries so old data shows while new page loads (no flash)
- Zustand `setSearch` and `setClassFilter` always reset `page` to 1

## Design System

**Warm Storybook** is the visual language (adopted September 2026). Full reference, token table, and the design canvas link live in `docs/design/warm-storybook/README.md`.

- Fonts: Nunito for body and labels; **Fredoka (`font-fun`) for page titles, section headings, and big numbers**. Page `<h1>`: `font-fun font-bold text-2xl md:text-3xl`.
- Brand brights: `kinder-orange` (#FF6B35), `kinder-blue` (#4D96FF), `kinder-green` (#6BCB77), `kinder-yellow` (#FFD93D), `kinder-purple` (#C77DFF), `kinder-pink` (#FF85A2). Use them for buttons, stickers, icon strokes, and chart series only — never as full section backgrounds.
- **Section washes** (`bg-wash-sky|mint|butter|blush|lavender|peach`) with matching **ink** text colours (`text-ink-*`): CSS-var driven, pastel in light and a deep nebula tint of the same hue in dark, so they need no `dark:` variant. Icon tiles are `rounded-2xl` with a wash background and the matching ink icon; map blue→sky, purple→lavender, green→mint, orange→peach, yellow→butter, pink→blush.
- Border radius: heavy use of `rounded-2xl`, `rounded-3xl`
- Cards: `bg-white dark:bg-gray-900 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-800` (no drop shadow except floating chips)
- Primary action buttons: `bg-kinder-orange text-white px-5 py-2.5 rounded-full font-extrabold`; secondary: white pill with `border-2 border-gray-200 dark:border-gray-800`
- Sticker badges: `StickerBadge` (`pages/landing/components/StickerBadge.tsx`) — bright fill, Fredoka uppercase, white border (gray-900 in dark), slight rotation. At most one per section.
- Landing page section joins use `<Wave variant="scallop" fillClassName="fill-<next section colour>" />` — the wave is painted in the NEXT section's colour. Prefer `fillClassName` (Tailwind `fill-*` utilities follow the tokens) over literal `fill`.
- **Dark mode keeps the starry galaxy**: mesh gradient + purple/teal/pink glows + `StarField` behind the landing hero and inside sky-tinted bands; faint stars across the portal; inside the admin welcome banner only.
- Skeleton animation: CSS `animate-shimmer` defined in `index.css` using `bg-[length:200%_100%]`
- All components are fully dark-mode aware using Tailwind `dark:` variants
- **Light mode border rule**: always use `border-gray-200` (not `border-gray-100`) for card/container/divider borders in light mode — `gray-100` is near-invisible on white/gray-50 backgrounds. Same applies to `divide-gray-200`, `border-t/b/r/l-gray-200`. Dark mode keeps `dark:border-gray-800` unchanged. For row dividers inside white cards use `border-gray-100` (one step lighter is fine since the card itself already has `gray-200`). For icon colors at rest, use `text-gray-400` minimum — never `text-gray-300`.
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

- Library: `sonner` (installed in frontend). `<Toaster position="bottom-right" richColors duration={3000} />` lives in `App.tsx` outside the Router.
- Every `useMutation` must have both `onSuccess` (with `toast.success`) and `onError` (with `toast.error`).
- Toast messages are short English strings — not translated through `useT` (toasts are ephemeral, translation can be added later).
- Pattern: `toast.success('Student updated')` / `toast.error('Failed to save student. Please try again.')`

## Error Handling

- `ErrorBoundary` class component (`components/ui/ErrorBoundary.tsx`) wraps every admin page route in `App.tsx`.
- Renders a "Try again" reset card on uncaught render errors; logs to `console.error` for dev.
- Does NOT wrap LandingPage or LoginPage (public pages handle their own errors).

## Backend Security Conventions

- **Input sanitisation**: all string fields in POST/PUT routes must be passed through `sanitiseStrings(body)` (from `lib/sanitise.ts`) before inserting into Supabase. For gallery caption only: use `stripHtml(caption)`.
- **Rate limiting**: login route uses an in-memory Map (`loginAttempts`) — 10 attempts per IP per minute, returns 429. Inquiries: 5/IP/10min. Reset is time-based (no external dep).
- **Env validation**: zod schema at the top of `index.ts` validates all required env vars on startup; calls `process.exit(1)` with a clear message if any are missing/malformed.
- **Security headers**: applied via `app.use('*', ...)` middleware on every response: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- **Logger**: use `logger` from `lib/logger.ts` (pino) in `index.ts`; pino-pretty in dev, JSON in prod. Route files do not use `console.log` — they return error responses instead.

## Audit Trail & Soft Delete

All business data tables have audit columns. Migration: `supabase/migrations/003_audit_trail.sql`.

### Audit helper (`backend/src/lib/audit.ts`)

```ts
import { auditCreate, auditUpdate, auditDelete, auditUpsert } from '../lib/audit'

// INSERT: spread auditCreate(c) — sets created_by (user UUID)
await supabase.from('table').insert({ ...body, ...auditCreate(c) })

// UPDATE: spread auditUpdate(c) — sets modified_at + modified_by
await supabase
  .from('table')
  .update({ ...body, ...auditUpdate(c) })
  .eq('id', id)

// UPSERT: spread auditUpsert(c) — sets created_by + modified_at + modified_by
await supabase.from('table').upsert({ ...body, ...auditUpsert(c) }, { onConflict: '...' })

// SOFT DELETE: update with auditDelete(c) instead of .delete()
await supabase.from('table').update(auditDelete(c)).eq('id', id).is('deleted_at', null)
```

### Actor resolution

`getActor(c)` returns:

1. `c.get('user').id` (UUID) — admin routes via Supabase Auth
2. `c.get('parentId')` (UUID) — portal routes via parent sessions
3. `null` — unauthenticated contexts (e.g. public inquiry POST)

### Soft delete rules

- Records are never physically deleted — set `deleted_at` + `deleted_by` instead
- **Every SELECT query** on a soft-deletable table must include `.is('deleted_at', null)`
- DELETE route handlers become UPDATE handlers: `.update(auditDelete(c)).eq('id', id).is('deleted_at', null)`
- **Exceptions** (no soft-delete): `parent_sessions` (ephemeral), `attendance` (daily overwrite), `document_numbering` (config), `school_info` (config), `portfolio_reports` (upsert-only)

## Supabase Plan

This project runs on the **free tier**. Key limits:

- 500 MB database storage, 1 GB file storage, 50 MB max upload size
- No automatic backups / point-in-time recovery
- Seven Storage buckets required (all must be created as **public** in the Supabase dashboard):
  - `student-photos` — student profile photo uploads (StudentModal)
  - `gallery-photos` — landing page gallery photo uploads (GalleryModal)
  - `announcement-banners` — announcement banner image uploads (AnnouncementModal)
  - `testimonial-avatars` — optional parent avatar uploads (TestimonialModal); 2 MB limit
  - `artwork-photos` — art wall artwork uploads (ArtWallModal); compressed before upload
  - `portfolio-photos` — portfolio entry photo uploads (PortfolioEntryModal)
  - `resumes` — job application resume uploads (ApplicationFormModal); PDF/DOC/DOCX, 5 MB limit; anon upload + authenticated read/delete
  - `school-logo` — school logo (SchoolInfoSection) AND landing identity photos under folder prefixes `principal/`, `about/`, `team/` (Settings > Website via `lib/uploadSchoolMedia.ts`); one bucket so no extra setup is needed

## Environment Variables

**Backend** (`.env`):

```
SUPABASE_URL=
SUPABASE_SECRET_KEY=<sb_secret_... from Supabase dashboard → API keys>
FRONTEND_URL=http://localhost:5173
PORT=3000
PORTAL_JWT_SECRET=<min 32 chars, NOT the same as Supabase JWT secret>
```

**Frontend** (`.env`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_... from Supabase dashboard → API keys>
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

### Art Wall

Cork board-style page for pinning student artwork photos. Full implementation details in `/art-wall` skill.

- Backend: `backend/src/routes/artWall.ts` — CRUD + `/by-student/:studentId`; public endpoint in `index.ts`
- Frontend: `pages/art-wall/ArtWallPage.tsx` (cork board grid) + `ArtWallModal` (add/edit) + `ArtworkCard` (rotated card with pushpin)
- Student profile: `StudentArtwork.tsx` — mini art gallery on `/admin/students/:id`
- Landing page: "Our Little Artists" section with masonry layout
- DB: `art_wall` table — `student_name` denormalised (artwork persists if student deleted)
- Storage: `artwork-photos` bucket (public)

### Parent Portal

Parent-facing portal with separate auth. Parents log in with Access Code + 6-digit PIN; one parent account can link to multiple children.

- Auth: `parentAuth.ts` (login/logout) + `parentAuth.ts` middleware (validates JWT, sets `parentId` + `parentChildIds`)
- Data routes: `portal.ts` — read-only access to attendance, fees, announcements, daily reports, portfolio; filtered by parent's linked children
- Parent management: `parents.ts` — CRUD + link/unlink students, access code generation, PIN setting
- Frontend: `/portal/*` routes with `PortalLayout` (child switcher, tab nav), `PortalProtectedRoute`
- Portal tabs: Dashboard, Attendance, Fees, Announcements, Daily Reports, Portfolio
- Admin UI: `GeneratePortalAccessModal` on student profile

### Inquiries

Public enrollment enquiry form on the landing page + admin ticket system.

- Backend: `inquiries.ts` (public POST, rate-limited 5/IP/10min) + `inquiriesAdmin.ts` (authenticated GET with status/date filters, PUT /:id/status)
- Frontend: `InquiryForm.tsx` (landing page) + `InquiriesPage.tsx` (admin table, 20/page, status tabs, date range filters, inline status dropdown)
- Status flow: `new` → `contacted` → `enrolled` / `closed`
- WhatsApp deep link on each row for quick parent follow-up
- DB: `inquiries` table has `status TEXT DEFAULT 'new'` with CHECK constraint

### Daily Reports

Per-student daily activity tracking (meals, nap, toilet, mood, notes).

- Backend: `dailyReports.ts` — GET by date+class, PUT upsert, DELETE soft-delete
- Frontend: `DailyReportsPage.tsx` — inline table with `MoodPicker`, date picker, class filter, "Save All"

### Portfolio

Student learning portfolio with KSPK domain observations and termly report cards.

- Backend: `portfolioEntries.ts` (CRUD) + `portfolioReports.ts` (upsert comments)
- Frontend: `PortfolioReportPage.tsx` (editable report card, auto-saves on blur) + `PortfolioReportPDF.tsx` (@react-pdf/renderer download)
- Student profile: portfolio tab with domain-grouped entries + "View Report Card" button

### Student Timeline

Unified chronological activity feed on the student profile page. Aggregates events from 6 data sources into one paginated stream.

- Backend: `GET /students/:id/timeline` — parallel `Promise.all` across attendance, portfolio entries, art wall, fee records, portfolio reports, daily reports. Cursor-based pagination (`before` param). Each query hits `student_id` index, returns max `limit+1` rows — scales to 100K+ records per table.
- Frontend: `StudentTimeline.tsx` — `useInfiniteQuery` with "Load more" button. Events grouped by month, color-coded cards with left border per type. Attendance streaks collapsed ("Present for 5 days" instead of 5 separate entries). Icon tooltips translated via `useT()`.
- Types: `TimelineEvent { type, date, title, subtitle? }` in `packages/types`
- Event types: `attendance` (green), `portfolio` (purple), `artwork` (pink), `fee_payment` (orange), `report_card` (blue), `daily_report` (yellow)

### Finance Documents

Printable finance documents — invoices, overdue notices, enrollment letters, collection sheets, monthly/annual reports, payment ledger. Full implementation details in `/finance-docs` skill.

## Remaining Backlog (prioritised)

### Completed

- [x] Real-time attendance updates — `hooks/useAttendanceRealtime.ts`
- [x] Parent portal — access code + PIN login, JWT sessions, 8 portal tabs (dashboard hub, attendance, fees, announcements, daily reports, portfolio, medical, incidents)
- [x] Parent-level accounts — one parent → multiple children, child switcher bottom sheet
- [x] Art Wall — cork board page, landing page section, student profile integration
- [x] Inquiries — public enrollment form + admin review page with status flow
- [x] Audit trail + soft delete — all business tables have audit columns
- [x] Finance documents — invoice, overdue notice, enrollment letter, collection sheet, monthly/annual reports, payment ledger
- [x] Student status (active/graduated/inactive) — filters, dashboard scoped to active
- [x] Class academic year + graduation — Graduate Class modal, class status filter
- [x] Student activity timeline — cursor-paginated feed from 7 data sources
- [x] Sidebar nav grouping + collapsible sidebar
- [x] Attendance class filter
- [x] Admin Parents page — full CRUD, parent detail modal, link/unlink children
- [x] Medical profiles — blood type, allergies, medications, vaccinations, emergency contacts, doctor info
- [x] Incident reports — admin CRUD + student profile tab + portal read-only view
- [x] Careers module — job postings (draft/published/closed), applications with resume upload, landing page section with detail modal
- [x] Dashboard performance — SQL aggregation via PostgreSQL RPC functions, ~30s → ~500ms at 500K scale
- [x] Attendance heatmap on student profile
- [x] Dashboard charts (recharts) — attendance trend + fee collection
- [x] Print-friendly attendance sheet
- [x] PWA / installable app
- [x] Global search (Cmd+K)

### Quick Wins

- [ ] School calendar — events, holidays, term dates; show on portal; simple CRUD + public endpoint
- [ ] Audit log viewer UI — data already in DB, just needs an admin page to browse/search/filter audit trail
- [ ] Waitlist management — add `waitlisted` to inquiry status flow (new → contacted → waitlisted → enrolled/closed)
- [ ] Graduation certificates — auto-generated PDF with school branding (similar to PortfolioReportPDF pattern)
- [ ] Award/achievement badges — "Star Reader", "Kind Friend" etc, visible on student profile + portal

### Medium Priority

- [ ] Newsletter/Posts module — full-page TipTap WYSIWYG editor (StarterKit), draft/published states, auto-slug from title, cover image + photo gallery strip, public `/posts` listing + `/posts/:slug` reader pages, DOMPurify or `sanitize-html` for HTML sanitization on save; separate from Announcements (short notices stay as-is)
- [ ] Simple Mode (home childcare profile) — a `business_type` field in `school_info` (`'kindergarten' | 'home_childcare'`); `useBusinessType()` hook reads it; toggleable in Settings. Changes: hides Classrooms module (sidebar + route), hides `class_name` on student form (defaults to single auto-created group), removes class filter on Attendance, landing page swaps content via per-mode translation key maps (hero copy, stats labels, feature cards, CTA text), sidebar nav filtered by `item.modes`. Backend unchanged — classrooms just go unused.
- [ ] Role-based access (superadmin vs teacher) — `AdminUser.role` type already defined, needs RBAC middleware + permission checks per route
- [ ] Email notifications to parents for absences (Supabase Edge Functions or Resend)
- [ ] Sentry crash logging — `@sentry/react` on frontend, Sentry Bun SDK on backend
- [ ] Staff management — employee records, roles, leave tracking, clock-in/out
- [ ] Milestone checklists — KSPK 2026 developmental milestones per student per term (extends portfolio)
- [ ] QR code check-in/out — parent scans at drop-off/pickup, logs exact time + who picked up
- [ ] Pickup authorization — registered list of who is allowed to pick up each child, photo ID, one-time guest passes
- [ ] In-app parent-teacher messaging — scoped per child, not a free-for-all
- [ ] Push notifications (PWA) — service worker exists, needs notification API + triggers (attendance, fees, announcements)
- [ ] Meal planning / menu management — weekly menu displayed on portal, ties into daily report meals
- [ ] Digital consent forms — field trip permission, photo usage, medical consent, e-signature
- [ ] Parent-teacher conference booking — time slot picker, auto-confirmed
- [ ] Progress dashboard — visual charts showing growth across KSPK domains over time
- [ ] Auto-absence alerts — if not marked present by 9:30am, parent gets notified
- [ ] Bulk WhatsApp broadcast — templates for fee reminders, event invites (WhatsApp Business API)
- [ ] Event RSVP — parents confirm attendance for school events through portal
- [ ] Online enrollment form — full application (beyond inquiry), document uploads, auto-creates student on approval
- [ ] Referral tracking — "referred by" field on inquiries, track which parents bring new families
- [ ] Full data export/backup — ZIP download of all school data (compliance, peace of mind)

### Growth & Health Tracking

- [ ] Growth chart — height/weight tracking over time with percentile curves
- [ ] Hydration tracker — glasses of water per day (ties into daily report)
- [ ] Diaper change log — for nursery/younger kids (time, type, notes)
- [ ] Sleep pattern analytics — visualize nap trends from daily reports data
- [ ] Allergy alert badges — prominent warning on student cards, attendance, daily reports

### Teacher Tools

- [ ] Lesson plan builder — weekly planner tied to KSPK domains, shareable between teachers
- [ ] Class rotation schedule — auto-generate timetables for shared spaces (playground, art room, music room)
- [ ] Substitute teacher quick-access — one-page summary per class (special needs, allergies, routines)
- [ ] Professional development log — training hours, certifications, expiry dates
- [ ] Voice notes for daily reports — teachers record audio instead of typing

### Communication & Community

- [ ] Parent satisfaction surveys — periodic anonymous surveys, results dashboard
- [ ] Suggestion box — anonymous parent submissions, admin review
- [ ] Class-specific updates — photo + text updates per class (like a private story)
- [ ] Lost and found board — photo + description, claimed/unclaimed status
- [ ] Carpool matching — parents in same area opt-in, system suggests matches

### Events & Activities

- [ ] Sports day module — event registration, scoring, leaderboards, printable certificates
- [ ] Concert/performance planner — role assignments, rehearsal schedule, seating chart
- [ ] Field trip planner — itinerary, cost breakdown, permission slip generation, headcount
- [ ] Year-end slideshow generator — auto-compile photos from gallery + art wall + daily reports per student
- [ ] Student of the week/month — spotlight card on portal dashboard + landing page

### Finance Extras

- [ ] Late fee auto-calculation — configurable grace period + daily/weekly penalty rate
- [ ] Payment plan installments — split fee into monthly instalments with auto-reminders
- [ ] Expense tracking — school-side expenditure (supplies, maintenance, utilities) for profit/loss view
- [ ] Scholarship/subsidy tracking — tag students with financial aid, offset against fees
- [ ] Petty cash log — small daily expenses with receipt photo upload

### Operations

- [ ] Visitor management — sign-in/out log with photo, purpose, who they're visiting
- [ ] Maintenance request tracker — teachers submit requests, admin assigns + tracks
- [ ] Supply request system — teachers request materials, admin approves + tracks budget
- [ ] Classroom/facility booking — shared spaces (hall, playground) time-slot calendar
- [ ] Vendor/supplier directory — contact list, order history, payment tracking

### Parent Portal Extras

- [ ] School supply checklist — per-class list, parents tick off what they've prepared
- [ ] Uniform ordering — size selection, quantity, integrated with fee system
- [ ] Homework/activity log — simple task list per child, parents mark complete
- [ ] Reading log — books read tracker with star ratings, builds a "library" per child
- [ ] Learning resources — curated links/PDFs/videos per KSPK domain for home activities

### Marketing & Retention

- [ ] Alumni tracking — graduated students, where they went, birthday greetings
- [ ] Google Reviews widget — pull and display on landing page
- [ ] Social media auto-post — publish announcements/gallery to Facebook/Instagram automatically
- [ ] School newsletter email — Resend/Mailchimp integration, template builder

### Malaysian-Specific

- [ ] JPNJ/JPN reporting — auto-generate enrollment reports for state education department
- [ ] KWAPM subsidy tracking — tag eligible students, track disbursement
- [ ] MyInvois integration — e-invoicing for schools hitting RM1M threshold (mandatory 2025)
- [ ] Hari Raya/CNY/Deepavali calendar templates — pre-built holiday announcements
- [ ] Dual-language report cards — auto-generate in both BM and EN

### AI-Powered (Future)

- [ ] Smart attendance — face recognition at gate camera
- [ ] Photo auto-tagging — detect which students are in a group photo
- [ ] Daily report auto-suggestions — AI drafts based on mood + activity patterns
- [ ] Developmental insight summaries — AI analyzes portfolio entries, flags areas needing attention
- [ ] Smart scheduling — auto-generate optimal class timetables based on constraints

### Big / Future

- [ ] Multi-tenant (SaaS) — add `schools` table + `school_id` FK on every resource table (row-level isolation); tenant resolved from subdomain or path (`schoolA.kindercare.app`); auth scoped per school; storage paths `bucket/{school_id}/...`; RLS rewritten to scope all queries by `school_id`. See Option A (data-driven) approach.
- [ ] Per-school landing page — current LandingPage is already data-driven; add `hero_title`, `hero_subtitle`, `cta_text`, `primary_color` to `school_info`/`school_branding`; scope public API calls by school slug. Phase 2: curated theme variants (`LandingTheme = 'default' | 'minimal' | 'modern'`) — each a different section layout using the same data.
- [ ] Plan-based feature gating — `plan` (`'free'|'basic'|'pro'`) + `plan_expires_at` columns on `schools` table. Backend: `PLAN_LIMITS` config (free: 20 students / 1 class / no exports; basic: unlimited / all core; pro: + custom landing + custom domain). Enforce at creation routes (count + reject), export routes (403), auth middleware (expiry check). Frontend: disabled buttons with upgrade tooltip, usage counter on dashboard ("18/20 students"), expiry banner at 7 days. Payment collection manual at first (bank transfer / ToyyibPay link, admin updates `plan_expires_at`); automate with ToyyibPay/Billplz webhooks at ~30+ schools.

## Admin Bear (Sidebar Easter Egg)

Full implementation details — eye states, idle machine timing, critical timer pattern, bubble positioning, mobile vs desktop rules — live in the `/build-a-bear` skill (`.claude/commands/build-a-bear.md`). Use `/build-a-bear` whenever modifying the bear mascot.

## Known Conventions

- **Git commit messages — short and concise**: one-line subject only, no lengthy description body, no `Co-Authored-By` trailer. Match the style of recent commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:` prefix + brief subject).

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
- **No `as any` type casts** — never use `as any` to silence TypeScript errors. Fix the underlying type instead. If a type is missing a field, extend it properly (e.g. add `code?: string` to the error type rather than casting the whole object to `any`).
- No emojis anywhere in the codebase — not in UI, not in console.log, not in comments, not in documentation. Use lucide-react icons instead.
- **Brand name** (`APP_NAME`) and **version** (`APP_VERSION`) are exported from `frontend/src/lib/version.ts` — the single source of truth. Never hardcode the school name anywhere else; always import and reference `APP_NAME`.
- **All new routes must use audit helpers**: `auditCreate(c)` on INSERT, `auditUpdate(c)` on UPDATE, `auditDelete(c)` for soft-delete, `auditUpsert(c)` for UPSERT. All SELECT queries on soft-deletable tables must include `.is('deleted_at', null)`.
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
- **No `console.log` in backend routes** — use `logger` from `lib/logger.ts` (pino). `logger.error({ error: error.message }, 'context')` for errors, `logger.info()` for informational. Route files never use `console.log`.
- **Generic error messages to clients** — never expose `error.message` from Supabase/PostgreSQL in API responses. Log the real error with `logger.error()`, return a human-friendly generic message: `c.json({ error: 'Failed to fetch students' }, 500)`. Postgres errors can leak table names, column names, and constraint details.
- **UUID validation on path params** — all route handlers using `:id` or `:studentId` params must validate with `isValidUUID()` from `lib/validation.ts` before querying. Return 400 on invalid UUID, not 500 from Postgres.
- **Public endpoints must use explicit SELECT columns** — never `.select('*')` on public-facing (anon) queries. Always list columns explicitly and exclude audit columns (`created_by`, `modified_by`, `deleted_by`, `deleted_at`, `modified_at`) to prevent leaking admin user IDs.
- **Rate limiting on public POST endpoints** — all unauthenticated POST routes (inquiries, job applications, portal login) must have rate limiting using the in-memory Map pattern. Typical limits: 3-10 requests per IP per 10 minutes.
- **Storage bucket path scoping** — anon upload RLS policies must scope uploads to a specific folder prefix (e.g. `(storage.foldername(name))[1] = 'applications'`). Never allow unrestricted bucket-wide uploads from anonymous users.
- **Audit columns are UUID type** — `created_by`, `modified_by`, `deleted_by` columns store Supabase Auth UUIDs and must be typed as `UUID`, not `TEXT`.
- **SQL migrations must use transactions** — wrap every migration in `BEGIN;` ... `COMMIT;` so that if any statement fails, PostgreSQL rolls back all changes automatically. No partial migrations.
