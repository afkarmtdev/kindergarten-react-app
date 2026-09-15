import { useRef, type ReactNode } from 'react'
import { useInViewport } from '@/hooks/useInViewport'

const ANIMATION = {
  float: 'lp-float',
  alt: 'lp-float-alt',
  slow: 'lp-float-slow',
  spin: 'lp-spin-slow',
  /** No drift at all — for doodles that animate themselves, like the train. */
  none: '',
} as const

export type FloatingDoodleAnimation = keyof typeof ANIMATION

/**
 * Scroll parallax, driven by the doodle's own view timeline (see `.lp-drift-*`
 * in index.css). `near` outruns the page slightly, `far` lags behind it, so a
 * ghost layer and a mid layer in the same section read as different depths.
 * md and up, motion-safe browsers with scroll-driven animations only; elsewhere
 * the doodle simply scrolls with the page.
 */
const PARALLAX = {
  none: '',
  near: 'lp-drift-near',
  far: 'lp-drift-far',
} as const

export type FloatingDoodleParallax = keyof typeof PARALLAX

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
  /** Defaults to `float`, or `none` for a ghost. */
  animation?: FloatingDoodleAnimation
  /**
   * Stagger in seconds so neighbouring shapes drift out of sync. Applied as a
   * negative delay: the animation is (re)started whenever the doodle scrolls
   * near the viewport, and a negative delay resumes mid-cycle instead of
   * holding the shape still for the delay first.
   */
  delay?: number
  /** 0 to 1. Shapes sit at 0.2 to 0.3 so they never compete with content; ghosts at 0.07. */
  opacity?: number
  /** Hide below the md breakpoint — use for anything large enough to land on phone text. */
  mdUp?: boolean
  /**
   * Shrink to 60% below the md breakpoint instead of hiding — use for the big
   * animals so phones still get one per section, tucked at this corner.
   */
  shrinkFrom?: FloatingDoodleShrinkFrom
  /**
   * Mirror the doodle horizontally. The side-view animals are drawn facing
   * left, so flip the ones placed at a section's left edge to face the content.
   */
  flip?: boolean
  /**
   * The far depth layer: an oversized (2 to 3x), barely-there, static copy of a
   * shape sitting behind the section's content. Defaults opacity to 0.07,
   * animation to `none` and parallax to `far`. Put ghosts inside SectionBackdrop.
   */
  ghost?: boolean
  /** Defaults to `near`, or `far` for a ghost. */
  parallax?: FloatingDoodleParallax
  children: ReactNode
}

/**
 * Absolutely-positioned, decorative, animated wrapper for a landing page doodle.
 * Three nested divs, each owning one transform so none fight: the outer div owns
 * position (so translate utilities work), the middle owns scroll parallax, the
 * inner owns the float/spin animation. Both animations only run while the
 * doodle is near the viewport, so off-screen doodles hold no GPU layer.
 */
export function FloatingDoodle({
  position,
  animation,
  delay = 0,
  opacity,
  mdUp = false,
  shrinkFrom,
  flip = false,
  ghost = false,
  parallax,
  children,
}: FloatingDoodleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInViewport(ref)
  const visibility = mdUp ? 'hidden md:block' : shrinkFrom ? SHRINK[shrinkFrom] : ''
  const driftCls = ANIMATION[animation ?? (ghost ? 'none' : 'float')]
  const parallaxCls = PARALLAX[parallax ?? (ghost ? 'far' : 'near')]
  return (
    <div
      ref={ref}
      className={`${visibility} absolute ${position} pointer-events-none`}
      aria-hidden="true"
    >
      <div className={inView && parallaxCls ? parallaxCls : undefined}>
        <div
          className={inView ? `${driftCls} doodle-live`.trim() : undefined}
          style={{
            opacity: opacity ?? (ghost ? 0.07 : 0.25),
            animationDelay: delay > 0 ? `-${delay}s` : undefined,
          }}
        >
          {/* Own element for the mirror so it never fights the animation's transform */}
          {flip ? <div className="-scale-x-100">{children}</div> : children}
        </div>
      </div>
    </div>
  )
}
