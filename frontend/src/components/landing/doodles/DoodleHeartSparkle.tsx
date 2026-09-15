/** Heart with a small four-point sparkle at its right shoulder. */
export function DoodleHeartSparkle({
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
      <path d="M24 42 C10 32 4 24 4 16 C4 9 9 5 14 5 C18 5 22 8 24 12 C26 8 30 5 34 5 C39 5 44 9 44 16 C44 24 38 32 24 42 Z" />
      <path d="M40 30 C40.5 34 42 35.5 46 36 C42 36.5 40.5 38 40 42 C39.5 38 38 36.5 34 36 C38 35.5 39.5 34 40 30 Z" />
    </svg>
  )
}
