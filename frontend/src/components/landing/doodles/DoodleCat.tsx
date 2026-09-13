/** Front-facing cat with pointy ears and whiskers. Same line-art style as the other doodles. */
export function DoodleCat({
  size = 48,
  color = '#FF6B35',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* ears */}
      <path d="M14 16 L11 4 L21 12" />
      <path d="M34 16 L37 4 L27 12" />
      {/* head */}
      <circle cx="24" cy="23" r="12" />
      {/* eyes */}
      <circle cx="19.5" cy="21.5" r="1.3" fill={color} stroke="none" />
      <circle cx="28.5" cy="21.5" r="1.3" fill={color} stroke="none" />
      {/* nose + mouth */}
      <path d="M23 25.5 h2 l-1 1.5 Z" fill={color} />
      <path d="M24 27 C23 29 21.5 29 21 28" />
      <path d="M24 27 C25 29 26.5 29 27 28" />
      {/* whiskers */}
      <path d="M7 23 h6" />
      <path d="M7.5 26.5 h5" />
      <path d="M35 23 h6" />
      <path d="M35.5 26.5 h5" />
      {/* body */}
      <path d="M14 46 C14 38 34 38 34 46" />
      {/* tail */}
      <path d="M34 44 C40 44 43 40 41 36" />
    </svg>
  )
}
