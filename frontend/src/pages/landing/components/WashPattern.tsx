/** Tiled CSS patterns defined as `.lp-pat-*` in index.css. Each is drawn in currentColor. */
const PATTERN = {
  /** Fine dot grid. */
  dots: { cls: 'lp-pat-dots', opacity: 'opacity-[0.09] dark:opacity-[0.11]' },
  /** Bigger staggered polka dots. */
  polka: { cls: 'lp-pat-polka', opacity: 'opacity-[0.07] dark:opacity-[0.09]' },
  /** Exercise-book ruled lines. */
  lines: { cls: 'lp-pat-lines', opacity: 'opacity-[0.09] dark:opacity-[0.11]' },
  /** Graph paper. */
  grid: { cls: 'lp-pat-grid', opacity: 'opacity-[0.08] dark:opacity-[0.1]' },
  /** Picnic-blanket check. */
  gingham: { cls: 'lp-pat-gingham', opacity: 'opacity-[0.06] dark:opacity-[0.08]' },
  /** Scattered four-point sparkles. */
  stars: { cls: 'lp-pat-stars', opacity: 'opacity-[0.1] dark:opacity-[0.12]' },
  /** Outlined hearts. */
  hearts: { cls: 'lp-pat-hearts', opacity: 'opacity-[0.1] dark:opacity-[0.12]' },
} as const

export type WashPatternName = keyof typeof PATTERN

/**
 * A faint repeating pattern laid over a section wash, in the section's ink
 * colour: dot grid on sky, ruled lines on butter, gingham on peach and so on.
 * Pure tiled CSS gradients and masks, so it paints once and never animates.
 * The outer layer (`.lp-pat-fade`) dissolves the pattern near the section's
 * top and bottom edges, so one texture never stops on a hard line against the
 * scallop wave or the next band's texture. It is a separate element because
 * the star and heart patterns already use a mask for their tiles.
 * Pass the ink colour as a text-* class in `className`.
 */
export function WashPattern({
  pattern,
  className = '',
}: {
  pattern: WashPatternName
  className?: string
}) {
  const { cls, opacity } = PATTERN[pattern]
  return (
    <div className="absolute inset-0 lp-pat-fade" aria-hidden="true">
      <div className={`absolute inset-0 ${cls} ${opacity} ${className}`} />
    </div>
  )
}
