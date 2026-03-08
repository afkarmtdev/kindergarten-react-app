import { useState } from 'react'
import { ShieldCheck, ShieldOff, KeyRound, Copy, Check } from 'lucide-react'
import type { Parent } from '@/types'

export function PortalAccessCard({
  linkedParent,
  onManage,
  t,
}: {
  linkedParent: Parent | null
  onManage: () => void
  t: (key: string) => string
}) {
  const [copied, setCopied] = useState(false)
  const hasCode = !!linkedParent?.access_code
  const hasPin = !!linkedParent?.portal_pin_hash
  const isActive = hasCode && hasPin

  function copyCode() {
    if (!linkedParent?.access_code) return
    navigator.clipboard.writeText(linkedParent.access_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mt-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isActive ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            {isActive ? (
              <ShieldCheck className="w-4.5 h-4.5 text-green-500" />
            ) : (
              <ShieldOff className="w-4.5 h-4.5 text-gray-400 dark:text-gray-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{t('portalAccess')}</p>
            {linkedParent && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {linkedParent.full_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isActive
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : hasCode
                  ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            {isActive
              ? t('portalAccessActive')
              : hasCode
                ? t('pinNotSet')
                : t('portalAccessInactive')}
          </span>
          {linkedParent && (
            <button
              onClick={onManage}
              className="shrink-0 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-xl text-xs font-semibold hover:border-kinder-orange hover:text-kinder-orange transition-all"
            >
              {t('manage')}
            </button>
          )}
        </div>
      </div>

      {/* Details row */}
      {linkedParent && (
        <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800">
          {/* Access Code */}
          <div className="bg-gray-50 dark:bg-gray-800/60 px-5 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
              {t('accessCodeLabel')}
            </p>
            {hasCode ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white tracking-wider">
                  {linkedParent.access_code}
                </span>
                <button
                  onClick={copyCode}
                  className="text-gray-400 hover:text-kinder-orange transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">--</span>
            )}
          </div>

          {/* PIN Status */}
          <div className="bg-gray-50 dark:bg-gray-800/60 px-5 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
              PIN
            </p>
            <div className="flex items-center gap-1.5">
              <KeyRound
                className={`w-3.5 h-3.5 ${hasPin ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}
              />
              <span
                className={`text-sm font-semibold ${hasPin ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
              >
                {hasPin ? t('pinSet') : t('pinNotSet')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No parent linked */}
      {!linkedParent && (
        <div className="px-5 pb-5">
          <p className="text-xs text-gray-400 dark:text-gray-500">{t('portalAccessInactive')}</p>
        </div>
      )}
    </div>
  )
}
