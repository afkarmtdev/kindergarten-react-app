// ─── ClassCollectionSheet ────────────────────────────────────────────────────
// Printable class fee collection sheet.
// Shows all fee records for a selected class and month in a table format
// suitable for manual collection tracking.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer, X } from 'lucide-react'
import { feesApi, classesApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { formatRM } from '../constants'
import type { ClassSheetStudentRow } from '@/types'

interface Props {
  initialClass?: string
  initialMonth?: string
  onClose: () => void
}

export function ClassCollectionSheet({ initialClass = '', initialMonth = '', onClose }: Props) {
  const t = useT()
  const { schoolName, address, logoUrl, registrationNumber, phone } = useSchoolInfo()

  const currentMonth = initialMonth || new Date().toISOString().slice(0, 7)
  const [selectedClassId, setSelectedClassId] = useState(initialClass)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const { data: classesData } = useQuery({
    queryKey: ['classes', { page: 1, search: '' }],
    queryFn: () => classesApi.getAll({ limit: 50 }),
  })

  const classes = classesData?.data ?? []
  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name ?? ''

  const { data: sheetData, isLoading } = useQuery({
    queryKey: ['fees-class-sheet', { class_id: selectedClassId, month: selectedMonth }],
    queryFn: () => feesApi.classSheet({ class_id: selectedClassId, month: selectedMonth }),
    enabled: !!selectedClassId && !!selectedMonth,
  })

  const formattedMonth = selectedMonth
    ? new Date(selectedMonth + '-01').toLocaleDateString('en-MY', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  const students: ClassSheetStudentRow[] = sheetData?.students ?? []
  const totals = sheetData?.totals

  // Assign sequential numbers to students
  let studentCounter = 0

  const content = (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .collection-sheet-print, .collection-sheet-print * { visibility: visible !important; }
          .collection-sheet-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; padding: 24px !important; }
          .collection-sheet-no-print { display: none !important; }
          @page { size: A4 portrait; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-5xl border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 collection-sheet-no-print">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mr-2">
              {t('classCollectionSheetTitle')}
            </h2>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange"
            >
              <option value="">{t('selectClassPrompt')}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange"
            />

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => window.print()}
                disabled={!selectedClassId || !sheetData}
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

          {/* Sheet body */}
          <div className="overflow-y-auto flex-1">
            <div className="collection-sheet-print p-6">
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

              {/* Sheet title */}
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-gray-900 tracking-wide">
                  {t('classCollectionSheetTitle').toUpperCase()}
                </h2>
                {selectedClassId && (
                  <p className="text-sm text-gray-600 mt-1">
                    {t('feeClass')}: <strong>{selectedClassName}</strong>
                    {formattedMonth && <> &mdash; {formattedMonth}</>}
                  </p>
                )}
              </div>

              {!selectedClassId ? (
                <div className="py-12 text-center text-gray-400 dark:text-gray-600 collection-sheet-no-print">
                  {t('selectClassPrompt')}
                </div>
              ) : isLoading ? (
                <div className="py-12 text-center text-gray-400 dark:text-gray-600 collection-sheet-no-print">
                  {t('loading')}
                </div>
              ) : students.length === 0 ? (
                <div className="py-12 text-center text-gray-400 dark:text-gray-600">
                  {t('collectionSheetNoRecords')}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border border-gray-300">
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700 w-8">
                            {t('collectionSheetNo')}
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">
                            {t('collectionSheetStudent')}
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">
                            {t('collectionSheetFeeDesc')}
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700 w-20">
                            {t('collectionSheetType')}
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700 w-20">
                            {t('collectionSheetDueDate')}
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right font-semibold text-gray-700 w-20">
                            {t('collectionSheetAmountDue')}
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right font-semibold text-gray-700 w-16">
                            {t('collectionSheetDiscount')}
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right font-semibold text-gray-700 w-20">
                            {t('collectionSheetBalance')}
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-700 w-16">
                            {t('collectionSheetCollected')}
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">
                            {t('collectionSheetRemarks')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => {
                          studentCounter++
                          const rowSpan = Math.max(1, student.records.length)
                          if (student.records.length === 0) {
                            return (
                              <tr key={student.student_id} className="border border-gray-200">
                                <td className="border border-gray-200 px-2 py-2 text-center text-gray-500">
                                  {studentCounter}
                                </td>
                                <td className="border border-gray-200 px-2 py-2 font-medium text-gray-800">
                                  {student.student_name}
                                </td>
                                <td
                                  colSpan={8}
                                  className="border border-gray-200 px-2 py-2 text-gray-400 italic"
                                >
                                  —
                                </td>
                              </tr>
                            )
                          }
                          return student.records.map((rec, recIdx) => (
                            <tr key={rec.id} className="border border-gray-200 hover:bg-gray-50/50">
                              {recIdx === 0 && (
                                <>
                                  <td
                                    rowSpan={rowSpan}
                                    className="border border-gray-200 px-2 py-2 text-center text-gray-500 align-top"
                                  >
                                    {studentCounter}
                                  </td>
                                  <td
                                    rowSpan={rowSpan}
                                    className="border border-gray-200 px-2 py-2 font-medium text-gray-800 align-top"
                                  >
                                    {student.student_name}
                                  </td>
                                </>
                              )}
                              <td className="border border-gray-200 px-2 py-2 text-gray-700">
                                {rec.description}
                              </td>
                              <td className="border border-gray-200 px-2 py-2 text-gray-600">
                                {rec.type}
                              </td>
                              <td className="border border-gray-200 px-2 py-2 text-gray-600">
                                {rec.due_date ?? '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-2 text-right font-semibold text-gray-900">
                                {formatRM(rec.amount_owed)}
                              </td>
                              <td className="border border-gray-200 px-2 py-2 text-right text-green-700">
                                {rec.discount_amount > 0
                                  ? `-${formatRM(rec.discount_amount)}`
                                  : '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-2 text-right font-semibold text-red-700">
                                {formatRM(
                                  Math.max(
                                    0,
                                    rec.amount_owed - rec.discount_amount - rec.amount_paid
                                  )
                                )}
                              </td>
                              <td className="border border-gray-200 px-2 py-2 text-center">
                                <div className="border border-gray-400 w-5 h-5 mx-auto" />
                              </td>
                              <td className="border border-gray-200 px-2 py-2 text-gray-400" />
                            </tr>
                          ))
                        })}

                        {/* Totals row */}
                        {totals && (
                          <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                            <td
                              colSpan={5}
                              className="border border-gray-300 px-2 py-2 text-right text-gray-800"
                            >
                              {t('collectionSheetTotal')}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">
                              {formatRM(totals.amount_owed)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right" />
                            <td className="border border-gray-300 px-2 py-2 text-right text-red-700">
                              {formatRM(Math.max(0, totals.balance))}
                            </td>
                            <td colSpan={2} className="border border-gray-300 px-2 py-2" />
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Signature section */}
                  <div className="mt-8 flex gap-16 text-sm text-gray-700">
                    <div>
                      <p className="mb-6">{t('collectionSheetPreparedBy')}:</p>
                      <div className="border-b border-gray-400 w-48 mb-1" />
                      <p className="text-xs text-gray-500">{t('collectionSheetSignatureLine')}</p>
                      <p className="text-xs text-gray-500 mt-2">{t('collectionSheetDateLine')}</p>
                    </div>
                    <div>
                      <p className="mb-6">{t('collectionSheetVerifiedBy')}:</p>
                      <div className="border-b border-gray-400 w-48 mb-1" />
                      <p className="text-xs text-gray-500">{t('collectionSheetSignatureLine')}</p>
                      <p className="text-xs text-gray-500 mt-2">{t('collectionSheetDateLine')}</p>
                    </div>
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
