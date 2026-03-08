// ─── MonthlyCollectionReport ──────────────────────────────────────────────────
// Printable monthly fee collection report.
// Prints in A4 landscape with summary stats, by-class, by-type,
// and outstanding accounts sections.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer, X } from 'lucide-react'
import { feesApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { formatRM } from '@/pages/fees/constants'

interface Props {
  month: string
  onClose: () => void
}

export function MonthlyCollectionReport({ month: initialMonth, onClose }: Props) {
  const t = useT()
  const { schoolName, address, logoUrl, registrationNumber, phone } = useSchoolInfo()

  const currentMonth = initialMonth || new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['fees-monthly-report', { month: selectedMonth }],
    queryFn: () => feesApi.monthlyReport({ month: selectedMonth }),
    enabled: !!selectedMonth,
  })

  const today = new Date().toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedMonth = selectedMonth
    ? new Date(selectedMonth + '-01').toLocaleDateString('en-MY', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  const totals = reportData?.totals
  const byClass = reportData?.by_class ?? []
  const byType = reportData?.by_type ?? []
  const outstanding = reportData?.outstanding_accounts ?? []

  const thCls =
    'border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide bg-gray-100'
  const tdCls = 'border border-gray-200 px-3 py-2 text-sm text-gray-800'
  const tdRightCls =
    'border border-gray-200 px-3 py-2 text-sm text-gray-800 text-right tabular-nums'

  const content = (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .monthly-report-print, .monthly-report-print * { visibility: visible !important; }
          .monthly-report-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; padding: 24px !important; }
          .monthly-report-no-print { display: none !important; }
          @page { size: A4 landscape; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-6xl border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 monthly-report-no-print">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mr-2">
              {t('monthlyReportTitle')}
            </h2>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange"
            />

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => window.print()}
                disabled={!selectedMonth || !reportData}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kinder-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40"
              >
                <Printer size={15} />
                {t('printButton')}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Report body */}
          <div className="overflow-y-auto flex-1">
            <div className="monthly-report-print p-6">
              {/* School header */}
              <div className="text-center mb-4">
                {logoUrl && (
                  <img src={logoUrl} alt="" className="h-10 mx-auto mb-2 object-contain" />
                )}
                <h1 className="text-lg font-extrabold text-gray-900">{schoolName}</h1>
                {address && (
                  <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{address}</p>
                )}
                {registrationNumber && (
                  <p className="text-xs text-gray-500 mt-0.5">Reg. No: {registrationNumber}</p>
                )}
                {phone && <p className="text-xs text-gray-500 mt-0.5">Tel: {phone}</p>}
              </div>

              <div className="border-b-2 border-gray-900 mb-1" />
              <div className="border-b border-gray-400 mb-4" />

              <div className="text-center mb-2">
                <h2 className="text-base font-bold text-gray-900 tracking-wide">
                  {t('monthlyReportTitle').toUpperCase()}
                </h2>
                {formattedMonth && <p className="text-sm text-gray-600 mt-0.5">{formattedMonth}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('monthlyReportGenerated')}: {today}
                </p>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-gray-400 monthly-report-no-print">
                  {t('loading')}
                </div>
              ) : (
                <>
                  {/* Summary stat boxes */}
                  {totals && (
                    <div className="grid grid-cols-4 gap-3 mb-6 mt-4">
                      {[
                        {
                          label: t('totalCharged'),
                          value: formatRM(totals.charged),
                          color: 'border-blue-200 bg-blue-50',
                        },
                        {
                          label: t('totalCollected'),
                          value: formatRM(totals.collected),
                          color: 'border-green-200 bg-green-50',
                        },
                        {
                          label: t('outstanding'),
                          value: formatRM(totals.outstanding),
                          color: 'border-red-200 bg-red-50',
                        },
                        {
                          label: t('monthlyReportRecords'),
                          value: String(totals.record_count),
                          color: 'border-gray-200 bg-gray-50',
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className={`rounded-xl border p-3 text-center ${stat.color}`}
                        >
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                            {stat.label}
                          </p>
                          <p className="text-lg font-extrabold text-gray-900">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* By Class */}
                  {byClass.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                        {t('monthlyReportByClass')}
                      </h3>
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className={thCls}>{t('feeClass')}</th>
                            <th className={`${thCls} text-right`}>{t('monthlyReportStudents')}</th>
                            <th className={`${thCls} text-right`}>{t('monthlyReportCharged')}</th>
                            <th className={`${thCls} text-right`}>{t('monthlyReportCollected')}</th>
                            <th className={`${thCls} text-right`}>{t('monthlyReportDiscount')}</th>
                            <th className={`${thCls} text-right`}>{t('outstanding')}</th>
                            <th className={`${thCls} text-right`}>{t('monthlyReportUnpaid')}</th>
                            <th className={`${thCls} text-right`}>{t('monthlyReportPartial')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {byClass.map((row) => (
                            <tr key={row.class_name} className="hover:bg-gray-50/50">
                              <td className={tdCls}>{row.class_name}</td>
                              <td className={tdRightCls}>{row.student_count}</td>
                              <td className={tdRightCls}>{formatRM(row.charged)}</td>
                              <td className={`${tdRightCls} text-green-700`}>
                                {formatRM(row.collected)}
                              </td>
                              <td className={tdRightCls}>{formatRM(row.discount)}</td>
                              <td className={`${tdRightCls} text-red-700`}>
                                {formatRM(row.outstanding)}
                              </td>
                              <td className={tdRightCls}>{row.unpaid_count}</td>
                              <td className={tdRightCls}>{row.partial_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* By Type */}
                  {byType.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                        {t('monthlyReportByType')}
                      </h3>
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className={thCls}>{t('feeType')}</th>
                            <th className={`${thCls} text-right`}>{t('monthlyReportCharged')}</th>
                            <th className={`${thCls} text-right`}>{t('monthlyReportCollected')}</th>
                            <th className={`${thCls} text-right`}>{t('outstanding')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {byType.map((row) => (
                            <tr key={row.type} className="hover:bg-gray-50/50">
                              <td className={tdCls}>{row.type}</td>
                              <td className={tdRightCls}>{formatRM(row.charged)}</td>
                              <td className={`${tdRightCls} text-green-700`}>
                                {formatRM(row.collected)}
                              </td>
                              <td className={`${tdRightCls} text-red-700`}>
                                {formatRM(row.outstanding)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Outstanding Accounts */}
                  {outstanding.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                        {t('monthlyReportOutstanding')}
                      </h3>
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className={thCls}>{t('collectionSheetNo')}</th>
                            <th className={thCls}>{t('feeStudent')}</th>
                            <th className={thCls}>{t('feeClass')}</th>
                            <th className={thCls}>{t('feeDesc')}</th>
                            <th className={thCls}>{t('feeDueDate')}</th>
                            <th className={`${thCls} text-right`}>{t('feeOwed')}</th>
                            <th className={`${thCls} text-right`}>{t('feePaid')}</th>
                            <th className={`${thCls} text-right`}>{t('feeBalance')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outstanding.map((row, idx) => (
                            <tr
                              key={`${row.student_name}-${row.description}-${idx}`}
                              className="hover:bg-gray-50/50"
                            >
                              <td className={tdCls}>{idx + 1}</td>
                              <td className={tdCls}>{row.student_name}</td>
                              <td className={tdCls}>{row.class_name}</td>
                              <td className={tdCls}>{row.description}</td>
                              <td className={tdCls}>{row.due_date ?? '—'}</td>
                              <td className={tdRightCls}>{formatRM(row.amount_owed)}</td>
                              <td className={`${tdRightCls} text-green-700`}>
                                {formatRM(row.amount_paid)}
                              </td>
                              <td className={`${tdRightCls} text-red-700 font-semibold`}>
                                {formatRM(Math.max(0, row.balance))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-dashed border-gray-300 pt-3 text-center mt-4">
                    <p className="text-xs text-gray-400">
                      Generated by {schoolName} on {today}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
