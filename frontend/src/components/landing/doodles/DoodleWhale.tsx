/** Chubby whale with a water spout, side view facing left. */
export function DoodleWhale({
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
      height={size * (40 / 56)}
      viewBox="0 0 56 40"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* spout */}
      <path d="M22 9 C22 5 20 3 17 3" />
      <path d="M22 9 C22 5 24 3 27 3" />
      {/* body */}
      <path d="M6 24 C6 15 14 10 24 10 C36 10 44 15 44 22 C44 30 34 34 22 34 C13 34 7 31 6 24 Z" />
      {/* tail */}
      <path d="M44 22 C48 18 51 14 53 12 C52 18 50 22 47 24 C50 26 52 30 53 34 C50 32 47 28 44 26" />
      {/* eye */}
      <circle cx="14" cy="20" r="1.3" fill={color} stroke="none" />
      {/* mouth */}
      <path d="M8 26 C13 29 20 29 26 27" />
      {/* fin */}
      <path d="M24 30 C26 33 30 34 33 32" />
    </svg>
  )
}
