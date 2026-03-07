// ─── Bear Speech Bubble ───────────────────────────────────────────────────────
// Floats above the bear mascot on hover. Messages in BEAR_HINTS get the
// Runescape-style rainbow wave effect — a subtle clue for the Access Panel.

export const BEAR_MESSAGES = [
  'Hello there!',
  'You found me!',
  'Woo-hoo!',
  "I'm floating!",
  'Weeee!',
  'Catch me if you can!',
  'Zero gravity!',
  'Space bear!',
  'Bouncy bouncy!',
  "Can't stop me!",
  'Whoa, spinning!',
  'Houston, I am cute!',
  '3... 2... 1... go!',
  'I see stars!',
  'Tumbling time!',
  'Wobbly wobble!',
  'To infinity!',
  'Boing boing!',
  // Hints below — each encodes Heart → Sun → Star → Shield in disguise
  'Love... warmth... starlight... shelter...',
  'Beating. Blazing. Shining. Guarding.',
  'Pulse. Dawn. Sparkle. Fortress.',
  'Affection, radiance, wonder, armor...',
]

// Secret hints — each encodes Heart → Sun → Star → Shield in disguise.
export const BEAR_HINTS = [
  'Love... warmth... starlight... shelter...',
  'Beating. Blazing. Shining. Guarding.',
  'Pulse. Dawn. Sparkle. Fortress.',
  'Affection, radiance, wonder, armor...',
]

const BEAR_NORMAL = BEAR_MESSAGES.filter((m) => !BEAR_HINTS.includes(m))

// 15% chance of a hint, otherwise a normal message.
export function pickBearMessage(): string {
  if (Math.random() < 0.15) {
    return BEAR_HINTS[Math.floor(Math.random() * BEAR_HINTS.length)]
  }
  return BEAR_NORMAL[Math.floor(Math.random() * BEAR_NORMAL.length)]
}

function RainbowText({ text }: { text: string }) {
  // Split into words so breaks only happen at spaces, never mid-word.
  // charOffset tracks position across words to keep the colour wave continuous.
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

export function BearSpeechBubble({ message }: { message: string | null }) {
  const isHint = message !== null && BEAR_HINTS.includes(message)

  return (
    <div
      className={`absolute bottom-full right-0 mb-1 pointer-events-none w-max max-w-[170px] transition-[opacity,transform] duration-200 ease-out ${
        message ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-1'
      }`}
      style={{ transformOrigin: 'bottom right' }}
    >
      <div className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 leading-snug">
        {isHint ? <RainbowText text={message!} /> : message}
      </div>
      {/* Tail — overlaps bubble by 1px so fill covers the bottom border seam */}
      <svg
        className="absolute right-4"
        style={{ bottom: -6 }}
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
