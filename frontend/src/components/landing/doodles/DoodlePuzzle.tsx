/** One jigsaw piece with tabs on the top and right and sockets on the bottom and left. */
export function DoodlePuzzle({
  size = 48,
  color = '#6BCB77',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size * (48 / 50)}
      height={size}
      viewBox="0 0 48 50"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 12 H18 C16 6 26 6 24 12 H36 V24 C42 22 42 32 36 30 V42 H24 C26 48 16 48 18 42 H8 V30 C2 32 2 22 8 24 Z" />
    </svg>
  )
}
