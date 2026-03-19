import { Check } from 'lucide-react'
import { useT } from '../../hooks/useT'

interface ChildOption {
  id: string
  full_name: string
  class_name?: string | null
  photo_url?: string | null
  status?: string
}

interface ChildSwitcherSheetProps {
  show: boolean
  children: ChildOption[]
  selectedChildId?: string
  onSelect: (id: string) => void
  onClose: () => void
}

export function ChildSwitcherSheet({
  show,
  children,
  selectedChildId,
  onSelect,
  onClose,
}: ChildSwitcherSheetProps) {
  const t = useT()

  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-800 max-w-lg mx-auto">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>

          <div className="px-5 pb-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('switchChild')}</h3>
          </div>

          <div className="px-3 pb-5 space-y-1">
            {[...children]
              .sort((a, b) => a.full_name.localeCompare(b.full_name))
              .map((child) => {
                const isSelected = child.id === selectedChildId
                const firstName = child.full_name.split(' ')[0]
                return (
                  <button
                    key={child.id}
                    onClick={() => {
                      onSelect(child.id)
                      onClose()
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`rounded-full p-[2px] shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-tr from-kinder-orange to-kinder-pink'
                          : 'bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600'
                      }`}
                    >
                      {child.photo_url ? (
                        <img
                          src={child.photo_url}
                          alt={firstName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-900"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 font-bold text-base ${
                            isSelected
                              ? 'bg-orange-50 dark:bg-orange-900/30 text-kinder-orange'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name + class + status */}
                    <div className="flex-1 text-left min-w-0">
                      <p
                        className={`text-sm font-semibold leading-tight truncate ${
                          isSelected ? 'text-kinder-orange' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {child.full_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {child.class_name && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {child.class_name}
                          </span>
                        )}
                        {child.status === 'graduated' && (
                          <span className="text-[10px] text-purple-500 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded-full">
                            Graduated
                          </span>
                        )}
                        {child.status === 'inactive' && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Check mark */}
                    {isSelected && <Check className="w-5 h-5 text-kinder-orange shrink-0" />}
                  </button>
                )
              })}
          </div>
        </div>
      </div>
    </>
  )
}
