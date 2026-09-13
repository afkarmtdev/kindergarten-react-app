/** Turtle with a domed shell, side view facing left. */
export function DoodleTurtle({
  size = 48,
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
      height={size * (40 / 64)}
      viewBox="0 0 64 40"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* shell dome */}
      <path d="M12 28 C12 16 22 9 33 9 C46 9 54 16 54 28 Z" />
      {/* shell pattern */}
      <path d="M24 28 C24 20 28 14 33 13" />
      <path d="M42 28 C42 20 38 14 33 13" />
      <path d="M18 20 C24 18 42 18 48 20" />
      {/* plastron */}
      <path d="M12 28 C14 33 22 34 33 34 C44 34 52 33 54 28" />
      {/* head */}
      <circle cx="7" cy="27" r="5" />
      <circle cx="5.5" cy="26" r="1.1" fill={color} stroke="none" />
      {/* legs */}
      <path d="M20 34 L17 39" />
      <path d="M28 34 L27 39" />
      <path d="M40 34 L41 39" />
      <path d="M48 34 L51 39" />
      {/* tail */}
      <path d="M54 30 L60 33" />
    </svg>
  )
}
