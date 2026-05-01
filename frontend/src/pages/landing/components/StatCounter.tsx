import { useState, useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

export function StatCounter({
  target,
  suffix,
  label,
  icon: Icon,
}: {
  target: number
  suffix: string
  label: string
  icon?: LucideIcon
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
            setCount(Math.floor(eased * target))
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

  return (
    <div ref={ref} className="text-center px-2">
      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/15">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
            <Icon size={24} className="text-white" strokeWidth={1.5} />
          </div>
        )}
        <p className="font-fun text-5xl lg:text-6xl font-bold text-white leading-none mb-2">
          {count}
          {suffix}
        </p>
        <p className="text-white/70 font-bold text-xs uppercase tracking-widest">{label}</p>
      </div>
    </div>
  )
}
