import { useState, useRef, useEffect } from 'react'
import { Trophy, Waves, X, RotateCcw, Fish } from 'lucide-react'

// ── Constants ──────────────────────────────────────────
const TRACK_H = 200 // visual height of the fishing track (px)
const FISH_H = 10 // fish indicator height (px)

const GRAVITY = 0.3 // px/frame² downward
const BOOST = -0.72 // px/frame² upward when holding
const DAMPING = 0.84 // velocity multiplier per frame
const MAX_VEL = 10 // velocity clamp (px/frame)

// ── Fish data — fill/drain rates control game duration ─
// Easy:   fast rates → short games
// Medium: medium rates → moderate games
// Hard:   slow rates → long, drawn-out tension
const FISH_LIST = [
  {
    name: 'Carp',
    color: '#94a3b8',
    diff: 'Easy',
    barH: 58,
    lerp: 0.038,
    noise: 0.9,
    fillRate: 2.2,
    drainRate: 1.4,
  },
  {
    name: 'Sardine',
    color: '#60a5fa',
    diff: 'Easy',
    barH: 56,
    lerp: 0.042,
    noise: 1.1,
    fillRate: 2.0,
    drainRate: 1.3,
  },
  {
    name: 'Catfish',
    color: '#ca8a04',
    diff: 'Medium',
    barH: 50,
    lerp: 0.058,
    noise: 1.6,
    fillRate: 1.5,
    drainRate: 1.0,
  },
  {
    name: 'Eel',
    color: '#06b6d4',
    diff: 'Medium',
    barH: 46,
    lerp: 0.065,
    noise: 2.0,
    fillRate: 1.3,
    drainRate: 0.9,
  },
  {
    name: 'Pufferfish',
    color: '#FF6B35',
    diff: 'Hard',
    barH: 38,
    lerp: 0.082,
    noise: 2.6,
    fillRate: 0.9,
    drainRate: 0.65,
  },
  {
    name: 'Legend',
    color: '#C77DFF',
    diff: 'Hard',
    barH: 32,
    lerp: 0.095,
    noise: 3.2,
    fillRate: 0.7,
    drainRate: 0.55,
  },
] as const

type FishData = (typeof FISH_LIST)[number]

const DIFF_STYLE: Record<string, string> = {
  Easy: 'bg-emerald-900/60 text-emerald-400',
  Medium: 'bg-yellow-900/60  text-yellow-400',
  Hard: 'bg-red-900/60     text-red-400',
}

// ── Confetti (Hard wins only) ──────────────────────────
const CONFETTI_CSS = `
  @keyframes confetti-drop {
    0%   { transform: translateY(0)     rotate(0deg);   opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: translateY(230px) rotate(720deg); opacity: 0; }
  }
`

const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 4.17 + 1.5) % 97}%`,
  delay: `${((i * 0.085) % 0.85).toFixed(2)}s`,
  duration: `${(1.4 + (i % 6) * 0.18).toFixed(2)}s`,
  color: ['#FF6B35', '#FFD93D', '#6BCB77', '#4D96FF', '#FF85A2', '#C77DFF'][i % 6],
  isCircle: i % 4 === 0,
  size: i % 3 === 0 ? 10 : 7,
}))

// ── Types ──────────────────────────────────────────────
type Phase = 'idle' | 'playing' | 'win' | 'lose'

// All mutable physics in a ref — avoids stale closures inside rAF
interface Phys {
  barY: number
  barVel: number
  fishY: number
  fishTarget: number
  fishTimer: number
  catchPct: number
  holding: boolean
  lerp: number
  noise: number
  barH: number
  fillRate: number
  drainRate: number
}

// Subset synced to state each frame to trigger re-renders
interface Disp {
  barY: number
  barH: number
  fishY: number
  catchPct: number
}

// ── Helper ─────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// ══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════
export function FishingGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')

  const [fish, setFish] = useState<FishData>(FISH_LIST[0])
  const [disp, setDisp] = useState<Disp>({ barY: 80, barH: 52, fishY: 100, catchPct: 30 })

  const physRef = useRef<Phys>({
    barY: 80,
    barVel: 0,
    fishY: 100,
    fishTarget: 100,
    fishTimer: 60,
    catchPct: 30,
    holding: false,
    lerp: 0.055,
    noise: 1.4,
    barH: 52,
    fillRate: 1.8,
    drainRate: 1.15,
  })
  const rafRef = useRef(0)

  // ── Start / restart ──────────────────────────────────
  function cast(keepFish?: FishData) {
    const f = keepFish ?? FISH_LIST[Math.floor(Math.random() * FISH_LIST.length)]
    setFish(f)

    const p = physRef.current
    p.barY = TRACK_H / 2 - f.barH / 2
    p.barVel = 0
    p.fishY = TRACK_H / 2
    p.fishTarget = TRACK_H / 2
    p.fishTimer = 60
    p.catchPct = 30
    p.holding = false
    p.lerp = f.lerp
    p.noise = f.noise
    p.barH = f.barH
    p.fillRate = f.fillRate
    p.drainRate = f.drainRate

    phaseRef.current = 'playing'
    setPhase('playing')
    setDisp({ barY: p.barY, barH: f.barH, fishY: p.fishY, catchPct: 30 })
  }

  // ── Game loop ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return

    function loop() {
      if (phaseRef.current !== 'playing') return
      const p = physRef.current

      // Bar physics
      p.barVel = clamp((p.barVel + (p.holding ? BOOST : GRAVITY)) * DAMPING, -MAX_VEL, MAX_VEL)
      p.barY = clamp(p.barY + p.barVel, 0, TRACK_H - p.barH)

      // Fish movement — lerp toward target with random noise
      if (--p.fishTimer <= 0) {
        p.fishTarget = clamp(
          FISH_H / 2 + Math.random() * (TRACK_H - FISH_H),
          FISH_H,
          TRACK_H - FISH_H
        )
        p.fishTimer = 30 + Math.floor(Math.random() * 60)
      }
      p.fishY += (p.fishTarget - p.fishY) * p.lerp + (Math.random() - 0.5) * p.noise * 2
      p.fishY = clamp(p.fishY, FISH_H / 2, TRACK_H - FISH_H / 2)

      // Catch meter — rates come from the fish data
      const inBar = p.fishY + FISH_H / 2 > p.barY && p.fishY - FISH_H / 2 < p.barY + p.barH
      p.catchPct = clamp(p.catchPct + (inBar ? p.fillRate : -p.drainRate), 0, 100)

      setDisp({ barY: p.barY, barH: p.barH, fishY: p.fishY, catchPct: p.catchPct })

      if (p.catchPct >= 100) {
        phaseRef.current = 'win'
        setPhase('win')
        return
      }
      if (p.catchPct <= 0) {
        phaseRef.current = 'lose'
        setPhase('lose')
        return
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase])

  // ── Hold handlers ─────────────────────────────────────
  function startHold(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    physRef.current.holding = true
  }
  function stopHold() {
    physRef.current.holding = false
  }

  const meterColor =
    disp.catchPct > 60 ? 'bg-emerald-400' : disp.catchPct > 25 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div className="select-none">
      {/* ── Idle ──────────────────────────────────── */}
      {phase === 'idle' && (
        <div className="text-center py-2">
          <div className="w-14 h-14 bg-blue-900/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Waves size={28} className="text-blue-400" />
          </div>
          <p className="text-white font-extrabold text-lg mb-1">Fishing</p>
          <p className="text-gray-400 text-sm mb-1">Keep the fish inside the green zone!</p>
          <p className="text-gray-500 text-xs mb-5">Hold to rise · Release to fall</p>

          {/* Fish difficulty preview dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {FISH_LIST.map((f) => (
              <div
                key={f.name}
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: f.color }}
                title={`${f.name} (${f.diff})`}
              />
            ))}
          </div>

          <button
            onClick={() => cast()}
            className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full"
          >
            Cast Line
          </button>
        </div>
      )}

      {/* ── Playing ───────────────────────────────── */}
      {phase === 'playing' && (
        <div className="flex flex-col items-center gap-3">
          {/* Fish info */}
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: fish.color }}
            />
            <span className="text-white font-semibold text-sm">{fish.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_STYLE[fish.diff]}`}
            >
              {fish.diff}
            </span>
          </div>

          {/* Game area */}
          <div className="flex gap-2.5 touch-none">
            {/* Fishing track */}
            <div
              className="relative rounded-xl overflow-hidden bg-blue-950 cursor-pointer"
              style={{ width: 48, height: TRACK_H }}
              onPointerDown={startHold}
              onPointerUp={stopHold}
              onPointerCancel={stopHold}
            >
              {/* Subtle water depth pattern */}
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '8px 8px',
                }}
              />
              {/* Player zone — subtle bg + Fish icon centered */}
              <div
                className="absolute left-1 right-1 rounded-sm bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center"
                style={{ top: disp.barY, height: disp.barH }}
              >
                <Fish size={18} className="text-emerald-400" />
              </div>
              {/* Fish indicator */}
              <div
                className="absolute left-2 right-2 rounded-sm opacity-90"
                style={{
                  backgroundColor: fish.color,
                  top: disp.fishY - FISH_H / 2,
                  height: FISH_H,
                }}
              />
            </div>

            {/* Catch progress meter */}
            <div className="flex flex-col gap-1 items-center" style={{ height: TRACK_H }}>
              <span className="text-gray-600 text-xs">100</span>
              <div
                className="relative rounded-xl overflow-hidden bg-gray-800 flex-1"
                style={{ width: 14 }}
              >
                <div
                  className={`absolute bottom-0 left-0 right-0 ${meterColor} transition-colors duration-200`}
                  style={{ height: `${disp.catchPct}%` }}
                />
                {/* Tick mark at starting level */}
                <div
                  className="absolute left-0 right-0 border-t border-white/15"
                  style={{ bottom: '30%' }}
                />
              </div>
              <span className="text-gray-600 text-xs">0</span>
            </div>
          </div>

          {/* Hold button */}
          <button
            className="w-full py-3 rounded-2xl font-bold text-sm border-2 bg-gray-800/80 border-gray-600 text-gray-300 hover:border-emerald-500 active:bg-emerald-900/60 active:border-emerald-400 active:text-emerald-300 transition-colors touch-none"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerCancel={stopHold}
          >
            Hold to Rise
          </button>

          <button
            onClick={() => {
              phaseRef.current = 'idle'
              setPhase('idle')
            }}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-white transition-colors"
          >
            <RotateCcw size={11} /> Give up
          </button>
        </div>
      )}

      {/* ── Win ───────────────────────────────────── */}
      {phase === 'win' && (
        <div className="relative text-center py-4 overflow-hidden">
          {/* Confetti — only for Hard catches */}
          {fish.diff === 'Hard' && (
            <>
              <style dangerouslySetInnerHTML={{ __html: CONFETTI_CSS }} />
              <div className="absolute inset-0 pointer-events-none">
                {CONFETTI_PIECES.map((piece, i) => (
                  <div
                    key={i}
                    className={piece.isCircle ? 'rounded-full' : 'rounded-sm'}
                    style={{
                      position: 'absolute',
                      left: piece.left,
                      top: '-12px',
                      width: piece.size,
                      height: piece.size,
                      backgroundColor: piece.color,
                      animation: `confetti-drop ${piece.duration} ${piece.delay} ease-in forwards`,
                    }}
                  />
                ))}
              </div>
            </>
          )}

          <Trophy size={40} className="text-kinder-yellow mx-auto mb-3 relative" />
          <p className="text-white font-extrabold text-xl mb-1 relative">
            {fish.diff === 'Hard' ? 'Legendary catch!' : 'Got one!'}
          </p>
          <div className="flex items-center justify-center gap-2 mb-5 relative">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fish.color }} />
            <span className="text-gray-300 font-semibold">{fish.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_STYLE[fish.diff]}`}
            >
              {fish.diff}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 relative">
            <button
              onClick={() => cast(fish)}
              className="py-2.5 rounded-xl font-semibold text-sm bg-kinder-orange text-white hover:bg-orange-600 transition-colors"
            >
              Same Fish
            </button>
            <button
              onClick={() => cast()}
              className="py-2.5 rounded-xl font-semibold text-sm bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              Random Fish
            </button>
          </div>
        </div>
      )}

      {/* ── Lose ──────────────────────────────────── */}
      {phase === 'lose' && (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
            <X size={24} className="text-red-400" />
          </div>
          <p className="text-white font-extrabold text-xl mb-1">It got away!</p>
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fish.color }} />
            <span className="text-gray-500">{fish.name} escaped</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => cast(fish)}
              className="py-2.5 rounded-xl font-semibold text-sm bg-kinder-orange text-white hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => cast()}
              className="py-2.5 rounded-xl font-semibold text-sm bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              New Fish
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
