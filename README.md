# KinderCare Management System

Full-stack kindergarten management app for managing students, classes, attendance, fees, and parent communication.

**Stack:** Bun + Hono + React + TypeScript + Tailwind CSS + Supabase

## Quick Start

```bash
# Install all workspaces + git hooks (once, from root)
bun install

# Backend
cd backend && cp .env.example .env   # fill in Supabase credentials
bun dev                               # http://localhost:3000

# Frontend
cd frontend && cp .env.example .env   # fill in Supabase credentials
bun dev                               # http://localhost:5173
```

## Environment Variables

**Backend** (`backend/.env`)

```
SUPABASE_URL=
SUPABASE_SECRET_KEY=         # sb_secret_... from Supabase dashboard → API keys
FRONTEND_URL=http://localhost:5173
PORT=3000
PORTAL_JWT_SECRET=           # min 32 chars, for parent portal JWT
```

**Frontend** (`frontend/.env`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=  # sb_publishable_... from Supabase dashboard → API keys
```

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run migrations in order from `supabase/migrations/` via the SQL Editor
3. Create these **public** storage buckets:

| Bucket                 | Used for                     |
| ---------------------- | ---------------------------- |
| `student-photos`       | Student profile photos       |
| `gallery-photos`       | Landing page gallery         |
| `announcement-banners` | Announcement banners         |
| `testimonial-avatars`  | Testimonial avatars          |
| `artwork-photos`       | Art wall artwork             |
| `portfolio-photos`     | Portfolio entries            |
| `resumes`              | Job applications             |
| `school-logo`          | School branding              |
| `payment-proofs`       | Fee payment proofs (private) |

## Project Structure

```
kindergarten-app/
├── backend/src/
│   ├── index.ts              # Hono app entry
│   ├── routes/               # 20+ route files (students, fees, portal, etc.)
│   ├── middleware/            # auth.ts (admin JWT), parentAuth.ts (portal JWT)
│   ├── lib/                  # audit.ts, sanitise.ts, logger.ts, fees.ts
│   └── db/supabase.ts
├── frontend/src/
│   ├── pages/                # 20+ page folders
│   ├── components/           # ui/, admin/, layout/, portal/, landing/
│   ├── store/                # Zustand stores (UI state only)
│   ├── hooks/                # Auth, i18n, school info, realtime
│   └── lib/                  # API client, translations, utils
├── packages/types/           # Shared TypeScript types
└── supabase/migrations/      # SQL migrations (run in order)
```

## Architecture

| Layer        | Tool                                       | Role                                          |
| ------------ | ------------------------------------------ | --------------------------------------------- |
| Runtime      | Bun                                        | Backend runtime + package manager             |
| Backend      | Hono                                       | REST API with Zod validation                  |
| Frontend     | React + Vite                               | SPA with code splitting                       |
| Styling      | Tailwind CSS                               | Nunito font, custom kinder-\* palette         |
| Server state | React Query                                | Cache, background refetch, optimistic updates |
| UI state     | Zustand                                    | Page, search, filters, modal state            |
| Database     | Supabase                                   | PostgreSQL + Auth + Storage                   |
| Auth         | Supabase Auth (admin), custom JWT (portal) | Bearer token                                  |

## Modules

### Admin

| Module           | Description                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| Dashboard        | Stats, fee summary, attendance/fee trend charts, today's birthdays              |
| Students         | CRUD, profile page, attendance heatmap, activity timeline, bulk CSV import      |
| Classes          | CRUD, capacity tracking, academic year, class graduation                        |
| Parents          | CRUD, link/unlink children, access code + PIN for portal                        |
| Attendance       | Bulk mark by date, status filters, CSV export, print sheet, realtime sync       |
| Daily Reports    | Per-student meals, nap, toilet, mood, notes by date                             |
| Fees             | Plans, records, payments, receipt numbering, statement, invoice, overdue notice |
| Finance Reports  | Class collection sheet, monthly report, annual report, payment ledger           |
| Portfolio        | Domain observations, termly report card editor, PDF download                    |
| Medical Profiles | Blood type, allergies, medications, vaccinations, emergency contacts            |
| Incidents        | Type, severity, action taken, parent notification, photo evidence               |
| Announcements    | Categories, pinned, expiry, banner image                                        |
| Gallery          | Photo upload, display order, visibility toggle, lightbox                        |
| Art Wall         | Cork board layout, student tagging, tilt angle, pushpin colors                  |
| Testimonials     | Parent quotes, avatar, visibility, display order                                |
| Inquiries        | Admin review table, status flow (new > contacted > enrolled/closed)             |
| Careers          | Job postings (draft/published/closed), applications with resume upload          |
| Settings         | School info + logo, document numbering, dark mode, EN/BM language               |
| Global Search    | Cmd+K command palette, jump to any student or page                              |

### Parent Portal

Separate login (access code + PIN). One parent account can link to multiple children with a child switcher.

| Tab           | Description                                |
| ------------- | ------------------------------------------ |
| Dashboard     | Child overview hub                         |
| Attendance    | Read-only attendance history               |
| Fees          | Payment history and balances               |
| Announcements | School notices                             |
| Daily Reports | Meals, nap, mood, activity notes           |
| Portfolio     | Learning observations and report cards     |
| Medical       | Allergies, medications, emergency contacts |
| Incidents     | Incident reports involving their child     |
| Devices       | Manage active portal sessions              |

### Public (Landing Page)

Hero with animated bear mascot, stat counters, feature cards, gallery with lightbox, art wall preview, announcements, testimonial carousel, enrollment inquiry form, careers section, Google Maps location, WhatsApp button. Fully dark mode aware.

## Code Quality

```bash
bun run lint          # ESLint v9 (flat config)
bun run format        # Prettier
bun run format:check  # Prettier dry-run (CI-safe)
bun run test          # All tests (backend bun:test + frontend vitest)
bun run test:backend  # Backend only
bun run test:frontend # Frontend only
```

Pre-commit hook via `lefthook` runs lint-staged + all tests on every `git commit`.

## Key Conventions

- All business tables have audit columns (`created_by`, `modified_at`, `modified_by`, `deleted_at`, `deleted_by`)
- Soft delete on all business data (`.update(auditDelete(c))` instead of `.delete()`)
- Every SELECT includes `.is('deleted_at', null)`
- All string inputs sanitised via `sanitiseStrings()` before insert
- Public endpoints registered before `authMiddleware` in `index.ts`
- EN/MS translations in `lib/translations.ts` (~160 keys)
- Dark mode via Tailwind `dark:` class strategy, persisted to localStorage
- All pages mobile-responsive with Tailwind breakpoint variants

See [CLAUDE.md](CLAUDE.md) for the full architecture reference, design system, and coding conventions.
