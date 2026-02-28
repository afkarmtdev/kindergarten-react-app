// ─── Bear Speech Bubble ───────────────────────────────────────────────────────
// Floats above the bear mascot on hover. Messages in BEAR_HINTS get the
// Runescape-style rainbow wave effect — a subtle clue for the Access Panel.

export const BEAR_MESSAGES = [
  'Hello there!',
  'Rawr!',
  'You found me!',
  'High five!',
  "Let's learn today!",
  'Stay curious!',
  'Be kind always!',
  'Adventure awaits!',
  'Woo-hoo!',
  "You're awesome!",
  'Best day ever!',
  'Keep exploring!',
  'I like your style!',
  'Learning is fun!',
  'Ready for fun?',
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
      className={`absolute bottom-full right-0 mb-1 transition-opacity duration-150 pointer-events-none w-max max-w-[170px] ${
        message ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 leading-snug">
        {isHint ? <RainbowText text={message!} /> : message}
      </div>
      {/* Tail pointing down toward the bear's head */}
      <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white dark:bg-gray-800 border-b border-r border-gray-100 dark:border-gray-700 rotate-45" />
    </div>
  )
}
