export function DoodleCloud({
  size = 32,
  color = '#4D96FF',
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
      viewBox="0 0 40 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 24 C5 24 2 21 2 17 C2 13 5 10 9 10 C9 6 13 2 18 2 C23 2 26 5 27 9 C29 7 33 8 35 10 C37 12 37 16 35 18 C37 20 37 23 34 24 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
