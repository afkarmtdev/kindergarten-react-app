import { useEffect, useState } from 'react'

// True once `settled` becomes true, or after `maxWaitMs` as a fallback so a
// slow or failed request never leaves gated UI hidden. Stays true once set.
export function useSettledOrTimeout(settled: boolean, maxWaitMs = 1500): boolean {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (settled) return
    const timer = setTimeout(() => setTimedOut(true), maxWaitMs)
    return () => clearTimeout(timer)
  }, [settled, maxWaitMs])

  return settled || timedOut
}
