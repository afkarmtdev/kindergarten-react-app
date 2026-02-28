// ─── Base Bear Mascot + Bear Logo ────────────────────────────────────────────
// Minecraft pixel-art style bear components used on the LandingPage.
//
// For seasonal variants (Christmas, summer, etc.) create a NEW component in
// this folder (e.g. BearMascotChristmas.tsx) that copies this SVG and layers
// seasonal accessories on top. Never modify this base file for seasonal use.
//
// Key layout notes (BaseBearMascot):
//   viewBox "0 0 96 112" — overflow="visible" lets the bag (negative x) render
//   Wave arm: RIGHT arm (x=64-72), pivot transformOrigin "68px 48px"
//   Right arm strap is a SEPARATE static rect outside the wave <g>
//   bear-mascot class + z-20 must be on the WRAPPER DIV in LandingPage, not here

export function BaseBearMascot() {
  return (
    <svg
      viewBox="0 0 96 112"
      width="120"
      height="140"
      aria-hidden="true"
      shapeRendering="crispEdges"
      overflow="visible"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* ── Backpack — peeking LEFT (overflow visible, negative x) ── */}
      <rect x="-14" y="36" width="12" height="14" fill="#22863A" />
      <rect x="-26" y="48" width="34" height="42" fill="#22863A" />
      <rect x="-22" y="62" width="14" height="16" fill="#1A6B2A" />
      <rect x="-22" y="62" width="14" height="3" fill="#C8A020" />

      {/* ── Ears (outer) ── */}
      <rect x="12" y="0" width="12" height="16" fill="#4A2A0E" />
      <rect x="48" y="0" width="12" height="16" fill="#4A2A0E" />
      {/* Inner ear — pink, above y=8 so the head block doesn't cover it */}
      <rect x="14" y="1" width="8" height="7" fill="#FFB3C6" />
      <rect x="50" y="1" width="8" height="7" fill="#FFB3C6" />

      {/* ── Head ── */}
      <rect x="8" y="8" width="56" height="40" fill="#7B5230" />
      <rect x="16" y="16" width="40" height="24" fill="#C8956B" />
      {/* Cheeks */}
      <rect x="16" y="28" width="10" height="6" fill="#FFB3C6" opacity="0.6" />
      <rect x="46" y="28" width="10" height="6" fill="#FFB3C6" opacity="0.6" />
      {/* Eyes */}
      <rect x="16" y="16" width="10" height="10" fill="#1A1A1A" />
      <rect x="46" y="16" width="10" height="10" fill="#1A1A1A" />
      {/* Nose */}
      <rect x="27" y="30" width="18" height="8" fill="#1A1A1A" />

      {/* ── Body ── */}
      <rect x="8" y="48" width="56" height="40" fill="#7B5230" />
      <rect x="16" y="56" width="40" height="24" fill="#C8956B" />

      {/* ── Left arm — static ── */}
      <rect x="0" y="48" width="8" height="32" fill="#4A2A0E" />
      <rect x="6" y="48" width="2" height="32" fill="#22863A" opacity="0.8" />

      {/* ── Right arm — waves on hover; pivot at shoulder (68,48) ── */}
      <g className="bear-arm-wave" style={{ transformOrigin: '68px 48px' }}>
        <rect x="64" y="48" width="8" height="32" fill="#4A2A0E" />
      </g>
      {/* Strap stays static — not inside the wave group */}
      <rect x="64" y="48" width="2" height="32" fill="#22863A" opacity="0.8" />

      {/* ── Legs ── */}
      <rect x="8" y="88" width="22" height="24" fill="#4A2A0E" />
      <rect x="42" y="88" width="22" height="24" fill="#4A2A0E" />
    </svg>
  )
}

// ─── Bear Logo — pixel-art face, used in navbar + footer ─────────────────────
export function BearLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      shapeRendering="crispEdges"
      style={{ flexShrink: 0, imageRendering: 'pixelated' }}
    >
      {/* Outer ears */}
      <rect x="1" y="0" width="3" height="3" fill="#4A2A0E" />
      <rect x="12" y="0" width="3" height="3" fill="#4A2A0E" />
      {/* Inner ears — pink, kept above y=2 so head doesn't cover them */}
      <rect x="2" y="0" width="2" height="2" fill="#FFB3C6" />
      <rect x="12" y="0" width="2" height="2" fill="#FFB3C6" />
      {/* Head */}
      <rect x="1" y="2" width="14" height="12" fill="#7B5230" />
      {/* Face */}
      <rect x="4" y="5" width="8" height="6" fill="#C8956B" />
      {/* Cheeks — lighter pink */}
      <rect x="4" y="9" width="2" height="1" fill="#FFB3C6" opacity="0.7" />
      <rect x="10" y="9" width="2" height="1" fill="#FFB3C6" opacity="0.7" />
      {/* Eyes */}
      <rect x="4" y="5" width="2" height="2" fill="#1A1A1A" />
      <rect x="10" y="5" width="2" height="2" fill="#1A1A1A" />
      {/* Nose */}
      <rect x="6" y="8" width="4" height="2" fill="#1A1A1A" />
    </svg>
  )
}
