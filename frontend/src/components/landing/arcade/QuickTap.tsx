import { useState, useEffect } from 'react'
import { Star, Heart, Shield, Sun, BookOpen, Music, Palette, Zap, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const QUICK_ICONS: LucideIcon[] = [Star, Heart, Shield, Sun, BookOpen, Music, Palette]
const QUICK_BG = [
  'bg-kinder-yellow',
  'bg-kinder-pink',
  'bg-kinder-blue',
  'bg-kinder-orange',
  'bg-kinder-green',
  'bg-kinder-purple',
]
const QUICK_ROUNDS = 5

export function QuickTap() {
  const [phase, setPhase] = useState<'idle' | 'countdown' | 'waiting' | 'go' | 'result' | 'done'>(
    'idle'
  )
  const [round, setRound] = useState(1)
  const [times, setTimes] = useState<number[]>([])
  const [countdown, setCountdown] = useState(3)
  const [startMs, setStartMs] = useState(0)
  const [lastTime, setLastTime] = useState(0)
  const [iconIdx, setIconIdx] = useState(0)
  const [colorIdx, setColorIdx] = useState(0)

  // 3 → 2 → 1 → 0 → go to waiting
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('waiting')
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 800)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // Random delay then show button
  useEffect(() => {
    if (phase !== 'waiting') return
    const delay = 800 + Math.random() * 2200
    const t = setTimeout(() => {
      setIconIdx(Math.floor(Math.random() * QUICK_ICONS.length))
      setColorIdx(Math.floor(Math.random() * QUICK_BG.length))
      setStartMs(performance.now())
      setPhase('go')
    }, delay)
    return () => clearTimeout(t)
  }, [phase])

  function handleTap() {
    if (phase !== 'go') return
    const elapsed = Math.round(performance.now() - startMs)
    setLastTime(elapsed)
    setTimes((prev) => [...prev, elapsed])
    setPhase('result')
  }

  function nextRound() {
    if (round >= QUICK_ROUNDS) {
      setPhase('done')
    } else {
      setRound((r) => r + 1)
      setCountdown(3)
      setPhase('countdown')
    }
  }

  function getRating(ms: number) {
    if (ms < 200) return 'Superhuman!'
    if (ms < 300) return 'Lightning fast!'
    if (ms < 450) return 'Great reflexes!'
    if (ms < 650) return 'Pretty good!'
    return 'Keep practicing!'
  }

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
  const Icon = QUICK_ICONS[iconIdx]
  const color = QUICK_BG[colorIdx]

  return (
    <div className="text-center">
      {phase === 'idle' && (
        <div className="py-2">
          <Zap size={40} className="text-kinder-yellow mx-auto mb-3" />
          <p className="text-white font-extrabold text-lg mb-1">Quick Tap</p>
          <p className="text-gray-400 text-sm mb-1">Tap the button the instant it appears!</p>
          <p className="text-gray-500 text-xs mb-5">
            {QUICK_ROUNDS} rounds — how fast are your reflexes?
          </p>
          <button
            onClick={() => {
              setRound(1)
              setTimes([])
              setCountdown(3)
              setPhase('countdown')
            }}
            className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full"
          >
            Start
          </button>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="py-6">
          <p className="text-gray-500 text-xs mb-3">
            Round {round} / {QUICK_ROUNDS}
          </p>
          <p className="text-7xl font-extrabold text-white leading-none">{countdown}</p>
          <p className="text-gray-500 text-sm mt-4">Get ready...</p>
        </div>
      )}

      {phase === 'waiting' && (
        <div className="py-6">
          <p className="text-gray-500 text-xs mb-5">
            Round {round} / {QUICK_ROUNDS}
          </p>
          <div className="w-28 h-28 bg-gray-800 border-2 border-gray-700 rounded-3xl mx-auto flex items-center justify-center">
            <p className="text-gray-600 text-xs font-medium">Wait...</p>
          </div>
          <p className="text-gray-600 text-xs mt-3">Don't tap yet!</p>
        </div>
      )}

      {phase === 'go' && (
        <div className="py-4">
          <p className="text-gray-400 text-xs mb-4 font-semibold tracking-wide">
            Round {round} / {QUICK_ROUNDS} — TAP NOW!
          </p>
          <button
            onClick={handleTap}
            className={`w-28 h-28 ${color} rounded-3xl mx-auto flex items-center justify-center shadow-2xl active:scale-90 cursor-pointer transition-transform duration-75`}
          >
            <Icon size={48} className="text-white" />
          </button>
        </div>
      )}

      {phase === 'result' && (
        <div className="py-4">
          <p className="text-gray-500 text-xs mb-3">
            Round {round} / {QUICK_ROUNDS}
          </p>
          <p className="leading-none mb-2">
            <span className="text-5xl font-extrabold text-white">{lastTime}</span>
            <span className="text-xl text-gray-400 ml-1">ms</span>
          </p>
          <p className="text-gray-400 text-sm mb-4">
            {lastTime < 250
              ? 'Insane!'
              : lastTime < 400
                ? 'Great!'
                : lastTime < 600
                  ? 'Good!'
                  : 'Slow down...'}
          </p>
          <div className="flex gap-1 mb-5">
            {Array.from({ length: QUICK_ROUNDS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i < times.length ? 'bg-kinder-orange' : 'bg-gray-700'}`}
              />
            ))}
          </div>
          <button
            onClick={nextRound}
            className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full"
          >
            {round >= QUICK_ROUNDS ? 'See Results' : 'Next Round'}
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div className="py-4">
          <Trophy size={36} className="text-kinder-yellow mx-auto mb-3" />
          <p className="text-white font-extrabold text-lg mb-1">All done!</p>
          <p className="text-gray-400 text-sm mb-1">
            Avg: <span className="text-white font-bold">{avg}ms</span>
          </p>
          <p className="text-kinder-yellow font-semibold text-sm mb-4">{getRating(avg)}</p>
          <div className="grid grid-cols-5 gap-1 mb-5">
            {times.map((t, i) => {
              const best = Math.min(...times)
              return (
                <div
                  key={i}
                  className={`rounded-lg p-1.5 text-center ${
                    t === best ? 'bg-kinder-green/20 border border-kinder-green/30' : 'bg-gray-800'
                  }`}
                >
                  <p className="text-gray-500 text-xs">R{i + 1}</p>
                  <p
                    className={`text-xs font-bold ${t === best ? 'text-kinder-green' : 'text-white'}`}
                  >
                    {t}
                  </p>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => {
              setPhase('idle')
              setTimes([])
              setRound(1)
            }}
            className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}
