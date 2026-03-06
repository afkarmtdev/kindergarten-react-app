export function DoodleCircle({
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
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 4 C22 3.5 28 8 28.5 16 C29 22 24 28.5 16 28 C8 27.5 3.5 22 4 16 C4.5 10 9 4.5 16 4Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
