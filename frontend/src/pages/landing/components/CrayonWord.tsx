import { useEffect, useRef, useState } from 'react'
import { useInViewport } from '@/hooks/useInViewport'
import { splitLastWord } from '@/lib/utils'

/**
 * Renders a heading string with a crayon accent behind its last word, the same
 * stroke language as the doodles: a highlighter swipe behind the word, or a
 * wobbly underline beneath it. The stroke draws itself in the first time the
 * word scrolls into view (`.lp-crayon` in index.css), then stays.
 *
 * Works for both languages because it always takes the last space-separated
 * word of whatever `t()` returned.
 */
export function CrayonWord({
  text,
  color = '#FFD93D',
  variant = 'highlight',
  wordClassName = '',
}: {
  text: string
  /** Stroke colour, a brand bright that contrasts with the section wash. */
  color?: string
  variant?: 'highlight' | 'underline'
  /** Extra classes for the accented word, e.g. "text-kinder-orange". */
  wordClassName?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInViewport(ref)
  // Latch so the stroke never un-draws when the heading scrolls back out.
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    if (inView) setDrawn(true)
  }, [inView])
  const [start, word] = splitLastWord(text)
  const draw = `lp-crayon ${drawn ? 'lp-crayon-draw' : ''}`

  return (
    <>
      {start}
      <span ref={ref} className={`relative inline-block isolate ${wordClassName}`}>
        {word}
        {variant === 'highlight' ? (
          <svg
            className={`${draw} absolute -z-10 left-[-0.12em] bottom-[0.02em] w-[calc(100%+0.24em)] h-[0.55em] opacity-60 dark:opacity-50`}
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
            className={`${draw} absolute -bottom-1.5 left-0 w-full`}
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
        )}
      </span>
    </>
  )
}
