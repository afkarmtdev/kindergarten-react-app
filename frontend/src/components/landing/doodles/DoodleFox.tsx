/** Front-facing fox with tall ears, cheek mask, and a curled tail. */
export function DoodleFox({
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
      <path d="M12 20 L8 4 L22 12" />
      <path d="M36 20 L40 4 L26 12" />
      {/* head */}
      <path d="M24 12 C16 12 10 18 10 26 C10 32 16 38 24 40 C32 38 38 32 38 26 C38 18 32 12 24 12 Z" />
      {/* cheek mask */}
      <path d="M17 28 C14 33 18 38 24 40" />
      <path d="M31 28 C34 33 30 38 24 40" />
      {/* eyes + nose */}
      <circle cx="18" cy="24" r="1.3" fill={color} stroke="none" />
      <circle cx="30" cy="24" r="1.3" fill={color} stroke="none" />
      <path d="M22 31 L26 31 L24 33.5 Z" fill={color} />
      {/* body + tail */}
      <path d="M14 46 C14 41 34 41 34 46" />
      <path d="M34 44 C42 46 46 40 43 35" />
    </svg>
  )
}
