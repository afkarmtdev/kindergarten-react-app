import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'
import { useT } from '@/hooks/useT'

interface Props {
  show: boolean
  itemName?: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteDialog({ show, itemName, onConfirm, onCancel }: Props) {
  const t = useT()

  if (!show) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-xs border border-gray-100 dark:border-gray-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trash2 size={16} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t('deleteDialogTitle')}
          </h3>
        </div>
        {itemName && (
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1 truncate">
            {itemName}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{t('deleteDialogBody')}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            {t('deleteBtn')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
