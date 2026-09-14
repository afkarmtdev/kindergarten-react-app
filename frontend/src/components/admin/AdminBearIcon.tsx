// Admin bear — the sticker teddy (components/ui/StickerBear.tsx) with a blue bow.
// It always sits on a kinder-orange tile, so the bow is blue (the old admin tie
// colour) rather than orange to stay visible. No state, no animation.
// eyeState: 'open' | 'half' (sleepy) | 'closed' (asleep) — driven by AdminBearLogo.
// gaze: pupil offset, driven by useLoginBear on the login page.
import {
  StickerBear,
  BEAR_BOW_BLUE,
  type BearEyeState,
  type BearGaze,
} from '@/components/ui/StickerBear'

export function AdminBearIcon({
  size = 34,
  eyeState = 'open',
  gaze,
}: {
  size?: number
  eyeState?: BearEyeState
  gaze?: BearGaze
}) {
  return <StickerBear size={size} eyeState={eyeState} gaze={gaze} bowColor={BEAR_BOW_BLUE} />
}
