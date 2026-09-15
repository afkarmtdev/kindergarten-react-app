/**
 * Toy steam train pulling one passenger carriage, side view facing left. Same
 * line-art style as the other doodles. Wheels carry spokes and the smoke puffs
 * are tagged so index.css can spin and drift them while the FloatingDoodle
 * wrapper marks the train .doodle-live (near the viewport).
 */
const WHEELS = [
  { cx: 22, cy: 38 },
  { cx: 38, cy: 38 },
  { cx: 58, cy: 38 },
  { cx: 88, cy: 38 },
  { cx: 106, cy: 38 },
]

export function DoodleTrain({
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
      height={size * (62 / 120)}
      viewBox="0 -14 120 62"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`doodle-train ${className}`.trim()}
      aria-hidden="true"
    >
      {/* smoke puffs — the viewBox starts at y=-14 so they have room to drift up */}
      <circle className="puff" cx="15" cy="5" r="3" />
      <circle className="puff puff-2" cx="9" cy="2" r="2" />
      {/* chimney with a flared top */}
      <path d="M21 17 V10 H27 V17" />
      <path d="M18 10 H30" />
      {/* boiler + steam dome */}
      <rect x="14" y="17" width="34" height="15" rx="5" />
      <path d="M34 17 a4 4 0 0 1 8 0" />
      {/* cab */}
      <rect x="48" y="8" width="20" height="24" rx="3" />
      <rect x="52" y="12" width="12" height="9" rx="2" />
      {/* cowcatcher + chassis */}
      <path d="M14 24 L6 34 H14" />
      <path d="M8 34 H70" />
      {/* coupling to the carriage */}
      <path d="M70 28 H78" />
      {/* carriage with two windows */}
      <rect x="78" y="14" width="36" height="18" rx="3" />
      <rect x="83" y="18" width="9" height="7" rx="1.5" />
      <rect x="99" y="18" width="9" height="7" rx="1.5" />
      <path d="M76 34 H116" />
      {/* wheels — rim, two spokes and a hub, grouped so each spins about its centre */}
      {WHEELS.map(({ cx, cy }) => (
        <g key={cx} className="wheel">
          <circle cx={cx} cy={cy} r="5" />
          <path d={`M${cx} ${cy - 4} V${cy + 4}`} />
          <path d={`M${cx - 4} ${cy} H${cx + 4}`} />
          <circle cx={cx} cy={cy} r="1.2" fill={color} stroke="none" />
        </g>
      ))}
    </svg>
  )
}
