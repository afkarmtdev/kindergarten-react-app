/** Striped bumblebee with two wings, side view facing left. */
export function DoodleBee({
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
      height={size * (44 / 56)}
      viewBox="0 0 56 44"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* wings */}
      <ellipse cx="26" cy="12" rx="7" ry="5" transform="rotate(-20 26 12)" />
      <ellipse cx="38" cy="11" rx="7" ry="5" transform="rotate(15 38 11)" />
      {/* body + stripes */}
      <ellipse cx="32" cy="26" rx="15" ry="11" />
      <path d="M26 16.5 C25 22 25 30 26 35.5" />
      <path d="M33 15 C32 22 32 30 33 37" />
      <path d="M40 17 C39 22 39 30 40 35" />
      {/* head */}
      <circle cx="10" cy="26" r="6.5" />
      <circle cx="8.5" cy="25" r="1.2" fill={color} stroke="none" />
      {/* antennae */}
      <path d="M8 20 C6 16 4 14 3 13" />
      <path d="M12 20 C12 16 13 13 15 12" />
      {/* stinger */}
      <path d="M47 26 L53 27" />
      {/* legs */}
      <path d="M24 36 L22 40" />
      <path d="M32 37 L32 41" />
      <path d="M40 36 L42 40" />
    </svg>
  )
}
