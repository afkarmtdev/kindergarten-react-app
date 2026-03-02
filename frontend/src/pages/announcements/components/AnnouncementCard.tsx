import { Pencil, Trash2, Pin, Calendar } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { CATEGORY_COLORS, CATEGORY_GRADIENTS, isExpired, formatDate } from '../constants'
import type { Announcement } from '@/types'

export function AnnouncementCard({
  announcement: a,
  onEdit,
  onDelete,
}: {
  announcement: Announcement
  onEdit: (a: Announcement) => void
  onDelete: (id: string) => void
}) {
  const t = useT()
  const expired = isExpired(a.expires_at)

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 ${
        a.is_pinned
          ? 'border-kinder-yellow dark:border-kinder-yellow'
          : 'border-gray-100 dark:border-gray-800'
      }`}
    >
      {/* Banner */}
      <div className="relative">
        {a.image_url ? (
          <div className="h-36 overflow-hidden">
            <img
              src={a.image_url}
              alt={a.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).parentElement!.className =
                  `h-36 bg-gradient-to-br ${CATEGORY_GRADIENTS[a.category]}`
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div className={`h-36 bg-gradient-to-br ${CATEGORY_GRADIENTS[a.category]}`} />
        )}

        {/* Badges overlay */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[a.category]}`}
          >
            {t(
              `category${a.category.charAt(0).toUpperCase()}${a.category.slice(1)}` as 'categoryGeneral'
            )}
          </span>
          {a.is_pinned && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-kinder-yellow/20 text-yellow-700 dark:text-yellow-500 flex items-center gap-1">
              <Pin size={10} />
              {t('pinnedBadge')}
            </span>
          )}
          {expired && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {t('expiredBadge')}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug mb-1.5 line-clamp-2">
          {a.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {a.body}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          {a.expires_at ? (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Calendar size={11} />
              {formatDate(a.expires_at)}
            </span>
          ) : (
            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
          )}

          <div className="flex gap-1">
            <button
              onClick={() => onEdit(a)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-kinder-blue/10 transition-all"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => {
                if (confirm(t('removeAnnouncementConfirm').replace('{title}', a.title))) {
                  onDelete(a.id)
                }
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
