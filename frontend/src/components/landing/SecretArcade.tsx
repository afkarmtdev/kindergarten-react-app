import { useState } from 'react'
import { Star, Heart, Shield, Sun, X, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MemoryGame } from '@/components/landing/arcade/MemoryGame'
import { SimonGame } from '@/components/landing/arcade/SimonGame'
import { WhackGame } from '@/components/landing/arcade/WhackGame'
import { QuickTap } from '@/components/landing/arcade/QuickTap'
import { PokemonBattle } from '@/components/landing/arcade/PokemonBattle'
import { FishingGame } from '@/components/landing/arcade/FishingGame'

// ── Game registry ─────────────────────────────────────
const GAME_DEFS = [
  { name: 'Memory Cards', desc: 'Match all the pairs!' },
  { name: 'Simon Says', desc: 'Watch and repeat the sequence' },
  { name: 'Whack-a-Star', desc: 'Tap stars — 30 seconds!' },
  { name: 'Quick Tap', desc: 'How fast are your reflexes?' },
  { name: 'Pokemon Battle', desc: 'Fight with a starter Pokemon!' },
  { name: 'Fishing', desc: 'Keep the fish in the green zone!' },
] as const

// ── Combo lock config ─────────────────────────────────
const SHAPES: { icon: LucideIcon; bg: string; glow: string }[] = [
  {
    icon: Star,
    bg: 'bg-kinder-yellow/20 hover:bg-kinder-yellow/40 border-kinder-yellow/30',
    glow: 'text-kinder-yellow',
  },
  {
    icon: Heart,
    bg: 'bg-kinder-pink/20   hover:bg-kinder-pink/40   border-kinder-pink/30',
    glow: 'text-kinder-pink',
  },
  {
    icon: Shield,
    bg: 'bg-kinder-blue/20   hover:bg-kinder-blue/40   border-kinder-blue/30',
    glow: 'text-kinder-blue',
  },
  {
    icon: Sun,
    bg: 'bg-kinder-orange/20 hover:bg-kinder-orange/40 border-kinder-orange/30',
    glow: 'text-kinder-orange',
  },
]

// Secret combo: Heart(1) → Sun(3) → Star(0) → Shield(2)
const SECRET = [1, 3, 0, 2]

// ══════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════
type PanelStatus = 'idle' | 'wrong' | 'granted' | 'initializing'

export function SecretArcade() {
  const [clickSeq, setClickSeq] = useState<number[]>([])
  const [status, setStatus] = useState<PanelStatus>('idle')
  const [gameKey, setGameKey] = useState(0)
  const [gameOpen, setGameOpen] = useState(false)
  const [gameIdx, setGameIdx] = useState(0)

  function handleShapeClick(idx: number) {
    if (status !== 'idle') return
    const newSeq = [...clickSeq, idx].slice(-SECRET.length)
    setClickSeq(newSeq)
    if (newSeq.length < SECRET.length) return

    const isRight = newSeq.every((v, i) => v === SECRET[i])
    if (isRight) {
      setStatus('granted')
      setTimeout(() => {
        setStatus('initializing')
        setTimeout(() => {
          setStatus('idle')
          setClickSeq([])
          setGameKey((k) => k + 1)
          setGameIdx(0)
          setGameOpen(true)
        }, 1200)
      }, 1000)
    } else {
      setStatus('wrong')
      setTimeout(() => {
        setStatus('idle')
        setClickSeq([])
      }, 800)
    }
  }

  return (
    <>
      {/* ── Access Panel ─────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 mt-6 pt-4 border-t border-gray-800">
        <p
          className={`text-xs tracking-widest uppercase font-bold transition-colors duration-300 ${
            status === 'wrong'
              ? 'text-red-500'
              : status === 'granted'
                ? 'text-kinder-green'
                : status === 'initializing'
                  ? 'text-kinder-green animate-pulse'
                  : 'text-gray-600'
          }`}
        >
          {status === 'wrong'
            ? 'ACCESS DENIED'
            : status === 'granted'
              ? 'ACCESS GRANTED'
              : status === 'initializing'
                ? 'INITIALIZING SECRET...'
                : 'Access Panel'}
        </p>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-300 ${
            status === 'granted' || status === 'initializing'
              ? 'border-kinder-green/60 bg-kinder-green/10'
              : status === 'wrong'
                ? 'border-red-500/60 bg-red-500/10'
                : 'border-gray-700/60 bg-gray-800/40'
          }`}
        >
          {SHAPES.map(({ icon: Icon, bg, glow }, idx) => {
            const isActive =
              clickSeq.length > 0 &&
              clickSeq[clickSeq.length - 1 - clickSeq.slice().reverse().indexOf(idx)] === idx
            return (
              <button
                key={idx}
                onClick={() => handleShapeClick(idx)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 ${bg} ${
                  isActive ? 'scale-110 brightness-125' : ''
                }`}
              >
                <Icon size={16} className={glow} />
              </button>
            )
          })}
        </div>
        {/* Sequence progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: SECRET.length }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${
                i < clickSeq.length ? 'w-2 h-2 bg-white/60' : 'w-1.5 h-1.5 bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Game modal ───────────────────────────────── */}
      {gameOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setGameOpen(false)}
        >
          <div
            className="relative bg-gray-900 border border-gray-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-kinder-orange rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-extrabold text-white text-lg leading-none">Secret Arcade</p>
                  <p className="text-gray-500 text-xs mt-0.5">You cracked the code!</p>
                </div>
              </div>
              <button
                onClick={() => setGameOpen(false)}
                className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Game selector */}
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={() => setGameIdx((i) => (i - 1 + GAME_DEFS.length) % GAME_DEFS.length)}
                className="text-gray-600 hover:text-white transition-colors flex-shrink-0 p-1"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1 text-center">
                <p className="font-bold text-white text-sm leading-tight">
                  {GAME_DEFS[gameIdx].name}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">{GAME_DEFS[gameIdx].desc}</p>
                <div className="flex justify-center gap-1.5 mt-2">
                  {GAME_DEFS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setGameIdx(i)}
                      className={`rounded-full transition-all duration-200 ${
                        i === gameIdx
                          ? 'w-4 h-1.5 bg-kinder-orange'
                          : 'w-1.5 h-1.5 bg-gray-700 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => setGameIdx((i) => (i + 1) % GAME_DEFS.length)}
                className="text-gray-600 hover:text-white transition-colors flex-shrink-0 p-1"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Active game — conditional render forces fresh mount on switch */}
            {gameIdx === 0 && <MemoryGame key={gameKey} />}
            {gameIdx === 1 && <SimonGame key={gameKey} />}
            {gameIdx === 2 && <WhackGame key={gameKey} />}
            {gameIdx === 3 && <QuickTap key={gameKey} />}
            {gameIdx === 4 && <PokemonBattle key={gameKey} />}
            {gameIdx === 5 && <FishingGame key={gameKey} />}
          </div>
        </div>
      )}
    </>
  )
}
