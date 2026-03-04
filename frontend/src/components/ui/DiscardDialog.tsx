import { AlertTriangle } from 'lucide-react'
import { useT } from '@/hooks/useT'

interface Props {
  show: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DiscardDialog({ show, onConfirm, onCancel }: Props) {
  const t = useT()

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-xs border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t('discardChanges')}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{t('discardChangesBody')}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('keepEditing')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            {t('discardChangesBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
