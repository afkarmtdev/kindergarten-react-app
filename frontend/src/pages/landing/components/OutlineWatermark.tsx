import { FloatingDoodle } from '@/components/landing/doodles/FloatingDoodle'

/**
 * Giant outlined text at a few percent opacity behind a section's content:
 * "ABC" behind the programmes, "123" behind the numbers. Set in Titan One
 * (`font-bubble`), fat bubble letters, and outlined only, like the doodles,
 * via `.lp-outline-text` in index.css, so they read as colouring-book numbers.
 * @param position Tailwind position classes, e.g. "top-4 left-6"
 * @param ghost Make the text the section's far depth layer: it rides the same
 *   `far` scroll parallax and 0.07 opacity as a `<FloatingDoodle ghost>`, so a
 *   section can use its watermark as the ghost instead of an oversized shape.
 */
export function OutlineWatermark({
  text,
  position,
  rotate = -6,
  size = 'clamp(9rem, 24vw, 20rem)',
  ghost = false,
  className = '',
}: {
  text: string
  position: string
  rotate?: number
  size?: string
  ghost?: boolean
  className?: string
}) {
  const textCls =
    'lp-outline-text font-bubble uppercase leading-none tracking-wide whitespace-nowrap select-none text-gray-900 dark:text-white'
  if (ghost) {
    return (
      <FloatingDoodle ghost position={position}>
        <div
          className={`${textCls} ${className}`}
          style={{ fontSize: size, transform: `rotate(${rotate}deg)` }}
        >
          {text}
        </div>
      </FloatingDoodle>
    )
  }
  return (
    <div
      className={`absolute ${position} ${textCls} opacity-[0.05] dark:opacity-[0.07] ${className}`}
      style={{ fontSize: size, transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {text}
    </div>
  )
}
