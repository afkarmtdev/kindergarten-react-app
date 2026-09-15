/** Four-point twinkle with a smaller companion at its top-right. */
export function DoodleSparkle({
  size = 48,
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
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 4 C25 18 30 23 44 24 C30 25 25 30 24 44 C23 30 18 25 4 24 C18 23 23 18 24 4 Z" />
      <path d="M38 6 C38.5 10 40 11.5 44 12 C40 12.5 38.5 14 38 18 C37.5 14 36 12.5 32 12 C36 11.5 37.5 10 38 6 Z" />
    </svg>
  )
}
