// Bear family for the portal login — papa (blue bow) and mama (pink bow,
// eyelashes) leaning in over a smaller grinning cub. Three StickerBears in a
// row; `size` is the total width. `eyeState` and `gaze` apply to the parents
// only; the cub keeps grinning (arc eyes have no pupils to move). On Malaysia
// Day the cub is the one waving the flag.
import {
  StickerBear,
  BEAR_BOW_BLUE,
  BEAR_BOW_PINK,
  type BearEyeState,
  type BearGaze,
} from '@/components/ui/StickerBear'
import { useMalaysiaDay } from '@/hooks/useMalaysiaDay'

export function PortalBearFamily({
  size = 96,
  eyeState = 'open',
  gaze,
}: {
  size?: number
  eyeState?: BearEyeState
  gaze?: BearGaze
}) {
  const malaysiaDay = useMalaysiaDay()
  const parent = size * 0.42
  const cub = size * 0.32
  return (
    <div className="flex items-end justify-center" style={{ width: size }} aria-hidden="true">
      <div style={{ marginRight: -size * 0.04 }}>
        <StickerBear
          size={parent}
          bowColor={BEAR_BOW_BLUE}
          tilt={-10}
          eyeState={eyeState}
          gaze={gaze}
        />
      </div>
      <div style={{ marginBottom: -size * 0.02 }}>
        <StickerBear size={cub} mood="grin" tilt={0} flag={malaysiaDay ? 'malaysia' : 'none'} />
      </div>
      <div style={{ marginLeft: -size * 0.04 }}>
        <StickerBear
          size={parent}
          bowColor={BEAR_BOW_PINK}
          tilt={10}
          lashes
          eyeState={eyeState}
          gaze={gaze}
        />
      </div>
    </div>
  )
}
