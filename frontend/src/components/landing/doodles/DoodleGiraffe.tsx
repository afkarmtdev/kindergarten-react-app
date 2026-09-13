/** Giraffe with a sideways muzzle, ear, mane and spots, neck angled. Same line-art style as the other doodles. */
export function DoodleGiraffe({
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
      width={size * (48 / 56)}
      height={size}
      viewBox="0 0 48 56"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* ossicones with knobs */}
      <path d="M16 7 V3.5" />
      <path d="M20 7 V3.5" />
      <circle cx="16" cy="2.5" r="1.4" fill={color} stroke="none" />
      <circle cx="20" cy="2.5" r="1.4" fill={color} stroke="none" />
      {/* head: wide muzzle facing left */}
      <path d="M4 12 C4 9 8 7 13 7 C18 7 22 9 22 12 C22 15 18 17 13 17 C8 17 4 15 4 12 Z" />
      <circle cx="6.5" cy="12" r="0.9" fill={color} stroke="none" />
      <circle cx="16" cy="10.5" r="1.1" fill={color} stroke="none" />
      <path d="M5 14.5 h5" />
      {/* ear, out to the back */}
      <path d="M22 9 l5 -3 l-2 5" />
      {/* neck, angled back and down */}
      <path d="M22 11 C28 16 32 26 34 36" />
      <path d="M20 17 C24 22 27 30 28 37" />
      {/* mane */}
      <path d="M25 13.5 l2.5 -2" />
      <path d="M28 18.5 l2.5 -2" />
      <path d="M30.5 24.5 l2.5 -2" />
      <path d="M32.5 30.5 l2.5 -2" />
      {/* body */}
      <path d="M28 37 C30 33 40 33 44 37 C47 40 46 46 42 48 C38 50 30 49 28 46 C26 43 26 40 28 37 Z" />
      {/* legs */}
      <path d="M31 49 V55" />
      <path d="M36 50 V55" />
      <path d="M41 49 V55" />
      {/* tail */}
      <path d="M45 40 l3 4" />
      {/* spots */}
      <circle cx="26.5" cy="24" r="1.6" fill={color} stroke="none" />
      <circle cx="30" cy="31" r="1.6" fill={color} stroke="none" />
      <circle cx="34" cy="42" r="2" fill={color} stroke="none" />
      <circle cx="40" cy="45" r="1.6" fill={color} stroke="none" />
    </svg>
  )
}
