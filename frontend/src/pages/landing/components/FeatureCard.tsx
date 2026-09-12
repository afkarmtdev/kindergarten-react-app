import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/translations'

/**
 * Warm Storybook: the brand colour of a feature picks a section wash for the card
 * and the matching ink colour for its icon. wash/ink tokens switch with dark mode.
 */
const TINT: Record<string, { card: string; icon: string }> = {
  'bg-kinder-blue': { card: 'bg-wash-sky', icon: 'text-ink-sky' },
  'bg-kinder-pink': { card: 'bg-wash-blush', icon: 'text-ink-blush' },
  'bg-kinder-purple': { card: 'bg-wash-lavender', icon: 'text-ink-lavender' },
  'bg-kinder-green': { card: 'bg-wash-mint', icon: 'text-ink-mint' },
  'bg-kinder-yellow': { card: 'bg-wash-butter', icon: 'text-ink-butter' },
  'bg-kinder-orange': { card: 'bg-wash-peach', icon: 'text-ink-peach' },
}

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
  const tint = TINT[color] ?? { card: 'bg-gray-100 dark:bg-gray-800', icon: 'text-gray-500' }

  return (
    <div
      className={`group relative ${tint.card} rounded-3xl p-5 sm:p-8 border-2 border-white dark:border-gray-800 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer ${className}`}
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
      <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
        <Icon size={28} className={tint.icon} strokeWidth={2} />
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-fun font-bold text-gray-900 dark:text-white text-xl mb-3">
          {t(titleKey)}
        </h3>
        <ChevronDown
          size={18}
          className={`text-gray-500 dark:text-gray-400 flex-shrink-0 mt-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{t(descKey)}</p>
      <div
        className={`grid transition-all duration-300 ${expanded ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-900/10 dark:border-white/10 pt-4">
            {t(expandedKey)}
          </p>
        </div>
      </div>
    </div>
  )
}
