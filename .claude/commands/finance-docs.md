# Finance Documents — Skill

Use this skill to add, extend, or debug any finance document in the kindergarten app.

---

## Architecture Overview

All finance documents follow this pattern:

1. **Backend endpoint** — returns structured data; placed BEFORE `/:id` wildcard in `fees.ts`
2. **Type definitions** — in `packages/types/index.ts`; re-exported via `frontend/src/types/index.ts`
3. **API method** — added to `feesApi` in `frontend/src/lib/api.ts`
4. **Print component** — `createPortal` modal with `.scope-print` CSS; uses `useSchoolInfo()`
5. **Trigger wiring** — button on `FeesPage.tsx` (table row or header) + state variable

---

## Prerequisite: School Info Fields

All print headers use `useSchoolInfo()` from `frontend/src/hooks/useSchoolInfo.ts`.

**What it returns:**

```ts
{
  ;(schoolName, address, phone, email, logoUrl, principalName, registrationNumber)
}
```

- `schoolName` falls back to `APP_NAME` if not configured
- `principalName` / `registrationNumber` are stored in `school_info` table

**Settings form:** `frontend/src/pages/settings/components/SchoolInfoSection.tsx`

- All new print documents that need a principal signature block should use `principalName`
- Zod schema for the backend route is in `backend/src/routes/schoolInfo.ts`

---

## Documents Implemented

### 1. Fee Invoice (`FeeInvoice.tsx`)

**File:** `frontend/src/components/admin/FeeInvoice.tsx`
**Scope:** `.invoice-print`
**Variants:** `'invoice'` (default) | `'overdue-notice'`
**Props:** `record: FeeRecord | null`, `onClose: () => void`, `variant?: 'invoice' | 'overdue-notice'`

- Invoice: shows school header, student/parent info, fee table, payment status, "Thank you" note
- Overdue notice: adds red "OVERDUE" badge with days-since-due count, formal demand language, signature block
- Days overdue computed as: `Math.floor((today - dueDate) / 86400000)`
- Receipt number shown only when `status === 'paid'`
- No backend call — renders data from the existing `FeeRecord` object

**Trigger in FeesPage:**

- `invoiceRecord` state (FeeRecord | null) → "Print Invoice" button (FileText, blue) on unpaid/partial rows
- `overdueRecord` state (FeeRecord | null) → "Print Overdue Notice" (AlertCircle, amber) on overdue rows

---

### 2. Enrollment Confirmation Letter (`EnrollmentLetterView.tsx`)

**File:** `frontend/src/components/admin/EnrollmentLetterView.tsx`
**Scope:** `.enrollment-print`
**Props:** `record: FeeRecord | null`, `onClose: () => void`

- Shown only for rows where `type === 'registration' && status === 'paid'`
- Formal letter format: date, school address, salutation, body paragraphs, principal signature
- Uses `registrationNumber`, `principalName`, `schoolName`, `address` from `useSchoolInfo()`
- No backend call — uses existing `FeeRecord.students` join data

**Trigger in FeesPage:**

- `enrollmentRecord` state (FeeRecord | null) → "Print Enrollment Letter" (BookOpen, green)

---

### 3. Class Collection Sheet (`ClassCollectionSheet.tsx`)

**File:** `frontend/src/pages/fees/components/ClassCollectionSheet.tsx`
**Scope:** `.collection-sheet-print`
**Props:** `open: boolean`, `onClose: () => void`

**Backend:** `GET /api/fees/class-sheet?class_name=...&month=YYYY-MM`
**Response type:** `ClassSheetResponse` (in `packages/types/index.ts`)

```ts
interface ClassSheetStudentRow {
  student_id: string
  student_name: string
  records: Array<{
    id: string
    description: string
    type: string
    due_date: string | null
    amount_owed: number
    discount_amount: number
    amount_paid: number
    status: string
  }>
}
interface ClassSheetResponse {
  class_name: string
  month: string
  students: ClassSheetStudentRow[]
  totals: { amount_owed: number; amount_paid: number; balance: number }
}
```

**API:** `feesApi.classSheet(class_name, month)` → `GET /api/fees/class-sheet?...`

**Layout:** A4 landscape, one row per student, `rowSpan` if student has multiple fees. Checkbox column for manual ticking. Signature block at bottom. Uses internal class + month selectors.

**Trigger in FeesPage:**

- `collectionSheetOpen` boolean state → "Print Collection Sheet" (ClipboardList) header button

---

### 4. Monthly Collection Report (`MonthlyCollectionReport.tsx`)

**File:** `frontend/src/components/admin/MonthlyCollectionReport.tsx`
**Scope:** `.monthly-report-print`
**Props:** `open: boolean`, `onClose: () => void`

**Backend:** `GET /api/fees/monthly-report?month=YYYY-MM`
**Response type:** `MonthlyReportResponse` (in `packages/types/index.ts`)

```ts
interface MonthlyReportByClass {
  class_name: string
  student_count: number
  charged: number
  collected: number
  discount: number
  outstanding: number
  unpaid_count: number
  partial_count: number
}
interface MonthlyReportByType {
  type: string
  charged: number
  collected: number
  outstanding: number
}
interface MonthlyReportOutstandingItem {
  student_name: string
  class_name: string
  description: string
  due_date: string | null
  amount_owed: number
  amount_paid: number
  balance: number
}
interface MonthlyReportResponse {
  month: string
  totals: { charged: number; collected: number; outstanding: number; record_count: number }
  by_class: MonthlyReportByClass[]
  by_type: MonthlyReportByType[]
  outstanding_accounts: MonthlyReportOutstandingItem[]
}
```

**API:** `feesApi.monthlyReport(month)` → `GET /api/fees/monthly-report?month=YYYY-MM`

**Layout:** A4 landscape, 4-stat summary boxes, by-class table, by-type breakdown, outstanding accounts list. Month picker in header.

**Backend aggregation logic:**

- `byClassMap` uses `Set<string>` for `student_ids` to count unique students per class
- Outstanding excludes `paid` and `waived` statuses
- `outstanding_accounts` filtered to `unpaid | partial`, sorted by class then name

**Trigger in FeesPage:**

- `monthlyReportOpen` boolean state → "Monthly Report" (BarChart2) header button

---

### 5. Annual Financial Summary (`AnnualReportPage.tsx`)

**File:** `frontend/src/pages/AnnualReportPage.tsx`
**Route:** `/admin/fees/annual-report` (NOT in sidebar — linked from FeesPage header TrendingUp button)
**Scope:** `.annual-report-print` (via `window.print()` + `@media print` in inline `<style>`)

**Backend:** `GET /api/fees/annual-report?year=YYYY`
**Response type:** `AnnualReportResponse` (in `packages/types/index.ts`)

```ts
interface AnnualReportByType {
  type: string
  total_owed: number
  total_paid: number
  total_discounts: number
  outstanding: number
}
interface AnnualReportResponse {
  year: number
  by_type: AnnualReportByType[]
  totals: {
    total_owed: number
    total_paid: number
    total_discounts: number
    outstanding: number
    record_count: number
    paid_count: number
    overdue_count: number
  }
}
```

**API:** `feesApi.annualReport(year)` → `GET /api/fees/annual-report?year=YYYY`

**Layout:** A4 portrait. Year selector in toolbar. 4-stat strip (total charged, collected, discounts, outstanding). By-type table with totals footer. Collection rate %. LHDN footnote.

**Registration in App.tsx:**

```tsx
const AnnualReportPage = lazy(() =>
  import('@/pages/AnnualReportPage').then((m) => ({ default: m.AnnualReportPage }))
)
// Route:
<Route path="fees/annual-report" element={<ErrorBoundary><Suspense fallback={<CuteLoader />}><AnnualReportPage /></Suspense></ErrorBoundary>} />
```

---

### 6. Payment Ledger (toggle on `FeeStatementPage.tsx`)

**File:** `frontend/src/pages/FeeStatementPage.tsx`
**Route:** `/admin/fees/statement/:studentId?year=YYYY`

The ledger view is a toggle (`ledgerView` boolean state) that replaces the standard fee table.

**Pure computation:** `frontend/src/lib/ledger.ts`

```ts
export interface LedgerRow extends FeeRecord {
  charge: number // amount_owed - discount_amount
  payment: number // amount_paid
  running_balance: number
}
export function computeLedgerRows(records: FeeRecord[]): LedgerRow[]
```

**Algorithm:**

1. Sort records by `due_date ?? created_at` (ascending string comparison)
2. For each record: `charge = amount_owed - discount_amount`; `runningBalance += charge - payment`
3. Running balance shown red if `> 0.001`, green if `<= 0.001`
4. Footer shows opening balance (RM 0.00) and closing balance

**Toggle button:** List icon, highlighted when active with `kinder-blue` border/bg

---

## Print Pattern (all documents)

```tsx
import { createPortal } from 'react-dom'

export function MyDocument({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { schoolName, address, logoUrl, principalName } = useSchoolInfo()

  if (!open) return null

  return createPortal(
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .my-doc-print, .my-doc-print * { visibility: visible !important; }
          .my-doc-print { position: fixed !important; left: 0 !important; top: 0 !important;
            width: 100% !important; background: white !important; padding: 24px !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 no-print"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar (no-print) */}
          <div className="flex items-center justify-between p-4 border-b no-print">
            <button onClick={() => window.print()}>Print</button>
            <button onClick={onClose}>Close</button>
          </div>
          {/* Printable content */}
          <div className="my-doc-print p-8">
            {/* School header */}
            {logoUrl && <img src={logoUrl} />}
            <h1>{schoolName}</h1>
            {address && <p>{address}</p>}
            {/* Document body */}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
```

**Why `createPortal`:** Cards use `hover:-translate-y-0.5` (CSS transform), which creates a new stacking context — `position: fixed` inside a transform is relative to the card, not the viewport. Portal bypasses this.

---

## Backend Pattern (new report endpoint)

All report endpoints go BEFORE `/:id` in `fees.ts`:

```ts
fees.get(
  '/my-report',
  zValidator('query', z.object({ param: z.string().regex(/pattern/) })),
  async (c) => {
    const { param } = c.req.valid('query')
    const { data, error } = await supabase
      .from('fee_records')
      .select('..., students(full_name, class_name, parent_name)')
      .is('deleted_at', null) // always exclude soft-deleted records
    // filters...
    if (error) return c.json({ error: error.message }, 500)
    // aggregate in JS
    return c.json({ result })
  }
)
```

**Critical:** Static paths (`/class-sheet`, `/monthly-report`, `/annual-report`, `/summary`, `/export`, `/generate`, `/statement/:studentId`) MUST all be declared before `/:id` to prevent Hono from treating them as IDs.

---

## Adding a New Finance Document — Checklist

1. **DB** (if needed): add columns/table to `supabase-schema.sql`, run in Supabase SQL editor
2. **Types:** add response interface to `packages/types/index.ts`
3. **Backend:** add `GET /api/fees/<route>` in `fees.ts` BEFORE `/:id` wildcard
4. **API method:** add `feesApi.<method>()` to `frontend/src/lib/api.ts`
5. **Component:** create print modal in `frontend/src/components/admin/` (or `fees/components/`) using `createPortal` + `.scope-print` CSS class
6. **Translations:** add all new UI strings to both `en` + `ms` in `frontend/src/lib/translations.ts`
7. **Wiring:** add state to `FeesPage.tsx`, pass props to `FeeTableRow.tsx` if row-level, render component
8. **Route** (standalone pages only): lazy-import + `<Route>` in `App.tsx`
9. **Tests:** add describe block to `backend/src/routes/fees.test.ts`

---

## Key Files Quick Reference

| Purpose                        | File                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| Backend fee routes             | `backend/src/routes/fees.ts`                                   |
| Status derivation + monthRange | `backend/src/lib/fees.ts`                                      |
| Shared types                   | `packages/types/index.ts`                                      |
| Frontend API methods           | `frontend/src/lib/api.ts`                                      |
| School info hook               | `frontend/src/hooks/useSchoolInfo.ts`                          |
| School info settings UI        | `frontend/src/pages/settings/components/SchoolInfoSection.tsx` |
| Fee table page                 | `frontend/src/pages/fees/FeesPage.tsx`                         |
| Fee table row                  | `frontend/src/pages/fees/components/FeeTableRow.tsx`           |
| Annual statement (per student) | `frontend/src/pages/FeeStatementPage.tsx`                      |
| Ledger computation             | `frontend/src/lib/ledger.ts`                                   |
| Annual report (school-wide)    | `frontend/src/pages/AnnualReportPage.tsx`                      |
| Receipt print modal            | `frontend/src/components/admin/ReceiptView.tsx`                |
| Invoice/overdue modal          | `frontend/src/components/admin/FeeInvoice.tsx`                 |
| Enrollment letter modal        | `frontend/src/components/admin/EnrollmentLetterView.tsx`       |
| Collection sheet modal         | `frontend/src/pages/fees/components/ClassCollectionSheet.tsx`  |
| Monthly report modal           | `frontend/src/components/admin/MonthlyCollectionReport.tsx`    |
| Backend tests                  | `backend/src/routes/fees.test.ts`                              |
| Ledger logic tests             | `frontend/src/lib/ledger.test.ts`                              |
