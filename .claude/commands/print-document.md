TRIGGER when: user asks to add a printable document, print view, print modal, receipt template, printable report, or asks to create a document that uses window.print() or @media print.

# print-document — Build a Printable Document Modal

Document description: $ARGUMENTS

Work through every step in order.

---

## Architecture Overview

All printable documents in this project use the same pattern:

1. **`createPortal`** to render the modal at `document.body` (bypasses CSS transform stacking context from card hover effects)
2. **`@media print` CSS** with visibility trick to isolate the printable content
3. **Toolbar** (hidden during print) with Print button + Close button + optional controls
4. **School header** from `useSchoolInfo()` — logo, name, address, phone
5. **Dark mode aware** preview (but prints in light mode only)

---

## Step 1 — Determine Scope Class

Each printable document needs a unique CSS scope class to isolate its print content. Convention: `<name>-print`.

Examples: `invoice-print`, `attendance-print`, `collection-sheet-print`, `monthly-report-print`, `statement-print`

The corresponding no-print class is `<name>-no-print`.

---

## Step 2 — Create the Component

Create the file based on scope:

- **Row-level documents** (triggered per record): `frontend/src/components/admin/<Name>.tsx`
- **Page-level reports** (triggered from page header): `frontend/src/pages/<resource>/components/<Name>.tsx`
- **Standalone pages** (own route): `frontend/src/pages/<Name>Page.tsx`

### Imports

```tsx
import { createPortal } from 'react-dom'
import { X, Printer } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
```

### Props Pattern

```tsx
// Record-level (data already available from parent)
interface Props {
  record: RecordType // the data to print — never null, parent guards rendering
  onClose: () => void
  variant?: string // optional variant switching (e.g. 'invoice' | 'overdue-notice')
}

// Report-level (fetches its own data)
interface Props {
  open: boolean
  onClose: () => void
}
```

---

## Step 3 — Print CSS Block (mandatory, exact pattern)

This MUST be the first child inside the portal content:

```tsx
<style>{`
  @media print {
    body * { visibility: hidden !important; }
    .<scope>-print, .<scope>-print * { visibility: visible !important; }
    .<scope>-print {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      background: white !important;
      padding: 32px !important;
      color: black !important;
    }
    .<scope>-no-print { display: none !important; }
    @page { size: A4 portrait; }
  }
`}</style>
```

**Why `visibility: hidden` instead of `display: none`?** — `display: none` collapses layout and breaks the fixed positioning of the printable content. `visibility: hidden` preserves the DOM layout so `.scope-print` can be repositioned to fill the page.

For landscape documents (tables, collection sheets): change `@page { size: A4 landscape; }`.

For tables that need borders in print, add:

```css
.<scope > -print table {
  border-collapse: collapse !important;
}
.<scope > -print th,
.<scope > -print td {
  border: 1px solid #d1d5db !important;
}
```

---

## Step 4 — Modal Structure (mandatory pattern)

```tsx
return createPortal(
  <>
    {/* Print CSS (Step 3) */}

    {/* Backdrop */}
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 <scope>-no-print sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <div className="flex items-center gap-2">
            {/* Optional controls: mode toggle, month/year selector */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kinder-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              <Printer size={15} />
              {t('printButton')}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div className="<scope>-print p-8">
          {/* School header (Step 5) */}
          {/* Document body */}
        </div>
      </div>
    </div>
  </>,
  document.body
)
```

Max-width variants:

- `max-w-lg` — receipts, invoices, single-record documents
- `max-w-2xl` — letters, statements
- `max-w-4xl` — landscape tables, collection sheets, reports

---

## Step 5 — School Header (reusable across all documents)

```tsx
const { schoolName, address, phone, email, logoUrl, principalName, registrationNumber } =
  useSchoolInfo()

{
  /* Inside .scope-print div */
}
;<div className="text-center mb-6">
  {logoUrl && <img src={logoUrl} alt="" className="h-16 mx-auto mb-2 object-contain" />}
  <h1 className="text-xl font-bold">{schoolName}</h1>
  {registrationNumber && <p className="text-xs text-gray-500">Reg. No: {registrationNumber}</p>}
  {address && <p className="text-sm text-gray-600">{address}</p>}
  {phone && <p className="text-sm text-gray-600">Tel: {phone}</p>}
</div>
```

---

## Step 6 — Optional: Principal Signature Block

For formal documents (overdue notices, enrollment letters, official reports):

```tsx
<div className="mt-12 pt-6 border-t border-gray-200">
  <div className="text-right">
    <div className="inline-block text-center">
      <div className="w-48 border-b border-gray-400 mb-1" />
      <p className="text-sm font-semibold">{principalName || '________________'}</p>
      <p className="text-xs text-gray-500">Principal / Pengetua</p>
    </div>
  </div>
</div>
```

---

## Step 7 — Report-Level Data Fetching (if needed)

For documents that fetch their own data (not passed as props):

```tsx
const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))

const { data, isLoading } = useQuery({
  queryKey: ['report-name', month],
  queryFn: () => resourceApi.getReport(month),
  enabled: open, // only fetch when modal is open
})
```

Add month/year selector to the toolbar (inside the `<scope>-no-print` div):

```tsx
<input
  type="month"
  value={month}
  onChange={(e) => setMonth(e.target.value)}
  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
/>
```

---

## Step 8 — Wiring into the Page

### Record-level (per-row button)

In the page component, add state + render:

```tsx
const [printRecord, setPrintRecord] = useState<RecordType | null>(null)

// In JSX (alongside other modals):
{
  printRecord && <MyDocument record={printRecord} onClose={() => setPrintRecord(null)} />
}
```

Pass `setPrintRecord` to row components as an action handler.

### Report-level (page header button)

```tsx
const [reportOpen, setReportOpen] = useState(false)

// Header button:
<button onClick={() => setReportOpen(true)} className="...">
  <FileText size={16} /> {t('printReport')}
</button>

// Render:
<MyReport open={reportOpen} onClose={() => setReportOpen(false)} />
```

---

## Step 9 — Translations

Add to BOTH `en` and `ms` in `frontend/src/lib/translations.ts`:

Required keys:

- Document title (shown in toolbar and at top of printed page)
- `printButton` — already exists globally (`'Print'` / `'Cetak'`)

---

## Gotchas

- **Never use `createPortal` inside a component with `hover:-translate-y-*`** — CSS transforms create new stacking contexts, breaking `position: fixed` inside children. That's why we portal to `document.body`.
- **Print CSS class names must be globally unique** — if two printable components are mounted at the same time, their `@media print` rules will conflict. Use distinct scope classes.
- **Dark mode in print** — the `.scope-print` block forces `background: white` and `color: black`. Do NOT add `dark:` variants inside the printable content area.
- **Images in print** — `img` tags with external URLs print fine. SVGs from lucide-react also print. But `background-image` CSS may not print (browser-dependent).
- **Long tables** — add `break-inside: avoid` on `<tr>` elements to prevent rows from splitting across pages.
- **`@react-pdf/renderer`** — for PDF download (not browser print), use the separate pattern in `PortfolioReportPDF.tsx`. Do NOT mix `@media print` and `@react-pdf/renderer` in the same component.

---

## Existing Documents (Reference)

| Document          | File                                                  | Scope Class              | Trigger                           |
| ----------------- | ----------------------------------------------------- | ------------------------ | --------------------------------- |
| Fee Invoice       | `components/admin/FeeInvoice.tsx`                     | `invoice-print`          | Per-row (FeeTableRow)             |
| Overdue Notice    | `components/admin/FeeInvoice.tsx` (variant)           | `invoice-print`          | Per-row (FeeTableRow)             |
| Enrollment Letter | `components/admin/EnrollmentLetterView.tsx`           | `enrollment-print`       | Per-row (type=registration, paid) |
| Collection Sheet  | `pages/fees/components/ClassCollectionSheet.tsx`      | `collection-sheet-print` | Page header button                |
| Monthly Report    | `components/admin/MonthlyCollectionReport.tsx`        | `monthly-report-print`   | Page header button                |
| Annual Report     | `pages/AnnualReportPage.tsx`                          | `annual-report-print`    | Standalone page                   |
| Fee Statement     | `pages/FeeStatementPage.tsx`                          | `statement-print`        | Standalone page                   |
| Attendance Sheet  | `pages/attendance/components/AttendancePrintView.tsx` | `attendance-print`       | Page header button                |
| Receipt           | `components/admin/ReceiptView.tsx`                    | `receipt-print`          | Per-row (FeeTableRow)             |
| Portfolio Report  | `pages/portfolio/PortfolioReportPDF.tsx`              | N/A (react-pdf)          | PDF download button               |
