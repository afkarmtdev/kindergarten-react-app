import { useState, useEffect, useRef } from 'react'
import { Star, RotateCcw, Trophy } from 'lucide-react'

const WHACK_TOTAL = 30

export function WhackGame() {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(WHACK_TOTAL)
  const [activeCell, setActiveCell] = useState<number | null>(null)
  const [hitFlash, setHitFlash] = useState<number | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown clock
  useEffect(() => {
    if (phase !== 'playing') return
    clockRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => {
      if (clockRef.current) clearInterval(clockRef.current)
    }
  }, [phase])

  // Detect time's up
  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      if (clockRef.current) clearInterval(clockRef.current)
      setActiveCell(null)
      setPhase('done')
    }
  }, [timeLeft, phase])

  // Star placement + auto-expiry (combined to avoid race conditions)
  useEffect(() => {
    if (phase !== 'playing') return
    if (activeCell === null) {
      const t = setTimeout(() => setActiveCell(Math.floor(Math.random() * 9)), 200)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setActiveCell(null), 1100)
      return () => clearTimeout(t)
    }
  }, [phase, activeCell])

  // Hit flash cleanup
  useEffect(() => {
    if (hitFlash === null) return
    const t = setTimeout(() => setHitFlash(null), 250)
    return () => clearTimeout(t)
  }, [hitFlash])

  function startGame() {
    setScore(0)
    setTimeLeft(WHACK_TOTAL)
    setActiveCell(null)
    setHitFlash(null)
    setPhase('playing')
  }

  function handleCellClick(i: number) {
    if (phase !== 'playing' || activeCell !== i) return
    setHitFlash(i)
    setScore((s) => s + 1)
    setActiveCell(null)
  }

  function getRating(s: number) {
    if (s >= 22) return 'Star champion!'
    if (s >= 16) return 'Lightning fast!'
    if (s >= 10) return 'Pretty good!'
    if (s >= 5) return 'Not bad!'
    return 'Keep trying!'
  }

  return (
    <div>
      {phase === 'idle' && (
        <div className="text-center py-2">
          <div className="w-14 h-14 bg-kinder-yellow/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star size={28} className="text-kinder-yellow" fill="#FFD93D" />
          </div>
          <p className="text-white font-extrabold text-lg mb-1">Whack-a-Star</p>
          <p className="text-gray-400 text-sm mb-1">Tap the stars before they disappear!</p>
          <p className="text-gray-500 text-xs mb-5">
            {WHACK_TOTAL} seconds — score as many as you can
          </p>
          <button
            onClick={startGame}
            className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full"
          >
            Start
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">
              <Star size={13} className="inline text-kinder-yellow mr-1" />
              Score: <span className="text-white font-bold">{score}</span>
            </span>
            <span
              className={`font-bold text-sm tabular-nums ${timeLeft <= 10 ? 'text-red-400' : 'text-kinder-blue'}`}
            >
              {timeLeft}s
            </span>
            <button
              onClick={() => {
                if (clockRef.current) clearInterval(clockRef.current)
                setPhase('idle')
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-2.5 py-1 rounded-lg transition-colors"
            >
              <RotateCcw size={10} /> Quit
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-100 ${
                  hitFlash === i
                    ? 'bg-kinder-green/30 border-2 border-kinder-green/60'
                    : activeCell === i
                      ? 'bg-kinder-yellow/20 border-2 border-kinder-yellow/60 scale-105 cursor-pointer'
                      : 'bg-gray-800 border border-gray-700 cursor-default'
                }`}
              >
                {activeCell === i && (
                  <Star size={24} className="text-kinder-yellow" fill="#FFD93D" />
                )}
                {hitFlash === i && (
                  <Star size={24} className="text-kinder-green" fill="currentColor" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="text-center py-4">
          <Trophy size={36} className="text-kinder-yellow mx-auto mb-3" />
          <p className="text-white font-extrabold text-xl mb-1">Time's up!</p>
          <p className="text-gray-400 text-sm mb-1">
            You hit <span className="text-white font-bold">{score}</span> star
            {score !== 1 ? 's' : ''}
          </p>
          <p className="text-kinder-yellow font-semibold text-sm mb-5">{getRating(score)}</p>
          <button
            onClick={startGame}
            className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}
