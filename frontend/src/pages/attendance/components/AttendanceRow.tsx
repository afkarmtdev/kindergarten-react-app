import { useT } from '@/hooks/useT'
import { STATUS_CONFIG, type Status } from '../constants'
import type { Student } from '@/types'

export function AttendanceRow({
  student,
  status,
  isPending,
  index,
  onMark,
}: {
  student: Student
  status: Status | null
  isPending: boolean
  index: number
  onMark: (studentId: string, status: Status) => void
}) {
  const t = useT()

  return (
    <tr
      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors ${
        isPending
          ? 'bg-amber-50/40 dark:bg-amber-900/10'
          : index % 2 === 0
            ? 'bg-white dark:bg-gray-900'
            : 'bg-gray-50/30 dark:bg-gray-800/30'
      }`}
    >
      <td className="px-3 md:px-6 py-2 md:py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-kinder-blue rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {student.full_name[0]}
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {student.full_name}
            </span>
            {isPending && (
              <span className="ml-2 text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                {t('unsaved')}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 md:px-6 py-2 md:py-3.5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{student.class_name}</span>
      </td>
      <td className="px-3 md:px-6 py-2 md:py-3.5">
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
            const { labelKey, icon: Icon, bg } = STATUS_CONFIG[s]
            const isActive = status === s
            return (
              <button
                key={s}
                onClick={() => onMark(student.id, s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isActive
                    ? bg
                    : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={11} />
                {t(labelKey)}
              </button>
            )
          })}
        </div>
      </td>
    </tr>
  )
}
