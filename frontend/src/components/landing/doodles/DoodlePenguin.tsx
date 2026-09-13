/** Front-facing penguin with a pale belly and little flippers. */
export function DoodlePenguin({
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
      width={size * (40 / 58)}
      height={size}
      viewBox="0 0 40 58"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* body */}
      <path d="M20 4 C10 4 6 14 6 30 C6 44 12 52 20 52 C28 52 34 44 34 30 C34 14 30 4 20 4 Z" />
      {/* belly */}
      <path d="M20 20 C14 20 12 28 12 36 C12 44 15 50 20 50 C25 50 28 44 28 36 C28 28 26 20 20 20 Z" />
      {/* eyes */}
      <circle cx="16" cy="14" r="1.3" fill={color} stroke="none" />
      <circle cx="24" cy="14" r="1.3" fill={color} stroke="none" />
      {/* beak */}
      <path d="M17 18 L23 18 L20 22 Z" fill={color} />
      {/* flippers */}
      <path d="M7 24 C3 30 3 38 6 44" />
      <path d="M33 24 C37 30 37 38 34 44" />
      {/* feet */}
      <path d="M14 52 L11 55" />
      <path d="M14 52 L17 55" />
      <path d="M26 52 L23 55" />
      <path d="M26 52 L29 55" />
    </svg>
  )
}
