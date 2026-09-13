/** Hand-drawn rounded triangle with a smaller inner triangle, like a party bunting flag. */
export function DoodleTriangle({
  size = 32,
  color = '#6BCB77',
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
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 4 L29 27 H3 Z" />
      <path d="M16 13 L22 23 H10 Z" />
    </svg>
  )
}
