import { useState, useEffect, useRef } from 'react'

export function TypedText({
  text,
  className = '',
  speed = 60,
  delay = 400,
}: {
  text: string
  className?: string
  speed?: number
  delay?: number
}) {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion.current) {
      setDisplayed(text)
      setShowCursor(false)
      return
    }

    setDisplayed('')
    setShowCursor(true)
    let idx = 0
    let intervalId: ReturnType<typeof setInterval> | null = null
    let cursorTimer: ReturnType<typeof setTimeout> | null = null

    const startTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        idx++
        setDisplayed(text.slice(0, idx))
        if (idx >= text.length) {
          if (intervalId) clearInterval(intervalId)
          cursorTimer = setTimeout(() => setShowCursor(false), 1500)
        }
      }, speed)
    }, delay)

    return () => {
      clearTimeout(startTimer)
      if (intervalId) clearInterval(intervalId)
      if (cursorTimer) clearTimeout(cursorTimer)
    }
  }, [text, speed, delay])

  return (
    <span className={className}>
      {displayed}
      {showCursor && (
        <span
          className="inline-block w-[3px] h-[0.85em] bg-kinder-orange ml-0.5 align-middle animate-pulse"
          aria-hidden="true"
        />
      )}
    </span>
  )
}
