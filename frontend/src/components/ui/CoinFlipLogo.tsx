import { useEffect, useRef, useState } from 'react'

interface CoinFlipLogoProps {
  /** Front face content (e.g. bear mascot icon) */
  children: React.ReactNode
  /** Tailwind classes for the front face container (size, bg, rounding) */
  frontClassName: string
  /** Tailwind classes for the back face container (size, bg, rounding) */
  backClassName: string
  /** URL of the school logo. When set, the back face renders this image. */
  logoUrl?: string | null
  /** Custom back-face content used when logoUrl is null. Falls back to children if also null. */
  back?: React.ReactNode
  /** Called after each flip with the new flipped state */
  onFlip?: (flipped: boolean) => void
  /** Auto-flip interval in ms. Set to 0 to disable. Default 0 (click-only). */
  autoFlipMs?: number
}

export function CoinFlipLogo({
  children,
  frontClassName,
  backClassName,
  logoUrl,
  back,
  onFlip,
  autoFlipMs = 0,
}: CoinFlipLogoProps) {
  const [flipped, setFlipped] = useState(false)
  const [tick, setTick] = useState(0)

  const onFlipRef = useRef(onFlip)
  useEffect(() => {
    onFlipRef.current = onFlip
  })

  useEffect(() => {
    if (autoFlipMs <= 0) return
    const id = setInterval(() => {
      setFlipped((f) => {
        const next = !f
        onFlipRef.current?.(next)
        return next
      })
    }, autoFlipMs)
    return () => clearInterval(id)
  }, [autoFlipMs, tick])

  const toggle = () => {
    setFlipped((f) => {
      const next = !f
      onFlipRef.current?.(next)
      return next
    })
    setTick((t) => t + 1)
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  const backContent = logoUrl ? (
    <img
      src={logoUrl}
      alt="School logo"
      className="w-full h-full object-contain"
      draggable={false}
    />
  ) : (
    (back ?? children)
  )

  return (
    <div
      className="cursor-pointer select-none"
      style={{ perspective: '800px' }}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={flipped ? 'Show mascot' : 'Show school logo'}
    >
      <div
        className="relative"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front — bear mascot */}
        <div className={frontClassName} style={{ backfaceVisibility: 'hidden' }}>
          {children}
        </div>

        {/* Back — school logo or fallback */}
        <div
          className={`${backClassName} absolute inset-0`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {backContent}
        </div>
      </div>
    </div>
  )
}
