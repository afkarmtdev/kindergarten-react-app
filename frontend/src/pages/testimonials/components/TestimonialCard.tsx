import { useState } from 'react'
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import type { Testimonial } from '@/types'

export function TestimonialCard({
  testimonial: t_,
  onEdit,
  onDelete,
}: {
  testimonial: Testimonial
  onEdit: (t: Testimonial) => void
  onDelete: (id: string) => void
}) {
  const t = useT()
  const [showDelete, setShowDelete] = useState(false)

  const initials = t_.parent_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col gap-4">
      {/* Quote */}
      <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed line-clamp-3">
        &ldquo;{t_.quote}&rdquo;
      </p>

      {/* Author row */}
      <div className="flex items-center gap-3 mt-auto">
        {t_.avatar_url ? (
          <img
            src={t_.avatar_url}
            alt={t_.parent_name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-gray-100 dark:border-gray-700"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-kinder-purple/20 flex items-center justify-center text-kinder-purple font-bold text-xs flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">
            {t_.parent_name}
          </p>
          {t_.parent_role && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{t_.parent_role}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <span
          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            t_.is_visible
              ? 'bg-kinder-green/10 text-kinder-green'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
          }`}
        >
          {t_.is_visible ? <Eye size={11} /> : <EyeOff size={11} />}
          {t_.is_visible ? t('testimonialVisible') : 'Hidden'}
        </span>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(t_)}
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
        itemName={t_.parent_name}
        onConfirm={() => {
          onDelete(t_.id)
          setShowDelete(false)
        }}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
