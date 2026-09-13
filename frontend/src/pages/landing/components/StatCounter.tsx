import { useState, useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

/** Section wash used for the icon tile; wash/ink tokens switch with dark mode automatically. */
export type StatTint = 'sky' | 'mint' | 'butter' | 'blush' | 'lavender' | 'peach'

const TINT: Record<StatTint, { bg: string; icon: string }> = {
  sky: { bg: 'bg-wash-sky', icon: 'text-ink-sky' },
  mint: { bg: 'bg-wash-mint', icon: 'text-ink-mint' },
  butter: { bg: 'bg-wash-butter', icon: 'text-ink-butter' },
  blush: { bg: 'bg-wash-blush', icon: 'text-ink-blush' },
  lavender: { bg: 'bg-wash-lavender', icon: 'text-ink-lavender' },
  peach: { bg: 'bg-wash-peach', icon: 'text-ink-peach' },
}

export function StatCounter({
  target,
  suffix,
  label,
  icon: Icon,
  tint = 'sky',
  decimals = 0,
}: {
  target: number
  suffix: string
  label: string
  icon?: LucideIcon
  tint?: StatTint
  /** Decimal places to show, e.g. 1 for a 4.9 star rating. */
  decimals?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
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

  const { bg, icon } = TINT[tint]

  return (
    <div ref={ref} className="text-center px-1 sm:px-2 h-full">
      <div className="h-full bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 border-2 border-gray-200 dark:border-gray-800 transition-colors duration-200">
        {Icon && (
          <div
            className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mx-auto mb-3`}
          >
            <Icon size={24} className={icon} strokeWidth={2} />
          </div>
        )}
        <p className="font-fun text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-none mb-2 whitespace-nowrap tabular-nums">
          {count.toFixed(decimals)}
          {suffix.trim() !== '' && (
            <span className="ml-1 text-[0.45em] align-top text-kinder-yellow">{suffix.trim()}</span>
          )}
        </p>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  )
}
