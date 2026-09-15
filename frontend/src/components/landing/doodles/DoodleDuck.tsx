/**
 * Duck sitting on the water with a wing arc and two ripples, side view facing left.
 * It bobs and rocks a touch on the water and the ripples slide out of phase, but
 * only while the FloatingDoodle wrapper marks it .doodle-live (near the viewport);
 * the CSS lives in index.css next to the train and music note rules.
 */
export function DoodleDuck({
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
      className={`doodle-duck ${className}`.trim()}
      aria-hidden="true"
    >
      {/* the duck, bobbing on the water */}
      <g className="body">
        {/* body, tail tip at the right */}
        <path d="M8 30 C8 22 16 18 24 20 C30 21 36 24 42 22 C44 28 40 38 30 40 C20 42 10 38 8 30 Z" />
        {/* head + bill */}
        <circle cx="13" cy="13" r="7" />
        <path d="M7 13 L1 15 L7 17" />
        <circle cx="12" cy="12" r="1.3" fill={color} stroke="none" />
        {/* wing */}
        <path d="M18 29 C22 24 32 24 34 30" />
      </g>
      {/* ripples, sliding out of phase */}
      <path className="ripple" d="M4 45 C8 43 12 47 16 45" />
      <path className="ripple ripple-2" d="M28 45 C32 43 36 47 40 45" />
    </svg>
  )
}
