TRIGGER when: user says /deploy, "deploy", "ship it", "bump version and push", "propagate to develop and main", "merge to main", or asks to release the current branch.

# deploy — Bump, Commit, Push, Propagate

Description: $ARGUMENTS

Releases the current feature branch: bumps the version, commits, pushes, merges into `develop`, then merges `develop` into `main`. Work through every step in order. Stop and report at the first failure; never force-push, never skip the pre-commit hook.

## Step 0 — Preflight

1. Run `git status --short` and `git branch --show-current`.
2. The current branch must be a feature branch (`feat/*`, `fix/*`, `chore/*`). If it is `develop` or `main`, stop and ask which branch to release.
3. Note whether there are uncommitted changes. If the tree is clean AND the branch has no commits ahead of `origin/develop`, say there is nothing to release and stop.
4. Read the current version from `frontend/public/version.json`.

## Step 1 — Pick the New Version

Format is `MAJOR.MINOR.PATCH-alphaN`. Follow the pattern in `git log --oneline --grep="bump version"`:

- **New feature or module** → bump MINOR, reset PATCH, `-alpha1` (e.g. `1.11.0-alpha1` → `1.12.0-alpha1`)
- **Fix / polish only** → bump PATCH (e.g. `1.12.0-alpha1` → `1.12.1-alpha1`)
- If `$ARGUMENTS` names a version, use it verbatim.

State the chosen version and why in one line before continuing.

## Step 2 — Commit the Work (if the tree is dirty)

Skip this step when the tree is already clean.

1. `git add -A`
2. Commit with a one-line message in the repo's style: `feat:` / `fix:` / `chore:` / `refactor:` prefix plus a short subject. **No body, no `Co-Authored-By` trailer** (CLAUDE.md rule).
3. The lefthook pre-commit hook runs lint-staged, all tests, and typecheck. Wait for it. Lines like `error: "RPC failed"` in the output are mocked test logs, not failures; look at the `N fail` count and the `✔️ / ✖` summary. If anything fails, fix it and re-commit; do not use `--no-verify`.

## Step 3 — Bump the Version

Both files must change together (Vite cannot import from `public/`, so they cannot share a source):

- `frontend/src/lib/version.ts` → `export const APP_VERSION = '<new>'`
- `frontend/public/version.json` → `{ "version": "<new>" }`

Then commit them alone: `chore: bump version to <new>` (same one-line rule, hook runs again).

## Step 4 — Push the Feature Branch

```bash
git push origin <feature-branch>
```

## Step 5 — Propagate to develop

```bash
git checkout develop
git pull origin develop
git merge --no-edit <feature-branch>
git push origin develop
```

If the merge reports conflicts, stop, list the conflicting files, and ask the user how to resolve. Do not resolve conflicts silently.

## Step 6 — Propagate to main

```bash
git checkout main
git pull origin main
git merge --no-edit develop
git push origin main
```

Same conflict rule as Step 5.

## Step 7 — Report

Show `git log --oneline -3` and confirm all three pushes with their `old..new` ranges. Then list any **manual follow-ups** the release needs, checking for:

- New files in `supabase/migrations/` since the last version bump → "run migration X in the Supabase SQL editor"
- New files in `supabase/seeds/` → optional seed to run
- New storage bucket mentioned in CLAUDE.md or a migration → "create bucket X (public) in the dashboard"
- New env vars added to the zod schema in `backend/src/index.ts` → "set X in production env"

Finish on `main` unless the user asked to stay on the feature branch.

## Gotchas

- The hook takes 15 to 30 seconds per commit. Use a long Bash timeout (300000+) so it is not cut off mid-run.
- `git pull` on `develop` / `main` before merging is mandatory; other people push there.
- Version bump is always its own commit, after the feature commit, matching the history.
- The `main-backup` remote branch is not part of this flow; leave it alone.
