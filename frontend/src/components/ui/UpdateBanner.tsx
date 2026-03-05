import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useT } from '../../hooks/useT'

interface UpdateBannerProps {
  visible: boolean
}

export function UpdateBanner({ visible }: UpdateBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const t = useT()

  if (!visible || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 bg-kinder-blue px-4 py-2.5 text-white shadow-lg">
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
        <RefreshCw className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{t('updateAvailableLong')}</span>
        <span className="sm:hidden">{t('updateAvailableShort')}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => {
            window.location.reload()
          }}
          className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold transition-colors hover:bg-white/30"
        >
          {t('updateReload')}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1 transition-colors hover:bg-white/20"
          aria-label={t('updateDismiss')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
