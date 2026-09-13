/** Tall giraffe with ossicones and spots. Same line-art style as the other doodles. */
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
      width={size * (40 / 56)}
      height={size}
      viewBox="0 0 40 56"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* ossicones */}
      <path d="M11 6 V2" />
      <path d="M17 6 V2" />
      <circle cx="11" cy="1.5" r="1.2" fill={color} stroke="none" />
      <circle cx="17" cy="1.5" r="1.2" fill={color} stroke="none" />
      {/* head */}
      <path d="M8 10 C8 6 20 6 20 10 C21 14 17 16 13 16 C10 16 8 13 8 10 Z" />
      <circle cx="11.5" cy="10" r="1" fill={color} stroke="none" />
      {/* ear */}
      <path d="M20 9 l4 -2 l-1 4" />
      {/* neck */}
      <path d="M12 16 C12 24 14 31 17 37" />
      <path d="M18 15 C19 22 22 29 25 35" />
      {/* body */}
      <path d="M17 37 C20 33 30 33 34 37 C37 40 36 46 32 48 C28 50 20 49 18 46 C16 43 15 40 17 37 Z" />
      {/* legs */}
      <path d="M21 49 V55" />
      <path d="M26 50 V55" />
      <path d="M31 49 V55" />
      {/* tail */}
      <path d="M35 40 l4 3" />
      {/* spots */}
      <circle cx="15" cy="23" r="1.6" fill={color} stroke="none" />
      <circle cx="20" cy="29" r="1.6" fill={color} stroke="none" />
      <circle cx="24" cy="41" r="2" fill={color} stroke="none" />
      <circle cx="30" cy="44" r="1.6" fill={color} stroke="none" />
    </svg>
  )
}
