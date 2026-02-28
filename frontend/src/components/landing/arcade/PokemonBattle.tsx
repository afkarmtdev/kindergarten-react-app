import { useState, useEffect } from 'react'
import { Trophy, RotateCcw, Shield, Zap } from 'lucide-react'

// ── Types ─────────────────────────────────────────────
interface Pokemon {
  id: number
  name: string
  sprite: string
  maxHp: number
  attack: number
  defense: number
  speed: number
}

// ── Static data ───────────────────────────────────────
const STARTERS = [
  { id: 1, name: 'Bulbasaur', move: 'Vine Whip', bg: 'bg-green-900/70' },
  { id: 4, name: 'Charmander', move: 'Ember', bg: 'bg-orange-900/70' },
  { id: 7, name: 'Squirtle', move: 'Water Gun', bg: 'bg-blue-900/70' },
]

const OPPONENTS = [
  { id: 16, move: 'Gust' }, // Pidgey
  { id: 19, move: 'Quick Attack' }, // Rattata
  { id: 23, move: 'Poison Sting' }, // Ekans
  { id: 39, move: 'Sing' }, // Jigglypuff
  { id: 52, move: 'Scratch' }, // Meowth
  { id: 54, move: 'Confusion' }, // Psyduck
  { id: 58, move: 'Bite' }, // Growlithe
  { id: 74, move: 'Rock Throw' }, // Geodude
  { id: 129, move: 'Splash' }, // Magikarp (easy win ;)
]

// ── Helpers ───────────────────────────────────────────
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function calcDamage(atk: number, def: number): number {
  const base = Math.floor((atk / Math.max(1, def)) * 18)
  return Math.max(4, Math.floor(base * (0.85 + Math.random() * 0.15)))
}

type PokeApiResponse = {
  name: string
  sprites: { front_default: string }
  stats: { base_stat: number; stat: { name: string } }[]
}

async function loadPokemon(id: number): Promise<Pokemon> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  if (!res.ok) throw new Error(`Failed to load Pokémon ${id}`)
  const d: PokeApiResponse = await res.json()
  const stat = (name: string) => d.stats.find((s) => s.stat.name === name)?.base_stat ?? 45
  return {
    id,
    name: d.name,
    sprite: d.sprites.front_default,
    maxHp: Math.max(50, stat('hp') * 2),
    attack: stat('attack'),
    defense: stat('defense'),
    speed: stat('speed'),
  }
}

// ── HP bar ────────────────────────────────────────────
function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, (current / max) * 100)
  const color = pct > 50 ? 'bg-kinder-green' : pct > 25 ? 'bg-kinder-yellow' : 'bg-red-500'
  return (
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <div
        className={`${color} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Shake + pixelated CSS injected once ───────────────
const BATTLE_CSS = `
  @keyframes poke-shake-p {
    0%,100% { transform: scaleX(-1) translateX(0); }
    25%     { transform: scaleX(-1) translateX(-5px); }
    75%     { transform: scaleX(-1) translateX(5px); }
  }
  @keyframes poke-shake-o {
    0%,100% { transform: translateX(0); }
    25%     { transform: translateX(-5px); }
    75%     { transform: translateX(5px); }
  }
  .poke-p       { transform: scaleX(-1); image-rendering: pixelated; }
  .poke-p-shake { animation: poke-shake-p 0.4s ease; image-rendering: pixelated; }
  .poke-o       { image-rendering: pixelated; }
  .poke-o-shake { animation: poke-shake-o 0.4s ease; image-rendering: pixelated; }
`

// ══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════
export function PokemonBattle() {
  // Phase
  const [phase, setPhase] = useState<'pick' | 'loading' | 'battle' | 'result'>('pick')

  // Pokémon data
  const [starterSprites, setStarterSprites] = useState<Record<number, string>>({})
  const [player, setPlayer] = useState<Pokemon | null>(null)
  const [opponent, setOpponent] = useState<Pokemon | null>(null)
  const [playerHp, setPlayerHp] = useState(0)
  const [opponentHp, setOpponentHp] = useState(0)

  // Battle state
  const [potions, setPotions] = useState(2)
  const [log, setLog] = useState<string[]>([])
  const [waiting, setWaiting] = useState(false)
  const [starterIdx, setStarterIdx] = useState(0)
  const [oppMove, setOppMove] = useState('')
  const [shakeP, setShakeP] = useState(false)
  const [shakeO, setShakeO] = useState(false)
  const [result, setResult] = useState<'win' | 'lose' | null>(null)
  const [fetchError, setFetchError] = useState(false)

  // Pre-load starter sprites for pick screen
  useEffect(() => {
    Promise.all(
      STARTERS.map((s) =>
        fetch(`https://pokeapi.co/api/v2/pokemon/${s.id}`)
          .then((r) => r.json())
          .then((d: PokeApiResponse) => [s.id, d.sprites.front_default] as [number, string])
      )
    )
      .then((pairs) => setStarterSprites(Object.fromEntries(pairs)))
      .catch(() => {})
  }, [])

  // ── Pick a starter ──────────────────────────────────
  async function pickStarter(idx: number) {
    setStarterIdx(idx)
    setFetchError(false)
    setPhase('loading')

    const opp = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)]
    try {
      const [pd, od] = await Promise.all([loadPokemon(STARTERS[idx].id), loadPokemon(opp.id)])
      setPlayer(pd)
      setOpponent(od)
      setPlayerHp(pd.maxHp)
      setOpponentHp(od.maxHp)
      setPotions(2)
      setOppMove(opp.move)
      setResult(null)
      setLog([`A wild ${cap(od.name)} appeared!`, `Go, ${cap(pd.name)}!`])
      setWaiting(true)
      setPhase('battle')
    } catch {
      setFetchError(true)
      setPhase('pick')
    }
  }

  // ── Take a turn ─────────────────────────────────────
  function takeTurn(action: 'attack' | 'bag') {
    if (!player || !opponent || !waiting) return
    setWaiting(false)

    const pName = cap(player.name)
    const oName = cap(opponent.name)
    const pMove = STARTERS[starterIdx].move
    const playerFirst = player.speed >= opponent.speed
    const pDmg = calcDamage(player.attack, opponent.defense)
    const oDmg = calcDamage(opponent.attack, player.defense)

    const newLogs: string[] = []
    let newPlayerHp = playerHp
    let newOpponentHp = opponentHp
    let newPotions = potions

    if (action === 'bag') {
      const healed = Math.min(20, player.maxHp - playerHp)
      newPlayerHp = Math.min(player.maxHp, playerHp + 20)
      newPotions = potions - 1
      newLogs.push(`${pName} used a Potion! +${healed} HP!`)
      newLogs.push(`${oName} used ${oppMove}! -${oDmg} dmg!`)
      newPlayerHp = Math.max(0, newPlayerHp - oDmg)
    } else if (playerFirst) {
      newOpponentHp = Math.max(0, opponentHp - pDmg)
      newLogs.push(`${pName} used ${pMove}! -${pDmg} dmg!`)
      if (newOpponentHp > 0) {
        newPlayerHp = Math.max(0, playerHp - oDmg)
        newLogs.push(`${oName} used ${oppMove}! -${oDmg} dmg!`)
      }
    } else {
      newPlayerHp = Math.max(0, playerHp - oDmg)
      newLogs.push(`${oName} used ${oppMove}! -${oDmg} dmg!`)
      if (newPlayerHp > 0) {
        newOpponentHp = Math.max(0, opponentHp - pDmg)
        newLogs.push(`${pName} used ${pMove}! -${pDmg} dmg!`)
      }
    }

    // Brief pause — then apply results + trigger shake animations
    setTimeout(() => {
      if (newPlayerHp < playerHp) {
        setShakeP(true)
        setTimeout(() => setShakeP(false), 420)
      }
      if (newOpponentHp < opponentHp) {
        setShakeO(true)
        setTimeout(() => setShakeO(false), 420)
      }

      setPlayerHp(newPlayerHp)
      setOpponentHp(newOpponentHp)
      setPotions(newPotions)
      setLog((prev) => [...prev, ...newLogs].slice(-5))

      if (newOpponentHp <= 0) {
        setTimeout(() => {
          setLog((prev) => [...prev, `${oName} fainted! You win!`].slice(-5))
          setResult('win')
          setPhase('result')
        }, 420)
      } else if (newPlayerHp <= 0) {
        setTimeout(() => {
          setLog((prev) => [...prev, `${pName} fainted...`].slice(-5))
          setResult('lose')
          setPhase('result')
        }, 420)
      } else {
        setWaiting(true)
      }
    }, 700)
  }

  function resetToPick() {
    setPhase('pick')
    setPlayer(null)
    setOpponent(null)
    setResult(null)
    setFetchError(false)
    setWaiting(false)
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: BATTLE_CSS }} />

      {/* ── Pick screen ──────────────────────────────── */}
      {phase === 'pick' && (
        <div>
          <p className="text-white font-extrabold text-base text-center mb-1">
            Choose your starter!
          </p>
          {fetchError && (
            <p className="text-red-400 text-xs text-center mb-2">
              Network error — check your connection and try again.
            </p>
          )}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {STARTERS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => pickStarter(idx)}
                className={`${s.bg} rounded-2xl p-3 text-center border-2 border-transparent hover:border-white/30 active:scale-95 transition-all hover:scale-105`}
              >
                {starterSprites[s.id] ? (
                  <img
                    src={starterSprites[s.id]}
                    alt={s.name}
                    className="w-full h-auto mx-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="h-16 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                  </div>
                )}
                <p className="text-white font-bold text-xs mt-1">{s.name}</p>
                <p className="text-white/50 text-xs">{s.move}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────── */}
      {phase === 'loading' && (
        <div className="text-center py-10">
          <Zap size={28} className="text-kinder-yellow mx-auto mb-3 animate-bounce" />
          <p className="text-gray-400 text-sm">Entering battle...</p>
        </div>
      )}

      {/* ── Battle ───────────────────────────────────── */}
      {phase === 'battle' && player && opponent && (
        <div>
          {/* Opponent row — info left, sprite right */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-white font-bold text-xs capitalize truncate">
                  {opponent.name}
                </span>
                <span className="text-gray-500 text-xs tabular-nums ml-2 flex-shrink-0">
                  {opponentHp}/{opponent.maxHp}
                </span>
              </div>
              <HpBar current={opponentHp} max={opponent.maxHp} />
            </div>
            <img
              src={opponent.sprite}
              alt={opponent.name}
              className={`w-20 h-20 object-contain flex-shrink-0 ${shakeO ? 'poke-o-shake' : 'poke-o'}`}
            />
          </div>

          {/* Player row — sprite left, info right */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={player.sprite}
              alt={player.name}
              className={`w-20 h-20 object-contain flex-shrink-0 ${shakeP ? 'poke-p-shake' : 'poke-p'}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-white font-bold text-xs capitalize truncate">
                  {player.name}
                </span>
                <span className="text-gray-500 text-xs tabular-nums ml-2 flex-shrink-0">
                  {playerHp}/{player.maxHp}
                </span>
              </div>
              <HpBar current={playerHp} max={player.maxHp} />
            </div>
          </div>

          {/* Battle log */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 mb-3 min-h-[52px]">
            {log.slice(-3).map((msg, i, arr) => (
              <p
                key={i}
                className={`text-xs leading-relaxed ${
                  i === arr.length - 1 ? 'text-white' : 'text-gray-600'
                }`}
              >
                {msg}
              </p>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => takeTurn('attack')}
              disabled={!waiting}
              className="py-2.5 rounded-xl font-bold text-sm bg-kinder-orange text-white hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Attack
            </button>
            <button
              onClick={() => takeTurn('bag')}
              disabled={!waiting || potions === 0 || playerHp >= player.maxHp}
              className="py-2.5 rounded-xl font-bold text-sm bg-kinder-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Potion ({potions})
            </button>
          </div>

          <button
            onClick={resetToPick}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-gray-600 hover:text-white transition-colors"
          >
            <RotateCcw size={11} /> Change starter
          </button>
        </div>
      )}

      {/* ── Result ───────────────────────────────────── */}
      {phase === 'result' && (
        <div className="text-center py-3">
          {result === 'win' ? (
            <>
              <Trophy size={40} className="text-kinder-yellow mx-auto mb-3" />
              <p className="text-white font-extrabold text-xl mb-1">Victory!</p>
              <p className="text-gray-400 text-sm mb-4">
                {cap(player?.name ?? '')} won the battle!
              </p>
            </>
          ) : (
            <>
              <Shield size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-white font-extrabold text-xl mb-1">Defeated!</p>
              <p className="text-gray-400 text-sm mb-4">
                {cap(player?.name ?? '')} fainted... Try again!
              </p>
            </>
          )}

          {/* Final log snippet */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 mb-4 text-left">
            {log.slice(-3).map((msg, i, arr) => (
              <p
                key={i}
                className={`text-xs leading-relaxed ${
                  i === arr.length - 1 ? 'text-white' : 'text-gray-600'
                }`}
              >
                {msg}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => pickStarter(starterIdx)}
              className="py-2.5 rounded-xl font-semibold text-sm bg-kinder-orange text-white hover:bg-orange-600 transition-colors"
            >
              Rematch
            </button>
            <button
              onClick={resetToPick}
              className="py-2.5 rounded-xl font-semibold text-sm bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              New Starter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
