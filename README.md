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
│       │   └── galleryStore.ts
│       ├── hooks/            # Auth context
│       ├── lib/              # API client (Axios)
│       └── types/            # Shared types
│
└── supabase-schema.sql  # Database schema + RLS policies
```

## State Management Architecture

| Layer | Tool | Responsibility |
|-------|------|---------------|
| Server state | **React Query** | API cache, background refetch, optimistic updates |
| UI state | **Zustand** | Pagination page, search, filters, modal open/close |

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

| Resource | Free Limit |
|----------|-----------|
| Database storage | 500 MB |
| File storage (Storage) | 1 GB |
| Max file upload size | 50 MB |
| Active projects | 2 |
| Backups | None (no point-in-time recovery) |

For a small school this is more than sufficient. Upgrade to the Pro plan if you need backups or expect significant data growth.

---

## Setup

### 1. Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase-schema.sql`
3. Go to **Project Settings → API** and copy:
   - `Project URL` → used as `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - `service_role` secret key → used as `SUPABASE_SERVICE_ROLE_KEY` (backend only, never expose this in frontend)
   - `anon` public key → used as `VITE_SUPABASE_ANON_KEY` (frontend)
4. Go to **Storage** and create two buckets:

   | Bucket name | Public | Used for |
   |-------------|--------|----------|
   | `student-photos` | ON | Student profile photo uploads |
   | `gallery-photos` | ON | Landing page gallery photo uploads |

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

## Pages
| Route | Description |
|-------|-------------|
| `/` | Public landing page (hero, features, gallery, testimonials, CTA) |
| `/admin/login` | Admin authentication |
| `/admin/dashboard` | Stats, today's attendance, monthly summary |
| `/admin/students` | Paginated student list with search & filters |
| `/admin/attendance` | Daily attendance marking with bulk save |
| `/admin/classes` | Classroom management with capacity tracking |
| `/admin/gallery` | Photo gallery management — upload, order, show/hide |

## API Endpoints
| Method | Route | Auth | Query Params |
|--------|-------|------|--------------|
| POST | `/api/auth/login` | Public | — |
| GET | `/api/students` | Required | `page, limit, search, class_name, gender` |
| POST | `/api/students` | Required | — |
| PUT | `/api/students/:id` | Required | — |
| DELETE | `/api/students/:id` | Required | — |
| GET | `/api/attendance/date/:date` | Required | `page, limit, status` |
| POST | `/api/attendance/bulk` | Required | — |
| GET | `/api/attendance/stats/summary` | Required | `month, year` |
| GET | `/api/classes` | Required | `page, limit, search` |
| POST | `/api/classes` | Required | — |
| GET | `/api/public/gallery` | **Public** | — (returns only visible items, ordered) |
| GET | `/api/gallery` | Required | `page, limit, search` |
| POST | `/api/gallery` | Required | — |
| PUT | `/api/gallery/:id` | Required | — |
| DELETE | `/api/gallery/:id` | Required | — |

---

## Roadmap — Feature Ideas

Things that would make this genuinely useful for a real kindergarten.

### Shipped
| Feature | Notes |
|---------|-------|
| Add/Edit student modal | Full form with validation, dark mode, i18n |
| Add/Edit class modal | Full form with validation, dark mode, i18n |
| Dark mode | Tailwind `dark:` class strategy, persisted to localStorage |
| Bahasa Malaysia / English i18n | Full translation map (~90 keys), toggle in sidebar + landing page |
| Student photo upload | Supabase Storage (`student-photos` bucket), file picker with preview |
| Attendance export (CSV) | Frontend-only, date-stamped file download |
| Gallery module | Admin CRUD + public horizontal scroll section on landing page, Supabase Storage (`gallery-photos` bucket), display order + visibility toggle |

### Nice to Have
| Feature | Why | Rough Effort |
|---------|-----|-------------|
| Parent portal | Public-facing page parents log into to see their child's attendance | Large |
| Role-based access | Teachers should only see their assigned class | Medium |
| Email alerts to parents | Auto-email when child is marked absent | Medium |
| Real-time attendance | Supabase Realtime so two teachers don't conflict | Medium |
| Announcements board | School-wide notices on the dashboard | Small |
| Student health notes | Allergies, medical conditions visible to teachers | Small |
| Fee tracking | Track school fees per student, mark as paid/unpaid | Large |
| Report cards | Generate and download PDF report cards per student | Large |
| Mobile app | React Native with Expo — same backend, new frontend | Large |
| Birthday reminders | Dashboard widget showing upcoming student birthdays | Small |

### Technical Improvements
| Improvement | Why |
|------------|-----|
| End-to-end tests (Playwright) | Catch regressions before deployment |
| API rate limiting | Protect backend from abuse |
| Optimistic UI on mutations | Instant feedback on create/delete without waiting for server |
| Error boundary components | Graceful error states per page instead of blank screens |

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

| Type | When to use |
|------|-------------|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `chore:` | Config, deps, tooling — no production code change |
| `refactor:` | Code restructure, no behavior change |
| `style:` | Formatting, styling only |
| `docs:` | README, comments, documentation |
| `test:` | Adding or updating tests |

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
