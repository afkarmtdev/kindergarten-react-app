/** Round elephant with a big ear and curled trunk, side view facing left. */
export function DoodleElephant({
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
      height={size * (48 / 56)}
      viewBox="0 0 56 48"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* body */}
      <path d="M22 16 C32 12 46 14 48 26 C49 34 44 39 36 39 L22 39 C18 39 17 34 18 30" />
      {/* head */}
      <path d="M22 16 C14 14 6 18 6 26 C6 31 10 34 14 34 C18 34 20 31 20 28" />
      {/* ear */}
      <path d="M22 18 C26 16 30 20 28 26 C26 30 21 30 20 26" />
      {/* trunk */}
      <path d="M8 30 C5 34 5 40 9 42 C12 43 13 40 11 38" />
      {/* eye */}
      <circle cx="13" cy="24" r="1.2" fill={color} stroke="none" />
      {/* legs */}
      <path d="M24 39 V46" />
      <path d="M31 39 V46" />
      <path d="M38 39 V46" />
      <path d="M44 37 V44" />
      {/* tail */}
      <path d="M48 28 C52 30 52 34 50 36" />
    </svg>
  )
}
