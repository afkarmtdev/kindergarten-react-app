/**
 * A beamed pair of quavers with two tiny echo notes rising off its top-right.
 * The pair sways in time and the echoes drift up and fade, but only while the
 * FloatingDoodle wrapper marks it .doodle-live (near the viewport); the CSS
 * lives in index.css next to the train and ladybird rules. The viewBox carries
 * 12 units of headroom above and to the right so the echoes never clip mid-drift.
 */
export function DoodleMusicNote({
  size = 48,
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
      viewBox="0 -12 60 60"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`doodle-music-note ${className}`.trim()}
      aria-hidden="true"
    >
      {/* the beamed pair, swaying about its base */}
      <g className="note">
        <path d="M14 40 V10 L34 4 V34" />
        <ellipse cx="9" cy="40" rx="6" ry="4" transform="rotate(-20 9 40)" />
        <ellipse cx="29" cy="34" rx="6" ry="4" transform="rotate(-20 29 34)" />
      </g>
      {/* echo notes, drifting up off the beam */}
      <g className="echo">
        <path d="M40 22 V12" />
        <path d="M40 12 C43 13 44 16 42 18" />
        <ellipse cx="38.5" cy="22" rx="2.4" ry="1.6" transform="rotate(-20 38.5 22)" />
      </g>
      <g className="echo echo-2">
        <path d="M45 10 V3" />
        <path d="M45 3 C47 4 47.5 6 46 7.5" />
        <ellipse cx="43.8" cy="10" rx="1.8" ry="1.2" transform="rotate(-20 43.8 10)" />
      </g>
    </svg>
  )
}
