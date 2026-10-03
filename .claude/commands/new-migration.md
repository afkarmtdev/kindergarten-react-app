TRIGGER when: user asks to create a SQL migration, add a database column/table/index, alter schema, add RLS policies, or any task that requires a new .sql file.

# new-migration — Create a Database Migration

Description: $ARGUMENTS

Work through every step in order.

## Step 1 — Name the File With a Timestamp

New migrations use `YYYYMMDDHHMMSS_snake_case_description.sql` (adopted 2026-03-20). The numbered files `001` to `007` are history; never add another numbered one.

List `supabase/migrations/` first and pick a timestamp later than the newest file, so the order is right even when two migrations are made the same day (e.g. `20261003120000_...` exists → use `20261003130000_...`).

Good names describe the change, not the feature:

- `20261003130000_students_legacy_parent_columns_nullable.sql`
- `20260320130000_storage_resumes.sql`

Bad names: `..._update.sql`, `..._fix.sql`, `..._newsletter_feature_with_posts_and_tags.sql`.

## Step 2 — Write the Migration

Create the file at `supabase/migrations/<timestamp>_<name>.sql`.

Rules:

- Start with a comment block: what it does and **why** (the error or feature that needed it)
- Wrap everything in `BEGIN;` ... `COMMIT;` so a failure rolls back the whole file
- Make every statement safe to re-run: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS` before every `CREATE POLICY`, `INSERT ... ON CONFLICT DO NOTHING` for data. (`ALTER COLUMN ... DROP NOT NULL` is already safe to repeat.)
- Audit columns (`created_by`, `modified_by`, `deleted_by`) are `UUID`, not `TEXT`
- New tables get RLS enabled + policies (match `001_initial_schema.sql`)
- Never modify an existing migration file — to undo one, write a new one that reverses it
- End with a blank line

Template:

```sql
-- Migration: <short description>
-- <Why it is needed: the error it fixes or the feature it supports>

BEGIN;

-- DDL statements here

COMMIT;
```

## Step 3 — Seed Data (Optional)

Sample/test data goes in `supabase/seeds/` (never in `migrations/`), named descriptively without a prefix, e.g. `newsletter_posts.sql`.

## Step 4 — Storage Buckets

If the migration creates a bucket, tell the user its name, public or private, file size limit and allowed MIME types, and list it under **Supabase Plan** in `CLAUDE.md`.

## Step 5 — Update References

- New table → **Database Schema** section in `CLAUDE.md`, plus audit columns if it needs soft delete
- Constraint or column change on an existing table → the schema line in `CLAUDE.md` and the module's skill file (`.claude/commands/<module>.md`)
- Do NOT update `001_initial_schema.sql` — it is a historical snapshot

## Step 6 — Test Data Migrations Before Handing Them Over

A migration that moves or rewrites rows (merges, backfills, dedupes) gets run once against real data, with no way to undo it. Run it against an in-memory Postgres first:

```bash
# in the scratchpad, not the repo
mkdir pg && cd pg && bun init -y && bun add @electric-sql/pglite
```

In a `test.ts` there: `new PGlite()`, `db.exec()` a minimal copy of the tables involved (columns, unique constraints, FKs that matter), insert one row set per scenario (including the awkward ones: duplicates, already-deleted rows, rows two steps would both touch), `db.exec(readFileSync(<migration>))`, then assert on `db.query()` results. Run the file a second time to prove it is safe to re-run. `bun run test.ts`.

**Run it two ways**: the whole file in one `db.exec()`, and statement by statement (strip `--` comments, drop `BEGIN`/`COMMIT`, split on `;`, one `db.exec()` each), which is how the Supabase SQL Editor can behave. The first `20261003160000` passed the whole-file run and still failed in the editor with `relation "parent_merge" does not exist`; the split run reproduces that. Both modes pass for the current version (five scenario groups, 18 checks, re-run a no-op).

## Gotchas

- **No temp tables or session state across statements.** The Supabase SQL Editor may commit after each statement even inside `BEGIN`/`COMMIT`, so a `CREATE TEMP TABLE ... ON COMMIT DROP` is gone before the next statement uses it. Make each statement self-contained: put shared lookups in a CTE, and do multi-table moves in **one** statement with data-modifying CTEs (`WITH x AS (UPDATE ... RETURNING 1), y AS (INSERT ... RETURNING 1) SELECT ...`). They all run once on the same snapshot, so they must write different rows, and a step that needs an earlier step's result (e.g. a unique value freed by it) goes in a later statement.
- **Commented-out "run later" steps.** `002_parents.sql` left Steps 5 to 7 commented out. The code moved on, the database did not, and the leftover `NOT NULL` constraints broke Add Student (`students.parent_name`) and portal login (`parent_sessions.student_id`). Never leave a required step commented out: if it must wait for a deploy, ship it as its own later migration and say so to the user.
- A constraint error in the network tab (`violates not-null constraint`, `violates foreign key`) usually means a migration was not run, or a "run later" step never was. Check `supabase/migrations/` before changing code.

## Reminders

- Migrations are append-only
- SQL files only live inside `supabase/`
- Tell the user to run the migration in the Supabase SQL Editor after creating it; the app does not apply migrations
