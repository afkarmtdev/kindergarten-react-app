// Admin bear — blue tie + blazer + white shirt collar = school administrator
// viewBox 24×26: ears+head (0-18) | shirt+tie (18-26)
// eyeState: 'open' = full 3×3 block | 'half' = droopy 3×2 (sleepy) | 'closed' = thin 3×1 line (asleep)
export function AdminBearIcon({
  size = 34,
  eyeState = 'open',
}: {
  size?: number
  eyeState?: 'open' | 'half' | 'closed'
}) {
  const eye =
    eyeState === 'closed' ? { y: 10, h: 1 } : eyeState === 'half' ? { y: 9, h: 2 } : { y: 8, h: 3 }
  return (
    <svg
      viewBox="0 0 24 26"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      shapeRendering="crispEdges"
    >
      {/* ── Ears ── */}
      <rect x="2" y="0" width="4" height="5" fill="#4A2A0E" />
      <rect x="18" y="0" width="4" height="5" fill="#4A2A0E" />
      <rect x="3" y="0" width="2" height="3" fill="#FFB3C6" />
      <rect x="19" y="0" width="2" height="3" fill="#FFB3C6" />

      {/* ── Head ── */}
      <rect x="2" y="3" width="20" height="15" fill="#7B5230" />

      {/* ── Muzzle ── */}
      <rect x="5" y="8" width="14" height="8" fill="#C8956B" />

      {/* ── Eyes ── */}
      <rect x="5" y={eye.y} width="3" height={eye.h} fill="#1A1A1A" />
      <rect x="16" y={eye.y} width="3" height={eye.h} fill="#1A1A1A" />

      {/* ── Nose ── */}
      <rect x="9" y="12" width="6" height="2" fill="#1A1A1A" />

      {/* ── Cheeks ── */}
      <rect x="5" y="12" width="3" height="2" fill="#FFB3C6" opacity="0.7" />
      <rect x="16" y="12" width="3" height="2" fill="#FFB3C6" opacity="0.7" />

      {/* ── Fuller white shirt collar ── */}
      <rect x="0" y="18" width="24" height="8" fill="white" />

      {/* ── Blazer ── */}
      {/* Left jacket panel */}
      <rect x="0" y="18" width="8" height="8" fill="#1E2B4A" />
      {/* Right jacket panel */}
      <rect x="16" y="18" width="8" height="8" fill="#1E2B4A" />
      {/* Left lapel */}
      <rect x="5" y="18" width="3" height="1" fill="white" />
      <rect x="6" y="19" width="2" height="1" fill="white" />
      <rect x="7" y="20" width="1" height="1" fill="white" />
      {/* Right lapel */}
      <rect x="16" y="18" width="3" height="1" fill="white" />
      <rect x="16" y="19" width="2" height="1" fill="white" />
      <rect x="16" y="20" width="1" height="1" fill="white" />

      {/* ── Blue tie ── */}
      {/* Knot */}
      <rect x="9" y="18" width="6" height="3" fill="#4D96FF" />
      {/* Body */}
      <rect x="10" y="21" width="4" height="4" fill="#4D96FF" />
      {/* Point */}
      <rect x="11" y="25" width="2" height="1" fill="#4D96FF" />
      {/* Classic diagonal stripes */}
      <rect x="14" y="18" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="13" y="19" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="12" y="20" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="11" y="21" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="13" y="21" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="12" y="22" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="11" y="23" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="10" y="24" width="1" height="1" fill="white" opacity="0.4" />
    </svg>
  )
}
