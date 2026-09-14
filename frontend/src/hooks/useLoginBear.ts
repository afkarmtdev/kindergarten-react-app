// Drives the bear on the admin and portal login pages. Spread `watchProps`
// onto the identifier input and `hideProps` onto the secret input; pass the
// current identifier text and the error string. Returns the eye state and
// gaze to hand to StickerBear.
//
//   const bear = useLoginBear({ typed: email, error })
//   <StickerBear eyeState={bear.eyeState} gaze={bear.gaze} />
//   <input {...bear.watchProps} />   // email / access code
//   <input {...bear.hideProps} />    // password / PIN
import { useEffect, useState } from 'react'
import { resolveLoginBear, OOPS_MS, type LoginBearLook } from '@/lib/loginBear'

interface FocusProps {
  onFocus: () => void
  onBlur: () => void
}

interface UseLoginBearResult extends LoginBearLook {
  watchProps: FocusProps
  hideProps: FocusProps
}

export function useLoginBear({
  typed,
  error,
}: {
  typed: string
  error: string
}): UseLoginBearResult {
  const [watching, setWatching] = useState(false)
  const [hiding, setHiding] = useState(false)
  const [oops, setOops] = useState(false)

  // Squeeze the eyes shut for a moment each time a new error lands.
  useEffect(() => {
    if (!error) return
    setOops(true)
    const timer = window.setTimeout(() => setOops(false), OOPS_MS)
    return () => window.clearTimeout(timer)
  }, [error])

  const look = resolveLoginBear({ watching, hiding, oops, typedLength: typed.length })

  return {
    ...look,
    watchProps: { onFocus: () => setWatching(true), onBlur: () => setWatching(false) },
    hideProps: { onFocus: () => setHiding(true), onBlur: () => setHiding(false) },
  }
}
