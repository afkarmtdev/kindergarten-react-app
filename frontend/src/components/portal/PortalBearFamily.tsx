// Bear family — two parent bears flanking a smaller cub — pixel-art style matching AdminBearIcon
// viewBox 76x30: papa (left, blazer+tie) | cub (center, orange tee, forward) | mama (right, blazer+bow, eyelashes)
// Same brown palette (#7B5230, #C8956B, #4A2A0E) as AdminBearIcon

export function PortalBearFamily({ size = 96 }: { size?: number }) {
  const w = 76
  const h = 30
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * (h / w)}
      shapeRendering="crispEdges"
    >
      {/* ── Papa bear (left, eyes look right toward cub) ── */}
      <g transform="translate(0,2)">
        {/* Ears */}
        <rect x="2" y="0" width="4" height="5" fill="#4A2A0E" />
        <rect x="18" y="0" width="4" height="5" fill="#4A2A0E" />
        <rect x="3" y="0" width="2" height="3" fill="#FFB3C6" />
        <rect x="19" y="0" width="2" height="3" fill="#FFB3C6" />
        {/* Head */}
        <rect x="2" y="3" width="20" height="15" fill="#7B5230" />
        {/* Muzzle */}
        <rect x="5" y="8" width="14" height="8" fill="#C8956B" />
        {/* Eyes — shifted 1px right (looking toward cub) */}
        <rect x="6" y="8" width="3" height="3" fill="#1A1A1A" />
        <rect x="17" y="8" width="3" height="3" fill="#1A1A1A" />
        {/* Nose */}
        <rect x="9" y="12" width="6" height="2" fill="#1A1A1A" />
        {/* Cheeks */}
        <rect x="5" y="12" width="3" height="2" fill="#FFB3C6" opacity="0.7" />
        <rect x="16" y="12" width="3" height="2" fill="#FFB3C6" opacity="0.7" />
        {/* White shirt */}
        <rect x="0" y="18" width="24" height="8" fill="white" />
        {/* Blazer */}
        <rect x="0" y="18" width="8" height="8" fill="#1E2B4A" />
        <rect x="16" y="18" width="8" height="8" fill="#1E2B4A" />
        {/* Left lapel */}
        <rect x="5" y="18" width="3" height="1" fill="white" />
        <rect x="6" y="19" width="2" height="1" fill="white" />
        <rect x="7" y="20" width="1" height="1" fill="white" />
        {/* Right lapel */}
        <rect x="16" y="18" width="3" height="1" fill="white" />
        <rect x="16" y="19" width="2" height="1" fill="white" />
        <rect x="16" y="20" width="1" height="1" fill="white" />
        {/* Blue tie */}
        <rect x="9" y="18" width="6" height="3" fill="#4D96FF" />
        <rect x="10" y="21" width="4" height="4" fill="#4D96FF" />
        <rect x="11" y="25" width="2" height="1" fill="#4D96FF" />
        {/* Tie stripes */}
        <rect x="14" y="18" width="1" height="1" fill="white" opacity="0.4" />
        <rect x="13" y="19" width="1" height="1" fill="white" opacity="0.4" />
        <rect x="12" y="20" width="1" height="1" fill="white" opacity="0.4" />
        <rect x="11" y="21" width="1" height="1" fill="white" opacity="0.4" />
        <rect x="13" y="21" width="1" height="1" fill="white" opacity="0.4" />
        <rect x="12" y="22" width="1" height="1" fill="white" opacity="0.4" />
        <rect x="11" y="23" width="1" height="1" fill="white" opacity="0.4" />
        <rect x="10" y="24" width="1" height="1" fill="white" opacity="0.4" />
      </g>

      {/* ── Cub (center, shorter, stands forward) ── */}
      <g transform="translate(27,8)">
        {/* Ears */}
        <rect x="2" y="0" width="3" height="4" fill="#4A2A0E" />
        <rect x="17" y="0" width="3" height="4" fill="#4A2A0E" />
        <rect x="3" y="0" width="1" height="2" fill="#FFB3C6" />
        <rect x="18" y="0" width="1" height="2" fill="#FFB3C6" />
        {/* Head */}
        <rect x="2" y="2" width="18" height="12" fill="#7B5230" />
        {/* Muzzle */}
        <rect x="5" y="7" width="12" height="6" fill="#C8956B" />
        {/* Eyes — looking forward */}
        <rect x="5" y="7" width="3" height="3" fill="#1A1A1A" />
        <rect x="14" y="7" width="3" height="3" fill="#1A1A1A" />
        {/* Nose */}
        <rect x="8" y="11" width="6" height="2" fill="#1A1A1A" />
        {/* Cheeks */}
        <rect x="5" y="11" width="2" height="2" fill="#FFB3C6" opacity="0.7" />
        <rect x="15" y="11" width="2" height="2" fill="#FFB3C6" opacity="0.7" />
        {/* Orange t-shirt */}
        <rect x="1" y="14" width="20" height="8" fill="#FF6B35" />
        {/* Neckline (lighter) */}
        <rect x="8" y="14" width="6" height="1" fill="#FF8C5A" />
        {/* Sleeves (darker) */}
        <rect x="1" y="14" width="3" height="5" fill="#E85D2A" />
        <rect x="18" y="14" width="3" height="5" fill="#E85D2A" />
      </g>

      {/* ── Mama bear (right, eyes look left toward cub, eyelashes + bow) ── */}
      <g transform="translate(52,2)">
        {/* Ears */}
        <rect x="2" y="0" width="4" height="5" fill="#4A2A0E" />
        <rect x="18" y="0" width="4" height="5" fill="#4A2A0E" />
        <rect x="3" y="0" width="2" height="3" fill="#FFB3C6" />
        <rect x="19" y="0" width="2" height="3" fill="#FFB3C6" />
        {/* Head */}
        <rect x="2" y="3" width="20" height="15" fill="#7B5230" />
        {/* Muzzle */}
        <rect x="5" y="8" width="14" height="8" fill="#C8956B" />
        {/* Eyes — shifted 1px left (looking toward cub) */}
        <rect x="4" y="8" width="3" height="3" fill="#1A1A1A" />
        <rect x="15" y="8" width="3" height="3" fill="#1A1A1A" />
        {/* Eyelashes */}
        <rect x="4" y="7" width="1" height="1" fill="#1A1A1A" />
        <rect x="6" y="7" width="1" height="1" fill="#1A1A1A" />
        <rect x="15" y="7" width="1" height="1" fill="#1A1A1A" />
        <rect x="17" y="7" width="1" height="1" fill="#1A1A1A" />
        {/* Nose */}
        <rect x="9" y="12" width="6" height="2" fill="#1A1A1A" />
        {/* Cheeks */}
        <rect x="5" y="12" width="3" height="2" fill="#FFB3C6" opacity="0.7" />
        <rect x="16" y="12" width="3" height="2" fill="#FFB3C6" opacity="0.7" />
        {/* White blouse */}
        <rect x="0" y="18" width="24" height="8" fill="white" />
        {/* Blazer */}
        <rect x="0" y="18" width="8" height="8" fill="#1E2B4A" />
        <rect x="16" y="18" width="8" height="8" fill="#1E2B4A" />
        {/* Left lapel */}
        <rect x="5" y="18" width="3" height="1" fill="white" />
        <rect x="6" y="19" width="2" height="1" fill="white" />
        <rect x="7" y="20" width="1" height="1" fill="white" />
        {/* Right lapel */}
        <rect x="16" y="18" width="3" height="1" fill="white" />
        <rect x="16" y="19" width="2" height="1" fill="white" />
        <rect x="16" y="20" width="1" height="1" fill="white" />
        {/* Pink bow brooch at collar */}
        <rect x="9" y="18" width="6" height="2" fill="#FF85A2" />
        <rect x="10" y="20" width="4" height="1" fill="#FF85A2" />
        <rect x="11" y="18" width="2" height="1" fill="white" opacity="0.3" />
        {/* White blouse below bow */}
        <rect x="10" y="21" width="4" height="5" fill="white" />
      </g>
    </svg>
  )
}

// Standalone cub icon for the portal header
// viewBox 22x22: cub head + orange tee
export function PortalBearCub({ size = 24 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 22 22"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      shapeRendering="crispEdges"
    >
      {/* Ears */}
      <rect x="2" y="0" width="3" height="4" fill="#4A2A0E" />
      <rect x="17" y="0" width="3" height="4" fill="#4A2A0E" />
      <rect x="3" y="0" width="1" height="2" fill="#FFB3C6" />
      <rect x="18" y="0" width="1" height="2" fill="#FFB3C6" />
      {/* Head */}
      <rect x="2" y="2" width="18" height="12" fill="#7B5230" />
      {/* Muzzle */}
      <rect x="5" y="7" width="12" height="6" fill="#C8956B" />
      {/* Eyes */}
      <rect x="5" y="7" width="3" height="3" fill="#1A1A1A" />
      <rect x="14" y="7" width="3" height="3" fill="#1A1A1A" />
      {/* Nose */}
      <rect x="8" y="11" width="6" height="2" fill="#1A1A1A" />
      {/* Cheeks */}
      <rect x="5" y="11" width="2" height="2" fill="#FFB3C6" opacity="0.7" />
      <rect x="15" y="11" width="2" height="2" fill="#FFB3C6" opacity="0.7" />
      {/* Orange t-shirt */}
      <rect x="1" y="14" width="20" height="8" fill="#FF6B35" />
      {/* Neckline */}
      <rect x="8" y="14" width="6" height="1" fill="#FF8C5A" />
      {/* Sleeves */}
      <rect x="1" y="14" width="3" height="5" fill="#E85D2A" />
      <rect x="18" y="14" width="3" height="5" fill="#E85D2A" />
    </svg>
  )
}
