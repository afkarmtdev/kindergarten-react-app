// BearSpeechBubbleV2 — same props and logic as BearSpeechBubble (V1).
// Visual improvements: shadow-lg, rounded-2xl, bounce pop-in, symmetric tail.
// RainbowText is duplicated here so V2 is self-contained; logic imports from V1.

import { useEffect, useRef, useState } from 'react'
import { BEAR_HINTS } from './BearSpeechBubble'

function RainbowText({ text }: { text: string }) {
  // Split into words so line breaks only happen at spaces, never mid-word.
  // charOffset keeps the colour wave continuous across word boundaries.
  let charOffset = 0
  return (
    <>
      {text.split(' ').map((word, wi, arr) => {
        const offset = charOffset
        charOffset += word.length + 1 // +1 for the space
        return (
          <span key={wi}>
            <span style={{ whiteSpace: 'nowrap' }}>
              {word.split('').map((char, ci) => (
                <span
                  key={ci}
                  style={{
                    display: 'inline-block',
                    animation: 'rainbow-char 1.4s linear infinite',
                    animationDelay: `${(offset + ci) * 0.07}s`,
                  }}
                >
                  {char}
                </span>
              ))}
            </span>
            {wi < arr.length - 1 && ' '}
          </span>
        )
      })}
    </>
  )
}

export function BearSpeechBubbleV2({ message }: { message: string | null }) {
  // Keep the last non-null message so the text stays readable during the fade-out.
  const [displayMessage, setDisplayMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (message) {
      if (unmountTimer.current) clearTimeout(unmountTimer.current)
      setDisplayMessage(message)
      setVisible(true)
    } else {
      setVisible(false)
      // Remove from DOM only after the CSS dismiss animation finishes.
      unmountTimer.current = setTimeout(() => setDisplayMessage(null), 150)
    }
    return () => {
      if (unmountTimer.current) clearTimeout(unmountTimer.current)
    }
  }, [message])

  if (!displayMessage) return null

  const isHint = BEAR_HINTS.includes(displayMessage)

  return (
    <div
      className={`absolute bottom-full right-0 mb-2 pointer-events-none w-max max-w-[180px]
        transition-[opacity,transform]
        ${
          visible
            ? 'opacity-100 scale-100 translate-y-0 duration-200 ease-out'
            : 'opacity-0 scale-0 translate-y-2 duration-150 ease-in'
        }`}
      style={{ transformOrigin: 'bottom right' }}
    >
      <div
        className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white
          text-[11px] font-bold px-3 py-2 rounded-2xl
          border border-gray-200 dark:border-gray-600
          shadow-lg leading-snug"
      >
        {isHint ? <RainbowText text={displayMessage} /> : displayMessage}
      </div>

      {/* Tail — right-aligned, points down toward bear; overlaps bubble by 1px to hide seam */}
      {/* right-8 keeps tail off the rounded corner (rounded-2xl = 16px radius = right-4 is exactly the curve start) */}
      <svg
        className="absolute right-8"
        style={{ bottom: -5 }}
        width="12"
        height="7"
        viewBox="0 0 12 7"
        aria-hidden="true"
      >
        <polygon points="0,0 4,7 12,0" className="fill-white dark:fill-gray-800" />
        {/* polyline = only the two diagonal sides, no top edge — seam stays hidden */}
        <polyline
          points="0,0 4,7 12,0"
          fill="none"
          strokeWidth="1"
          className="stroke-gray-200 dark:stroke-gray-600"
        />
      </svg>
    </div>
  )
}
