import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { User, Mail, Phone, Gift, X } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { isBirthdayToday } from '@/lib/utils'
import type { Student } from '@/types'
import type { Status } from '../constants'

export function StudentInfoCard({
  student: s,
  stats,
  presentRate,
  totalAll,
}: {
  student: Student
  stats: Partial<Record<Status, number>>
  presentRate: number
  totalAll: number
  onEdit: () => void
}) {
  const t = useT()
  const [photoOpen, setPhotoOpen] = useState(false)

  useEffect(() => {
    if (!photoOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPhotoOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [photoOpen])

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          {s.photo_url ? (
            <img
              src={s.photo_url}
              alt={s.full_name}
              className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setPhotoOpen(true)}
            />
          ) : (
            <div className="w-20 h-20 bg-kinder-blue rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">{s.full_name[0]}</span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
              {s.full_name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-block bg-orange-50 dark:bg-orange-900/30 text-kinder-orange text-xs font-semibold px-2.5 py-1 rounded-full">
                {s.class_name}
              </span>
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                  s.gender === 'male'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                }`}
              >
                {s.gender === 'male' ? t('boy') : t('girl')}
              </span>
              {s.date_of_birth && (
                <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {format(new Date(s.date_of_birth + 'T00:00:00'), 'dd MMM yyyy')}
                </span>
              )}
              {s.date_of_birth && isBirthdayToday(s.date_of_birth) && (
                <span className="inline-flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Gift size={11} />
                  {t('birthdayToday')}
                </span>
              )}
            </div>

            {s.parent && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <User size={13} className="flex-shrink-0" />
                  <span>{s.parent.full_name}</span>
                </div>
                {s.parent.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Mail size={13} className="flex-shrink-0" />
                    <span>{s.parent.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Phone size={13} className="flex-shrink-0" />
                  <span>{s.parent.phone}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          {[
            {
              label: t('totalRecorded'),
              value: totalAll,
              color: 'text-gray-700 dark:text-gray-200',
            },
            { label: t('presentRate'), value: `${presentRate}%`, color: 'text-kinder-green' },
            { label: t('absent'), value: stats.absent ?? 0, color: 'text-red-500' },
            { label: t('late'), value: stats.late ?? 0, color: 'text-yellow-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {photoOpen &&
        s.photo_url &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-6"
            onClick={() => setPhotoOpen(false)}
          >
            <button
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setPhotoOpen(false)}
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
              <img
                src={s.photo_url}
                alt={s.full_name}
                className="w-full max-w-xs rounded-3xl object-cover shadow-2xl"
              />
              <p className="text-white font-bold text-lg">{s.full_name}</p>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
