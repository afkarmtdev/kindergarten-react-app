// ─── Annual Financial Summary Page ────────────────────────────────────────────
// /admin/fees/annual-report?year=YYYY
// School-wide financial summary by fee type for a given year.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Printer, TrendingUp } from 'lucide-react'
import { feesApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { formatRM } from '@/pages/fees/constants'
import type { FeeType } from '@/types'

const TYPE_LABELS: Record<FeeType, { en: string }> = {
  tuition: { en: 'Tuition' },
  activity: { en: 'Activity' },
  uniform: { en: 'Uniform' },
  registration: { en: 'Registration' },
  other: { en: 'Other' },
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type as FeeType]?.en ?? type
}

export function AnnualReportPage() {
  usePageTitle('Annual Report')
  const t = useT()
  const { schoolName, address, logoUrl, registrationNumber } = useSchoolInfo()

  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const { data, isLoading } = useQuery({
    queryKey: ['fees-annual-report', year],
    queryFn: () => feesApi.annualReport(year),
  })

  const totals = data?.totals
  const byType = data?.by_type ?? []

  const collectionRate =
    totals && totals.total_owed > 0 ? Math.round((totals.total_paid / totals.total_owed) * 100) : 0

  const generatedDate = new Date().toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .annual-report-print, .annual-report-print * { visibility: visible !important; }
          .annual-report-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; padding: 24px !important; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 16mm; }
        }
      `}</style>

      <div className="p-4 md:p-8 max-w-4xl">
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
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kinder-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              <Printer size={15} />
              {t('printAnnualReport')}
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
          <div className="annual-report-print bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Report header */}
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
              {registrationNumber && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Reg. No: {registrationNumber}
                </p>
              )}
              {/* Double border line */}
              <div className="border-b-2 border-gray-900 dark:border-gray-100 mt-4 mb-1" />
              <div className="border-b border-gray-400 dark:border-gray-500 mb-4" />
              <div className="flex items-center justify-center gap-2 mt-2">
                <TrendingUp size={18} className="text-kinder-orange" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                  {t('annualReportTitle')}
                </h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('statementYear')}: {year}
              </p>
            </div>

            {byType.length === 0 ? (
              <div className="py-16 text-center text-gray-400 dark:text-gray-600">
                No fee records for {year}.
              </div>
            ) : (
              <>
                {/* Summary strip — 4 stat boxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100 dark:border-gray-800">
                  {/* Total Charged */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                      Total Charged
                    </p>
                    <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200 tabular-nums">
                      {formatRM(totals?.total_owed ?? 0)}
                    </p>
                  </div>
                  {/* Total Collected */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                      Total Collected
                    </p>
                    <p className="text-lg font-extrabold text-green-600 dark:text-green-400 tabular-nums">
                      {formatRM(totals?.total_paid ?? 0)}
                    </p>
                  </div>
                  {/* Total Outstanding */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                      Total Outstanding
                    </p>
                    <p
                      className={`text-lg font-extrabold tabular-nums ${
                        (totals?.outstanding ?? 0) > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {formatRM(totals?.outstanding ?? 0)}
                    </p>
                  </div>
                  {/* Overdue Records */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                      Overdue Records
                    </p>
                    <p
                      className={`text-lg font-extrabold tabular-nums ${
                        (totals?.overdue_count ?? 0) > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {totals?.overdue_count ?? 0}
                    </p>
                  </div>
                </div>

                {/* By Fee Type table */}
                <div className="px-6 pt-5 pb-2">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                    {t('monthlyReportByType')}
                  </h3>
                </div>
                <div className="overflow-x-auto px-6 pb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Fee Type
                        </th>
                        <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Total Charged
                        </th>
                        <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Discounts
                        </th>
                        <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Total Collected
                        </th>
                        <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Outstanding
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {byType.map((row) => (
                        <tr
                          key={row.type}
                          className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                        >
                          <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-200">
                            {typeLabel(row.type)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                            {formatRM(row.total_owed)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-green-600 dark:text-green-400">
                            {row.total_discounts > 0 ? `-${formatRM(row.total_discounts)}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-green-700 dark:text-green-300 font-semibold">
                            {formatRM(row.total_paid)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right tabular-nums font-semibold ${
                              row.outstanding > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-500 dark:text-gray-500'
                            }`}
                          >
                            {row.outstanding > 0 ? formatRM(row.outstanding) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60 font-bold">
                        <td className="py-3 px-3 text-gray-900 dark:text-gray-100">Totals</td>
                        <td className="py-3 px-3 text-right tabular-nums text-gray-900 dark:text-gray-100">
                          {formatRM(totals?.total_owed ?? 0)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-green-600 dark:text-green-400">
                          {(totals?.total_discounts ?? 0) > 0
                            ? `-${formatRM(totals!.total_discounts)}`
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-green-700 dark:text-green-300">
                          {formatRM(totals?.total_paid ?? 0)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right tabular-nums ${
                            (totals?.outstanding ?? 0) > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-500'
                          }`}
                        >
                          {(totals?.outstanding ?? 0) > 0 ? formatRM(totals!.outstanding) : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Collection Rate + Record Summary */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('collectionRate')}:{' '}
                    <span
                      className={
                        collectionRate >= 90
                          ? 'text-green-600 dark:text-green-400'
                          : collectionRate >= 70
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {collectionRate}%
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('feeRecordSummary', {
                      count: String(totals?.record_count ?? 0),
                      paid: String(totals?.paid_count ?? 0),
                      overdue: String(totals?.overdue_count ?? 0),
                    })}
                  </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t('annualReportFootnote', { year: String(year) })}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Generated: {generatedDate} — {schoolName}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
