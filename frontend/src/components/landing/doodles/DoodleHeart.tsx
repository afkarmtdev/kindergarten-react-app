export function DoodleHeart({
  size = 32,
  color = '#FF85A2',
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
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 28 C12 24 3 18 3 11 C3 7 6 4 10 4 C13 4 15 6 16 8 C17 6 19 4 22 4 C26 4 29 7 29 11 C29 18 20 24 16 28Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
