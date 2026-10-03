TRIGGER when: user mentions students, Add Student, StudentModal, StudentsPage, StudentCard, student profile, student timeline, bulk import of students, routes/students.ts, the students table, or parent details entered on a student form.

# students — Students Module

How students are created, edited, listed and linked to parents, and how the profile timeline pages. Read before touching `routes/students.ts`, `StudentModal`, the students table, the timeline, or anything that writes parent details from a student form.

---

## Files

| Layer    | File                                                     | Role                                                                       |
| -------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| Backend  | `backend/src/routes/students.ts`                         | CRUD, paginated list, `/count`, `/bulk`, `/:id/timeline`                   |
| Backend  | `backend/src/lib/parentLinks.ts`                         | `activeParent()`, `hasLiveStudent()` for nested `parent_students` selects  |
| Backend  | `backend/src/lib/timeline.ts`                            | Timeline cursor parse + merge-and-page (`pageTimeline`)                    |
| Backend  | `backend/src/routes/students.test.ts`                    | Route tests (mockSupabase; spy pattern for asserting writes)               |
| Frontend | `frontend/src/pages/students/StudentsPage.tsx`           | Grid, 12/page, search + class/gender/status filters                        |
| Frontend | `frontend/src/pages/students/components/StudentCard.tsx` | Card with birthday badge, edit/delete                                      |
| Frontend | `frontend/src/components/admin/StudentModal.tsx`         | Add/edit form, includes parent name/email/phone                            |
| Frontend | `frontend/src/components/admin/BulkImportModal.tsx`      | CSV import, client-side row validation, calls `studentsApi.bulkImport`     |
| Frontend | `frontend/src/pages/student-profile/`                    | Profile page; `PortalAccessCard` uses **parentsApi**, not studentsApi      |
| Frontend | `frontend/src/store/studentsStore.ts`                    | page, search, filters, modal state                                         |
| API      | `studentsApi` in `frontend/src/lib/api.ts`               | getAll, getCount, getById, create, update, delete, bulkImport, getTimeline |

Routes: `GET /count`, `GET /`, `GET /:id/timeline`, `GET /:id`, `POST /bulk`, `POST /`, `PUT /:id`, `DELETE /:id` (soft delete).

---

## Data flow

**Parent details do not live on the student row.** The form still sends `parent_name`, `parent_email`, `parent_phone`, and the route splits them off.

**Which parent a student shows.** Every read selects `PARENT_JOIN` = `parent_students(created_at, deleted_at, parents(id, full_name, email, phone, deleted_at))`, and `flattenStudent()` picks one with `activeParent()`: the **earliest** live link whose parent is not deleted. Earliest-first keeps the list, the profile, the form and the fee documents on the same parent when a student has several. Result: `student.parent = { full_name, email, phone } | null`, plus `class_name = "<name> (<academic_year>)"`.

**`upsertParentLink(studentId, name, email, phone, { linkCreatedAt?, emaillessParentId? })`**: finds the parent by trimmed, lower-cased email (unique), updates name and phone, or creates one; then upserts `parent_students` on `(parent_id, student_id)` with `deleted_at: null` so an unlinked pair is re-activated. A **deleted** parent found by email is restored with `access_code` + `portal_pin_hash` cleared, so portal access has to be issued again. If nobody has the email and `emaillessParentId` is given, the email is filled in on that parent (guarded by `is email null`) instead of creating a new one. Returns `{ parentId }`.

**`POST /`**: inserts the student, then links the parent. The insert was read back before the link existed, so the response's `parent` is filled from the form.

**`PUT /:id` with all three parent fields**: runs **before** the student update so the read-back is already current.

1. Reads the student's links (`.is('deleted_at', null)`; 404 if missing), and the parent the form showed (`activeParent`).
2. Same email (any case) as that parent: only name/phone are updated.
3. The shown parent has **no email** (allowed on the Parents page) and nobody else has the entered one: the email is filled in on that parent; no new record, no unlink.
4. Different email: a different person. The new parent is linked with the **shown link's `created_at`** (so it keeps the earliest slot and the form shows it next time), and the shown parent is unlinked from **this student only** (`auditDelete`). The old parent keeps their record, other children and portal access.

**Bulk import** (`POST /bulk`, body `{ students: Row[] }`): validates each row (failures carry the CSV row number, `i + 2`), resolves `class_name` to an **active, non-deleted** classroom id, strips `class_name` and the parent fields, inserts all students in one call, then runs `upsertParentLink` per inserted row. Returns `{ imported, failed: [{ row, reason }] }`.

**List search** uses `.ilike('full_name', ...)`; multi-column searches elsewhere use `orIlike()` from `lib/search.ts`.

**Birthday filter** (`?birthday_today=true`) bypasses the table query and calls the `dashboard_birthdays_today` + `dashboard_birthday_count` RPCs instead.

**Portal access** (access code, PIN, revoke) is per parent: `routes/parents.ts` + `parentsApi`. The student profile finds the parent with `parentsApi.getByStudent(id)` (returns `has_pin`, never the hash) and opens `GeneratePortalAccessModal` with that `parentId`.

### Timeline (`GET /:id/timeline?limit&before`)

Seven sources (attendance, portfolio entries, art wall, paid fees, report cards, daily reports, incidents) are fetched in parallel, turned into `{ type, date, title, subtitle }` events, and paged by `pageTimeline()`.

- Order: newest day first; same-day events in source order, then each source's DB order with an `id` tie-break. The cursor depends on this order never changing between requests.
- Cursor `next_cursor = "<date>|<n>"`: continue from `<date>`, skipping its first `n` events (already shown). Sources are fetched `lte` the cursor day (timestamp columns: `lt` the next midnight) with `limit + 1 + n` rows. A plain `<date>` (old format) means strictly before it. `before` is validated by `TIMELINE_CURSOR_RE`.
- Art wall is fetched whole: `artwork_date` is optional and falls back to the upload day, which SQL cannot order or filter on. Fine while a student has a handful of artworks.

---

## Gotchas

- **Never write `parent_name` / `parent_email` / `parent_phone` to `students`.** Legacy columns, nullable since migration `20261003130000`. Before it they were `NOT NULL`, so Add Student failed with `null value in column "parent_name" ... violates not-null constraint`. That error means the migration has not been run.
- `students.access_code` and `students.portal_pin_hash` are also legacy and unused; portal login reads `parents`.
- `upsertParentLink` failures are swallowed: the student is still saved (201/200) and can exist with `parent: null`.
- **Any nested `parent_students(...)` select needs `created_at, deleted_at` on the link and `deleted_at` on `parents`, and must go through `activeParent()`.** Nested selects return soft-deleted rows; query filters only work on top-level rows.
- Migration `002_parents.sql` left Steps 5 to 7 commented out ("run later"); leftovers like that cause constraint errors. Check what 002 left undone before assuming the schema matches the code.
- A timeline cursor that ends on a date with `<`/`lt` loses the rest of that day's events. Keep the `date|n` format and the fixed same-day order.
- Untyped supabase-js infers nested selects as arrays even for many-to-one joins (`parents(...)`); go through `Record<string, unknown>` and cast to the real single-object shape.
- Error responses are generic (`Failed to create student`, `Student not found`); the real Postgres message is in the backend log.

---

## Open issues

- None known.

---

## Change log

- 2026-10-03: Add Student failed on the `parent_name` NOT NULL constraint; fixed by migration `20261003130000` (columns kept, now nullable).
- 2026-10-03: Removed unused student-level portal routes and their `studentsApi` methods; portal access is per parent.
- 2026-10-03: All error responses made generic + logged (see `/new-route` Step 4).
- 2026-10-03: Unlinked/deleted parents hidden everywhere (`activeParent`); relinking works; a deleted parent entered again is restored without old portal access; bulk import row numbers fixed.
- 2026-10-03: Changing the parent email on the form replaces the shown parent instead of adding a second one; earliest-link rule; POST/PUT responses show the saved parent; PUT returns 404 for a missing student.
- 2026-10-03: `:id` params validated with `isValidUUID()` (400 `Invalid ID`); tests use UUID path ids (`SID`, `MISSING_ID`). An emailless shown parent gets the entered email instead of being replaced.
- 2026-10-03: Timeline no longer drops events at page boundaries (`date|n` cursor, `lib/timeline.ts`); undated artworks placed on their upload day; incidents and report cards have id tie-breaks.
