import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { useT } from '@/hooks/useT'

interface WebsiteSectionCardProps {
  title: string
  description: string
  isLoading: boolean
  hasSchoolInfo: boolean
  isDirty: boolean
  isSaving: boolean
  saveDisabled?: boolean
  onSave: () => void
  children: ReactNode
}

/** Card chrome shared by every Settings > Website panel: heading, loading rows, save bar. */
export function WebsiteSectionCard({
  title,
  description,
  isLoading,
  hasSchoolInfo,
  isDirty,
  isSaving,
  saveDisabled = false,
  onSave,
  children,
}: WebsiteSectionCardProps) {
  const t = useT()

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border-2 border-gray-200 dark:border-gray-800 p-6 space-y-5">
      <div>
        <h2 className="text-base font-fun font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {!hasSchoolInfo && (
            <div className="flex items-start gap-2 rounded-xl bg-wash-butter text-ink-butter px-4 py-3 text-sm font-semibold">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {t('settingsWebsiteNeedsGeneral')}
            </div>
          )}
          {children}
        </>
      )}

      <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || isSaving || saveDisabled || !hasSchoolInfo}
          className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-orange-600 transition-colors"
        >
          {isSaving ? t('saving2') : t('save')}
        </button>
      </div>
    </div>
  )
}
