/**
 * Small top-down ladybird with a dotted loop-the-loop flight trail behind it.
 * Same line-art style as the other doodles. The bug group is drawn centred on
 * its own origin so index.css can fly it along LADYBIRD_TRAIL with a CSS
 * motion path while the FloatingDoodle wrapper marks it .doodle-live (near the
 * viewport). The dotted trail sits behind a mask whose reveal path is drawn in
 * step with the bug, so the line only appears where the bug has already been.
 * Without motion-path support, or off-screen, the bug rests at the end of the
 * full trail.
 */
import { useId } from 'react'

export const LADYBIRD_TRAIL = 'M4 44 C10 30 20 28 24 34 C28 40 18 44 16 38 C14 32 26 24 34 20'

export function DoodleLadybird({
  size = 48,
  color = '#FF6B35',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  // useId includes colons, which are awkward inside url(#...) references
  const maskId = `ladybird-trail-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg
      width={size}
      height={size * (62 / 76)}
      // Padded around the trail so the bug (legs included) never meets an edge
      // at either end of its flight.
      viewBox="-12 -2 76 62"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`doodle-ladybird ${className}`.trim()}
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-12" y="-2" width="76" height="62">
          {/* pathLength=100 so a dashoffset of 100 hides the whole trail and 0 shows it */}
          <path
            className="trail-reveal"
            d={LADYBIRD_TRAIL}
            pathLength="100"
            stroke="#fff"
            strokeWidth="4"
          />
          {/* Black hole that rides with the bug so the trail stops at its rim instead of
              showing through the outline-only body */}
          <circle className="bug-hole" r="10.5" fill="#000" stroke="none" />
        </mask>
      </defs>
      {/* dotted flight trail with a loop, revealed behind the bug */}
      <path className="trail" d={LADYBIRD_TRAIL} strokeDasharray="3 3" mask={`url(#${maskId})`} />
      {/* the ladybird, top-down, centred on the group origin */}
      <g className="bug">
        <g transform="translate(-24 -27)">
          {/* head + antennae */}
          <path d="M18.5 12 A6 6 0 0 1 29.5 12" />
          <path d="M20 6 L17 1" />
          <path d="M28 6 L31 1" />
          {/* body with the wing split */}
          <circle cx="24" cy="27" r="16" />
          <path d="M24 11 V43" />
          {/* spots */}
          <circle cx="16" cy="23" r="2.2" />
          <circle cx="32" cy="23" r="2.2" />
          <circle cx="18" cy="34" r="2" />
          <circle cx="30" cy="34" r="2" />
          {/* legs */}
          <path d="M9 22 L4 19" />
          <path d="M8 30 L3 31" />
          <path d="M12 38 L8 42" />
          <path d="M39 22 L44 19" />
          <path d="M40 30 L45 31" />
          <path d="M36 38 L40 42" />
        </g>
      </g>
    </svg>
  )
}
