TRIGGER when: user asks to add bulk import, CSV upload, batch import, file upload for data import, or asks to import multiple records from a file.

# bulk-import — Build a Bulk Import Workflow

Resource: $ARGUMENTS

Work through every step in order.

---

## Architecture Overview

Bulk import follows a 3-step state machine: **idle** (file picker) → **preview** (parsed rows with validation) → **result** (imported/failed summary). The frontend parses and validates the CSV, then sends clean JSON to the backend for insertion.

Reference implementation: `BulkImportModal.tsx` + `students.ts POST /bulk`

---

## Step 1 — Define CSV Schema

Determine the columns for the CSV file:

```ts
const CSV_HEADERS = ['column_a', 'column_b', 'column_c'] // lowercase, snake_case

const SAMPLE_ROWS = ['value1,value2,value3', 'value4,value5,value6']
```

Rules:

- Headers are case-insensitive (normalised to lowercase during parsing)
- Required fields must be validated in `validateRow()`
- FK references (e.g. `class_name`) are resolved server-side — accept human-readable names in CSV

---

## Step 2 — Frontend: CSV Parser + Validator

Create validation and parsing functions inside the modal component:

```tsx
type Step = 'idle' | 'preview' | 'result'

interface ParsedRow {
  index: number // 1-indexed row number matching Excel/Sheets (header = row 1)
  data: Record<string, string>
  error?: string // validation error message, undefined if valid
}

function validateRow(row: Record<string, string>): string | undefined {
  if (!row.column_a?.trim()) return 'column_a is required'
  // Add field-specific validation...
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return [] // need header + at least one data row

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line, i) => {
    const values = line.split(',').map((v) => v.trim())
    const data: Record<string, string> = {}
    headers.forEach((h, j) => {
      data[h] = values[j] ?? ''
    })
    const error = validateRow(data)
    return { index: i + 2, data, error } // +2 = skip header row + 0-index
  })
}
```

**Row numbering**: `i + 2` makes row numbers match what the user sees in Excel/Google Sheets (row 1 = header, row 2 = first data row).

---

## Step 3 — Frontend: Modal Component

Create `frontend/src/components/admin/Bulk<Resource>Modal.tsx`:

```tsx
import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, X, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react'
import { resourceApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { DiscardDialog } from '@/components/ui/DiscardDialog'
```

### State Machine

```tsx
const [step, setStep] = useState<Step>('idle')
const [rows, setRows] = useState<ParsedRow[]>([])
const [result, setResult] = useState<{
  imported: number
  failed: { row: number; reason: string }[]
} | null>(null)
const [fileName, setFileName] = useState('')
const fileRef = useRef<HTMLInputElement>(null)
```

### File Handler

```tsx
function handleFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const parsed = parseCsv(text)
    setRows(parsed)
    setFileName(file.name)
    setStep('preview')
    markDirty()
  }
  reader.readAsText(file)
}
```

### Download Sample CSV

```tsx
function downloadSample() {
  const csv = [CSV_HEADERS.join(','), ...SAMPLE_ROWS].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '<resource>-sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}
```

### Mutation

```tsx
const mutation = useMutation({
  mutationFn: () => resourceApi.bulkImport(rows.filter((r) => !r.error).map((r) => r.data)),
  onSuccess: (data) => {
    setResult(data)
    setStep('result')
    queryClient.invalidateQueries({ queryKey: ['<resource>'] })
  },
  onError: () => toast.error('Import failed. Please try again.'),
})
```

### Three Steps UI

**Idle**: Drop zone or file picker + "Download Sample CSV" link

```tsx
{
  step === 'idle' && (
    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
      <Upload className="mx-auto mb-3 text-gray-400" size={32} />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('dropCsvHere')}</p>
      <button
        onClick={() => fileRef.current?.click()}
        className="bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold"
      >
        {t('selectFile')}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        onClick={downloadSample}
        className="mt-3 flex items-center gap-1.5 mx-auto text-sm text-kinder-blue hover:underline"
      >
        <Download size={14} /> {t('downloadSample')}
      </button>
    </div>
  )
}
```

**Preview**: Table of parsed rows with error highlighting

```tsx
{
  step === 'preview' && (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {rows.length} rows parsed from {fileName} — {rows.filter((r) => !r.error).length} valid,{' '}
        {rows.filter((r) => r.error).length} errors
      </p>
      <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">
        <table className="w-full text-sm">
          {/* Header row + data rows with error highlighting */}
        </table>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => {
            setStep('idle')
            setRows([])
          }}
          className="px-4 py-2 rounded-xl border ..."
        >
          {t('back')}
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!rows.some((r) => !r.error) || mutation.isPending}
          className="bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? t('importing') : t('import')} ({rows.filter((r) => !r.error).length}
          )
        </button>
      </div>
    </>
  )
}
```

**Result**: Summary with success count + failed rows list

```tsx
{
  step === 'result' && result && (
    <div className="text-center">
      <CheckCircle className="mx-auto mb-3 text-green-500" size={40} />
      <p className="text-lg font-bold text-gray-900 dark:text-white">{result.imported} imported</p>
      {result.failed.length > 0 && (
        <div className="mt-4 text-left">
          <p className="text-sm font-semibold text-red-600 mb-2">
            {result.failed.length} rows failed:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {result.failed.map((f) => (
              <li key={f.row}>
                Row {f.row}: {f.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={onClose}
        className="mt-6 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold"
      >
        {t('done')}
      </button>
    </div>
  )
}
```

### Discard Guard

The modal uses `useDiscardGuard` — call `markDirty()` when a file is loaded (preview step), use `requestClose` on X/backdrop/Cancel. Result step can close directly.

---

## Step 4 — Backend: Bulk Insert Endpoint

Add to the existing route file (`backend/src/routes/<resource>.ts`):

```ts
import { auditCreate } from '../lib/audit'
import { sanitiseStrings } from '../lib/sanitise'

const bulkSchema = z.object({
  <resource>: z.array(z.object({
    // field schemas matching CSV_HEADERS
  })).min(1).max(500),
})

resource.post('/bulk', zValidator('json', bulkSchema), async (c) => {
  const { <resource>: rows } = c.req.valid('json')
  const valid: Record<string, unknown>[] = []
  const failed: { row: number; reason: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = sanitiseStrings(rows[i])
    // Validate + resolve FKs (e.g. class_name → class_id)
    // If invalid: failed.push({ row: i + 2, reason: '...' }); continue
    valid.push({ ...row, ...auditCreate(c) })
  }

  if (valid.length === 0) return c.json({ imported: 0, failed })

  const { error } = await supabase.from('<table>').insert(valid)
  if (error) return c.json({ error: error.message }, 500)

  return c.json({ imported: valid.length, failed }, 201)
})
```

### FK Resolution Pattern

When CSV uses human-readable names instead of UUIDs (e.g. `class_name` instead of `class_id`):

```ts
// Batch-resolve all unique FK values at once (one query, not N queries)
const uniqueNames = [...new Set(rows.map((r) => r.class_name))]
const { data: classRows } = await supabase
  .from('classrooms')
  .select('id, name')
  .in('name', uniqueNames)
  .is('deleted_at', null)

const classMap: Record<string, string> = {}
for (const cls of classRows ?? []) classMap[cls.name] = cls.id

// In the per-row loop:
if (!classMap[row.class_name]) {
  failed.push({ row: i + 2, reason: `class '${row.class_name}' not found` })
  continue
}
valid.push({ ...rest, class_id: classMap[row.class_name], ...auditCreate(c) })
```

---

## Step 5 — API Method

Add to the relevant API object in `frontend/src/lib/api.ts`:

```ts
bulkImport: (rows: Record<string, string>[]) =>
  api.post('/api/<resource>/bulk', { <resource>: rows }).then((r) => r.data),
```

---

## Step 6 — Translations

Add to BOTH `en` and `ms` in `frontend/src/lib/translations.ts`:

```ts
bulkImport / 'Bulk Import' / 'Import Pukal'
dropCsvHere /
  'Drop a CSV file here or click to browse' /
  'Letak fail CSV di sini atau klik untuk pilih'
selectFile / 'Select File' / 'Pilih Fail'
downloadSample / 'Download sample CSV' / 'Muat turun CSV contoh'
importing / 'Importing...' / 'Mengimport...'
```

---

## Step 7 — Tests

Add to the existing route test file:

```ts
describe('POST /bulk — bulk import', () => {
  test('imports valid rows', async () => {
    setMockResponse('<table>', { data: [{ id: '1' }], error: null })
    const res = await resource.request('/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ <resource>: [{ /* valid row */ }] }),
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.imported).toBeGreaterThan(0)
  })

  test('returns failed rows with reasons', async () => { ... })
  test('rejects empty array', async () => { ... })
})
```

---

## Gotchas

- **CSV parsing is intentionally simple** — splits by comma, no handling for quoted fields with embedded commas. For complex CSVs, consider a library like `papaparse`, but for kindergarten data (names, dates, phones) the simple parser works fine.
- **Row numbering must match spreadsheet apps** — use `i + 2` (1 for header + 1 for 0-index) so users can find the failing row in Excel/Sheets.
- **Validation must be duplicated** — frontend validates for instant feedback, backend validates for security. Keep schemas in sync.
- **FK resolution uses `.is('deleted_at', null)`** — don't import records referencing soft-deleted parents (classrooms, fee plans, etc.).
- **Batch size** — cap at 500 rows per request. Supabase has a max request size; very large imports should be chunked client-side.
- **Parent/child auto-creation** — if the import needs to create linked records (e.g. students → parents), do it AFTER the main insert succeeds. Use `Promise.all` for parallel creation. Not atomic — document this for the user.

---

## Existing Bulk Import

| Resource | Frontend                               | Backend                  | Notes                                                |
| -------- | -------------------------------------- | ------------------------ | ---------------------------------------------------- |
| Students | `components/admin/BulkImportModal.tsx` | `students.ts POST /bulk` | Auto-creates parent records via `upsertParentLink()` |
