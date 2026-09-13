/** Front-facing bunny with tall ears and whiskers. */
export function DoodleBunny({
  size = 48,
  color = '#FF85A2',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size * (40 / 48)}
      height={size}
      viewBox="0 0 40 48"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* ears */}
      <ellipse cx="14" cy="11" rx="4" ry="9" transform="rotate(-8 14 11)" />
      <ellipse cx="26" cy="11" rx="4" ry="9" transform="rotate(8 26 11)" />
      {/* head */}
      <circle cx="20" cy="26" r="9" />
      {/* eyes */}
      <circle cx="16.5" cy="24" r="1.2" fill={color} stroke="none" />
      <circle cx="23.5" cy="24" r="1.2" fill={color} stroke="none" />
      {/* nose + mouth */}
      <path d="M19 28 h2 l-1 1.5 Z" fill={color} />
      <path d="M20 29.5 C19 31.5 17.5 31.5 17 30.5" />
      <path d="M20 29.5 C21 31.5 22.5 31.5 23 30.5" />
      {/* whiskers */}
      <path d="M9 27 h5" />
      <path d="M9 30 h4" />
      <path d="M26 27 h5" />
      <path d="M27 30 h4" />
      {/* body */}
      <path d="M11 41 C11 36 15 34 20 34 C25 34 29 36 29 41 C29 44 26 46 20 46 C14 46 11 44 11 41 Z" />
    </svg>
  )
}
