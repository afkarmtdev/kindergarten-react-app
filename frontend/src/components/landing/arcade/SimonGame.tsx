import { useState } from 'react'
import { Star, Heart, Shield, Sun, RotateCcw, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const SIMON_BTNS: { icon: LucideIcon; dim: string; lit: string; pressed: string }[] = [
  {
    icon: Star,
    dim: 'bg-yellow-950/80 border-2 border-yellow-900',
    lit: 'bg-kinder-yellow border-2 border-yellow-300 scale-105',
    pressed: 'bg-yellow-950/80 border-4 border-kinder-yellow scale-95',
  },
  {
    icon: Heart,
    dim: 'bg-pink-950/80 border-2 border-pink-900',
    lit: 'bg-kinder-pink border-2 border-pink-300 scale-105',
    pressed: 'bg-pink-950/80 border-4 border-kinder-pink scale-95',
  },
  {
    icon: Shield,
    dim: 'bg-blue-950/80 border-2 border-blue-900',
    lit: 'bg-kinder-blue border-2 border-blue-300 scale-105',
    pressed: 'bg-blue-950/80 border-4 border-kinder-blue scale-95',
  },
  {
    icon: Sun,
    dim: 'bg-orange-950/80 border-2 border-orange-900',
    lit: 'bg-kinder-orange border-2 border-orange-300 scale-105',
    pressed: 'bg-orange-950/80 border-4 border-kinder-orange scale-95',
  },
]

const SIMON_WIN = 10

export function SimonGame() {
  const [sequence, setSequence] = useState<number[]>([])
  const [playerStep, setPlayerStep] = useState(0)
  const [litBtn, setLitBtn] = useState<number | null>(null)
  const [pressedBtn, setPressedBtn] = useState<number | null>(null)
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'gameover' | 'win'>('idle')
  const [round, setRound] = useState(0)

  function playSeq(seq: number[]) {
    setPhase('showing')
    setPlayerStep(0)
    setLitBtn(null)
    seq.forEach((btnIdx, i) => {
      setTimeout(() => setLitBtn(btnIdx), i * 700 + 300)
      setTimeout(() => setLitBtn(null), i * 700 + 720)
    })
    setTimeout(() => setPhase('input'), seq.length * 700 + 420)
  }

  function startGame() {
    const seq = [Math.floor(Math.random() * 4)]
    setSequence(seq)
    setRound(1)
    playSeq(seq)
  }

  function handlePress(btnIdx: number) {
    if (phase !== 'input') return
    setPressedBtn(btnIdx)
    setTimeout(() => setPressedBtn(null), 220)
    const expected = sequence[playerStep]
    if (btnIdx !== expected) {
      setPhase('gameover')
      return
    }
    if (playerStep + 1 === sequence.length) {
      if (round >= SIMON_WIN) {
        setPhase('win')
        return
      }
      const nextSeq = [...sequence, Math.floor(Math.random() * 4)]
      setSequence(nextSeq)
      setRound((r) => r + 1)
      setPhase('showing')
      setTimeout(() => playSeq(nextSeq), 600)
    } else {
      setPlayerStep((s) => s + 1)
    }
  }

  function resetGame() {
    setSequence([])
    setPlayerStep(0)
    setLitBtn(null)
    setPhase('idle')
    setRound(0)
  }

  return (
    <div>
      {phase === 'idle' && (
        <div className="text-center py-2">
          <div className="grid grid-cols-2 gap-2 w-24 mx-auto mb-4 pointer-events-none">
            {SIMON_BTNS.map(({ icon: Icon, dim }, i) => (
              <div
                key={i}
                className={`h-10 rounded-xl flex items-center justify-center ${dim} opacity-70`}
              >
                <Icon size={16} className="text-white" />
              </div>
            ))}
          </div>
          <p className="text-white font-extrabold text-lg mb-1">Simon Says</p>
          <p className="text-gray-400 text-sm mb-5">Watch the sequence — then repeat it!</p>
          <button
            onClick={startGame}
            className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full"
          >
            Start
          </button>
        </div>
      )}

      {(phase === 'showing' || phase === 'input') && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">
              Round <span className="text-white font-bold">{round}</span>/{SIMON_WIN}
            </span>
            <span className="text-gray-500 text-xs">
              {phase === 'showing' ? 'Watch...' : `Step ${playerStep + 1} / ${sequence.length}`}
            </span>
            <button
              onClick={resetGame}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-2.5 py-1 rounded-lg transition-colors"
            >
              <RotateCcw size={10} /> Quit
            </button>
          </div>
          <div
            className={`grid grid-cols-2 gap-3 ${phase !== 'input' ? 'pointer-events-none' : ''}`}
          >
            {SIMON_BTNS.map(({ icon: Icon, dim, lit, pressed }, i) => (
              <button
                key={i}
                onClick={() => handlePress(i)}
                className={`h-24 rounded-2xl flex items-center justify-center transition-all duration-150 ${
                  litBtn === i ? lit : pressedBtn === i ? pressed : dim
                }`}
              >
                <Icon size={32} className="text-white" />
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="text-center py-6">
          <p className="text-red-400 font-extrabold text-4xl mb-2">Wrong!</p>
          <p className="text-gray-400 text-sm mb-1">
            You reached round <span className="text-white font-bold">{round}</span>
          </p>
          <p className="text-gray-600 text-xs mb-6">Sequence length was {sequence.length}</p>
          <button
            onClick={resetGame}
            className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}

      {phase === 'win' && (
        <div className="text-center py-6">
          <Trophy size={40} className="text-kinder-yellow mx-auto mb-3" />
          <p className="text-white font-extrabold text-xl mb-1">Perfect!</p>
          <p className="text-gray-400 text-sm mb-6">You cleared all {SIMON_WIN} rounds!</p>
          <button
            onClick={resetGame}
            className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}
