/** Paper plane pointing up and to the right, with two motion lines trailing behind. */
export function DoodlePaperPlane({
  size = 48,
  color = '#4D96FF',
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
      <path d="M4 24 L44 6 L30 44 L24 28 Z" />
      <path d="M24 28 L44 6" />
      <path d="M4 24 L24 28" />
      {/* motion lines */}
      <path d="M8 34 C11 31 14 31 16 33" />
      <path d="M4 40 C8 36 13 36 16 39" />
    </svg>
  )
}
