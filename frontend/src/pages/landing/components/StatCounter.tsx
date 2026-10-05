import { useState, useEffect, useRef, type ReactNode } from 'react'
import { CrayonStroke } from './CrayonStroke'

/**
 * One phrase of the numbers sentence ("20 happy students"): a giant numeral that
 * counts up the first time it scrolls into view, a crayon swipe under it, and
 * the label set beside it on the numeral's baseline, one word per line. There
 * is no card; the type sits straight on the section wash.
 *
 * Below md the phrase dissolves (`contents`) into the band's two-column grid,
 * so the numerals line up on their right edge and the labels on their left.
 */
export function StatCounter({
  target,
  suffix,
  label,
  color,
  accent,
  decimals = 0,
}: {
  target: number
  suffix: string
  label: string
  /** Crayon swipe colour, a brand bright that contrasts with the section wash. */
  color: string
  /** Small doodle perched above the label, from lg up. */
  accent?: ReactNode
  /** Decimal places to show, e.g. 1 for a 4.9 star rating. */
  decimals?: number
}) {
  const [count, setCount] = useState(0)
  const [seen, setSeen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          setSeen(true)
          const duration = 2000
          const start = Date.now()
          const tick = () => {
            const progress = Math.min((Date.now() - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(eased * target)
            if (progress < 1) requestAnimationFrame(tick)
            else setCount(target)
          }
          requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  const [firstWord, ...otherWords] = label.split(' ')

  return (
    <p className="contents md:flex lp-last-baseline md:gap-3 lg:gap-4 xl:gap-5">
      <span
        ref={ref}
        className="relative isolate justify-self-end font-fun font-bold leading-[0.8] whitespace-nowrap tabular-nums text-[4.5rem] sm:text-[5.5rem] md:text-[6rem] lg:text-[8.5rem] xl:text-[10rem] text-gray-900 dark:text-white"
      >
        {/* The final value holds the width, so the sentence never reflows while
            the digits count up; the counting copy is laid over it. */}
        <span className="relative inline-block">
          <span className="opacity-0">{target.toFixed(decimals)}</span>
          <span aria-hidden="true" className="absolute inset-0 text-right select-none">
            {count.toFixed(decimals)}
          </span>
        </span>
        {suffix.trim() !== '' && (
          <span aria-hidden="true" className="ml-[0.06em] text-[0.4em] align-top text-ink-butter">
            {suffix.trim()}
          </span>
        )}
        <CrayonStroke
          color={color}
          drawn={seen}
          className="absolute -z-10 left-[-0.1em] bottom-[-0.17em] w-[calc(100%+0.2em)] h-[0.45em] opacity-60 dark:opacity-50"
        />
      </span>{' '}
      <span className="relative font-fun font-semibold lowercase text-left leading-[1.05] text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-gray-700 dark:text-gray-300">
        {accent && (
          <span
            aria-hidden="true"
            className="hidden lg:block absolute bottom-full left-0 mb-2 xl:mb-3 rotate-12"
          >
            {accent}
          </span>
        )}
        <span className="block">{firstWord}</span>
        {otherWords.length > 0 && <span className="block">{otherWords.join(' ')}</span>}
      </span>
    </p>
  )
}
