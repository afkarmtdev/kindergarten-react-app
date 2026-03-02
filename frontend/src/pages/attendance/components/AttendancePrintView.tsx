import { useState } from 'react'
import { X, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { useT } from '@/hooks/useT'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import type { Student, AttendanceRecord } from '@/types'
import type { Status } from '../constants'

interface Props {
  students: Student[]
  records: AttendanceRecord[]
  selectedDate: string
  classFilter: string
  onClose: () => void
}

const STATUSES: Status[] = ['present', 'absent', 'late', 'excused']

export function AttendancePrintView({
  students,
  records,
  selectedDate,
  classFilter,
  onClose,
}: Props) {
  const t = useT()
  const { schoolName, address, logoUrl } = useSchoolInfo()
  const [mode, setMode] = useState<'blank' | 'filled'>('filled')

  const recordMap = new Map(records.map((r) => [r.student_id, r.status as Status]))

  const filtered = classFilter ? students.filter((s) => s.class_name === classFilter) : students
  const sorted = [...filtered].sort((a, b) => a.full_name.localeCompare(b.full_name))

  const dateStr = format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .attendance-print, .attendance-print * { visibility: visible !important; }
          .attendance-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 24px !important;
            color: black !important;
          }
          .attendance-print table { border-collapse: collapse !important; }
          .attendance-print th, .attendance-print td { border: 1px solid #d1d5db !important; }
          .attendance-no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm attendance-no-print-overlay">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 attendance-no-print shrink-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t('printAttendanceTitle')}
            </h2>
            <div className="flex items-center gap-2">
              {/* Mode toggle */}
              <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
                <button
                  onClick={() => setMode('filled')}
                  className={`px-3 py-1.5 font-semibold transition-colors ${
                    mode === 'filled'
                      ? 'bg-kinder-orange text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {t('printModeFilled')}
                </button>
                <button
                  onClick={() => setMode('blank')}
                  className={`px-3 py-1.5 font-semibold transition-colors ${
                    mode === 'blank'
                      ? 'bg-kinder-orange text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {t('printModeBlank')}
                </button>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kinder-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                <Printer size={15} />
                {t('printAttendance')}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Preview (scrollable) */}
          <div className="overflow-y-auto flex-1 p-6">
            <div className="attendance-print">
              {/* Header */}
              <div className="text-center mb-4">
                {logoUrl && (
                  <img src={logoUrl} alt="" className="h-12 mx-auto mb-2 object-contain" />
                )}
                <h1 className="text-xl font-extrabold text-gray-900">{schoolName}</h1>
                {address && (
                  <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{address}</p>
                )}
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  {t('printAttendanceTitle')}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{dateStr}</p>
                {classFilter && <p className="text-sm text-gray-500 mt-0.5">{classFilter}</p>}
                <div className="border-b-2 border-gray-900 mt-3 mb-1" />
                <div className="border-b border-gray-400" />
              </div>

              {/* Table */}
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-600 w-10">
                      {t('printNo')}
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-600">
                      {t('student')}
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center text-xs font-bold text-gray-600 w-10">
                      P
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center text-xs font-bold text-gray-600 w-10">
                      A
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center text-xs font-bold text-gray-600 w-10">
                      L
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center text-xs font-bold text-gray-600 w-10">
                      E
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-600 w-28">
                      {t('printNotes')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((student, i) => {
                    const status = recordMap.get(student.id) ?? null
                    return (
                      <tr key={student.id}>
                        <td className="border border-gray-300 px-2 py-1.5 text-gray-600 text-center">
                          {i + 1}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-gray-900 font-medium">
                          {student.full_name}
                        </td>
                        {STATUSES.map((s) => (
                          <td key={s} className="border border-gray-300 px-2 py-1.5 text-center">
                            {mode === 'blank' ? (
                              <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm" />
                            ) : status === s ? (
                              <span className="text-gray-900 font-bold">{'\u2713'}</span>
                            ) : null}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-2 py-1.5 text-gray-500 text-xs">
                          {mode === 'filled'
                            ? (records.find((r) => r.student_id === student.id)?.notes ?? '')
                            : ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Legend */}
              <p className="text-xs text-gray-500 mt-4">{t('printLegend')}</p>

              {/* Footer */}
              <div className="flex justify-between text-xs text-gray-400 mt-6 pt-3 border-t border-dashed border-gray-300">
                <span>{schoolName}</span>
                <span>
                  {t('showing')} {sorted.length} {t('students').toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
