/** Crescent moon opening to the right, with a small five-point star beside it. */
export function DoodleMoon({
  size = 48,
  color = '#FFD93D',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M30 4 A20 20 0 1 0 30 44 A15 15 0 1 1 30 4 Z" />
      <path d="M40 12 L41.5 16 L45.5 16 L42 18.5 L43.5 22.5 L40 20 L36.5 22.5 L38 18.5 L34.5 16 L38.5 16 Z" />
    </svg>
  )
}
