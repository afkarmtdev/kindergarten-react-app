import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useT } from '../../hooks/useT'
import { useVersionCheck } from '../../hooks/useVersionCheck'
import { ReloadCurtain } from './ReloadCurtain'
import { CURTAIN_ENTER_MIN_MS, isCurtainPath, markCurtainHandoff } from '@/lib/reloadCurtain'

/**
 * Top-of-page strip shown when a newer build is deployed. Rendered once at the app root
 * so every page — landing, login, admin, portal — gets the same update path.
 *
 * On the landing page and in the admin app the Reload tap also drops the ReloadCurtain and
 * leaves a sessionStorage flag so the new build can lift the same curtain after the
 * reload (ReloadCurtainHandoff). The parent portal keeps the plain spinner.
 */
export function UpdateBanner() {
  const [reloading, setReloading] = useState(false)
  const [curtain, setCurtain] = useState(false)
  const { updateAvailable, applyUpdate } = useVersionCheck()
  const t = useT()

  if (!updateAvailable) return null

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-2 bg-kinder-blue px-4 py-2.5 text-white shadow-lg">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <RefreshCw className={`h-4 w-4 shrink-0 ${reloading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('updateAvailableLong')}</span>
          <span className="sm:hidden">{t('updateAvailableShort')}</span>
        </div>
        <button
          disabled={reloading}
          onClick={() => {
            setReloading(true)
            if (!isCurtainPath(window.location.pathname)) {
              applyUpdate()
              return
            }
            // Let the curtain drop and the bear land before the reload can fire;
            // with no waiting worker applyUpdate() reloads instantly.
            markCurtainHandoff(window.sessionStorage)
            setCurtain(true)
            setTimeout(applyUpdate, CURTAIN_ENTER_MIN_MS)
          }}
          className="shrink-0 rounded-lg bg-white/20 px-3 py-1 text-xs font-bold transition-colors hover:bg-white/30 disabled:opacity-60"
        >
          {reloading ? t('updateReloading') : t('updateReload')}
        </button>
      </div>
      {curtain && <ReloadCurtain phase="enter" />}
    </>
  )
}
