export function DoodleSpiral({
  size = 32,
  color = '#C77DFF',
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
        d="M16 16 C16 14 18 12 20 12 C23 12 25 14 25 17 C25 21 22 24 18 24 C13 24 9 20 9 15 C9 9 14 5 20 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
