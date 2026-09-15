/**
 * The teacher's apple: a dimpled body with a stem and one leaf. Somebody keeps
 * biting it: the outline swaps from whole to one bite to two bites (with a
 * chomp squash and a couple of crumbs each time), then a fresh apple fades in.
 * Runs only while the FloatingDoodle wrapper marks it .doodle-live; the CSS
 * lives in index.css next to the train and duck rules. At rest it is whole.
 */
export function DoodleApple({
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
      viewBox="4 2 40 44"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`doodle-apple ${className}`.trim()}
      aria-hidden="true"
    >
      <g className="body">
        {/* whole */}
        <path
          className="whole"
          d="M24 14 C14 8 6 16 8 28 C10 38 16 44 24 42 C32 44 38 38 40 28 C42 16 34 8 24 14 Z"
        />
        {/* one bite out of the top right */}
        <path
          className="bite-1"
          d="M24 14 C14 8 6 16 8 28 C10 38 16 44 24 42 C32 44 38 38 40 31 A9.5 9.5 0 0 1 37 15 C35 10 30 9 24 14 Z"
        />
        {/* second, bigger bite */}
        <path
          className="bite-2"
          d="M24 14 C14 8 6 16 8 28 C10 38 16 44 24 42 C32 44 36 40 38 36 A12 12 0 0 1 36 14 C33 9 29 9 24 14 Z"
        />
        {/* stem + leaf */}
        <path d="M24 14 C24 10 25 7 27 5" />
        <path d="M26 10 C30 5 36 6 36 8 C33 12 28 12 26 10 Z" />
      </g>
      {/* crumbs that fly off with each bite */}
      <circle className="crumb" cx="40" cy="22" r="1.3" fill={color} stroke="none" />
      <circle className="crumb crumb-2" cx="41" cy="27" r="1" fill={color} stroke="none" />
    </svg>
  )
}
