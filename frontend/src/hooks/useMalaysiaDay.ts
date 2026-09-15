// True for Malaysia Day week (16 to 22 September inclusive, local time).
// Re-checked every minute so a tab left open overnight picks the flag up and
// puts it down on its own. Used to hand the sticker bear its Jalur Gemilang for the week.
//
// Preview on any other day from the browser console, then reload:
//   localStorage.setItem('kc-preview-malaysia-day', '1')
//   localStorage.removeItem('kc-preview-malaysia-day')
import { useEffect, useState } from 'react'

const PREVIEW_KEY = 'kc-preview-malaysia-day'

const FIRST_DAY = 16
const LAST_DAY = 22

export function isMalaysiaDay(now: Date = new Date()): boolean {
  const day = now.getDate()
  return now.getMonth() === 8 && day >= FIRST_DAY && day <= LAST_DAY
}

function previewForced(): boolean {
  try {
    return localStorage.getItem(PREVIEW_KEY) === '1'
  } catch {
    return false
  }
}

export function useMalaysiaDay(): boolean {
  const [festive, setFestive] = useState(() => previewForced() || isMalaysiaDay())
  useEffect(() => {
    const id = setInterval(() => setFestive(previewForced() || isMalaysiaDay()), 60_000)
    return () => clearInterval(id)
  }, [])
  return festive
}
