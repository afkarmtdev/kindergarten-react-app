/** Front-facing owl with ear tufts, big round eyes, and a feathered belly. */
export function DoodleOwl({
  size = 48,
  color = '#C77DFF',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size * (44 / 54)}
      height={size}
      viewBox="0 0 44 54"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* ear tufts */}
      <path d="M11 15 L9 6 L17 12" />
      <path d="M33 15 L35 6 L27 12" />
      {/* body */}
      <ellipse cx="22" cy="30" rx="14" ry="18" />
      {/* eyes */}
      <circle cx="16" cy="24" r="5" />
      <circle cx="28" cy="24" r="5" />
      <circle cx="16.5" cy="24.5" r="1.5" fill={color} stroke="none" />
      <circle cx="27.5" cy="24.5" r="1.5" fill={color} stroke="none" />
      {/* beak */}
      <path d="M20 29.5 L24 29.5 L22 32.5 Z" fill={color} />
      {/* wings */}
      <path d="M8 30 C6 36 8 42 12 46" />
      <path d="M36 30 C38 36 36 42 32 46" />
      {/* belly feathers */}
      <path d="M17 38 l2.5 3 l2.5 -3 l2.5 3 l2.5 -3" />
      {/* feet */}
      <path d="M17 48 V51" />
      <path d="M27 48 V51" />
      <path d="M15 53 l2 -2 l2 2" />
      <path d="M25 53 l2 -2 l2 2" />
    </svg>
  )
}
