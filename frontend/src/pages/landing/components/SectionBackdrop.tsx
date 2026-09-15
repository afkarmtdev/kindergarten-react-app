import type { ReactNode } from 'react'
import { PaperGrain } from './PaperGrain'
import { WashPattern, type WashPatternName } from './WashPattern'

/** Section wash → ink text class. `neutral` is for the white/gray-950 bands. */
const INK = {
  sky: 'text-ink-sky',
  mint: 'text-ink-mint',
  butter: 'text-ink-butter',
  blush: 'text-ink-blush',
  lavender: 'text-ink-lavender',
  peach: 'text-ink-peach',
  ocean: 'text-ink-ocean',
  neutral: 'text-gray-900 dark:text-white',
} as const
const INK_DARK = {
  sky: 'dark:text-ink-sky',
  mint: 'dark:text-ink-mint',
  butter: 'dark:text-ink-butter',
  blush: 'dark:text-ink-blush',
  lavender: 'dark:text-ink-lavender',
  peach: 'dark:text-ink-peach',
  ocean: 'dark:text-ink-ocean',
  neutral: 'dark:text-white',
} as const

export type SectionTint = keyof typeof INK

export interface SectionBackdropProps {
  /** The section's wash, which picks the ink colour for the pattern. */
  tint: SectionTint
  /** Only for sections whose wash changes hue in dark mode (Our Story: butter → ocean). */
  darkTint?: SectionTint
  pattern?: WashPatternName | 'none'
  grain?: boolean
  /** Depth layers: SpotlightGlow, OutlineWatermark and ghost FloatingDoodles. */
  children?: ReactNode
}

/**
 * The layered background of a landing section, from far to near: paper grain,
 * a faint wash pattern, then whatever depth layers the section passes as
 * children (spotlight glows, an outlined watermark, ghost doodles). Everything
 * in it is static except the
 * ghost doodles' scroll parallax, which the doodle gates on visibility itself.
 *
 * Renders as an absolute inset-0 layer, so it goes first inside a
 * `relative lp-clip` section, before StarField and the floating doodles; the
 * section's content wrappers are `relative` and paint above it in DOM order.
 */
export function SectionBackdrop({
  tint,
  darkTint,
  pattern = 'none',
  grain = true,
  children,
}: SectionBackdropProps) {
  const ink = darkTint ? `${INK[tint]} ${INK_DARK[darkTint]}` : INK[tint]
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {grain && <PaperGrain />}
      {pattern !== 'none' && <WashPattern pattern={pattern} className={ink} />}
      {children}
    </div>
  )
}
