// Pure logic for the login-page bear: what the eyes do given what the user is
// doing in the form. Kept out of the hook so it can be tested without React.
//
//   watching  the identifier field (email / access code) has focus:
//             pupils slide left-to-right as the text grows, looking down at it
//   hiding    the secret field (password / PIN) has focus: eyes go half-lidded,
//             the bear politely not looking
//   oops      a login just failed: eyes squeeze shut for a moment
import type { BearEyeState, BearGaze } from '@/components/ui/StickerBear'

export interface LoginBearInput {
  watching: boolean
  hiding: boolean
  oops: boolean
  typedLength: number
}

export interface LoginBearLook {
  eyeState: BearEyeState
  gaze: BearGaze
}

// Characters that span the pupils from far left to far right. Matches roughly
// how many characters fit in the login inputs before they scroll.
export const GAZE_SPAN_CHARS = 22
// Pupils look slightly down while the bear reads the field.
const READING_Y = 0.35
// How long the eyes stay shut after a failed attempt.
export const OOPS_MS = 1600

export function resolveLoginBear({
  watching,
  hiding,
  oops,
  typedLength,
}: LoginBearInput): LoginBearLook {
  if (oops) return { eyeState: 'closed', gaze: { x: 0, y: 0 } }
  if (hiding) return { eyeState: 'half', gaze: { x: 0, y: READING_Y } }
  if (watching) {
    const progress = Math.min(Math.max(typedLength, 0) / GAZE_SPAN_CHARS, 1)
    return { eyeState: 'open', gaze: { x: -1 + progress * 2, y: READING_Y } }
  }
  return { eyeState: 'open', gaze: { x: 0, y: 0 } }
}
