// Mascot family for the portal login — papa (blue bow) and mama (pink bow,
// eyelashes) leaning in over a smaller grinning little one. Three Mascots in a
// row; `size` is the total width. `eyeState` and `gaze` apply to the parents
// only; the little one keeps grinning (arc eyes have no pupils to move). On
// Malaysia Day the little one is the one waving the flag; it sits above the
// parents so the flag waves in front of mama's head instead of vanishing behind it.
import {
  Mascot,
  MASCOT_BOW_BLUE,
  MASCOT_BOW_PINK,
  type MascotEyeState,
  type MascotGaze,
} from '@/components/ui/Mascot'
import { useMalaysiaDay } from '@/hooks/useMalaysiaDay'

export function PortalBearFamily({
  size = 96,
  eyeState = 'open',
  gaze,
}: {
  size?: number
  eyeState?: MascotEyeState
  gaze?: MascotGaze
}) {
  const malaysiaDay = useMalaysiaDay()
  const parent = size * 0.42
  const cub = size * 0.32
  return (
    <div className="flex items-end justify-center" style={{ width: size }} aria-hidden="true">
      <div style={{ marginRight: -size * 0.04 }}>
        <Mascot
          size={parent}
          bowColor={MASCOT_BOW_BLUE}
          tilt={-10}
          eyeState={eyeState}
          gaze={gaze}
        />
      </div>
      <div className="relative z-10" style={{ marginBottom: -size * 0.02 }}>
        <Mascot size={cub} mood="grin" tilt={0} flag={malaysiaDay ? 'malaysia' : 'none'} />
      </div>
      <div style={{ marginLeft: -size * 0.04 }}>
        <Mascot
          size={parent}
          bowColor={MASCOT_BOW_PINK}
          tilt={10}
          lashes
          eyeState={eyeState}
          gaze={gaze}
        />
      </div>
    </div>
  )
}
