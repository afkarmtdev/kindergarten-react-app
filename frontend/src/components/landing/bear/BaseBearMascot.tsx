// ─── Base Bear Mascot + Bear Logo ────────────────────────────────────────────
// Minecraft pixel-art style bear components used on the LandingPage.
//
// For seasonal variants (Christmas, summer, etc.) create a NEW component in
// this folder (e.g. BearMascotChristmas.tsx) that copies this SVG and layers
// seasonal accessories on top. Never modify this base file for seasonal use.
//
// Key layout notes (BaseBearMascot):
//   viewBox "0 0 96 112" — overflow="visible" lets the bag (negative x) render
//   Wave arm: RIGHT arm (x=64-72), pivot transformOrigin "68px 48px"
//   Right arm strap is a SEPARATE static rect outside the wave <g>
//   bear-mascot class + z-20 must be on the WRAPPER DIV in LandingPage, not here

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

export interface BearMascotHandle {
  setFlip: (flipped: boolean) => void
}
import { pickBearMessage } from './BearSpeechBubble'
import { BearSpeechBubbleV2 as BearSpeechBubble } from './BearSpeechBubbleV2'

type BearAnim = 'rest' | 'hover' | 'dance' | 'shimmy' | 'wobble' | 'groove' | 'spin' | 'bounce'

const IDLE_DANCES: BearAnim[] = [
  /* 'dance', 'shimmy', 'wobble', 'groove', 'spin', 'bounce' */
]

const DANCE_DURATION: Record<string, number> = {
  dance: 1400,
  shimmy: 750,
  wobble: 1250,
  groove: 1650,
  spin: 1050,
  bounce: 750,
}

const ANIM_CLASS: Record<BearAnim, string> = {
  rest: 'bear-floating',
  hover: 'bear-jumping',
  dance: 'bear-dancing',
  shimmy: 'bear-shimmying',
  wobble: 'bear-wobbling',
  groove: 'bear-grooving',
  spin: 'bear-spinning',
  bounce: 'bear-bouncing',
}

// All bear-specific keyframes + animation classes live here so the component
// is fully self-contained. LandingPage.tsx no longer needs any bear CSS.
const BEAR_KEYFRAMES = `
  @keyframes lp-bear-float {
    0%   { transform: translateY(0px) rotate(0deg); }
    25%  { transform: translateY(-10px) rotate(-1.5deg); }
    50%  { transform: translateY(-16px) rotate(0deg); }
    75%  { transform: translateY(-10px) rotate(1.5deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  .bear-floating { animation: lp-bear-float 4s ease-in-out infinite; }

  @keyframes lp-bear-wave {
    0%   { transform: rotate(0deg); }
    25%  { transform: rotate(-70deg); }
    50%  { transform: rotate(-30deg); }
    75%  { transform: rotate(-60deg); }
    100% { transform: rotate(0deg); }
  }
  @keyframes lp-bear-jump {
    0%   { transform: translateY(0); }
    25%  { transform: translateY(-20px); }
    50%  { transform: translateY(-8px); }
    68%  { transform: translateY(-16px); }
    84%  { transform: translateY(-4px); }
    100% { transform: translateY(0); }
  }
  @keyframes lp-bear-dance {
    0%   { transform: translateY(0px) rotate(0deg); }
    20%  { transform: translateY(-10px) rotate(-4deg); }
    45%  { transform: translateY(-5px) rotate(3deg); }
    65%  { transform: translateY(-12px) rotate(-3deg); }
    85%  { transform: translateY(-4px) rotate(4deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  @keyframes lp-arm-dance {
    0%   { transform: rotate(0deg); }
    30%  { transform: rotate(-55deg); }
    55%  { transform: rotate(-20deg); }
    80%  { transform: rotate(-60deg); }
    100% { transform: rotate(0deg); }
  }
  @keyframes lp-bear-shimmy {
    0%   { transform: translateX(0); }
    13%  { transform: translateX(-5px); }
    25%  { transform: translateX(5px); }
    38%  { transform: translateX(-5px); }
    50%  { transform: translateX(5px); }
    63%  { transform: translateX(-4px); }
    75%  { transform: translateX(4px); }
    88%  { transform: translateX(-2px); }
    100% { transform: translateX(0); }
  }
  @keyframes lp-arm-shimmy {
    0%   { transform: rotate(0deg); }
    20%  { transform: rotate(-45deg); }
    40%  { transform: rotate(-10deg); }
    60%  { transform: rotate(-45deg); }
    80%  { transform: rotate(-10deg); }
    100% { transform: rotate(0deg); }
  }
  @keyframes lp-bear-wobble {
    0%   { transform: rotate(0deg); }
    20%  { transform: rotate(-8deg); }
    40%  { transform: rotate(8deg); }
    60%  { transform: rotate(-6deg); }
    80%  { transform: rotate(5deg); }
    100% { transform: rotate(0deg); }
  }
  @keyframes lp-arm-wobble {
    0%   { transform: rotate(0deg); }
    20%  { transform: rotate(-35deg); }
    40%  { transform: rotate(20deg); }
    60%  { transform: rotate(-25deg); }
    80%  { transform: rotate(15deg); }
    100% { transform: rotate(0deg); }
  }
  /* bear-grooving commented out
  @keyframes lp-bear-groove {
    0%   { transform: translateX(0) rotate(0deg); }
    25%  { transform: translateX(-6px) rotate(-4deg); }
    50%  { transform: translateX(0) rotate(0deg); }
    75%  { transform: translateX(6px) rotate(4deg); }
    100% { transform: translateX(0) rotate(0deg); }
  }
  @keyframes lp-arm-groove {
    0%   { transform: rotate(0deg); }
    25%  { transform: rotate(-50deg); }
    50%  { transform: rotate(-10deg); }
    75%  { transform: rotate(-50deg); }
    100% { transform: rotate(0deg); }
  } */
  /* lp-bear-spin commented out — 360° spin disabled
  @keyframes lp-bear-spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  } */
  @keyframes lp-bear-bounce {
    0%   { transform: translateY(0); }
    25%  { transform: translateY(-14px); }
    50%  { transform: translateY(-4px); }
    70%  { transform: translateY(-10px); }
    85%  { transform: translateY(-2px); }
    100% { transform: translateY(0); }
  }
  @keyframes lp-arm-bounce {
    0%   { transform: rotate(0deg); }
    25%  { transform: rotate(-65deg); }
    50%  { transform: rotate(-20deg); }
    70%  { transform: rotate(-55deg); }
    100% { transform: rotate(0deg); }
  }
  .bear-mascot                   { position: relative; display: inline-block; }
  .bear-jumping                  { animation: lp-bear-jump    0.55s ease-out    both; }
  .bear-jumping   .bear-arm-wave { animation: lp-bear-wave    1s    ease-in-out both; }
  .bear-dancing                  { animation: lp-bear-dance   1.4s  ease-in-out both; }
  .bear-dancing   .bear-arm-wave { animation: lp-arm-dance    1.4s  ease-in-out both; }
  .bear-shimmying                { animation: lp-bear-shimmy  0.75s ease-in-out both; }
  .bear-shimmying .bear-arm-wave { animation: lp-arm-shimmy   0.75s ease-in-out both; }
  .bear-wobbling                 { animation: lp-bear-wobble  1.2s  ease-in-out both; }
  .bear-wobbling  .bear-arm-wave { animation: lp-arm-wobble   1.2s  ease-in-out both; }
  /* .bear-grooving                 { animation: lp-bear-groove  1.6s  ease-in-out both; } */
  /* .bear-grooving  .bear-arm-wave { animation: lp-arm-groove   1.6s  ease-in-out both; } */
  /* .bear-spinning { animation: lp-bear-spin 1.0s ease-in-out both; } */
  .bear-bouncing                 { animation: lp-bear-bounce  0.7s  ease-out    both; }
  .bear-bouncing  .bear-arm-wave { animation: lp-arm-bounce   0.7s  ease-out    both; }
`

export type BearFaceDirection = 'left' | 'right'

export const BaseBearMascot = forwardRef<
  BearMascotHandle,
  { hideBubble?: boolean; direction?: BearFaceDirection; tilt?: number }
>(function BaseBearMascot({ hideBubble = false, direction = 'right', tilt = 0 }, ref) {
  const [bearAnim, setBearAnim] = useState<BearAnim>('rest')
  const [bearMessage, setBearMessage] = useState<string | null>(null)
  const bearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoveredRef = useRef(false)
  const isVisibleRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const flipDivRef = useRef<HTMLDivElement>(null)
  const danceRef = useRef<(() => void) | null>(null)
  const bubbleCooldownRef = useRef(false)
  const clearMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Periodic idle dance — every 5–8 s, random move each time, skipped while hovered or off-screen
  useEffect(() => {
    const dance = () => {
      if (bearTimerRef.current) clearTimeout(bearTimerRef.current)
      bearTimerRef.current = setTimeout(
        () => {
          if (!isVisibleRef.current) return // off-screen — observer will restart when back in view
          if (!isHoveredRef.current && IDLE_DANCES.length > 0) {
            const pick = IDLE_DANCES[Math.floor(Math.random() * IDLE_DANCES.length)]
            setBearAnim(pick)
            bearTimerRef.current = setTimeout(() => {
              setBearAnim('rest')
              dance()
            }, DANCE_DURATION[pick])
          } else if (!isHoveredRef.current) {
            dance() // no dances configured — reschedule quietly
          } else {
            dance() // hovered — skip this round, try again later
          }
        },
        5000 + Math.random() * 3000
      )
    }
    danceRef.current = dance
    dance()
    return () => {
      if (bearTimerRef.current) clearTimeout(bearTimerRef.current)
      if (clearMsgTimerRef.current) clearTimeout(clearMsgTimerRef.current)
    }
  }, [])

  // Pause the dance cycle when the bear scrolls out of view, resume when back
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting
        if (entry.isIntersecting) {
          danceRef.current?.() // restart cycle when bear comes back into view
        } else {
          if (bearTimerRef.current) clearTimeout(bearTimerRef.current)
          setBearAnim('rest')
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Sync direction prop → flip div imperatively (for static usage without the handle)
  useEffect(() => {
    if (flipDivRef.current) {
      flipDivRef.current.style.transform = direction === 'left' ? 'scaleX(-1)' : ''
    }
  }, [direction])

  useImperativeHandle(ref, () => ({
    setFlip: (flipped: boolean) => {
      if (flipDivRef.current) {
        flipDivRef.current.style.transform = flipped ? 'scaleX(-1)' : ''
      }
    },
  }))

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BEAR_KEYFRAMES }} />
      <div
        ref={wrapperRef}
        className={`bear-mascot cursor-pointer ${ANIM_CLASS[bearAnim]}`}
        onMouseEnter={() => {
          isHoveredRef.current = true
          // Cancel any pending message-clear from a brief leave (e.g. cursor drifting to bubble)
          if (clearMsgTimerRef.current) {
            clearTimeout(clearMsgTimerRef.current)
            clearMsgTimerRef.current = null
          }
          if (bearTimerRef.current) clearTimeout(bearTimerRef.current)
          setBearAnim('hover')
          if (!hideBubble && !bubbleCooldownRef.current) {
            setBearMessage(pickBearMessage())
            bubbleCooldownRef.current = true
            setTimeout(() => {
              bubbleCooldownRef.current = false
            }, 2000)
          }
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false
          setBearAnim('rest')
          danceRef.current?.()
          // Grace period — bubble stays visible briefly so moving the cursor up
          // to read it doesn't cause an instant dismiss.
          clearMsgTimerRef.current = setTimeout(() => {
            setBearMessage(null)
            clearMsgTimerRef.current = null
          }, 400)
        }}
      >
        {/* Speech bubble stays outside the flip so text is never mirrored */}
        {!hideBubble && <BearSpeechBubble message={bearMessage} />}
        {/* flipDivRef — no JSX style; scaleX set imperatively via useEffect/setFlip so React never resets it */}
        <div ref={flipDivRef}>
          {/* Tilt wrapper — JSX-controlled, separate from flip */}
          <div style={tilt !== 0 ? { transform: `rotate(${tilt}deg)` } : undefined}>
            <svg
              viewBox="0 0 96 112"
              width="120"
              height="140"
              aria-hidden="true"
              shapeRendering={tilt !== 0 ? 'auto' : 'crispEdges'}
              overflow="visible"
              style={{ imageRendering: tilt !== 0 ? 'auto' : 'pixelated' }}
            >
              {/* ── Backpack — peeking LEFT (overflow visible, negative x) ── */}
              <rect x="-14" y="36" width="12" height="14" fill="#22863A" />
              <rect x="-26" y="48" width="34" height="42" fill="#22863A" />
              <rect x="-22" y="62" width="14" height="16" fill="#1A6B2A" />
              <rect x="-22" y="62" width="14" height="3" fill="#C8A020" />

              {/* ── Ears (outer) ── */}
              <rect x="12" y="0" width="12" height="16" fill="#4A2A0E" />
              <rect x="48" y="0" width="12" height="16" fill="#4A2A0E" />
              {/* Inner ear — pink, above y=8 so the head block doesn't cover it */}
              <rect x="14" y="1" width="8" height="7" fill="#FFB3C6" />
              <rect x="50" y="1" width="8" height="7" fill="#FFB3C6" />

              {/* ── Head ── */}
              <rect x="8" y="8" width="56" height="40" fill="#7B5230" />
              <rect x="16" y="16" width="40" height="24" fill="#C8956B" />
              {/* Cheeks */}
              <rect x="16" y="28" width="10" height="6" fill="#FFB3C6" opacity="0.6" />
              <rect x="46" y="28" width="10" height="6" fill="#FFB3C6" opacity="0.6" />
              {/* Eyes */}
              <rect x="16" y="16" width="10" height="10" fill="#1A1A1A" />
              <rect x="46" y="16" width="10" height="10" fill="#1A1A1A" />
              {/* Nose */}
              <rect x="27" y="30" width="18" height="8" fill="#1A1A1A" />

              {/* ── Body ── */}
              <rect x="8" y="48" width="56" height="40" fill="#7B5230" />
              <rect x="16" y="56" width="40" height="24" fill="#C8956B" />

              {/* ── Left arm — static ── */}
              <rect x="0" y="48" width="8" height="32" fill="#4A2A0E" />
              <rect x="6" y="48" width="2" height="32" fill="#22863A" opacity="0.8" />

              {/* ── Right arm — waves on hover; pivot at shoulder (68,48) ── */}
              <g className="bear-arm-wave" style={{ transformOrigin: '68px 48px' }}>
                <rect x="64" y="48" width="8" height="32" fill="#4A2A0E" />
              </g>
              {/* Strap stays static — not inside the wave group */}
              <rect x="64" y="48" width="2" height="32" fill="#22863A" opacity="0.8" />

              {/* ── Legs ── */}
              <rect x="8" y="88" width="22" height="24" fill="#4A2A0E" />
              <rect x="42" y="88" width="22" height="24" fill="#4A2A0E" />
            </svg>
          </div>
        </div>
      </div>
    </>
  )
})

// ─── Bear Logo — pixel-art face, used in navbar + footer ─────────────────────
export function BearLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      shapeRendering="crispEdges"
      style={{ flexShrink: 0, imageRendering: 'pixelated' }}
    >
      {/* Outer ears */}
      <rect x="1" y="0" width="3" height="3" fill="#4A2A0E" />
      <rect x="12" y="0" width="3" height="3" fill="#4A2A0E" />
      {/* Inner ears — pink, kept above y=2 so head doesn't cover them */}
      <rect x="2" y="0" width="2" height="2" fill="#FFB3C6" />
      <rect x="12" y="0" width="2" height="2" fill="#FFB3C6" />
      {/* Head */}
      <rect x="1" y="2" width="14" height="12" fill="#7B5230" />
      {/* Face */}
      <rect x="4" y="5" width="8" height="6" fill="#C8956B" />
      {/* Cheeks — lighter pink */}
      <rect x="4" y="8" width="2" height="1" fill="#FFB3C6" opacity="0.7" />
      <rect x="10" y="8" width="2" height="1" fill="#FFB3C6" opacity="0.7" />
      {/* Eyes */}
      <rect x="4" y="5" width="2" height="2" fill="#1A1A1A" />
      <rect x="10" y="5" width="2" height="2" fill="#1A1A1A" />
      {/* Nose */}
      <rect x="6" y="8" width="4" height="2" fill="#1A1A1A" />
    </svg>
  )
}
