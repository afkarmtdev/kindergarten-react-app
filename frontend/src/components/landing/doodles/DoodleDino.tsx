/** Long-necked dinosaur, side view facing left, neck angled forward. Same line-art style as the other doodles. */
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
      height={size * (48 / 64)}
      viewBox="0 0 64 48"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* head: wide muzzle, mouth, eye */}
      <path d="M4 14 C4 10 8 8 13 9 C17 10 19 13 18 16 C17 19 12 20 8 19 C5 18 4 16 4 14 Z" />
      <path d="M5 16 h7" />
      <circle cx="12" cy="12" r="1.1" fill={color} stroke="none" />
      {/* neck: angled back and down into the body */}
      <path d="M17 12 C24 14 30 20 33 24" />
      <path d="M17 19 C22 22 25 26 27 30" />
      {/* body */}
      <path d="M26 29 C30 24 42 22 50 26 C56 30 56 38 50 41 C44 44 32 44 28 40 C24 36 24 32 26 29 Z" />
      {/* back plates */}
      <path d="M34 24.5 l2 -4 l2 4" />
      <path d="M40 23 l2 -4 l2 4" />
      <path d="M46 24 l2 -4 l2 4" />
      {/* tail */}
      <path d="M55 32 C60 30 62 26 62 22" />
      {/* legs */}
      <path d="M32 43 V47" />
      <path d="M38 44 V47" />
      <path d="M44 44 V47" />
      <path d="M50 42 V46" />
    </svg>
  )
}
