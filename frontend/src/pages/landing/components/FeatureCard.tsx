import { useState } from 'react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/translations'
import type { LandingFeatureKey } from '@/types'
import { DoodleApple } from '@/components/landing/doodles/DoodleApple'
import { DoodleHeart } from '@/components/landing/doodles/DoodleHeart'
import { DoodleMusicNote } from '@/components/landing/doodles/DoodleMusicNote'
import { DoodlePuzzle } from '@/components/landing/doodles/DoodlePuzzle'
import { DoodleSun } from '@/components/landing/doodles/DoodleSun'
import { DoodleStar } from '@/components/landing/doodles/DoodleStar'

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

/**
 * The hand-drawn motif sketched into each card's top-right corner, in the card's
 * ink colour. The doodles are drawn on different grids (32, 48 and 60 units), so
 * each gets its own size to land on a similar line weight and visual size, and the
 * music note is nudged outwards because its viewBox keeps headroom for its echoes.
 * Nothing here may reach below 100px: the chevron button starts there.
 */
const DOODLE: Record<
  LandingFeatureKey,
  { Doodle: ComponentType<{ size?: number; color?: string }>; size: number; position: string }
> = {
  learn: { Doodle: DoodleApple, size: 96, position: 'top-0 right-1' },
  safe: { Doodle: DoodleHeart, size: 80, position: 'top-1 right-2' },
  arts: { Doodle: DoodleMusicNote, size: 116, position: '-top-4 -right-4' },
  play: { Doodle: DoodlePuzzle, size: 96, position: 'top-0 right-1' },
  outdoor: { Doodle: DoodleSun, size: 84, position: 'top-1 right-2' },
  class: { Doodle: DoodleStar, size: 84, position: 'top-1 right-2' },
}

export function FeatureCard({
  featureKey,
  icon: Icon,
  color,
  titleKey,
  descKey,
  expandedKey,
  badge,
  className = '',
  style,
}: {
  featureKey: LandingFeatureKey
  icon: LucideIcon
  color: string
  titleKey: TranslationKey
  descKey: TranslationKey
  expandedKey: TranslationKey
  badge?: ReactNode
  /** Width and entrance animation; the card itself owns nothing the animation would fight. */
  className?: string
  style?: CSSProperties
}) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const tint = TINT[color] ?? { card: 'bg-gray-100 dark:bg-gray-800', icon: 'text-gray-500' }
  const { Doodle, size: doodleSize, position: doodlePosition } = DOODLE[featureKey]

  return (
    // Three layers, one job each: the outer div takes the fade-in (its animation
    // keeps a transform, which would cancel a hover lift on the same element), the
    // middle one lifts on hover and carries the badge with it, the inner one is the
    // card surface and clips the corner doodle.
    <div className={className} style={style}>
      <div
        className="group relative rounded-3xl cursor-pointer transition-transform duration-300 hover:-translate-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-kinder-orange"
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
        {/* Top-left: the top-right corner belongs to the doodle */}
        {badge && <div className="absolute -top-3 -left-3 z-10 pointer-events-none">{badge}</div>}
        <div
          className={`relative overflow-hidden ${tint.card} rounded-3xl p-5 sm:p-8 border-2 border-white dark:border-gray-800 transition-shadow duration-300 group-hover:shadow-xl`}
        >
          <div
            className={`absolute ${doodlePosition} ${tint.icon} opacity-30 dark:opacity-25 rotate-12 transition-transform duration-500 group-hover:rotate-[20deg] group-hover:scale-110 pointer-events-none`}
            aria-hidden="true"
          >
            <Doodle size={doodleSize} color="currentColor" />
          </div>
          <div className="relative">
            <div className="w-14 h-14 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-5">
              <Icon size={26} className={tint.icon} strokeWidth={2} />
            </div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="font-fun font-bold text-gray-900 dark:text-white text-xl">
                {t(titleKey)}
              </h3>
              <span className="w-8 h-8 rounded-full bg-white/70 dark:bg-gray-900/60 group-hover:bg-white dark:group-hover:bg-gray-900 text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0 transition-colors duration-200">
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
              </span>
            </div>
            {/* Two lines reserved from md up, so cards sharing a row close at the same height */}
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed md:min-h-[3.25rem]">
              {t(descKey)}
            </p>
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
        </div>
      </div>
    </div>
  )
}
