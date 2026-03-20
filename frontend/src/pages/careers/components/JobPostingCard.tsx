import { useState } from 'react'
import { Pencil, Trash2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useT } from '@/hooks/useT'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import type { JobPosting } from '@/types'

const TYPE_STYLES: Record<string, string> = {
  full_time: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  part_time: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  internship: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  contract: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  published: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400',
}

interface Props {
  posting: JobPosting
  onEdit: () => void
  onDelete: () => void
}

export function JobPostingCard({ posting, onEdit, onDelete }: Props) {
  const t = useT()
  const [showDelete, setShowDelete] = useState(false)

  const typeKey = posting.type as keyof typeof TYPE_STYLES
  const statusKey = posting.status as keyof typeof STATUS_STYLES

  const typeLabel =
    posting.type === 'full_time'
      ? t('fullTime')
      : posting.type === 'part_time'
        ? t('partTime')
        : posting.type === 'internship'
          ? t('internship')
          : t('contract')

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col gap-3">
      {/* Title */}
      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug line-clamp-2">
        {posting.title}
      </h3>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_STYLES[typeKey] ?? TYPE_STYLES.full_time}`}
        >
          {typeLabel}
        </span>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[statusKey] ?? STATUS_STYLES.draft}`}
        >
          {t(`posting_${posting.status}` as keyof typeof t)}
        </span>
      </div>

      {/* Department */}
      {posting.department && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{posting.department}</p>
      )}

      {/* Salary */}
      {posting.salary_min != null && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          RM {Number(posting.salary_min).toLocaleString('en-MY', { minimumFractionDigits: 0 })}
          {posting.salary_max != null && posting.salary_max !== posting.salary_min && (
            <>
              {' '}
              - RM{' '}
              {Number(posting.salary_max).toLocaleString('en-MY', { minimumFractionDigits: 0 })}
            </>
          )}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-200 dark:border-gray-800">
        <Link
          to={`/admin/careers/applications?posting_id=${posting.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-kinder-blue hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <Users size={13} />
          {t('viewApplications')}
        </Link>

        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-kinder-blue/10 transition-all"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <DeleteDialog
        show={showDelete}
        itemName={posting.title}
        onConfirm={() => {
          onDelete()
          setShowDelete(false)
        }}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
