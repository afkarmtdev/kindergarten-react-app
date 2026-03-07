# KinderCare Fees Module — Test Guide and Client Demo Script

---

## SECTION 1: How to Test the Fees Module — Top to Bottom

### Prerequisites (Before Any Test)

1. Backend is running on `http://localhost:3000` and frontend on `http://localhost:5173`.
2. At least one classroom exists in the system (required for class filters and bulk generation).
3. At least two students exist and are assigned to a class.
4. The admin is logged in — all fee endpoints require a valid Bearer token.
5. Document Numbering for the `receipt` type has been configured in `/admin/settings`. Go to Settings → Document Numbering → add at least a `constant` segment (e.g. `RC-`) and a `serial` segment, then save. Without this, every payment attempt will be blocked with "not configured" in the UI (amber warning, Submit disabled) and in the backend (HTTP 400).

---

### 1. Fee Plans — Create, Edit, Delete, Search

**Location:** `/admin/fee-plans`

**Create**

1. Click "Add Fee Plan" (orange button, top right).
2. Fill in Name (required), Type (tuition / activity / uniform / registration / other), Amount (required, positive), optional Description.
3. Submit. Expect: toast "Fee plan created", new card appears in the grid.
4. Error state: blank Name → inline validation. Amount = 0 or negative → HTTP 400.

**Edit**

1. Click the pencil icon on any plan card. Modal pre-populates all fields.
2. Change the name and save. Expect: toast "Fee plan updated", card title updates.

**Delete**

1. Click the trash icon → `DeleteDialog` appears with the plan name shown.
2. Confirm. Expect: optimistic removal (card disappears instantly), toast "Fee plan removed".
3. Edge case: deleting a plan does NOT cascade to fee records already generated from it.

**Search**

1. Type in the SearchBar (debounced 350ms). Filters by plan name (`ilike`).
2. Clear → full list returns. Default 9 per page with pagination.

---

### 2. Fee Records — Create, Edit, Delete, Search, Filter

**Location:** `/admin/fees`

**Create (manual single record)**

1. Click "Add Fee Record" (orange button).
2. Select student, choose Type, enter Description (required), Amount Owed (required, positive), optional Discount Amount + Discount Reason (appears only when discount > 0), optional Due Date.
3. Submit. Status auto-derived: discount ≥ amount → `waived`; otherwise `unpaid`.
4. Edit mode: student picker hidden; read-only grey box shows student name and class.

**Edit**

1. Click the pencil icon on any row. Modal opens pre-filled.
2. Change Description or Amount. Submit. Backend re-derives status from existing `amount_paid` + new values.
3. Discard guard: making changes then clicking X or Cancel → "Discard changes?" dialog.

**Delete**

1. Only `unpaid` records can be deleted. Backend returns HTTP 400 ("Only unpaid records can be deleted") for paid/partial/waived.
2. Click trash → `DeleteDialog` shows item name. Confirm → optimistic removal.

**Search**

1. Type a student name. Backend queries students via `ilike`, then filters fee records to those student IDs.

**Filter by Status** — dropdown: All / Unpaid / Partial / Paid / Waived.

**Filter by Month** — `<input type="month">`. Backend converts to first/last day of month, filters on `due_date`. Records without `due_date` are excluded when month filter is active.

**Filter by Class** — dropdown. Backend translates class name → student IDs → fee records.

**Combined filters** — all four compose. Verify month + class + status "unpaid" returns only matching rows.

---

### 3. Generate Fees from Plan (3-Step Modal)

**Location:** `/admin/fees` → "Generate Fees" (blue Zap button)

**Step 1 — Fee Source**

- **Use Fee Plan**: select existing plan; amount and type inherited.
- **Custom Fee**: manually enter type, amount, optional description.
- Next disabled until plan selected or amount > 0.

**Step 2 — Target and Due Date**

- Target: "All Students" or a specific class.
- Due Date: optional.

**Step 3 — Confirm**

- Summary shows fee name/amount, target, due date.
- Preview line: "Will generate N fee records" (fetches student count live).
- Confirm → backend inserts one `fee_records` row per student, all `amount_paid: 0`, status `unpaid`.
- Expect: toast `"Generated N fee records"`, modal closes, list invalidated.

**Error states**

- No students in selected class → HTTP 400 "No students found for the selected target."
- Invalid fee plan ID → HTTP 404 "Fee plan not found."

---

### 4. Record Payment (Partial and Full)

**Location:** Action menu on any unpaid or partial row → "Pay"

**Setup check** — modal fetches `GET /api/document-numbering/receipt`. If no config: amber warning banner, Submit disabled.

**Full payment**

1. Modal shows: student name, description, Total Owed, Discount (if any), Amount Previously Paid (if partial), Balance Remaining (orange).
2. Amount field pre-filled with exact balance. Submit.
3. Backend: adds to `amount_paid`, re-derives status (`paid`), assigns next receipt number, sets `paid_at` to now.
4. Expect: toast "Payment recorded", modal closes, Receipt view opens automatically.

**Partial payment**

1. Change the amount to less than the balance.
2. Submit. Status becomes `partial`. `paid_at` is NOT set (only set on full payment).

**Over-payment protection**

1. Enter amount larger than balance.
2. Frontend: inline error "Maximum payment is RM X.XX".
3. Backend: `amount > balance + 0.001` → HTTP 400 "Payment amount exceeds outstanding balance of RM X.XX".

---

### 5. Receipt — Print

**Location:** Auto-opens after payment, or click the receipt icon on a paid/partial row.

**What to verify**

1. Header: school logo (if set), school name, address, "Official Receipt."
2. Receipt Number: sequentially generated (e.g. `RC-0006`).
3. Date: today formatted `en-MY` locale.
4. "Bill To": student name and class.
5. Line items: Description, Amount Owed, Discount line (only when discount > 0 with reason), Total, Previously Paid (only on partial chain), "This Payment" in orange, Balance Remaining in red (only when > 0.001).
6. Click Print → `@media print` hides everything except `.receipt-print`.

---

### 6. Fee Invoice — Print / Overdue Notice Variant

**Location:** Action menu → "Invoice" or "Overdue Notice"

**Invoice variant**

1. Open on an unpaid record. Title: "FEE INVOICE."
2. Invoice No: `INV-` + first 8 chars of record UUID uppercased.
3. "Bill To": parent name (bold), then student name and class.
4. Fee table: Description | Amount Owed | Discount | Net Payable.
5. Footer: Amount Paid (green), Outstanding Balance (red background when > 0).
6. Payment instructions box with due date (shown only when due date is in the future).
7. Print → `invoice-print` scopes output to A4 portrait.

**Overdue Notice variant**

1. Title: "OVERDUE BALANCE NOTICE."
2. Red days-overdue badge: `"X days overdue"` (today minus `due_date`).
3. Principal signature block at the bottom (uses `principalName` from school settings).
4. Only shown when record has a past due date and status is unpaid/partial.

---

### 7. Enrollment Confirmation Letter — Print

**Location:** Action menu → "Enrollment Letter" (only enabled when `type === 'registration'` AND `status === 'paid'`)

**What to verify**

1. Letterhead: school logo/name/address/reg number/phone/email left; date and reference (`ENR-` + 8 chars of UUID) right.
2. Salutation uses `record.students.parent_name` or fallback "Parent / Guardian."
3. 2×2 details grid: Class Assigned | Registration Fee | Receipt Number | Payment Date.
4. LHDN note: small grey text about Malaysian child education tax relief.
5. Principal signature block (name + "Principal" label + school name + date line).
6. Footer: "Official document of {schoolName}."
7. Print → A4 portrait, `enrollment-print` scopes output.

---

### 8. Class Collection Sheet — Pick Class + Month, Print

**Location:** `/admin/fees` → "Collection Sheet" button in the header

**What to verify**

1. Select a class and a month. Print button disabled until both selected and data loads.
2. Title: "CLASS COLLECTION SHEET — Class: {name} — {Month Year}."
3. Columns: No. | Student Name | Fee Description | Type | Due Date | Amount Due | Discount | Balance | Collected (empty checkbox square) | Remarks.
4. Students listed alphabetically. No records for the month → em-dash across fee columns.
5. Students with multiple records in the month → name spans rows (`rowSpan`).
6. Totals row at the bottom. Two signature blocks: "Prepared By" and "Verified By."
7. Print → A4 portrait.

**Edge cases**

- Empty class → UI shows "No records found."
- Missing `class_name` or `month` → HTTP 400.
- Month not in `YYYY-MM` format → HTTP 400.

---

### 9. Monthly Collection Report — Pick Month, Print

**Location:** `/admin/fees` → "Monthly Report" button in the header

**What to verify**

1. Modal pre-populated with current month filter (or current month if none set).
2. Four summary stat boxes: Total Charged (blue) | Total Collected (green) | Outstanding (red) | Record Count (grey).
3. "By Class" table: Class | Students | Charged | Collected | Discount | Outstanding | Unpaid # | Partial #. Sorted alphabetically.
4. "By Type" table: Fee Type | Charged | Collected | Outstanding.
5. "Outstanding Accounts" table: No. | Student Name | Class | Description | Due Date | Amount Owed | Amount Paid | Balance (red). Unpaid/partial only, sorted by class then student name.
6. Footer: "Generated by {schoolName} on {date}."
7. Print → A4 landscape (`@page { size: A4 landscape; }`).

**Error states** — missing month → HTTP 400. Wrong format (e.g. `?month=March`) → HTTP 400.

---

### 10. Annual Financial Report — Pick Year

**Location:** `/admin/fees` → "Annual Report" link in the header → `/admin/fees/annual-report`

**What to verify**

1. Year selector defaults to current year; dropdown lists 5 most recent years.
2. Four stat boxes: Total Charged | Total Collected (green) | Total Outstanding (red when > 0) | Overdue Records (amber when > 0).
3. "By Fee Type" table: Fee Type | Total Charged | Discounts (green/negative, em-dash when 0) | Total Collected | Outstanding. Total footer row.
4. Collection Rate: ≥ 90% green, ≥ 70% amber, below 70% red.
5. Record summary: "{N} records total, {N} paid, {N} overdue."
6. LHDN footnote + "Generated: {date} — {schoolName}."
7. Print → A4 portrait, `annual-report-print` scopes output.

**Boundary validation** — Year < 2020 → HTTP 400. Year > 2099 → HTTP 400. No records → "No fee records for {year}." message.

---

### 11. Fee Statement (Per Student) — Navigate, Toggle Views, Print

**Location:** Action menu on any fee row → "Statement" → `/admin/fees/statement/:studentId`

**Statement View (default)**

1. Header: school logo/name/address/phone. Title "FEE STATEMENT" + year.
2. Student info block: student name and class | parent name.
3. Table: Description | Due Date | Amount Owed | Discount (negative green, em-dash when 0) | Amount Paid | Status (green=paid, yellow=partial, red=unpaid, grey=waived).
4. Footer: "Total Paid" (bold, orange) = sum of `amount_paid` for the year.
5. LHDN note at bottom (dashed border).

**Ledger View**

1. Toggle "Ledger View" button.
2. Table: Date | Description | Type | Charge (debit) | Payment (credit, green) | Running Balance (red when > 0.001, green when ≤ 0.001).
3. Footer: Opening Balance RM 0.00 | Closing Balance (bold, colour-coded by sign).
4. Powered by `computeLedgerRows()` in `frontend/src/lib/ledger.ts` — pure function, sorts by `due_date`, accumulates running balance.

**Print** — works in both views. `statement-print` scopes output.

---

### 12. CSV Export

**Location:** `/admin/fees` → "Export CSV" button

1. Calls `GET /api/fees/export?month=YYYY-MM` using the current `monthFilter`. No filter = all records.
2. Columns: Student Name, Class, Type, Description, Due Date, Amount Owed, Discount, Amount Paid, Status, Receipt Number.
3. All values double-quoted. Formula injection escaped — values starting with `=`, `+`, `-`, `@`, tab, or CR are prefixed with `'`.
4. Filename: `fees-{month}.csv`.

**Verify**

- Set month filter → export → only that month's records appear.
- Clear filter → export → all records.
- Open in Excel — headers on row 1, data from row 2, amounts with 2 decimal places.
- Student name starting with `=SUM(` → CSV wraps it as `"'=SUM(...)"`.

---

### 13. Document Numbering for Receipts

**Location:** `/admin/settings` → Document Numbering section

1. Build format: `constant` (e.g. `RC-`) + `year` (4 chars) + `serial` (4 chars, no reset, start from 1). Preview updates live. Save.
2. When `PUT /api/fees/:id/payment` is called, backend calls `generateNextNumber('receipt')` — fetches config, increments `current_serial` atomically, returns formatted string (e.g. `RC-20260006`).
3. Record three payments in a row — serial increments by 1 each time.
4. Error case: delete the config row in Supabase → payment returns HTTP 400, UI shows toast error.

---

### Backend Tests — Running the Suite

```bash
cd backend && bun test src/routes/fees.test.ts
```

| Area                 | Tests                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| Fee Plans GET        | Paginated list, empty, default page/limit (9), custom page/limit, limit > 100 → 400 |
| Fee Plans POST       | Creates with 201, rejects missing name → 400, rejects negative amount → 400         |
| Fee Records GET list | Paginated, search by name, default limit 20, limit > 100 → 400                      |
| Fee Records GET /:id | Returns record, 404 when not found                                                  |
| POST /generate       | Generates by class, 400 when no students                                            |
| GET /summary         | Totals, zeros on empty                                                              |
| GET /export          | CSV Content-Type, headers, data                                                     |
| DELETE /:id          | Deletes unpaid, rejects paid (400), 404 when missing                                |
| GET /class-sheet     | Requires class+month, bad month → 400, empty class, grouped students                |
| GET /monthly-report  | Requires month, bad format → 400, zeros, by-class, by-type, outstanding accounts    |
| GET /annual-report   | Year < 2020 → 400, year > 2099 → 400, by-type, discounts, defaults to current year  |
| PUT /:id/payment     | 404, overpayment → 400, negative → 400, not configured → 400, full payment, partial |

---

## SECTION 2: What Does the Fees Module Do? (Client Demo Script)

### The Problem It Solves

Right now, your school probably collects fees by writing in a book, sending a message to parents, or keeping it in your head — who has paid and who has not. That works with 10 students. With 80 or 100 students, things get lost. Parents say they paid. You cannot find the receipt. You do not know how much the school collected this month. At year end, a parent asks for proof of payment for their tax file — and you are digging through paper receipts from twelve months ago.

The Fees Module takes all of that away. Every ringgit charged, paid, discounted, or still outstanding is recorded in one place. The system always knows the exact numbers.

---

### Fee Plans — Your School's Price List

Think of a Fee Plan as a template on a menu. You create it once and use it forever.

Example: create a plan called "Monthly Tuition — 2026" for RM 350. Next month, press one button — the system creates a RM 350 bill for every child automatically. You never type RM 350 again.

You can have as many plans as you like: tuition, activity fees, uniforms, registration. Each one remembers the name, type, and exact amount.

---

### Fee Records — The Bill for Each Child

Every charge is a Fee Record. Like giving a physical bill to a family, except this one lives in the computer and you can find it in two seconds.

Each record shows: which student, what the charge is for, how much is owed, any discount and why, when it is due, how much has been paid, and the current status — **Unpaid**, **Partial**, **Paid**, or **Waived**. The status is always calculated automatically. You never touch it.

---

### Generating Fees in One Click

Instead of creating 80 fee records one by one, click "Generate Fees." The system asks three questions:

1. Which fee plan (or type in a custom amount)?
2. Which class — or all students?
3. When is it due?

Confirm. Done. 80 bills in two seconds. Preview shows: "This will create 24 fee records." No surprises.

---

### Paying Fees and Getting a Receipt

When a parent pays, open the child's record and click "Pay." The system shows the exact balance. Type the amount received. Press Record.

Three things happen at once:

1. The payment is added to the record.
2. The status updates automatically (Partial or Paid).
3. A unique receipt number is generated — like `RC-2026-0042`.

A receipt pops up on screen. Shows: school name, receipt number, date, child's name, what was paid for, and the amount. Press Print. The parent gets a clean, professional receipt.

---

### The Printed Documents

**Receipt** — Proof that money was received. Parent keeps it. System keeps the record.

**Fee Invoice** — A polite but clear demand note for families who have not paid yet. Shows exactly what is owed, the due date, and the school's phone number.

**Overdue Notice** — Same as the invoice, but with a red badge showing how many days past due, plus the principal's signature block at the bottom. More formal. Used when a gentle reminder is not working.

**Enrollment Confirmation Letter** — When a new child registers and the registration fee is paid, print this letter immediately. It is a formal letter on school letterhead, addressed to the parent by name, confirming enrollment, the class assigned, receipt number, and payment date. Includes an LHDN note — parents can attach it to their income tax filing for child education tax relief. Saves them a phone call to you at the end of the year.

---

### The Reports and What the Principal Uses Them For

**Class Collection Sheet** — Pick a class. Pick a month. Print. A table with every student, every fee charged, the balance outstanding, and an empty checkbox column for manual tick-off during collection rounds. Signature lines for teacher and principal.

**Monthly Collection Report** — At end of month, the principal sees everything at a glance: total charged vs. collected vs. outstanding, which class is behind, which fee types are coming in, and a full list of every family that still owes. Printed in landscape so everything fits on one page.

**Annual Financial Report** — Full year summary: total charged, collected, discounts, and outstanding — broken down by fee type. Collection Rate percentage shown in colour (green ≥ 90%, amber ≥ 70%, red below 70%). Goes to the accountant or school board.

---

### The Annual Statement and Why Malaysian Parents Love It

Every parent can claim a tax relief for school fees when filing income tax with LHDN. But they need proof of what they paid.

Click on any student, pick the year, and a full fee statement appears — every charge, every payment, every discount, and the grand total paid for the year. At the bottom is a note that says this document can be used for child education tax relief under the Malaysian Income Tax Act.

The parent does not need to chase you for receipts. They do not need to add up amounts. They press Print, and they have a single clean document showing every ringgit paid that year — with the school letterhead at the top.

There is also a **Ledger View** for parents or auditors who want to see every transaction as a running balance — each charge as a debit, each payment as a credit, the balance after every entry.

---

### The Live Demo Flow — What to Say

Walk the client through this sequence:

1. **Open Fee Plans** — _"This is your price list. You set it up once."_
2. **Click Generate Fees** — _"One button. Every child in Rose Class gets a RM 350 bill for January. Done in two seconds."_
3. **Find a student in the fee table. Click Pay** — _"Parent comes to the counter. Type in the amount. Press Record."_
4. **Show the receipt** — _"Receipt comes up on screen. Click Print. Professional receipt, receipt number, school letterhead."_
5. **Click Collection Sheet** — _"Pick Rose Class, pick January. Print this and hand it to the teacher."_
6. **Click Monthly Report** — _"End of the month, principal sees everything: collected, outstanding, who owes."_
7. **Navigate to a student's Statement** — _"Parent needs proof for their income tax. Click, pick the year, Print. Done."_

That is the whole cycle — from charging to collecting to reporting — all in one system.
