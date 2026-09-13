import type { ReactNode } from 'react'
import { Quote, type LucideIcon } from 'lucide-react'

export type StoryChapterTone = 'peach' | 'mint' | 'blush'

const TONE_CLASSES: Record<StoryChapterTone, { tile: string; ink: string }> = {
  peach: { tile: 'bg-wash-peach', ink: 'text-ink-peach' },
  mint: { tile: 'bg-wash-mint', ink: 'text-ink-mint' },
  blush: { tile: 'bg-wash-blush', ink: 'text-ink-blush' },
}

export interface StoryChapterProps {
  /** Zero-based position along the path — even chapters put text on the left, odd on the right. */
  index: number
  /** Small uppercase label above the title, e.g. "Chapter one". */
  label: string
  title: string
  body: string
  tone: StoryChapterTone
  icon: LucideIcon
  /** Photo (or other visual) shown on the opposite side of the path. */
  aside: ReactNode | null
  /** Optional row under the body, e.g. the principal's signature. */
  footer?: ReactNode
  /**
   * Render the body as a letter: a white card with a quote mark, always left-aligned
   * so a long message keeps a straight reading edge even on a right-aligned chapter.
   */
  letter?: boolean
}

/**
 * One stop on the "Our Story" path: icon tile + label + title + body on one side,
 * a photo on the other. Sides alternate by index on large screens and stack on mobile.
 */
export function StoryChapter({
  index,
  label,
  title,
  body,
  tone,
  icon: Icon,
  aside,
  footer,
  letter = false,
}: StoryChapterProps) {
  const textLeft = index % 2 === 0
  const classes = TONE_CLASSES[tone]

  return (
    <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-28 lg:items-center">
      <div
        className={`flex flex-col gap-4 ${
          textLeft ? 'lg:items-end lg:text-right' : 'lg:order-2 lg:items-start'
        }`}
      >
        <div className={`flex items-center gap-3 ${textLeft ? 'lg:flex-row-reverse' : ''}`}>
          <div
            className={`w-12 h-12 shrink-0 rounded-2xl ${classes.tile} flex items-center justify-center`}
          >
            <Icon size={24} className={classes.ink} strokeWidth={2} />
          </div>
          <span className={`font-fun font-bold text-sm uppercase tracking-wider ${classes.ink}`}>
            {label}
          </span>
        </div>
        <h3 className="font-fun font-bold text-2xl sm:text-3xl leading-tight text-gray-900 dark:text-white">
          {title}
        </h3>
        {letter ? (
          <div className="w-full bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border-2 border-gray-200 dark:border-gray-800 text-left flex flex-col gap-4">
            <Quote size={28} className="text-kinder-orange" fill="#FF6B35" />
            <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed whitespace-pre-line">
              {body}
            </p>
            {footer}
          </div>
        ) : (
          <>
            <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed whitespace-pre-line">
              {body}
            </p>
            {footer}
          </>
        )}
      </div>
      {aside !== null && (
        <div
          className={`flex ${textLeft ? 'justify-center lg:justify-start' : 'lg:order-1 justify-center lg:justify-end'}`}
        >
          {aside}
        </div>
      )}
    </div>
  )
}
