export function DoodleFlower({
  size = 32,
  color = '#6BCB77',
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
      <circle cx="16" cy="14" r="4" stroke={color} strokeWidth="2" fill="none" />
      <ellipse cx="16" cy="7" rx="3" ry="4" stroke={color} strokeWidth="1.5" fill="none" />
      <ellipse
        cx="22"
        cy="11"
        rx="3"
        ry="4"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        transform="rotate(60 22 11)"
      />
      <ellipse
        cx="22"
        cy="19"
        rx="3"
        ry="4"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        transform="rotate(120 22 19)"
      />
      <ellipse cx="16" cy="21" rx="3" ry="4" stroke={color} strokeWidth="1.5" fill="none" />
      <ellipse
        cx="10"
        cy="19"
        rx="3"
        ry="4"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        transform="rotate(60 10 19)"
      />
      <ellipse
        cx="10"
        cy="11"
        rx="3"
        ry="4"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        transform="rotate(120 10 11)"
      />
      <path d="M16 18V30" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
