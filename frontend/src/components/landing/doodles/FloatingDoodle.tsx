import { useRef, type ReactNode } from 'react'
import { useInViewport } from '@/hooks/useInViewport'

const ANIMATION = {
  float: 'lp-float',
  alt: 'lp-float-alt',
  slow: 'lp-float-slow',
  spin: 'lp-spin-slow',
} as const

export type FloatingDoodleAnimation = keyof typeof ANIMATION

/**
 * Below the md breakpoint the doodle is scaled to 60% about this corner, so a
 * 380px animal becomes a ~230px one that stays tucked at the section edge.
 * Pick the corner the position classes anchor to.
 */
const SHRINK = {
  'top-left': 'scale-[0.6] md:scale-100 origin-top-left',
  'top-right': 'scale-[0.6] md:scale-100 origin-top-right',
  'bottom-left': 'scale-[0.6] md:scale-100 origin-bottom-left',
  'bottom-right': 'scale-[0.6] md:scale-100 origin-bottom-right',
  left: 'scale-[0.6] md:scale-100 origin-left',
  right: 'scale-[0.6] md:scale-100 origin-right',
} as const

export type FloatingDoodleShrinkFrom = keyof typeof SHRINK

export interface FloatingDoodleProps {
  /** Tailwind position classes, e.g. "top-1/3 left-1/4" or "bottom-8 right-10 -translate-y-1/2". */
  position: string
  animation?: FloatingDoodleAnimation
  /**
   * Stagger in seconds so neighbouring shapes drift out of sync. Applied as a
   * negative delay: the animation is (re)started whenever the doodle scrolls
   * near the viewport, and a negative delay resumes mid-cycle instead of
   * holding the shape still for the delay first.
   */
  delay?: number
  /** 0 to 1. Shapes sit at 0.2 to 0.3 so they never compete with content. */
  opacity?: number
  /** Hide below the md breakpoint — use for anything large enough to land on phone text. */
  mdUp?: boolean
  /**
   * Shrink to 60% below the md breakpoint instead of hiding — use for the big
   * animals so phones still get one per section, tucked at this corner.
   */
  shrinkFrom?: FloatingDoodleShrinkFrom
  children: ReactNode
}

/**
 * Absolutely-positioned, decorative, animated wrapper for a landing page doodle.
 * The outer div owns position (so translate utilities work), the inner div owns the
 * float/spin animation (which also uses transform). The animation only runs while
 * the doodle is near the viewport, so off-screen doodles hold no GPU layer.
 */
export function FloatingDoodle({
  position,
  animation = 'float',
  delay = 0,
  opacity = 0.25,
  mdUp = false,
  shrinkFrom,
  children,
}: FloatingDoodleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInViewport(ref)
  const visibility = mdUp ? 'hidden md:block' : shrinkFrom ? SHRINK[shrinkFrom] : ''
  return (
    <div
      ref={ref}
      className={`${visibility} absolute ${position} pointer-events-none`}
      aria-hidden="true"
    >
      <div
        className={inView ? ANIMATION[animation] : undefined}
        style={{ opacity, animationDelay: delay > 0 ? `-${delay}s` : undefined }}
      >
        {children}
      </div>
    </div>
  )
}
