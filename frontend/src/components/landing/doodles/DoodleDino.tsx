/** Long-necked dinosaur, side view facing left. Same line-art style as the other doodles. */
export function DoodleDino({
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
      width={size}
      height={size * (48 / 56)}
      viewBox="0 0 56 48"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* head */}
      <path d="M8 9 C8 6 11 4 14 5 C17 6 18 9 17 12 C15 14 10 14 8 12 Z" />
      <circle cx="12" cy="8.5" r="1" fill={color} stroke="none" />
      {/* neck */}
      <path d="M11 14 C12 20 15 25 20 27" />
      <path d="M16 13 C18 18 21 22 25 24" />
      {/* body */}
      <path d="M20 27 C24 22 36 20 42 24 C48 28 48 36 42 39 C36 42 26 42 22 38 C18 34 18 30 20 27 Z" />
      {/* back spikes */}
      <path d="M26 25 l2 -4 l2 4" />
      <path d="M32 23.5 l2 -4 l2 4" />
      <path d="M38 24 l2 -4 l2 4" />
      {/* tail */}
      <path d="M47 30 C52 28 54 24 53 19" />
      {/* legs */}
      <path d="M25 41 V46" />
      <path d="M31 42 V46" />
      <path d="M37 42 V46" />
      <path d="M43 39 V45" />
    </svg>
  )
}
