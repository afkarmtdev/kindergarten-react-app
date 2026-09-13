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

export type BearEyeState = 'open' | 'half' | 'closed'
export type BearMood = 'smile' | 'grin'

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

interface StickerBearProps {
  size?: number
  eyeState?: BearEyeState
  mood?: BearMood
  bowColor?: string
  tilt?: number
  outline?: boolean
  outlineColor?: string
  lashes?: boolean
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
  className,
}: StickerBearProps) {
  const happy = mood === 'grin'

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

        {/* Ears */}
        <circle cx="7.5" cy="8.5" r="4" fill={EAR} />
        <circle cx="24.5" cy="8.5" r="4" fill={EAR} />
        <circle cx="7.5" cy="8.5" r="2" fill={EAR_INNER} />
        <circle cx="24.5" cy="8.5" r="2" fill={EAR_INNER} />

        {/* Head */}
        <circle cx="16" cy="17" r="10.5" fill={FUR} />

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
          <>
            <circle cx="12" cy="15.5" r="1.4" fill={INK} />
            <circle cx="20" cy="15.5" r="1.4" fill={INK} />
          </>
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
