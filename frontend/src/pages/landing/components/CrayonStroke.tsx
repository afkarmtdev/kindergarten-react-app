/**
 * The crayon stroke itself, the same stroke language as the doodles: a
 * highlighter swipe to sit behind text, or a wobbly underline beneath it.
 * It stretches to whatever box `className` gives it and draws itself in once
 * `drawn` turns true (`.lp-crayon` in index.css), then stays.
 */
export function CrayonStroke({
  variant = 'highlight',
  color,
  drawn,
  className = '',
}: {
  variant?: 'highlight' | 'underline'
  /** Stroke colour, a brand bright that contrasts with the section wash. */
  color: string
  drawn: boolean
  /** Position and size, relative to the text the stroke belongs to. */
  className?: string
}) {
  const draw = `lp-crayon ${drawn ? 'lp-crayon-draw' : ''}`

  return variant === 'highlight' ? (
    <svg
      className={`${draw} ${className}`}
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 14 C 22 10, 42 17, 62 12 S 88 15, 96 11"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
  ) : (
    <svg
      className={`${draw} ${className}`}
      viewBox="0 0 110 12"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 8 C 30 2, 60 10, 107 4"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
  )
}
