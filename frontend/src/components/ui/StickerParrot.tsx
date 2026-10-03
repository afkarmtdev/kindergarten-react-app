// Sticker parrot "Little seed" — the KinderCare mascot since October 2026, in
// the Tadika Arif Ilmu logo's colours: royal blue head, a white two-lobed face
// mask, an orange hooked beak, a seedling sprouting from the crown and a bow of
// two leaves under the chin. Built on the sticker bear's exact grid (viewBox
// 32x32, head circle (16,17) r10.5, white die-cut edge, the bear's eyes) so it
// takes the same props and every gaze and doze state carries over; the archived
// bear is StickerBear.tsx. Same drawing as the landing-page cursor in index.css
// (.cursor-mascot). Import it through Mascot.tsx, never directly.
//
//   eyeState  open (default) | half (sleepy) | closed (asleep)
//   mood      smile (default) | grin (happy arc eyes, beak open, the "hover" cursor)
//   bowColor  leaf colour, any CSS colour; orange by default, blue on orange tiles
//             (admin). The knot is orange on blue leaves and blue on anything else.
//   tilt      degrees, -8 by default like the cursor; 0 for perfectly upright
//   outline   white die-cut edge; pass false only on white backgrounds
//   lashes    two small eyelashes per eye (mama in the portal family)
//   gaze      where the pupils look, x/y in -1..1 (open eyes only); 0,0 is
//             straight ahead. The login pages use it to follow the caret.
//   cap       'nightcap' swaps the sprout for a floppy sleeping cap with two
//             sparkles on it (dark mode). It settles in with the bear-cap-settle
//             animation from index.css whenever it mounts.
//   capColor  cap fill; defaults to the head blue (with orange sparkles), as in
//             the approved drawing, whatever the bow colour.
//   flag      'malaysia' raises a wing from behind the head holding the Jalur
//             Gemilang, waved a few times on mount (bear-flag-wave in
//             index.css). Every mascot gets it for Malaysia Day week via useMalaysiaDay.

export type ParrotEyeState = 'open' | 'half' | 'closed'
export type ParrotMood = 'smile' | 'grin'
export interface ParrotGaze {
  x: number
  y: number
}
export type ParrotCap = 'none' | 'nightcap'
export type ParrotFlag = 'none' | 'malaysia'

// How far (in viewBox units) a pupil may slide from centre at gaze 1.
const GAZE_RANGE = 1.1
const clampGaze = (n: number) => Math.max(-1, Math.min(1, n))

// Palette sampled from the school logo: royal blue, orange, white, navy ink.
const BLUE = '#1A50A8'
const ORANGE = '#F86705'
const ORANGE_SHADE = '#CF5200'
const INK = '#10213F'
const MASK = '#ffffff'
const BLUSH = '#FF9F6E'
const MOUTH = '#5A1E22'
const TONGUE = '#FF8A7A'
// The flag wing sits a shade darker than the head so it reads as behind it;
// its round tip is head blue so the grip on the pole stands out.
const WING = '#123C80'
export const PARROT_BOW_ORANGE = ORANGE
export const PARROT_BOW_BLUE = BLUE
export const PARROT_BOW_PINK = '#FF85A2'

// Orange on the logo blue, blue on anything else: the bow knot against its
// leaves and the cap sparkles against the cap.
function accentOn(fill: string) {
  return fill.toUpperCase() === BLUE ? ORANGE : BLUE
}

// Leaves are the logo's teardrop (round belly, pointed tip, never veined),
// drawn with the round base on (0, 0) and the tip straight up, then moved
// into place by `transform`. Path strings are precomputed per length x width.
interface Leaf {
  d: string
  transform: string
}

// Sprout: a blue stem rising out of the crown, a 5.6 x 4 leaf leaning left
// and a 6 x 4.2 leaf reaching up to the right. Hidden under the nightcap.
const SPROUT_STEM = 'M16 9.4 C16 6.8 16.5 4.9 17.3 3.4'
const SPROUT_LEAVES: Leaf[] = [
  {
    d: 'M0 0 C-2.2 -0.84 -2.48 -3.47 0 -5.6 C2.48 -3.47 2.2 -0.84 0 0 Z',
    transform: 'translate(17.2 3.6) rotate(-66)',
  },
  {
    d: 'M0 0 C-2.31 -0.9 -2.6 -3.72 0 -6 C2.6 -3.72 2.31 -0.9 0 0 Z',
    transform: 'translate(17.4 3.4) rotate(46)',
  },
]

// Bow: two 6.6 x 4.6 leaves pointing out either side of a round knot.
const BOW_LEAF = 'M0 0 C-2.53 -0.99 -2.85 -4.09 0 -6.6 C2.85 -4.09 2.53 -0.99 0 0 Z'
const BOW_LEAVES: Leaf[] = [
  { d: BOW_LEAF, transform: 'translate(15.2 28) rotate(-84)' },
  { d: BOW_LEAF, transform: 'translate(16.8 28) rotate(84)' },
]

// Face mask: two overlapping white lobes around the eyes (bare skin, like a macaw).
const MASK_LOBES = [
  { cx: 12.2, cy: 16.7, rx: 4.3, ry: 3.9, transform: 'rotate(16 12.2 16.7)' },
  { cx: 19.8, cy: 16.7, rx: 4.3, ry: 3.9, transform: 'rotate(-16 19.8 16.7)' },
]

// Hooked beak, drawn full size and scaled 0.92 about the head centre. The grin
// drops the navy lower jaw open (mouth and tongue show) and squashes the upper
// beak up a little; the nostrils ride up with it.
const BEAK_TRANSFORM = 'translate(16 17) scale(0.92) translate(-16 -17)'
const BEAK_UPPER =
  'M13.4 18.1 C13.4 16.6 18.6 16.6 18.6 18.1 C18.6 21.1 17.3 23.3 14.8 23.8 C14.2 23.9 13.9 23.4 14.3 23 C15.3 22.2 15.5 21 14.7 20.2 C13.9 19.5 13.4 18.9 13.4 18.1 Z'
const BEAK_UPPER_SHADE =
  'M17.2 16.95 C18.1 17.15 18.6 17.5 18.6 18.1 C18.6 21.1 17.3 23.3 14.8 23.8 C16.4 22.9 17.5 21.2 17.6 19 C17.62 18.1 17.5 17.4 17.2 16.95 Z'
const BEAK_LOWER = { cx: 16.5, cy: 22.1, rx: 2.2, ry: 1.6 }
const GRIN_JAW = 'M13.4 20.8 C13.4 24.3 14.6 25.6 16 25.6 C17.4 25.6 18.6 24.3 18.6 20.8 Z'
const GRIN_MOUTH = { cx: 16, cy: 22.3, rx: 2.1, ry: 2.15 }
const GRIN_TONGUE = { cx: 16, cy: 23.6, rx: 1.3, ry: 0.9 }
const GRIN_UPPER_TRANSFORM = 'translate(16 16.6) scale(1 0.8) translate(-16 -16.6)'

// Nightcap: the bear's cap, unchanged. The cone rises from the brim, folds over
// to the right, pompom at the tip; the brim follows the top of the head.
const CAP_CONE =
  'M7.5 9.6 C9.5 4.5 13 1.2 17 1.4 C21 1.6 24 2.4 28.2 3.2 C25 5.2 22.5 5.6 20.4 6 C22.5 7.4 24 8.6 24.5 9.6 Z'
const CAP_BRIM = 'M6.5 10.4 Q16 7.2 25.5 10.4 L25.5 12.4 Q16 9.2 6.5 12.4 Z'
const CAP_POM = { cx: 28.4, cy: 3.2, r: 2.3 }

// Four-point sparkle centred on (x, y) with radius r.
function sparklePath(x: number, y: number, r: number) {
  return `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`
}
const CAP_SPARKLES = [sparklePath(13.6, 5.6, 1.3), sparklePath(19.2, 3.6, 0.95)]

// Flag wing: the bear's raised arm as a wing. Drawn before the sprout, head and
// bow so the shoulder hides behind them: it starts under the bow at the bottom
// right of the head, reaches out sideways and bends up beside the cheek, where
// a round wing tip (the bear's paw, without the pad) grips the pole. The pole
// and the Jalur Gemilang are the bear's: the pole leans 13deg and the flag
// hangs off its top in a rotated local frame (x along the fly, y down the
// hoist) so the flag itself is plain axis-aligned rects. The wave rotates
// about the shoulder, so keep the start of ARM_PATH in sync with the
// .bear-flag-wave transform-origin in index.css; it must stay behind the bow
// or the root shows mid-wave.
const ARM_PATH = 'M19.5 27 C25 28.5 30.5 25.5 30.2 18.8'
const ARM_WIDTH = 3.4
const WING_TIP = { cx: 30.2, cy: 18.8, r: 2.4 }
const POLE = { x1: 29.6, y1: 21.4, x2: 32.9, y2: 7 }
const POLE_COLOR = '#8B5A2B'
const FLAG_TRANSFORM = `translate(${POLE.x2} ${POLE.y2}) rotate(13)`
const FLAG_W = 9
const FLAG_H = 5.6
const FLAG_STRIPES = 14
const FLAG_RED = '#CC0001'
const FLAG_BLUE = '#010066'
const FLAG_YELLOW = '#FFCC00'
const STRIPE_H = FLAG_H / FLAG_STRIPES
// Canton covers the top seven stripes and half the fly, like the real flag.
const CANTON = { w: FLAG_W / 2, h: STRIPE_H * 7 }

// Fourteen-point star (one point per state and territory) centred on (cx, cy).
function starPoints(cx: number, cy: number, outer: number, inner: number, points = 14) {
  const pts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / points
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}
const FLAG_STAR = starPoints(3.15, 1.4, 0.85, 0.42)

interface StickerParrotProps {
  size?: number
  eyeState?: ParrotEyeState
  mood?: ParrotMood
  bowColor?: string
  tilt?: number
  outline?: boolean
  outlineColor?: string
  lashes?: boolean
  gaze?: ParrotGaze
  cap?: ParrotCap
  capColor?: string
  flag?: ParrotFlag
  className?: string
}

export function StickerParrot({
  size = 32,
  eyeState = 'open',
  mood = 'smile',
  bowColor = PARROT_BOW_ORANGE,
  tilt = -8,
  outline = true,
  outlineColor = '#ffffff',
  lashes = false,
  gaze,
  cap = 'none',
  capColor,
  flag = 'none',
  className,
}: StickerParrotProps) {
  const happy = mood === 'grin'
  const sprout = cap !== 'nightcap'
  const capFill = capColor ?? BLUE
  const gazeX = clampGaze(gaze?.x ?? 0) * GAZE_RANGE
  const gazeY = clampGaze(gaze?.y ?? 0) * GAZE_RANGE

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      aria-hidden="true"
      className={className}
    >
      <g transform={tilt !== 0 ? `rotate(${tilt} 16 16)` : undefined}>
        {/* Die-cut sticker edge */}
        {outline && (
          <>
            {sprout && (
              <>
                <path
                  d={SPROUT_STEM}
                  fill="none"
                  stroke={outlineColor}
                  strokeWidth="4.6"
                  strokeLinecap="round"
                />
                {SPROUT_LEAVES.map((leaf) => (
                  <path
                    key={leaf.transform}
                    {...leaf}
                    fill={outlineColor}
                    stroke={outlineColor}
                    strokeWidth="3.6"
                    strokeLinejoin="round"
                  />
                ))}
              </>
            )}
            <circle cx="16" cy="17" r="12.3" fill={outlineColor} />
            {BOW_LEAVES.map((leaf) => (
              <path
                key={leaf.transform}
                {...leaf}
                fill={outlineColor}
                stroke={outlineColor}
                strokeWidth="3"
                strokeLinejoin="round"
              />
            ))}
          </>
        )}

        {/* Flag wing — before the sprout, head and bow so the shoulder hides behind them */}
        {flag === 'malaysia' && (
          <g className="bear-flag-wave">
            {outline && (
              <>
                <path
                  d={ARM_PATH}
                  fill="none"
                  stroke={outlineColor}
                  strokeWidth={ARM_WIDTH + 3}
                  strokeLinecap="round"
                />
                <line {...POLE} stroke={outlineColor} strokeWidth="4.3" strokeLinecap="round" />
                <g transform={FLAG_TRANSFORM}>
                  <rect
                    width={FLAG_W}
                    height={FLAG_H}
                    fill={outlineColor}
                    stroke={outlineColor}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </g>
                <circle
                  cx={WING_TIP.cx}
                  cy={WING_TIP.cy}
                  r={WING_TIP.r + 1.5}
                  fill={outlineColor}
                />
              </>
            )}
            <path
              d={ARM_PATH}
              fill="none"
              stroke={WING}
              strokeWidth={ARM_WIDTH}
              strokeLinecap="round"
            />
            <line {...POLE} stroke={POLE_COLOR} strokeWidth="1.3" strokeLinecap="round" />
            <g transform={FLAG_TRANSFORM}>
              {Array.from({ length: FLAG_STRIPES }, (_, i) => (
                <rect
                  key={i}
                  y={i * STRIPE_H}
                  width={FLAG_W}
                  height={STRIPE_H + 0.02}
                  fill={i % 2 === 0 ? FLAG_RED : '#ffffff'}
                />
              ))}
              <rect width={CANTON.w} height={CANTON.h} fill={FLAG_BLUE} />
              <circle cx="1.45" cy="1.4" r="0.95" fill={FLAG_YELLOW} />
              <circle cx="1.82" cy="1.24" r="0.8" fill={FLAG_BLUE} />
              <polygon points={FLAG_STAR} fill={FLAG_YELLOW} />
            </g>
            <circle {...WING_TIP} fill={BLUE} />
          </g>
        )}

        {/* Sprout — leaves overlap, so each gets a thin seam in the edge colour */}
        {sprout && (
          <>
            <path
              d={SPROUT_STEM}
              fill="none"
              stroke={BLUE}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {SPROUT_LEAVES.map((leaf) => (
              <path
                key={leaf.transform}
                {...leaf}
                fill={ORANGE}
                stroke={outlineColor}
                strokeWidth="0.9"
                strokeLinejoin="round"
              />
            ))}
          </>
        )}

        {/* Head + face mask */}
        <circle cx="16" cy="17" r="10.5" fill={BLUE} />
        {MASK_LOBES.map((lobe) => (
          <ellipse key={lobe.cx} {...lobe} fill={MASK} />
        ))}

        {/* Nightcap — after the face mask so the brim sits on top of it */}
        {cap === 'nightcap' && (
          <g className="bear-cap-settle">
            {outline && (
              <>
                <path
                  d={CAP_CONE}
                  fill={capFill}
                  stroke={outlineColor}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d={CAP_BRIM}
                  fill="#ffffff"
                  stroke={outlineColor}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <circle {...CAP_POM} fill="#ffffff" stroke={outlineColor} strokeWidth="3" />
              </>
            )}
            <path d={CAP_CONE} fill={capFill} />
            {CAP_SPARKLES.map((d) => (
              <path key={d} d={d} fill={accentOn(capFill)} />
            ))}
            <path d={CAP_BRIM} fill="#ffffff" />
            <circle {...CAP_POM} fill="#ffffff" />
          </g>
        )}

        {/* Bow */}
        {BOW_LEAVES.map((leaf) => (
          <path key={leaf.transform} {...leaf} fill={bowColor} />
        ))}
        <circle
          cx="16"
          cy="28"
          r="1.8"
          fill={accentOn(bowColor)}
          stroke={outline ? outlineColor : 'none'}
          strokeWidth="1"
        />

        {/* Cheeks — inside the white mask so the blush never muddies on blue */}
        <circle cx="10.8" cy="18.9" r="1.3" fill={BLUSH} opacity="0.6" />
        <circle cx="21.2" cy="18.9" r="1.3" fill={BLUSH} opacity="0.6" />

        {/* Eyes */}
        {happy ? (
          <path
            d="M10.6 16q1.4-2.2 2.8 0M18.6 16q1.4-2.2 2.8 0"
            fill="none"
            stroke={INK}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        ) : eyeState === 'closed' ? (
          <path
            d="M10.6 15.6q1.4 1.6 2.8 0M18.6 15.6q1.4 1.6 2.8 0"
            fill="none"
            stroke={INK}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        ) : eyeState === 'half' ? (
          <>
            <ellipse cx="12" cy="16" rx="1.4" ry="0.8" fill={INK} />
            <ellipse cx="20" cy="16" rx="1.4" ry="0.8" fill={INK} />
          </>
        ) : (
          <g
            style={{
              transform: `translate(${gazeX}px, ${gazeY}px)`,
              transition: 'transform 160ms ease-out',
            }}
          >
            <circle cx="12" cy="15.5" r="1.4" fill={INK} />
            <circle cx="20" cy="15.5" r="1.4" fill={INK} />
          </g>
        )}
        {lashes && (
          <path
            d="M10.4 14.6l-1 -0.9M10.9 13.9l-0.7 -1.1M21.6 14.6l1 -0.9M21.1 13.9l0.7 -1.1"
            fill="none"
            stroke={INK}
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        )}

        {/* Beak — closed, or open in a grin */}
        <g transform={BEAK_TRANSFORM}>
          {happy ? (
            <>
              <path d={GRIN_JAW} fill={INK} />
              <ellipse {...GRIN_MOUTH} fill={MOUTH} />
              <ellipse {...GRIN_TONGUE} fill={TONGUE} />
              <g transform={GRIN_UPPER_TRANSFORM}>
                <path d={BEAK_UPPER} fill={ORANGE} />
                <path d={BEAK_UPPER_SHADE} fill={ORANGE_SHADE} />
              </g>
            </>
          ) : (
            <>
              <ellipse {...BEAK_LOWER} fill={INK} />
              <path d={BEAK_UPPER} fill={ORANGE} />
              <path d={BEAK_UPPER_SHADE} fill={ORANGE_SHADE} />
            </>
          )}
          <ellipse cx="15.05" cy={happy ? 17.25 : 17.6} rx="0.42" ry="0.32" fill={ORANGE_SHADE} />
          <ellipse cx="16.95" cy={happy ? 17.25 : 17.6} rx="0.42" ry="0.32" fill={ORANGE_SHADE} />
        </g>
      </g>
    </svg>
  )
}
