/** Front-facing monkey with round ears, face patch, and a curly tail. Same line-art style as the other doodles. */
export function DoodleMonkey({
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
      {/* hair tuft */}
      <path d="M22 6.5 l2 -3.5 l2 3.5" />
      {/* ears */}
      <circle cx="8" cy="17" r="5" />
      <circle cx="40" cy="17" r="5" />
      {/* head */}
      <circle cx="24" cy="18" r="12" />
      {/* face patch */}
      <path d="M15 20 C15 13 33 13 33 20 C33 27 28 30 24 30 C20 30 15 27 15 20 Z" />
      {/* eyes, nostrils, smile */}
      <circle cx="20" cy="18.5" r="1.2" fill={color} stroke="none" />
      <circle cx="28" cy="18.5" r="1.2" fill={color} stroke="none" />
      <circle cx="22.5" cy="23" r="0.8" fill={color} stroke="none" />
      <circle cx="25.5" cy="23" r="0.8" fill={color} stroke="none" />
      <path d="M20 26 C22 28.5 26 28.5 28 26" />
      {/* body */}
      <path d="M15 39 C15 32 33 32 33 39 C33 46 29 50 24 50 C19 50 15 46 15 39 Z" />
      {/* arms */}
      <path d="M15 36 C10 38 8 42 9 46" />
      <path d="M33 36 C38 38 40 42 39 46" />
      {/* legs */}
      <path d="M20 50 V55" />
      <path d="M28 50 V55" />
      {/* curly tail */}
      <path d="M33 44 C40 45 45 41 43 36 C41.5 32.5 37 34 38.5 37.5" />
    </svg>
  )
}
