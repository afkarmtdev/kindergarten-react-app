/** Plump fish with a forked tail, side view facing left. */
export function DoodleFish({
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
      height={size * (36 / 56)}
      viewBox="0 0 56 36"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* body */}
      <path d="M6 18 C12 8 26 6 36 10 C40 12 42 15 42 18 C42 21 40 24 36 26 C26 30 12 28 6 18 Z" />
      {/* tail */}
      <path d="M42 18 C46 12 50 9 54 8 C52 13 51 16 51 18 C51 20 52 23 54 28 C50 27 46 24 42 18" />
      {/* eye + mouth */}
      <circle cx="12" cy="16" r="1.3" fill={color} stroke="none" />
      <path d="M6 18 C7 19.5 8 19.5 9 18" />
      {/* fins */}
      <path d="M24 8.5 C26 4 31 3 33 7" />
      <path d="M22 27 C24 31 29 32 31 29" />
      {/* gill + scales */}
      <path d="M18 12 C15 15 15 21 18 24" />
      <path d="M26 14 C28 16 28 20 26 22" />
      <path d="M32 15 C34 17 34 19 32 21" />
    </svg>
  )
}
