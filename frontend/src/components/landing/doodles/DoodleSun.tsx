export function DoodleSun({
  size = 32,
  color = '#FFD93D',
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
      <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M16 4V8 M16 24V28 M4 16H8 M24 16H28 M7.5 7.5L10 10 M22 22L24.5 24.5 M24.5 7.5L22 10 M10 22L7.5 24.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
