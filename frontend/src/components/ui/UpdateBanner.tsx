import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useT } from '../../hooks/useT'

interface UpdateBannerProps {
  visible: boolean
}

export function UpdateBanner({ visible }: UpdateBannerProps) {
  const [reloading, setReloading] = useState(false)
  const t = useT()

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 bg-kinder-blue px-4 py-2.5 text-white shadow-lg">
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
        <RefreshCw className={`h-4 w-4 shrink-0 ${reloading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{t('updateAvailableLong')}</span>
        <span className="sm:hidden">{t('updateAvailableShort')}</span>
      </div>
      <button
        disabled={reloading}
        onClick={async () => {
          setReloading(true)
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration()
            if (reg) {
              // Ensure the SW update check has started
              try {
                await reg.update()
              } catch {
                // ignore — update() can reject if the SW script fetch fails
              }
              if (reg.installing || reg.waiting) {
                // New SW is mid-install — wait for it to take control before reloading
                await new Promise<void>((resolve) => {
                  navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
                    once: true,
                  })
                  // Safety timeout: reload anyway after 12s (allow time on slow school WiFi)
                  setTimeout(resolve, 12000)
                })
              }
            }
          }
          window.location.reload()
        }}
        className="shrink-0 rounded-lg bg-white/20 px-3 py-1 text-xs font-bold transition-colors hover:bg-white/30 disabled:opacity-60"
      >
        {reloading ? t('updateReloading') : t('updateReload')}
      </button>
    </div>
  )
}
