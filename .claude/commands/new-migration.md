TRIGGER when: user asks to create a SQL migration, add a database column/table/index, alter schema, add RLS policies, or any task that requires a new .sql file.

# new-migration — Create a Database Migration

Description: $ARGUMENTS

Work through every step in order.

## Step 1 — Determine the Next Number

List files in `supabase/migrations/` and find the highest existing number prefix. The new migration gets the next sequential number, zero-padded to 3 digits (e.g. if `006_inquiry_status.sql` is the latest, the next is `007`).

## Step 2 — Choose a Descriptive Name

The filename format is: `{NNN}_{snake_case_description}.sql`

Good names describe the change, not the feature:

- `007_add_newsletter_table.sql`
- `008_add_status_to_classrooms.sql`
- `009_create_rls_policies_for_parents.sql`

Bad names:

- `007_update.sql` (too vague)
- `007_fix.sql` (too vague)
- `007_newsletter_feature_with_posts_and_tags.sql` (too long)

## Step 3 — Write the Migration

Create the file at `supabase/migrations/{NNN}_{name}.sql`.

Rules:

- Start with a comment block explaining what this migration does
- Use `IF NOT EXISTS` / `IF EXISTS` guards where appropriate (columns, tables, indexes)
- Never modify or overwrite an existing migration file — always create a new one
- If undoing a previous migration, create a new migration that reverses it
- Include RLS policies if adding a new table (match existing patterns in `001_initial_schema.sql`)
- End with a blank line

Template:

```sql
-- Migration {NNN}: {Short description}
-- {Longer explanation if needed}

-- Your DDL statements here
```

## Step 4 — Seed Data (Optional)

If the migration needs sample/test data, create or update a file in `supabase/seeds/` (never in `migrations/`).

Seed files do not get number prefixes — use a descriptive snake_case name like `newsletter_posts.sql`.

## Step 5 — Update References

- If the migration adds a new table, update the **Database Schema** section in `CLAUDE.md`
- If the migration adds a new table that needs soft-delete, add audit columns (`created_by`, `modified_at`, `modified_by`, `deleted_at`, `deleted_by`) and note it in the schema docs
- Do NOT update `supabase/migrations/001_initial_schema.sql` — it is a historical snapshot

## Reminders

- Migrations are append-only — never edit an already-numbered file
- Seed data goes in `supabase/seeds/`, not `supabase/migrations/`
- SQL files must only live inside `supabase/` — never in the project root
- Tell the user to run the migration in the Supabase SQL Editor after creation
