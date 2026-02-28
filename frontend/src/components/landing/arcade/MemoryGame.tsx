import { useState } from 'react'
import { Star, Heart, BookOpen, Music, Palette, Sun, RotateCcw, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MCard {
  id: number
  pairId: number
  icon: LucideIcon
  color: string
  flipped: boolean
  matched: boolean
}

const PAIRS: { icon: LucideIcon; color: string }[] = [
  { icon: Star, color: 'bg-kinder-yellow' },
  { icon: Heart, color: 'bg-kinder-pink' },
  { icon: BookOpen, color: 'bg-kinder-blue' },
  { icon: Music, color: 'bg-kinder-purple' },
  { icon: Palette, color: 'bg-kinder-green' },
  { icon: Sun, color: 'bg-kinder-orange' },
]

function shufflePairs(): MCard[] {
  const deck: MCard[] = []
  PAIRS.forEach((p, pairId) => {
    deck.push({
      id: pairId * 2,
      pairId,
      icon: p.icon,
      color: p.color,
      flipped: false,
      matched: false,
    })
    deck.push({
      id: pairId * 2 + 1,
      pairId,
      icon: p.icon,
      color: p.color,
      flipped: false,
      matched: false,
    })
  })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function MemoryGame() {
  const [cards, setCards] = useState<MCard[]>(shufflePairs)
  const [firstId, setFirstId] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [moves, setMoves] = useState(0)

  const allMatched = cards.every((c) => c.matched)

  function handleFlip(cardId: number) {
    if (locked) return
    const card = cards.find((c) => c.id === cardId)
    if (!card || card.flipped || card.matched || cardId === firstId) return

    if (firstId === null) {
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)))
      setFirstId(cardId)
      return
    }

    const firstCard = cards.find((c) => c.id === firstId)!
    const isMatch = firstCard.pairId === card.pairId
    const capturedFirstId = firstId
    setMoves((m) => m + 1)

    if (isMatch) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === capturedFirstId || c.id === cardId ? { ...c, flipped: true, matched: true } : c
        )
      )
      setFirstId(null)
    } else {
      setLocked(true)
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)))
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === capturedFirstId || c.id === cardId ? { ...c, flipped: false } : c
          )
        )
        setFirstId(null)
        setLocked(false)
      }, 1000)
    }
  }

  function resetGame() {
    setCards(shufflePairs())
    setFirstId(null)
    setLocked(false)
    setMoves(0)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm">
          Moves: <span className="text-white font-bold">{moves}</span>
        </span>
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg"
        >
          <RotateCcw size={12} />
          Restart
        </button>
      </div>

      {allMatched ? (
        <div className="text-center py-8">
          <Trophy size={40} className="text-kinder-yellow mx-auto mb-3" />
          <p className="text-white font-extrabold text-xl mb-1">You won!</p>
          <p className="text-gray-400 text-sm mb-5">Completed in {moves} moves</p>
          <button
            onClick={resetGame}
            className="bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Play Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.id}
                style={{ perspective: '600px' }}
                className="relative aspect-square"
              >
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: card.flipped || card.matched ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.4s ease',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <div
                    style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
                    className="bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                    onClick={() => handleFlip(card.id)}
                  >
                    <Star size={16} className="text-gray-600" />
                  </div>
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      position: 'absolute',
                      inset: 0,
                    }}
                    className={`${card.color} rounded-xl flex items-center justify-center ${
                      card.matched ? 'opacity-50 ring-2 ring-white/20' : ''
                    }`}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
