import { useEffect } from 'react'
import { X, Pin, Calendar } from 'lucide-react'
import { useT } from '@/hooks/useT'
import type { Announcement } from '@/types'
import { NOTICE_CATEGORY_COLORS, NOTICE_CATEGORY_GRADIENTS } from '../constants'

interface NoticeModalProps {
  notice: Announcement | null
  onClose: () => void
}

export function NoticeModal({ notice, onClose }: NoticeModalProps) {
  const t = useT()

  useEffect(() => {
    if (!notice) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [notice, onClose])

  if (!notice) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
    >
      <div
        className="relative max-w-2xl w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col lp-enter-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        {notice.image_url ? (
          <div className="h-56 sm:h-64 w-full overflow-hidden flex-shrink-0">
            <img src={notice.image_url} alt={notice.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className={`h-32 w-full flex-shrink-0 bg-gradient-to-br ${NOTICE_CATEGORY_GRADIENTS[notice.category]}`}
          />
        )}

        <div className="p-6 sm:p-8 overflow-y-auto">
          <div className="flex gap-1.5 flex-wrap mb-4">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${NOTICE_CATEGORY_COLORS[notice.category]}`}
            >
              {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
            </span>
            {notice.is_pinned && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-kinder-yellow/20 text-yellow-700 dark:text-yellow-500 flex items-center gap-1">
                <Pin size={11} />
                {t('pinnedBadge')}
              </span>
            )}
          </div>

          <h2
            id="notice-modal-title"
            className="font-extrabold text-gray-900 dark:text-gray-100 text-2xl leading-tight mb-3"
          >
            {notice.title}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {notice.body}
          </p>

          {notice.expires_at && (
            <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              <Calendar size={12} />
              <span>
                Expires{' '}
                {new Date(notice.expires_at).toLocaleDateString('en-MY', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
