import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useT } from '@/hooks/useT'
import type { Testimonial } from '@/types'

const AUTOPLAY_MS = 4000
const EXIT_MS = 150
/** Lines shown before a long quote is clamped behind "Show more" */
const CLAMP_LINES = 4
/** Matches Tailwind `leading-relaxed` so the reserved height equals CLAMP_LINES lines */
const QUOTE_LINE_HEIGHT = 1.625

export interface TestimonialCarouselProps {
  testimonials: Testimonial[]
}

type Direction = 'next' | 'prev'

function Avatar({ item }: { item: Testimonial }) {
  if (item.avatar_url) {
    return (
      <img
        src={item.avatar_url}
        alt={item.parent_name}
        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-800 flex-shrink-0"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-wash-sky flex items-center justify-center text-ink-sky font-fun font-bold text-sm flex-shrink-0">
      {item.parent_name.charAt(0).toUpperCase()}
    </div>
  )
}

function Stars() {
  return (
    <div className="flex gap-1 mb-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} fill="#FFD93D" stroke="#FFD93D" />
      ))}
    </div>
  )
}

/**
 * Auto-advancing testimonial carousel. The previous and next testimonials
 * peek out from behind the active card on either side; clicking a peek card
 * or the arrow buttons jumps there without waiting for the timer.
 *
 * Every card reserves the same quote height (CLAMP_LINES lines) so the
 * section does not jump between short and long testimonials. Quotes that
 * overflow get a "Show more" toggle; autoplay pauses while one is expanded.
 */
export function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const t = useT()
  const count = testimonials.length
  const [active, setActive] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [direction, setDirection] = useState<Direction>('next')
  const [cardAnim, setCardAnim] = useState<'enter' | 'exit'>('enter')
  const [isPaused, setIsPaused] = useState(false)
  const [expanded, setExpanded] = useState(false)
  // Measured pixel heights of the active quote: full text vs CLAMP_LINES lines
  const [quoteHeights, setQuoteHeights] = useState({ full: 0, collapsed: 0 })
  const quoteRef = useRef<HTMLParagraphElement>(null)

  const goTo = (index: number, dir: Direction) => {
    if (count === 0) return
    setDirection(dir)
    setActive(((index % count) + count) % count)
  }
  const goNext = () => goTo(active + 1, 'next')
  const goPrev = () => goTo(active - 1, 'prev')

  useEffect(() => {
    if (isPaused || expanded || count <= 1) return
    const timer = setInterval(() => {
      setDirection('next')
      setActive((i) => (i + 1) % count)
    }, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [isPaused, expanded, active, count])

  // Slide out → swap content → slide in
  useEffect(() => {
    setCardAnim('exit')
    const swap = setTimeout(() => {
      setDisplayIndex(active)
      setExpanded(false)
      setCardAnim('enter')
    }, EXIT_MS)
    return () => clearTimeout(swap)
  }, [active])

  // Measure the quote so the wrapper can tween between clamped and full height.
  // Re-measured on swap and whenever the text reflows (resize, font load).
  useLayoutEffect(() => {
    const el = quoteRef.current
    if (!el) return
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 0
      setQuoteHeights({
        full: el.scrollHeight,
        collapsed: Math.round(lineHeight * CLAMP_LINES),
      })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [displayIndex])

  if (count === 0) return null

  const current = testimonials[displayIndex] ?? testimonials[0]
  const prevItem = testimonials[(displayIndex - 1 + count) % count]
  const nextItem = testimonials[(displayIndex + 1) % count]
  const hasMany = count > 1

  const animClass =
    cardAnim === 'exit'
      ? direction === 'next'
        ? 'lp-card-exit'
        : 'lp-card-exit-back'
      : direction === 'next'
        ? 'lp-card-enter'
        : 'lp-card-enter-back'

  const quoteMinHeight = { minHeight: `${CLAMP_LINES * QUOTE_LINE_HEIGHT}em` }

  // Until measured, fall back to the em value so first paint matches the measured height
  const isClamped = quoteHeights.full > quoteHeights.collapsed + 1
  const collapsedHeight =
    quoteHeights.collapsed > 0 ? `${quoteHeights.collapsed}px` : quoteMinHeight.minHeight
  const quoteWrapperHeight =
    expanded && isClamped
      ? `${Math.max(quoteHeights.full, quoteHeights.collapsed)}px`
      : collapsedHeight

  const peekBase =
    'group hidden md:flex flex-col absolute top-0 bottom-0 w-full bg-white/80 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-10 text-left overflow-hidden cursor-pointer transition-all duration-300 opacity-60 hover:opacity-90 focus-visible:opacity-90 outline-none'

  // Faint chevron drawn on the visible sliver of each peek card
  const peekChevron =
    'absolute top-1/2 -translate-y-1/2 text-gray-400/60 dark:text-gray-500/60 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200 pointer-events-none'

  // Mobile-only arrows beside the dots (peek cards are hidden there)
  const arrowBase =
    'inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 transition-colors duration-200'

  return (
    <div
      className="max-w-2xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative">
        {/* Peek cards — previous on the left, next on the right */}
        {hasMany && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label={t('previousTestimonial')}
              tabIndex={-1}
              className={`${peekBase} -translate-x-[8%] translate-y-1.5 scale-[0.96] hover:-translate-x-[11%]`}
            >
              <ChevronLeft size={22} className={`${peekChevron} left-2`} aria-hidden="true" />
              <Stars />
              <p
                className="text-gray-700 dark:text-gray-200 leading-relaxed italic text-lg line-clamp-4"
                style={quoteMinHeight}
              >
                &ldquo;{prevItem.quote}&rdquo;
              </p>
              <div className="mt-auto pt-4 flex items-center gap-3">
                <Avatar item={prevItem} />
                <p className="font-extrabold text-gray-900 dark:text-white truncate">
                  {prevItem.parent_name}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={t('nextTestimonial')}
              tabIndex={-1}
              className={`${peekBase} translate-x-[8%] translate-y-1.5 scale-[0.96] hover:translate-x-[11%]`}
            >
              <ChevronRight size={22} className={`${peekChevron} right-2`} aria-hidden="true" />
              <Stars />
              <p
                className="text-gray-700 dark:text-gray-200 leading-relaxed italic text-lg line-clamp-4"
                style={quoteMinHeight}
              >
                &ldquo;{nextItem.quote}&rdquo;
              </p>
              <div className="mt-auto pt-4 flex items-center gap-3">
                <Avatar item={nextItem} />
                <p className="font-extrabold text-gray-900 dark:text-white truncate">
                  {nextItem.parent_name}
                </p>
              </div>
            </button>
          </>
        )}

        {/* Active card */}
        <div
          className={`relative z-10 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-10 ${animClass}`}
        >
          <div
            className="absolute top-4 right-6 text-ink-sky/10 text-8xl sm:text-9xl font-serif leading-none pointer-events-none select-none"
            aria-hidden="true"
          >
            &ldquo;
          </div>
          <Stars />
          {/* Height tweens between CLAMP_LINES lines and the full quote */}
          <div
            className="relative overflow-hidden lp-collapse"
            style={{ height: quoteWrapperHeight }}
          >
            <p
              ref={quoteRef}
              className="text-gray-700 dark:text-gray-200 leading-relaxed italic text-lg"
            >
              &ldquo;{current.quote}&rdquo;
            </p>
            {/* Soft fade over the clipped last line; melts away when expanded */}
            <div
              aria-hidden="true"
              className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-white/0 to-white dark:from-gray-900/0 dark:to-gray-900 pointer-events-none transition-opacity duration-300 ${
                isClamped && !expanded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
          {/* Fixed-height row so the toggle never shifts the author block */}
          <div className="h-7 mt-2 mb-3 flex items-center">
            {isClamped && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-1 -ml-3 px-3 py-1 rounded-full text-sm font-extrabold text-ink-sky bg-wash-sky/0 hover:bg-wash-sky transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
              >
                <span key={expanded ? 'less' : 'more'} className="lp-pop">
                  {expanded ? t('showLess') : t('showMore')}
                </span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`transition-transform duration-500 ${expanded ? 'rotate-180' : 'rotate-0'}`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                />
              </button>
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex items-center gap-3">
            <Avatar item={current} />
            <div className="min-w-0 min-h-[46px] flex flex-col justify-center">
              <p className="font-extrabold text-gray-900 dark:text-white">{current.parent_name}</p>
              {current.parent_role && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                  {current.parent_role}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasMany && (
        <div className="flex items-center justify-center gap-4 mt-6">
          {/* Arrow buttons beside the dots (mobile) */}
          <button
            type="button"
            onClick={goPrev}
            aria-label={t('previousTestimonial')}
            className={`${arrowBase} md:hidden`}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) =>
              i === active ? (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i, i > active ? 'next' : 'prev')}
                  className="relative w-10 h-2.5 bg-ink-sky/20 rounded-full overflow-hidden"
                >
                  <div
                    key={displayIndex}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      backgroundColor: 'rgb(var(--ink-sky))',
                      borderRadius: '9999px',
                      animation: `lp-progress ${AUTOPLAY_MS}ms linear both`,
                      animationPlayState: isPaused || expanded ? 'paused' : 'running',
                    }}
                  />
                </button>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i, i > active ? 'next' : 'prev')}
                  className="w-2.5 h-2.5 bg-ink-sky/30 hover:bg-ink-sky/60 rounded-full transition-colors duration-300"
                />
              )
            )}
          </div>
          <button
            type="button"
            onClick={goNext}
            aria-label={t('nextTestimonial')}
            className={`${arrowBase} md:hidden`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
