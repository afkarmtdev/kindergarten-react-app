// Admin mascot — the app mascot (components/ui/Mascot.tsx) with a blue bow.
// It always sits on a kinder-orange tile, so the bow is blue rather than
// orange to stay visible. No state, no animation.
// eyeState: 'open' | 'half' (sleepy) | 'closed' (asleep) — driven by AdminBearLogo.
// gaze: pupil offset, driven by useLoginBear on the login page.
// In dark mode the mascot wears its starry nightcap (settles in when the toggle flips).
// During Malaysia Day week (16 to 22 Sep) it waves the Jalur Gemilang.
import {
  Mascot,
  MASCOT_BOW_BLUE,
  type MascotEyeState,
  type MascotGaze,
} from '@/components/ui/Mascot'
import { useSettingsStore } from '@/store/settingsStore'
import { useMalaysiaDay } from '@/hooks/useMalaysiaDay'

export function AdminBearIcon({
  size = 34,
  eyeState = 'open',
  gaze,
}: {
  size?: number
  eyeState?: MascotEyeState
  gaze?: MascotGaze
}) {
  const darkMode = useSettingsStore((s) => s.darkMode)
  const malaysiaDay = useMalaysiaDay()
  return (
    <Mascot
      size={size}
      eyeState={eyeState}
      gaze={gaze}
      bowColor={MASCOT_BOW_BLUE}
      cap={darkMode ? 'nightcap' : 'none'}
      flag={malaysiaDay ? 'malaysia' : 'none'}
    />
  )
}
