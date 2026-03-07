// ─── Fee Statement Page ────────────────────────────────────────────────────────
// /admin/fees/statement/:studentId?year=YYYY
// Printable annual fee statement for LHDN child education tax relief.

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Printer, List } from 'lucide-react'
import { feesApi } from '@/lib/api'
import type { FeeRecord } from '@/types'
import { computeLedgerRows } from '@/lib/ledger'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'

export function FeeStatementPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const t = useT()
  const { schoolName, address, logoUrl } = useSchoolInfo()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [ledgerView, setLedgerView] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['fee-statement', studentId, year],
    queryFn: () => feesApi.getStatement(studentId!, year),
    enabled: !!studentId,
  })

  usePageTitle(data?.student?.full_name ? `${data.student.full_name} — Statement` : 'Fee Statement')

  const formatRM = (v: number | string) => `RM ${Number(v).toFixed(2)}`

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      unpaid: t('feeStatusUnpaid'),
      partial: t('feeStatusPartial'),
      paid: t('feeStatusPaid'),
      waived: t('feeStatusWaived'),
    }
    return map[s] ?? s
  }

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      paid: 'text-green-600',
      waived: 'text-gray-500',
      partial: 'text-yellow-600',
      unpaid: 'text-red-500',
    }
    return map[s] ?? ''
  }

  const records = data?.records ?? []
  const student = data?.student

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .statement-print, .statement-print * { visibility: visible !important; }
          .statement-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; padding: 24px !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-4 md:p-8 max-w-3xl">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 no-print">
          <Link
            to="/admin/fees"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronLeft size={16} />
            {t('fees')}
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={() => setLedgerView((v) => !v)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                ledgerView
                  ? 'border-kinder-blue bg-kinder-blue/10 text-kinder-blue dark:text-kinder-blue'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <List size={15} />
              {t('ledgerView')}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kinder-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              <Printer size={15} />
              {t('printStatement')}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="statement-print bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Statement header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 text-center">
              {logoUrl && <img src={logoUrl} alt="" className="h-12 mx-auto mb-2 object-contain" />}
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                {schoolName}
              </h1>
              {address && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 whitespace-pre-line">
                  {address}
                </p>
              )}
              <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mt-1">
                {t('feeStatementTitle')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('statementYear')}: {year}
              </p>
            </div>

            {/* Student info */}
            {student && (
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                    Student
                  </p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{student.full_name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{student.class_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                    Parent
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {student.parent_name}
                  </p>
                </div>
              </div>
            )}

            {/* Records table / Ledger table */}
            {records.length === 0 ? (
              <div className="py-12 text-center text-gray-400 dark:text-gray-600">
                No fee records for {year}
              </div>
            ) : ledgerView ? (
              (() => {
                const ledgerRows = computeLedgerRows(records as FeeRecord[])
                const closingBalance = ledgerRows.at(-1)?.running_balance ?? 0
                return (
                  <div>
                    {/* Section title */}
                    <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('ledgerTitle')} — Running Balance Statement
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Date
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {t('feeDesc')}
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {t('feeType')}
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {t('ledgerCharge')}
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {t('ledgerPayment')}
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {t('ledgerBalance')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {ledgerRows.map((r) => (
                            <tr
                              key={r.id}
                              className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                            >
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {r.due_date ?? r.created_at?.slice(0, 10) ?? '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                                {r.description}
                              </td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
                                {r.type}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                                {formatRM(r.charge)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-green-600 dark:text-green-400">
                                {r.payment > 0 ? formatRM(r.payment) : '—'}
                              </td>
                              <td
                                className={`px-4 py-3 text-right tabular-nums font-semibold ${
                                  r.running_balance > 0.001
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-green-600 dark:text-green-400'
                                }`}
                              >
                                {formatRM(r.running_balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
                            <td colSpan={5} className="px-4 py-3 font-semibold">
                              {t('ledgerOpeningBalance')}: RM 0.00
                              <span className="mx-3">|</span>
                              {t('ledgerClosingBalance')}:
                            </td>
                            <td
                              className={`px-4 py-3 text-right tabular-nums font-extrabold text-sm ${
                                closingBalance > 0.001
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              {formatRM(closingBalance)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('feeDesc')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('feeDueDate')}
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('feeOwed')}
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('feeDiscount')}
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('feePaid')}
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('feeStatus')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {records.map((r: FeeRecord) => (
                      <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {r.description}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {r.due_date ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold tabular-nums">
                          {formatRM(r.amount_owed)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 tabular-nums">
                          {Number(r.discount_amount) > 0 ? `-${formatRM(r.discount_amount)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatRM(r.amount_paid)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold ${statusColor(r.status)}`}>
                            {statusLabel(r.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                      <td
                        colSpan={4}
                        className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100"
                      >
                        {t('statementTotalPaid')}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-kinder-orange tabular-nums">
                        {formatRM(data?.total_paid ?? 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* LHDN note */}
            <div className="px-6 py-4 border-t border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                This statement is for your personal tax records. Total fees paid may be eligible for
                child education tax relief under the Malaysian Income Tax Act (LHDN).
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
