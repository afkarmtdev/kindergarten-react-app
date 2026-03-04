import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

interface UpdateBannerProps {
  visible: boolean
}

export function UpdateBanner({ visible }: UpdateBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (!visible || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 bg-kinder-blue px-4 py-2.5 text-white shadow-lg">
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
        <RefreshCw className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">
          A new version is available. Reload to get the latest update.
        </span>
        <span className="sm:hidden">New version available.</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={async () => {
            if ('caches' in window) {
              const keys = await caches.keys()
              await Promise.all(keys.map((key) => caches.delete(key)))
            }
            window.location.reload()
          }}
          className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold transition-colors hover:bg-white/30"
        >
          Reload now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1 transition-colors hover:bg-white/20"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
