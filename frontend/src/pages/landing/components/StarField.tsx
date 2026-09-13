// StarField — twinkling 4-pointed sparkle overlay for dark sections.
// Parent must have position:relative + overflow:hidden.
// Uses lp-twinkle / lp-twinkle-slow CSS classes from constants.ts KEYFRAMES.
// Stars only twinkle while the field is near the viewport (see useInViewport).
import { useRef } from 'react'
import { useInViewport } from '@/hooks/useInViewport'

type Star = { top: string; left: string; size: number; cls: string; delay: string; rot: number }

const STARS_A: Star[] = [
  { top: '7%', left: '4%', size: 8, cls: 'lp-twinkle', delay: '0s', rot: 22 },
  { top: '14%', left: '19%', size: 6, cls: 'lp-twinkle-slow', delay: '1.6s', rot: 45 },
  { top: '4%', left: '38%', size: 8, cls: 'lp-twinkle', delay: '3.1s', rot: 0 },
  { top: '9%', left: '57%', size: 6, cls: 'lp-twinkle-slow', delay: '0.7s', rot: 67 },
  { top: '5%', left: '74%', size: 10, cls: 'lp-twinkle', delay: '2.3s', rot: 30 },
  { top: '18%', left: '88%', size: 8, cls: 'lp-twinkle-slow', delay: '4.1s', rot: 45 },
  { top: '33%', left: '94%', size: 6, cls: 'lp-twinkle', delay: '1.0s', rot: 15 },
  { top: '52%', left: '96%', size: 8, cls: 'lp-twinkle-slow', delay: '2.8s', rot: 55 },
  { top: '26%', left: '2%', size: 6, cls: 'lp-twinkle', delay: '3.7s', rot: 38 },
  { top: '43%', left: '7%', size: 8, cls: 'lp-twinkle-slow', delay: '1.9s', rot: 0 },
  { top: '62%', left: '11%', size: 6, cls: 'lp-twinkle', delay: '0.3s', rot: 72 },
  { top: '16%', left: '80%', size: 8, cls: 'lp-twinkle', delay: '5.2s', rot: 20 },
  { top: '38%', left: '68%', size: 6, cls: 'lp-twinkle-slow', delay: '2.1s', rot: 45 },
  { top: '57%', left: '82%', size: 8, cls: 'lp-twinkle', delay: '3.4s', rot: 10 },
  { top: '72%', left: '91%', size: 6, cls: 'lp-twinkle-slow', delay: '1.2s', rot: 60 },
]

const STARS_B: Star[] = [
  { top: '10%', left: '6%', size: 6, cls: 'lp-twinkle', delay: '0.4s', rot: 15 },
  { top: '22%', left: '22%', size: 8, cls: 'lp-twinkle-slow', delay: '2.0s', rot: 50 },
  { top: '6%', left: '44%', size: 6, cls: 'lp-twinkle', delay: '1.3s', rot: 33 },
  { top: '15%', left: '62%', size: 8, cls: 'lp-twinkle-slow', delay: '3.5s', rot: 70 },
  { top: '8%', left: '78%', size: 10, cls: 'lp-twinkle', delay: '0.9s', rot: 0 },
  { top: '30%', left: '90%', size: 6, cls: 'lp-twinkle-slow', delay: '4.6s', rot: 45 },
  { top: '48%', left: '97%', size: 8, cls: 'lp-twinkle', delay: '2.2s', rot: 20 },
  { top: '65%', left: '93%', size: 6, cls: 'lp-twinkle-slow', delay: '1.5s', rot: 60 },
  { top: '35%', left: '3%', size: 8, cls: 'lp-twinkle', delay: '3.0s', rot: 42 },
  { top: '55%', left: '9%', size: 6, cls: 'lp-twinkle-slow', delay: '0.6s', rot: 8 },
  { top: '75%', left: '15%', size: 8, cls: 'lp-twinkle', delay: '4.8s', rot: 67 },
  { top: '20%', left: '75%', size: 6, cls: 'lp-twinkle', delay: '1.8s', rot: 30 },
  { top: '44%', left: '58%', size: 8, cls: 'lp-twinkle-slow', delay: '3.8s', rot: 55 },
  { top: '68%', left: '72%', size: 6, cls: 'lp-twinkle', delay: '2.6s', rot: 18 },
  { top: '82%', left: '84%', size: 8, cls: 'lp-twinkle-slow', delay: '0.2s', rot: 45 },
]

/**
 * @param variant   'a' | 'b' — two distinct star patterns so adjacent sections look different
 * @param className wrapper class — default 'hidden dark:block' for dark-mode-only sections;
 *                  pass '' for sections that are always dark (e.g. footer)
 */
export function StarField({
  variant = 'a',
  className = 'hidden dark:block',
}: {
  variant?: 'a' | 'b'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInViewport(ref)
  const stars = variant === 'b' ? STARS_B : STARS_A
  return (
    <div
      ref={ref}
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {stars.map(({ top, left, size, cls, delay, rot }, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top,
            left,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            transform: `rotate(${rot}deg)`,
          }}
        >
          <div className={inView ? cls : undefined} style={{ animationDelay: `-${delay}` }}>
            <svg viewBox="-1 -1 2 2" width={size} height={size}>
              <path
                d="M0,-1 L0.10,-0.10 L1,0 L0.10,0.10 L0,1 L-0.10,0.10 L-1,0 L-0.10,-0.10 Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}
