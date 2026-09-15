/**
 * Paper grain — a tiled SVG noise texture at a few percent opacity, so a flat
 * pastel wash reads as construction paper and the outlined doodles look drawn
 * on it. Static: one repeating 160px tile, painted once. The tile swaps from
 * black speckles to white ones in dark mode (see `.lp-grain` in index.css).
 * Parent must be position:relative (SectionBackdrop provides this).
 */
export function PaperGrain({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 lp-grain opacity-[0.07] dark:opacity-[0.06] ${className}`}
      aria-hidden="true"
    />
  )
}
