// Sticker teddy — the KinderCare mascot. Same drawing as the landing-page bear
// cursor in index.css (.cursor-bear): round fur-brown head, peach muzzle, pink
// cheeks, a bow under the chin and a white die-cut edge so it reads as a sticker
// on any background. viewBox 32x32, drawn once here and reused everywhere
// (admin sidebar, login, landing logo, portal, 404).
//
//   eyeState  open (default) | half (sleepy) | closed (asleep)
//   mood      smile (default) | grin (happy arc eyes + tongue, the "hover" cursor)
//   bowColor  any CSS colour; orange by default, blue on orange tiles (admin)
//   tilt      degrees, -8 by default like the cursor; 0 for perfectly upright
//   outline   white die-cut edge; pass false only on white backgrounds
//   lashes    two small eyelashes per eye (mama bear in the portal family)
//   gaze      where the pupils look, x/y in -1..1 (open eyes only); 0,0 is
//             straight ahead. The login pages use it to follow the caret.
//   cap       'nightcap' draws a floppy sleeping cap with two sparkles on it
//             (admin bear in dark mode). It settles in with the bear-cap-settle
//             animation from index.css whenever it mounts.
//   capColor  cap fill; defaults to the bow colour so it matches the tile.
//   flag      'malaysia' raises a paw from behind the head holding the Jalur
//             Gemilang, waved a few times on mount (bear-flag-wave in
//             index.css). Every bear gets it for Malaysia Day week via useMalaysiaDay.

export type BearEyeState = 'open' | 'half' | 'closed'
export type BearMood = 'smile' | 'grin'
export interface BearGaze {
  x: number
  y: number
}
export type BearCap = 'none' | 'nightcap'
export type BearFlag = 'none' | 'malaysia'

// How far (in viewBox units) a pupil may slide from centre at gaze 1.
const GAZE_RANGE = 1.1
const clampGaze = (n: number) => Math.max(-1, Math.min(1, n))

const FUR = '#C68B59'
const EAR = '#A86B3C'
const EAR_INNER = '#E8A87C'
const MUZZLE = '#F3D3B0'
const INK = '#2B1B10'
const CHEEK = '#FF85A2'
export const BEAR_BOW_ORANGE = '#FF6B35'
export const BEAR_BOW_BLUE = '#4D96FF'
export const BEAR_BOW_PINK = '#FF85A2'

const BOW_LEFT = '9,25.5 15,28 9,30.5'
const BOW_RIGHT = '23,25.5 17,28 23,30.5'

// Nightcap: cone rises from the brim, folds over to the right, pompom at the
// tip. The brim follows the top of the head so the ears poke out either side.
const CAP_CONE =
  'M7.5 9.6 C9.5 4.5 13 1.2 17 1.4 C21 1.6 24 2.4 28.2 3.2 C25 5.2 22.5 5.6 20.4 6 C22.5 7.4 24 8.6 24.5 9.6 Z'
const CAP_BRIM = 'M6.5 10.4 Q16 7.2 25.5 10.4 L25.5 12.4 Q16 9.2 6.5 12.4 Z'
const CAP_POM = { cx: 28.4, cy: 3.2, r: 2.3 }
const CAP_STAR = '#FFD93D'

// Four-point sparkle centred on (x, y) with radius r.
function sparklePath(x: number, y: number, r: number) {
  return `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`
}
const CAP_SPARKLES = [sparklePath(13.6, 5.6, 1.3), sparklePath(19.2, 3.6, 0.95)]

// Flag arm: drawn before the ears and head so the shoulder disappears behind
// the head and the paw pokes out past the right ear. The pole leans 13deg and
// the flag hangs off its top in a rotated local frame (x along the fly, y down
// the hoist) so the Jalur Gemilang itself is plain axis-aligned rects.
const ARM_PATH = 'M21.5 19.5 C25.5 19.6 28.6 17.6 29.6 13.6'
const ARM_WIDTH = 3.4
const PAW = { cx: 29.6, cy: 13.4, r: 2.4 }
const POLE = { x1: 28.9, y1: 16.2, x2: 32.2, y2: 2 }
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

interface StickerBearProps {
  size?: number
  eyeState?: BearEyeState
  mood?: BearMood
  bowColor?: string
  tilt?: number
  outline?: boolean
  outlineColor?: string
  lashes?: boolean
  gaze?: BearGaze
  cap?: BearCap
  capColor?: string
  flag?: BearFlag
  className?: string
}

export function StickerBear({
  size = 32,
  eyeState = 'open',
  mood = 'smile',
  bowColor = BEAR_BOW_ORANGE,
  tilt = -8,
  outline = true,
  outlineColor = '#ffffff',
  lashes = false,
  gaze,
  cap = 'none',
  capColor,
  flag = 'none',
  className,
}: StickerBearProps) {
  const happy = mood === 'grin'
  const capFill = capColor ?? bowColor
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
            <circle cx="7.5" cy="8.5" r="5.8" fill={outlineColor} />
            <circle cx="24.5" cy="8.5" r="5.8" fill={outlineColor} />
            <circle cx="16" cy="17" r="12.3" fill={outlineColor} />
            <polygon
              points={BOW_LEFT}
              fill={bowColor}
              stroke={outlineColor}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <polygon
              points={BOW_RIGHT}
              fill={bowColor}
              stroke={outlineColor}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Flag arm — before the ears and head so the shoulder hides behind them */}
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
                <circle cx={PAW.cx} cy={PAW.cy} r={PAW.r + 1.5} fill={outlineColor} />
              </>
            )}
            <path
              d={ARM_PATH}
              fill="none"
              stroke={FUR}
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
            <circle cx={PAW.cx} cy={PAW.cy} r={PAW.r} fill={FUR} />
            <circle cx={PAW.cx} cy={PAW.cy} r="0.95" fill={EAR_INNER} />
          </g>
        )}

        {/* Ears */}
        <circle cx="7.5" cy="8.5" r="4" fill={EAR} />
        <circle cx="24.5" cy="8.5" r="4" fill={EAR} />
        <circle cx="7.5" cy="8.5" r="2" fill={EAR_INNER} />
        <circle cx="24.5" cy="8.5" r="2" fill={EAR_INNER} />

        {/* Head */}
        <circle cx="16" cy="17" r="10.5" fill={FUR} />

        {/* Nightcap — after the head so it covers the inner ears */}
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
              <path key={d} d={d} fill={CAP_STAR} />
            ))}
            <path d={CAP_BRIM} fill="#ffffff" />
            <circle {...CAP_POM} fill="#ffffff" />
          </g>
        )}

        {/* Bow */}
        <polygon points={BOW_LEFT} fill={bowColor} />
        <polygon points={BOW_RIGHT} fill={bowColor} />
        <circle
          cx="16"
          cy="28"
          r="1.7"
          fill={bowColor}
          stroke={outline ? outlineColor : 'none'}
          strokeWidth="1"
        />

        {/* Muzzle + cheeks */}
        <ellipse cx="16" cy="20.5" rx="5" ry="3.6" fill={MUZZLE} />
        <circle cx="10" cy="19.5" r="1.6" fill={CHEEK} opacity="0.6" />
        <circle cx="22" cy="19.5" r="1.6" fill={CHEEK} opacity="0.6" />

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

        {/* Tongue (grin only), nose, mouth */}
        {happy && <ellipse cx="16" cy="22.8" rx="1.4" ry="0.9" fill={CHEEK} />}
        <ellipse cx="16" cy="19" rx="1.9" ry="1.3" fill={INK} />
        <path
          d="M14.2 21.6q1.8 1.4 3.6 0"
          fill="none"
          stroke={INK}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
