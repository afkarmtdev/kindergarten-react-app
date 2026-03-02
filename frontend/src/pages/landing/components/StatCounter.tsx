import { useState, useEffect, useRef } from 'react'

export function StatCounter({
  target,
  suffix,
  label,
}: {
  target: number
  suffix: string
  label: string
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
      <p className="text-5xl lg:text-6xl font-extrabold text-white leading-none mb-2">
        {count}
        {suffix}
      </p>
      <p className="text-white/70 font-bold text-xs uppercase tracking-widest">{label}</p>
    </div>
  )
}
