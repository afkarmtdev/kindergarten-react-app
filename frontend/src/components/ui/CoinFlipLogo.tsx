import { useState } from 'react'

interface CoinFlipLogoProps {
  /** URL of the school logo. Flip is disabled when null. */
  logoUrl: string | null
  /** Front face content (e.g. bear mascot icon) */
  children: React.ReactNode
  /** Tailwind classes for the front face container (size, bg, rounding) */
  frontClassName: string
  /** Tailwind classes for the back face container (size, bg, rounding) */
  backClassName: string
  /** Called after each flip with the new flipped state */
  onFlip?: (flipped: boolean) => void
}

export function CoinFlipLogo({
  logoUrl,
  children,
  frontClassName,
  backClassName,
  onFlip,
}: CoinFlipLogoProps) {
  const [flipped, setFlipped] = useState(false)
  const canFlip = !!logoUrl

  if (!canFlip) {
    return <div className={frontClassName}>{children}</div>
  }

  const toggle = () => {
    setFlipped((f) => {
      const next = !f
      onFlip?.(next)
      return next
    })
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

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

        {/* Back — school logo */}
        <div
          className={`${backClassName} absolute inset-0`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <img
            src={logoUrl}
            alt="School logo"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
