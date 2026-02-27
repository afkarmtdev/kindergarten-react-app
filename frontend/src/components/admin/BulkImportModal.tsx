import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react'
import { studentsApi } from '@/lib/api'
import { useT } from '@/hooks/useT'

type Step = 'idle' | 'preview' | 'result'

interface ParsedRow {
  index: number
  data: Record<string, string>
  error?: string
}

const CSV_HEADERS = ['full_name', 'date_of_birth', 'gender', 'class_name', 'parent_name', 'parent_email', 'parent_phone']

const SAMPLE_ROWS = [
  'Ahmad Hariz bin Fauzi,2019-03-15,male,Sunflower,Ahmad Fauzi,fauzi@email.com,0123456789',
  'Nur Aisyah binti Rahmat,2019-07-22,female,Rainbow,Siti Rahimah,siti@email.com,0198765432',
  'Arjun Krishnan,2020-01-10,male,Butterfly,Priya Krishnan,priya@email.com,0112345678',
]

function downloadSample() {
  const csv = [CSV_HEADERS.join(','), ...SAMPLE_ROWS].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'students-sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRow(row: Record<string, string>): string | undefined {
  if (!row.full_name?.trim()) return 'full_name is required'
  if (!['male', 'female'].includes(row.gender)) return 'gender must be male or female'
  if (!row.class_name?.trim()) return 'class_name is required'
  if (!row.parent_name?.trim()) return 'parent_name is required'
  if (!row.parent_email?.trim() || !EMAIL_REGEX.test(row.parent_email)) return 'parent_email is invalid'
  if (!row.parent_phone?.trim()) return 'parent_phone is required'
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line, i) => {
    const values = line.split(',').map((v) => v.trim())
    const data: Record<string, string> = {}
    headers.forEach((h, j) => { data[h] = values[j] ?? '' })
    const error = validateRow(data)
    return { index: i + 2, data, error }
  })
}

interface Props {
  open: boolean
  onClose: () => void
}

export function BulkImportModal({ open, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('idle')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [result, setResult] = useState<{ imported: number; failed: { row: number; reason: string }[] } | null>(null)
  const [fileName, setFileName] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      studentsApi.bulkImport(rows.filter((r) => !r.error).map((r) => r.data)),
    onSuccess: (data) => {
      setResult(data)
      setStep('result')
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const handleFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCsv(text)
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const validCount = rows.filter((r) => !r.error).length
  const invalidCount = rows.filter((r) => !!r.error).length

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep('idle')
      setRows([])
      setResult(null)
      setFileName('')
    }, 200)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">{t('bulkImport')}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Step 1: idle ── */}
          {step === 'idle' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('csvFormatHint')}</p>
                <button
                  onClick={downloadSample}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs text-kinder-blue font-semibold hover:underline"
                >
                  <Download size={13} />
                  Sample CSV
                </button>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center cursor-pointer hover:border-kinder-orange dark:hover:border-kinder-orange transition-colors group"
              >
                <Upload size={32} className="mx-auto text-gray-300 dark:text-gray-600 group-hover:text-kinder-orange transition-colors mb-3" />
                <p className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Click to upload CSV</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">.csv files only</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          )}

          {/* ── Step 2: preview ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{fileName}</span>
                </div>
                <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <CheckCircle size={11} />
                  {t('validRows', { n: validCount })}
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <AlertCircle size={11} />
                    {t('invalidRows', { n: invalidCount })}
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{t('willBeSkipped')}</span>
                )}
              </div>

              {/* Preview table */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-auto max-h-72">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-3 py-2 text-gray-500 dark:text-gray-400 font-bold w-10">Row</th>
                      {CSV_HEADERS.map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap">{h}</th>
                      ))}
                      <th className="text-left px-3 py-2 text-gray-500 dark:text-gray-400 font-bold">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row) => (
                      <tr
                        key={row.index}
                        className={`border-b border-gray-50 dark:border-gray-800 last:border-0 ${
                          row.error ? 'bg-red-50/60 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="px-3 py-1.5 text-gray-400 dark:text-gray-500">{row.index}</td>
                        {CSV_HEADERS.map((h) => (
                          <td
                            key={h}
                            className={`px-3 py-1.5 whitespace-nowrap max-w-[120px] truncate ${
                              row.error && !row.data[h]
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {row.data[h] || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}
                          </td>
                        ))}
                        <td className="px-3 py-1.5 text-red-500 dark:text-red-400 whitespace-nowrap">
                          {row.error ?? ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                    +{rows.length - 20} more rows not shown
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: result ── */}
          {step === 'result' && result && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-kinder-green rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{t('importResult')}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('importSuccess', { n: result.imported })}</p>
              </div>

              {result.failed.length > 0 && (
                <div className="text-left bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">
                    {t('importFailed')} ({result.failed.length})
                  </p>
                  <ul className="space-y-1">
                    {result.failed.map((f) => (
                      <li key={f.row} className="text-xs text-red-500 dark:text-red-400">
                        Row {f.row}: {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          {step === 'idle' && (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {t('cancel')}
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => { setStep('idle'); setRows([]); setFileName('') }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={validCount === 0 || mutation.isPending}
                className="flex items-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-all disabled:opacity-60"
              >
                <Upload size={15} />
                {mutation.isPending ? t('saving') : t('importStudents', { n: validCount })}
              </button>
            </>
          )}

          {step === 'result' && (
            <button
              onClick={handleClose}
              className="bg-kinder-green text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-600 transition-all"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
