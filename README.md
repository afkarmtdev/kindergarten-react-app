# KinderCare Management System

A full-stack kindergarten management app built with **Bun**, **Hono**, **React**, **TypeScript**, **Zustand**, and **Supabase**.

## Project Structure

```
kindergarten-app/
├── backend/          # Hono API (Bun runtime)
│   └── src/
│       ├── index.ts          # Entry point
│       ├── routes/           # Paginated API routes
│       ├── middleware/       # JWT auth middleware
│       ├── db/               # Supabase client
│       └── types/            # Shared types
│
├── frontend/         # React + Vite + TypeScript
│   └── src/
│       ├── pages/            # Route pages
│       ├── components/
│       │   ├── ui/           # Skeleton, Pagination, SearchBar
│       │   └── layout/       # AdminLayout, ProtectedRoute
│       ├── store/            # Zustand stores (UI state)
│       │   ├── studentsStore.ts
│       │   ├── classesStore.ts
│       │   ├── attendanceStore.ts
│       │   ├── galleryStore.ts
│       │   ├── announcementsStore.ts
│       │   └── settingsStore.ts
│       ├── hooks/            # Auth context + translation hook
│       ├── lib/              # API client (Axios), translations, Supabase browser client
│       └── types/            # Shared types
│
└── supabase/
    ├── migrations/      # Numbered schema migrations (run in order)
    └── seeds/           # Sample/test data
```

## State Management Architecture

| Layer        | Tool            | Responsibility                                     |
| ------------ | --------------- | -------------------------------------------------- |
| Server state | **React Query** | API cache, background refetch, optimistic updates  |
| UI state     | **Zustand**     | Pagination page, search, filters, modal open/close |

**React Query** is keyed by `[resource, { page, search, filters }]` so each unique filter combination is independently cached — switching filters or pages shows stale data instantly while new data loads in the background (`placeholderData`).

**Zustand stores** hold ephemeral UI state (which page you're on, what you've typed in search, unsaved attendance changes) that should reset only when explicitly cleared — not on re-renders.

## Prerequisites

Install these on your machine before anything else.

### 1. Bun `>= 1.1.0`

Bun is the runtime and package manager for both frontend and backend.

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify: `bun --version`

### 2. Node.js `>= 20.0.0` (LTS)

Vite requires Node.js under the hood even though we use Bun as the package manager.
Download from [nodejs.org](https://nodejs.org/en/download) — choose the **LTS** installer for your OS.

Verify: `node --version`

> **Note:** If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm install --lts && nvm use --lts`.

### 3. Git `>= 2.x`

Likely already installed. Check with `git --version`. If not, download from [git-scm.com](https://git-scm.com).

---

## Key Package Versions

These are the versions this project was built and tested with. `bun install` will resolve them automatically from `package.json`.

**Backend**
| Package | Version |
|---------|---------|
| hono | ^4.4.0 |
| @hono/zod-validator | ^0.2.2 |
| @supabase/supabase-js | ^2.44.0 |
| zod | ^3.23.0 |
| typescript | ^5.4.0 |

**Frontend**
| Package | Version |
|---------|---------|
| react | ^18.3.1 |
| react-dom | ^18.3.1 |
| react-router-dom | ^6.24.0 |
| @tanstack/react-query | ^5.45.0 |
| zustand | ^4.5.2 |
| axios | ^1.7.0 |
| zod | ^3.23.0 |
| tailwindcss | ^3.4.4 |
| vite | ^5.3.1 |
| typescript | ^5.4.5 |
| date-fns | ^3.6.0 |
| lucide-react | ^0.395.0 |

---

## Supabase Free Plan Limits

This project runs on the **Supabase free tier**. Keep these limits in mind:

| Resource               | Free Limit                       |
| ---------------------- | -------------------------------- |
| Database storage       | 500 MB                           |
| File storage (Storage) | 1 GB                             |
| Max file upload size   | 50 MB                            |
| Active projects        | 2                                |
| Backups                | None (no point-in-time recovery) |

For a small school this is more than sufficient. Upgrade to the Pro plan if you need backups or expect significant data growth.

---

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run each file in `supabase/migrations/` in order (001, 002, ...)
3. Go to **Project Settings → API** and copy:
   - `Project URL` → used as `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - `service_role` secret key → used as `SUPABASE_SERVICE_ROLE_KEY` (backend only, never expose this in frontend)
   - `anon` public key → used as `VITE_SUPABASE_ANON_KEY` (frontend)
4. Go to **Storage** and create three buckets:

   | Bucket name            | Public | Used for                           |
   | ---------------------- | ------ | ---------------------------------- |
   | `student-photos`       | ON     | Student profile photo uploads      |
   | `gallery-photos`       | ON     | Landing page gallery photo uploads |
   | `announcement-banners` | ON     | Announcement banner image uploads  |

### 2. Backend

```bash
cd backend
cp .env.example .env   # Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
bun install
bun dev                # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
bun install
bun dev                # http://localhost:5173
```

### 4. Install Workspace Dependencies & Git Hooks

Run once from the **project root** after cloning:

```bash
bun install   # installs all workspace packages + runs `lefthook install` to wire the pre-commit hook
```

From now on every `git commit` automatically lints and formats only your staged files.

### Code Quality

Run these from the **project root**:

```bash
bun run lint          # ESLint across frontend/src, backend/src, packages
bun run format        # Prettier — rewrite all files in place
bun run format:check  # Prettier — dry-run check (safe for CI)
```

## Pages

| Route                  | Description                                                               |
| ---------------------- | ------------------------------------------------------------------------- |
| `/`                    | Public landing page (hero, features, gallery, notices, testimonials, CTA) |
| `/admin/login`         | Admin authentication                                                      |
| `/admin/dashboard`     | Stats, today's attendance, monthly summary                                |
| `/admin/students`      | Paginated student list with search & filters                              |
| `/admin/students/:id`  | Student profile — attendance history, quick stats, inline edit            |
| `/admin/attendance`    | Daily attendance marking with bulk save                                   |
| `/admin/classes`       | Classroom management with capacity tracking                               |
| `/admin/gallery`       | Photo gallery management — upload, order, show/hide                       |
| `/admin/announcements` | Notice board — categories, pinned flag, expiry date, banner image         |

## API Endpoints

| Method | Route                           | Auth       | Query Params                              |
| ------ | ------------------------------- | ---------- | ----------------------------------------- |
| POST   | `/api/auth/login`               | Public     | —                                         |
| POST   | `/api/auth/logout`              | Required   | —                                         |
| GET    | `/api/auth/me`                  | Required   | —                                         |
| GET    | `/api/students`                 | Required   | `page, limit, search, class_name, gender` |
| POST   | `/api/students`                 | Required   | —                                         |
| POST   | `/api/students/bulk`            | Required   | —                                         |
| PUT    | `/api/students/:id`             | Required   | —                                         |
| DELETE | `/api/students/:id`             | Required   | —                                         |
| GET    | `/api/attendance/date/:date`    | Required   | `page, limit, status`                     |
| POST   | `/api/attendance/bulk`          | Required   | —                                         |
| GET    | `/api/attendance/stats/summary` | Required   | `month, year`                             |
| GET    | `/api/classes`                  | Required   | `page, limit, search`                     |
| POST   | `/api/classes`                  | Required   | —                                         |
| PUT    | `/api/classes/:id`              | Required   | —                                         |
| DELETE | `/api/classes/:id`              | Required   | —                                         |
| GET    | `/api/public/gallery`           | **Public** | — (visible items only, ordered)           |
| GET    | `/api/gallery`                  | Required   | `page, limit, search`                     |
| POST   | `/api/gallery`                  | Required   | —                                         |
| PUT    | `/api/gallery/:id`              | Required   | —                                         |
| DELETE | `/api/gallery/:id`              | Required   | —                                         |
| GET    | `/api/public/announcements`     | **Public** | — (non-expired only, pinned first)        |
| GET    | `/api/announcements`            | Required   | `page, limit, search, category`           |
| POST   | `/api/announcements`            | Required   | —                                         |
| PUT    | `/api/announcements/:id`        | Required   | —                                         |
| DELETE | `/api/announcements/:id`        | Required   | —                                         |

---

## Roadmap — Feature Ideas

Things that would make this genuinely useful for a real kindergarten.

### Shipped

| Feature                        | Notes                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Add/Edit student modal         | Full form with validation, dark mode, i18n                                                                                                                                     |
| Add/Edit class modal           | Full form with validation, dark mode, i18n                                                                                                                                     |
| Dark mode                      | Tailwind `dark:` class strategy, persisted to localStorage                                                                                                                     |
| Bahasa Malaysia / English i18n | Full translation map (~90 keys), toggle in sidebar + landing page navbar                                                                                                       |
| Student photo upload           | Supabase Storage (`student-photos` bucket), file picker with preview                                                                                                           |
| Attendance export (CSV)        | Frontend-only, date-stamped file download                                                                                                                                      |
| Gallery module                 | Admin CRUD + public horizontal scroll section on landing page; Supabase Storage (`gallery-photos` bucket); display order + visibility toggle                                   |
| Announcements / notice board   | Admin CRUD; categories (General/Holiday/Event/Reminder), pinned flag, expiry date, banner image upload (`announcement-banners` bucket); public Notices section on landing page |
| Student profile page           | Individual attendance history (paginated 15/page), quick stats strip, inline edit via StudentModal                                                                             |
| Bulk CSV import                | 3-step modal (upload → preview → result); client-side CSV parse; invalid rows highlighted and skipped; sample CSV download; backend `POST /api/students/bulk`                  |
| Mobile-responsive layout       | Hamburger drawer on admin; responsive paddings, headings, and grids on all pages; responsive landing page hero, sections, and navbar                                           |
| Toast notifications            | `sonner` library; success/error toasts on all create, update, delete, and save mutations                                                                                       |
| Error boundaries               | `ErrorBoundary` class component wraps every admin page; shows "Try again" reset card on uncaught render errors                                                                 |
| Backend security               | Rate limiting (login 10/IP/min), input sanitisation (`stripHtml`/`sanitiseStrings`), env validation (zod at startup), HTTP security headers                                    |
| Structured backend logging     | `pino` + `pino-pretty` in dev; JSON output in production; used in error handler and startup                                                                                    |

---

## Technical Improvements Backlog

Engineering tasks that improve reliability, performance, and maintainability — no new user-facing features.

### Error Handling & Observability

- [x] **Toast notifications** — `sonner` installed; success/error toasts on all create, update, delete, and save mutations across Students, Classes, Gallery, Attendance, and BulkImport.
- [x] **Error boundaries** — `ErrorBoundary` class component wraps every admin page route in `App.tsx`; broken pages show a "Try again" card instead of blanking the whole portal.
- [ ] **Crash logging (Sentry)** — integrate Sentry on both frontend (`@sentry/react`) and backend to capture unhandled exceptions and performance traces in production.
- [x] **Structured backend logging** — `pino` + `pino-pretty` installed; unhandled errors logged via `logger.error` with request path/method; startup uses `logger.info`.

### Security

- [x] **Rate limiting** — simple in-memory rate limiter on `POST /api/auth/login`: 10 attempts per IP per 60-second window, returns HTTP 429 when exceeded.
- [x] **Input sanitisation** — `stripHtml` helper strips `<tags>` from all free-text string fields before Supabase insert/update (students, classes, gallery caption).
- [x] **Environment variable validation** — zod schema validated at server startup; missing/malformed vars print a clear error and `process.exit(1)` before the server starts.
- [x] **HTTP security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` added via Hono middleware on every response.

### Performance

- [x] **Code splitting** — each admin page is `React.lazy()` + `<Suspense fallback={<CuteLoader />}>`; LandingPage and LoginPage remain eager. Each page is its own JS chunk (6–17 kB).
- [x] **Image optimisation** — Canvas API compression in `frontend/src/lib/compressImage.ts`; applied before every Supabase Storage upload in StudentModal, GalleryModal, and AnnouncementModal. Max 1200px wide, JPEG 0.82 quality. No new dependencies.
- [x] **Query prefetching** — `useEffect` + `queryClient.prefetchQuery` on all 4 list pages (Students, Classes, Gallery, Announcements); prefetches page+1 whenever current page data loads.

### Type Safety & API Contract

- [x] **Shared types package** — `packages/types/index.ts` in a Bun workspace (`@kindergarten/types`). Both `frontend/src/types/index.ts` and `backend/src/types/index.ts` are now thin re-exports. Single source of truth for `Student`, `AttendanceRecord`, `ClassRoom`, `GalleryItem`, `Announcement`, `AttendanceSummary`, `AdminUser`.
- [ ] **API response validation** — use Zod to validate every request body on the backend, and `zodios` on the frontend to validate API responses at the boundary.

### Testing

- [ ] **E2E tests (Playwright)** — cover critical paths: login → mark attendance → export CSV; add student → verify in list; bulk CSV import with mixed valid/invalid rows.
- [ ] **Unit tests for utilities** — `parseCsv`, `validateRow`, and `downloadSample` in `BulkImportModal` are pure functions — straightforward to test with `bun:test`.

### Developer Experience

- [ ] **Docker Compose setup** — `docker-compose.yml` so new contributors can `docker compose up` and get a local environment without manual setup.
- [x] **Pre-commit lint + format** — ESLint v9 (flat config) + Prettier 3 wired via `lefthook` + `lint-staged`; only staged files are checked on commit; `bun run lint` / `bun run format` available at the root.
- [ ] **CI pipeline** — GitHub Actions workflow: install → type-check → lint → run unit tests on every PR.

---

## Feature Ideas — Grouped by Who Benefits

### For Admins & Management

- [x] **Announcements / notice board** — `/admin/announcements` full CRUD page; categories (General/Holiday/Event/Reminder), pinned flag, expiry date, banner image upload; public Notices section on LandingPage (hidden when no active announcements).
- [ ] **Fee tracking** — record monthly fee payments per student; flag overdue accounts; export a payment summary.
- [ ] **Events calendar** — a shared school calendar (sports day, field trips, parent-teacher meetings) visible to staff and optionally to parents.
- [ ] **Monthly attendance report PDF** — auto-generate a per-student or per-class PDF showing attendance rate and present/absent breakdown; downloadable from the dashboard or student profile page.
- [ ] **Role-based access** — the DB schema already has `AdminUser.role`; implement `superadmin` vs `teacher` so teachers can only mark attendance for their own class and cannot add/delete students.
- [ ] **Audit / activity log** — record who changed what and when for accountability (e.g. "attendance changed from absent → present by teacher@school.com at 9:14 am").
- [ ] **Dashboard charts** — monthly attendance trend line + class breakdown pie chart using `recharts`; gives management a visual overview at a glance.
- [ ] **Live stats on landing page** — pull real numbers from the DB (total students enrolled, attendance rate this month, active classes) and animate them counting up on scroll; makes the landing page feel alive.

### For Teachers

- [ ] **Quick attendance from student profile** — mark today's attendance directly from the student profile page, not just from the attendance table.
- [ ] **Class view** — a dedicated page for a single class showing its roster and today's attendance status so a teacher only sees their own students.
- [ ] **Substitute teacher notes** — a staff-only text field per attendance record (e.g. "doctor letter submitted").
- [ ] **Bulk attendance from class roster** — a "Mark Attendance" shortcut on the Classes page that pre-filters the attendance table to just that class.
- [ ] **QR code attendance** — each student gets a printable QR card; teacher scans it to mark present. Fast for large classes.
- [ ] **Confetti on full attendance** — fire a small confetti burst when all students for the day are marked present; small touch, memorable moment.
- [ ] **Birthday widget on dashboard** — "3 students have birthdays this week" card with their names; gives teachers something to celebrate with kids and parents.
- [ ] **Attendance streak badge on student profile** — "14 days present in a row" badge; gives teachers something to celebrate with students and motivates good habits.
- [ ] **Drag-and-drop gallery reordering** — drag photos into position instead of editing `display_order` manually.

### For Parents

- [ ] **Parent portal** — a read-only view (separate login via PIN or magic link) where a parent can see their child's attendance history without full admin access.
- [ ] **Absence reason submission** — a simple public form where parents submit an absence reason / medical certificate for a specific date; admin sees the reason alongside the attendance record.
- [ ] **WhatsApp notification** — send a WhatsApp message (via Twilio or WhatsApp Business API) when a child is marked absent; more practical than email for most Malaysian parents.
- [ ] **Attendance summary email** — a weekly or monthly digest emailed to parents showing their child's attendance rate and any missed days.

### For Everyone (UX Polish)

- [ ] **Print-friendly attendance sheet** — a CSS `@media print` layout that renders the attendance table cleanly for schools that still want a paper backup.
- [ ] **Mobile-optimised attendance marking** — a swipe-friendly card-based UI for teachers marking attendance on a phone or tablet.
- [ ] **PWA / offline support** — cache the attendance marking page with a service worker so teachers can mark attendance without internet; sync when reconnected.
- [ ] **Real-time attendance updates** — Supabase Realtime subscriptions so changes by one teacher appear live in another tab without a refresh.
- [ ] **Global search (Cmd+K)** — a command palette to jump directly to any student's profile by name from anywhere in the admin portal.
- [ ] **Interactive gallery lightbox** — click a gallery photo to expand it in a smooth overlay instead of a static grid.
- [ ] **Birthday reminders** — a dashboard widget showing upcoming student birthdays this week.

---

## Git Setup Guide

This section covers everything from first-time Git setup to a recommended team workflow.

### 1. Install & Configure Git

If you don't have Git yet:

```bash
# macOS (via Homebrew)
brew install git

# Ubuntu / Debian
sudo apt install git

# Windows — download from https://git-scm.com
```

Verify installation:

```bash
git --version   # Should show git version 2.x.x or higher
```

Set your identity (required before your first commit — this gets recorded in every commit you make):

```bash
git config --global user.name "Your Full Name"
git config --global user.email "you@example.com"
```

Set VS Code as your default editor (optional but recommended):

```bash
git config --global core.editor "code --wait"
```

Verify your config:

```bash
git config --list
```

---

### 2. Initialize the Repository

Navigate to your project root and initialize:

```bash
cd kindergarten-app
git init
```

This creates a hidden `.git/` folder that tracks everything. You only run this once.

---

### 3. Create a .gitignore

This tells Git which files to never track — secrets, dependencies, build output. Create `kindergarten-app/.gitignore`:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment files — NEVER commit these
.env
.env.local
.env.production
backend/.env
frontend/.env

# Build output
dist/
build/
.vite/

# Bun
bun.lockb     # You CAN commit this if you want deterministic installs — team preference
*.bun

# OS files
.DS_Store
Thumbs.db
desktop.ini

# Editor
.vscode/settings.json
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*
bun-error.pid

# TypeScript
*.tsbuildinfo
```

> **Critical:** Never commit `.env` files. They contain your Supabase service role key which gives full database access. The `.env.example` files (with empty values) are safe to commit and should be — they document what variables are needed.

---

### 4. First Commit

Stage everything and make your initial commit:

```bash
git add .
git status          # Review what's being tracked — make sure no .env files appear
git commit -m "feat: initial project scaffold"
```

If you accidentally staged a `.env` file:

```bash
git reset HEAD backend/.env    # Unstage it
```

---

### 5. Connect to GitHub / GitLab

**Create the remote repository** on [github.com](https://github.com/new) — name it `kindergarten-app`, set it to Private, do NOT initialize with a README (you already have one).

Then link it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/kindergarten-app.git
git branch -M main
git push -u origin main
```

After this first push, future pushes just need:

```bash
git push
```

---

### 6. Branching Strategy

Never commit directly to `main`. Use branches for every change.

**Recommended branch naming:**

```
main                    # Production-ready code only
develop                 # Integration branch — merge features here first
feature/student-modal   # New features
fix/attendance-save-bug # Bug fixes
chore/update-deps       # Dependency updates, config changes
```

**Create and switch to a new branch:**

```bash
git checkout -b feature/student-modal
# or the modern equivalent:
git switch -c feature/student-modal
```

**See all branches:**

```bash
git branch -a
```

**Switch between branches:**

```bash
git switch main
git switch develop
git switch feature/student-modal
```

---

### 7. Daily Workflow

This is what every developer on the team does every day:

```bash
# 1. Start of day — get latest changes
git switch develop
git pull origin develop

# 2. Create a branch for your task
git switch -c feature/add-student-form

# 3. Write code...

# 4. Stage your changes
git add .                          # Stage everything
git add src/pages/StudentsPage.tsx # Or stage specific files

# 5. Commit with a meaningful message
git commit -m "feat: add student create/edit modal form"

# 6. Push your branch
git push origin feature/add-student-form

# 7. Open a Pull Request on GitHub to merge into develop
```

---

### 8. Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) — it makes your history readable and can auto-generate changelogs.

**Format:** `type: short description`

| Type        | When to use                                       |
| ----------- | ------------------------------------------------- |
| `feat:`     | A new feature                                     |
| `fix:`      | A bug fix                                         |
| `chore:`    | Config, deps, tooling — no production code change |
| `refactor:` | Code restructure, no behavior change              |
| `style:`    | Formatting, styling only                          |
| `docs:`     | README, comments, documentation                   |
| `test:`     | Adding or updating tests                          |

**Examples:**

```bash
git commit -m "feat: add student photo upload via Supabase Storage"
git commit -m "fix: attendance not saving when date changes"
git commit -m "chore: update hono to 4.5.0"
git commit -m "docs: add Git setup guide to README"
git commit -m "refactor: extract StudentCard into its own component"
```

Keep the description under 72 characters. Use lowercase. No period at the end.

---

### 9. Useful Day-to-Day Commands

```bash
# See what's changed since last commit
git status

# See the actual diff of changes
git diff

# See commit history (pretty format)
git log --oneline --graph --all

# Undo last commit but keep the changes (useful if you forgot something)
git reset --soft HEAD~1

# Discard all uncommitted changes to a file (careful — irreversible)
git checkout -- src/pages/StudentsPage.tsx

# Temporarily save work without committing (useful when switching tasks)
git stash
git stash pop    # Restore stashed changes later

# Pull latest and rebase your branch on top (cleaner history than merge)
git pull origin develop --rebase
```

---

### 10. If You Accidentally Committed Secrets

If you ever commit a `.env` file with real credentials:

```bash
# 1. Remove it from tracking immediately
git rm --cached backend/.env
git commit -m "chore: remove accidentally committed .env file"
git push

# 2. Rotate your credentials IMMEDIATELY
# Go to Supabase → Project Settings → API → Regenerate service_role key
# The old key is compromised and must be treated as such

# 3. Purge from Git history (if the commit was already pushed)
# This is destructive — coordinate with your team first
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

> The safest protection is to add `.env` to `.gitignore` before you write any secrets — which we've already done.

---

### 11. Pull Requests & Code Review

When your feature is ready:

1. Push your branch: `git push origin feature/your-branch`
2. Go to GitHub → your repo → click **"Compare & pull request"**
3. Set **base branch** to `develop` (not `main`)
4. Write a clear PR description:
   - What does this change?
   - How to test it?
   - Any screenshots if UI changed?
5. Request a reviewer
6. After approval → **Squash and merge** into `develop`
7. Delete the branch after merging

When `develop` is stable and tested → open a PR from `develop` → `main` for a production release.

---

### 12. Recommended GitHub Repository Settings

After pushing, configure these in **GitHub → Settings**:

- **Branches → Branch protection rules** on `main`:
  - [x] Require pull request before merging
  - [x] Require at least 1 approval
  - [x] Dismiss stale reviews when new commits are pushed
  - [x] Do not allow bypassing the above settings

- **General → Pull Requests**:
  - [x] Allow squash merging
  - [ ] Disable merge commits (keeps history clean)
  - [ ] Disable rebase merging (optional — team preference)

- **Secrets and variables → Actions**: Add your production env vars here if you set up CI/CD later
