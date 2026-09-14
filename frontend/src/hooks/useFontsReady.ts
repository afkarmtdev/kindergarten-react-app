import { useEffect, useState } from 'react'

// True once the document's web fonts have loaded, or after `maxWaitMs` as a
// fallback so nothing gated on it stays hidden when a font never arrives.
// Used to hold entrance animations until the font swap has happened: a font
// swap reflows text mid-animation, which makes iOS Safari paint the old and
// new glyph positions on top of each other for a frame.
export function useFontsReady(maxWaitMs = 1000): boolean {
  const [ready, setReady] = useState(
    () => typeof document === 'undefined' || !('fonts' in document)
  )

  useEffect(() => {
    if (ready) return
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setReady(true)
    }
    const timer = setTimeout(finish, maxWaitMs)
    document.fonts.ready.then(finish)
    return () => clearTimeout(timer)
  }, [ready, maxWaitMs])

  return ready
}
