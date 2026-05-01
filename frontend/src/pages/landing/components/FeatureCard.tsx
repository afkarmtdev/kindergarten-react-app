import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/translations'

export function FeatureCard({
  icon: Icon,
  color,
  titleKey,
  descKey,
  expandedKey,
  badge,
  className = '',
  style,
}: {
  icon: LucideIcon
  color: string
  titleKey: TranslationKey
  descKey: TranslationKey
  expandedKey: TranslationKey
  badge?: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`group relative bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-8 border border-gray-200 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer ${className}`}
      style={style}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setExpanded((v) => !v)
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
    >
      {badge && <div className="absolute -top-3 -right-3 z-10 pointer-events-none">{badge}</div>}
      <div
        className={`w-16 h-16 ${color} rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon size={28} className="text-white" strokeWidth={1.5} />
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-fun font-bold text-gray-900 dark:text-white text-xl mb-3">
          {t(titleKey)}
        </h3>
        <ChevronDown
          size={18}
          className={`text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{t(descKey)}</p>
      <div
        className={`grid transition-all duration-300 ${expanded ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-200 dark:border-gray-800 pt-4">
            {t(expandedKey)}
          </p>
        </div>
      </div>
    </div>
  )
}
