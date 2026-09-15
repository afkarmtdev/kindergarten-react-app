// Admin bear — the sticker teddy (components/ui/StickerBear.tsx) with a blue bow.
// It always sits on a kinder-orange tile, so the bow is blue (the old admin tie
// colour) rather than orange to stay visible. No state, no animation.
// eyeState: 'open' | 'half' (sleepy) | 'closed' (asleep) — driven by AdminBearLogo.
// gaze: pupil offset, driven by useLoginBear on the login page.
// In dark mode the bear wears its starry nightcap (settles in when the toggle flips).
// During Malaysia Day week (16 to 22 Sep) it waves the Jalur Gemilang.
import {
  StickerBear,
  BEAR_BOW_BLUE,
  type BearEyeState,
  type BearGaze,
} from '@/components/ui/StickerBear'
import { useSettingsStore } from '@/store/settingsStore'
import { useMalaysiaDay } from '@/hooks/useMalaysiaDay'

export function AdminBearIcon({
  size = 34,
  eyeState = 'open',
  gaze,
}: {
  size?: number
  eyeState?: BearEyeState
  gaze?: BearGaze
}) {
  const darkMode = useSettingsStore((s) => s.darkMode)
  const malaysiaDay = useMalaysiaDay()
  return (
    <StickerBear
      size={size}
      eyeState={eyeState}
      gaze={gaze}
      bowColor={BEAR_BOW_BLUE}
      cap={darkMode ? 'nightcap' : 'none'}
      flag={malaysiaDay ? 'malaysia' : 'none'}
    />
  )
}
