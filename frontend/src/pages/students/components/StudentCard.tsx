import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Phone, Pencil, Trash2 } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { isBirthdayToday } from '@/lib/utils'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import type { Student } from '@/types'

export function StudentCard({
  student,
  onEdit,
  onDelete,
}: {
  student: Student
  onEdit: (s: Student) => void
  onDelete: (id: string) => void
}) {
  const t = useT()
  const [showDelete, setShowDelete] = useState(false)

  return (
    <>
      <Link
        to={`/admin/students/${student.id}`}
        className={`block bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border-2 border-gray-200 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-0.5${student.status !== 'active' ? ' opacity-70' : ''}`}
      >
        <div className="flex items-start gap-4">
          {student.photo_url ? (
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-kinder-blue rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">{student.full_name[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">
              {student.full_name}
            </h3>
            <span className="inline-block bg-orange-50 dark:bg-orange-900/30 text-kinder-orange text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
              {student.class_name}
            </span>
            <span
              className={`ml-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                student.gender === 'male'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
              }`}
            >
              {student.gender === 'male' ? t('boy') : t('girl')}
            </span>
            {isBirthdayToday(student.date_of_birth) && (
              <span className="ml-1.5 inline-block bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
                {t('birthdayToday')}
              </span>
            )}
            {student.status === 'graduated' && (
              <span className="ml-1.5 inline-block bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
                {t('graduated')}
              </span>
            )}
            {student.status === 'inactive' && (
              <span className="ml-1.5 inline-block bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
                {t('inactive')}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(student)
              }}
              className="text-gray-400 dark:text-gray-600 hover:text-kinder-blue dark:hover:text-kinder-blue transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowDelete(true)
              }}
              className="text-gray-400 dark:text-gray-600 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {student.parent && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <User size={11} className="flex-shrink-0" />
              <span className="truncate">
                {t('parent')}: {student.parent.full_name}
              </span>
            </div>
            {student.parent.email && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Mail size={11} className="flex-shrink-0" />
                <span className="truncate">{student.parent.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Phone size={11} className="flex-shrink-0" />
              <span>{student.parent.phone}</span>
            </div>
          </div>
        )}
      </Link>
      <DeleteDialog
        show={showDelete}
        itemName={student.full_name}
        onConfirm={() => {
          onDelete(student.id)
          setShowDelete(false)
        }}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}
