import type { CSSProperties } from 'react'

/**
 * Soft radial glow behind a heading or card cluster, in a brand bright that sits
 * next to the section's wash. Mirrors the nebula blobs in the dark hero. Uses a
 * radial-gradient rather than filter: blur so there is no compositing cost.
 *
 * The gradient is `closest-side`, so it is fully transparent at the box edge:
 * nothing is ever visible at the rim, and the section's `lp-clip` cannot slice
 * the halo flat. The box is also capped at the section's height, so a glow
 * centred in a short band on a phone still fades out before the top and bottom.
 * Keep glows inside the section (no negative translate past an edge) for the
 * same reason.
 *
 * For a glow behind the section title use `top-0` with `height={TITLE_GLOW_HEIGHT}`:
 * every landing title centre sits about 150 to 170px below its section top, so a
 * 340px-tall ellipse starting at the top edge is centred on the title and has
 * already faded out by the scallop above it.
 * @param position  Tailwind position classes, e.g. "top-0 left-1/2 -translate-x-1/2"
 * @param color     the bright used in light mode (and in dark unless `darkColor` is given)
 * @param darkColor a cooler bright for dark mode; a yellow glow over a night tint turns
 *                  it green or brown, so warm-lit sections swap to a nebula colour here
 * @param size      width in px (and height, unless `height` is given)
 * @param height    height in px, for an elliptical glow
 */
export const TITLE_GLOW_HEIGHT = 340

export function SpotlightGlow({
  position,
  color,
  darkColor,
  size = 560,
  height,
  className = '',
}: {
  position: string
  color: string
  darkColor?: string
  size?: number
  height?: number
  className?: string
}) {
  return (
    <div
      className={`absolute ${position} rounded-full lp-glow opacity-25 dark:opacity-[0.14] ${className}`}
      style={
        {
          width: size,
          height: `min(${height ?? size}px, 100%)`,
          '--lp-glow': color,
          '--lp-glow-dark': darkColor ?? color,
        } as CSSProperties
      }
      aria-hidden="true"
    />
  )
}
