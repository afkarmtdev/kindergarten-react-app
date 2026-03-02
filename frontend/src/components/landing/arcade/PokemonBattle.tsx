import { useState, useEffect } from 'react'
import { Trophy, RotateCcw, Shield, Zap } from 'lucide-react'

// ── Types ─────────────────────────────────────────────
type PokeType = 'fire' | 'water' | 'grass' | 'normal'

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
  {
    id: 1,
    name: 'Bulbasaur',
    type: 'grass' as PokeType,
    bg: 'bg-green-900/70',
    move1: { name: 'Vine Whip', power: 1.0, acc: 1.0 },
    move2: { name: 'Razor Leaf', power: 1.6, acc: 0.9 },
  },
  {
    id: 4,
    name: 'Charmander',
    type: 'fire' as PokeType,
    bg: 'bg-orange-900/70',
    move1: { name: 'Ember', power: 1.0, acc: 1.0 },
    move2: { name: 'Flamethrower', power: 1.6, acc: 0.85 },
  },
  {
    id: 7,
    name: 'Squirtle',
    type: 'water' as PokeType,
    bg: 'bg-blue-900/70',
    move1: { name: 'Water Gun', power: 1.0, acc: 1.0 },
    move2: { name: 'Hydro Pump', power: 1.8, acc: 0.8 },
  },
]

const OPPONENTS = [
  { id: 16, move: 'Gust', type: 'normal' as PokeType }, // Pidgey
  { id: 19, move: 'Quick Attack', type: 'normal' as PokeType }, // Rattata
  { id: 23, move: 'Poison Sting', type: 'normal' as PokeType }, // Ekans
  { id: 39, move: 'Sing', type: 'normal' as PokeType }, // Jigglypuff
  { id: 52, move: 'Scratch', type: 'normal' as PokeType }, // Meowth
  { id: 54, move: 'Confusion', type: 'water' as PokeType }, // Psyduck
  { id: 58, move: 'Bite', type: 'fire' as PokeType }, // Growlithe
  { id: 74, move: 'Rock Throw', type: 'normal' as PokeType }, // Geodude
  { id: 129, move: 'Splash', type: 'water' as PokeType }, // Magikarp
]

const TYPE_COLORS: Record<PokeType, string> = {
  fire: 'bg-orange-500/30 text-orange-300',
  water: 'bg-blue-500/30 text-blue-300',
  grass: 'bg-green-500/30 text-green-300',
  normal: 'bg-gray-500/30 text-gray-400',
}

// ── Helpers ───────────────────────────────────────────
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function typeMultiplier(atk: PokeType, def: PokeType): number {
  if (atk === 'fire' && def === 'grass') return 1.5
  if (atk === 'fire' && def === 'water') return 0.67
  if (atk === 'water' && def === 'fire') return 1.5
  if (atk === 'water' && def === 'grass') return 0.67
  if (atk === 'grass' && def === 'water') return 1.5
  if (atk === 'grass' && def === 'fire') return 0.67
  return 1
}

function effectivenessMsg(mult: number): string {
  if (mult >= 1.5) return ' Super effective!'
  if (mult <= 0.67) return ' Not very effective...'
  return ''
}

function calcDamage(
  atk: number,
  def: number,
  opts: { power?: number; acc?: number } = {}
): { damage: number; missed: boolean; isCrit: boolean } {
  const { power = 1.0, acc = 1.0 } = opts
  if (Math.random() > acc) return { damage: 0, missed: true, isCrit: false }
  const isCrit = Math.random() < 0.0625 // 1/16 chance
  const critMult = isCrit ? 1.5 : 1
  const base = Math.floor((atk / Math.max(1, def)) * 18 * power)
  const damage = Math.max(4, Math.floor(base * (0.85 + Math.random() * 0.15) * critMult))
  return { damage, missed: false, isCrit }
}

type PokeApiResponse = {
  name: string
  sprites: { front_default: string }
  stats: { base_stat: number; stat: { name: string } }[]
}

// Module-level cache — survives remounts and tab switches
const pokeCache = new Map<number, Pokemon>()
// In-flight deduplication — second caller awaits the same Promise, no duplicate fetch
const pokePending = new Map<number, Promise<Pokemon>>()

function loadPokemon(id: number): Promise<Pokemon> {
  if (pokeCache.has(id)) return Promise.resolve(pokeCache.get(id)!)
  if (pokePending.has(id)) return pokePending.get(id)!

  const promise = fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Failed to load Pokémon ${id}`)
      const d: PokeApiResponse = await res.json()
      const stat = (name: string) => d.stats.find((s) => s.stat.name === name)?.base_stat ?? 45
      const pokemon: Pokemon = {
        id,
        name: d.name,
        sprite: d.sprites.front_default,
        maxHp: Math.max(50, stat('hp') * 2),
        attack: stat('attack'),
        defense: stat('defense'),
        speed: stat('speed'),
      }
      pokeCache.set(id, pokemon)
      return pokemon
    })
    .finally(() => pokePending.delete(id))

  pokePending.set(id, promise)
  return promise
}

// Called by SecretArcade during the unlock animation window
export function prefetchPokemonCache() {
  const allIds = [...STARTERS.map((s) => s.id), ...OPPONENTS.map((o) => o.id)]
  allIds.forEach((id) => {
    if (!pokeCache.has(id)) loadPokemon(id).catch(() => {})
  })
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

// ── CSS injected once ──────────────────────────────────
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
  @keyframes float-dmg {
    0%   { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
  .poke-p       { transform: scaleX(-1); image-rendering: pixelated; }
  .poke-p-shake { animation: poke-shake-p 0.4s ease; image-rendering: pixelated; }
  .poke-o       { image-rendering: pixelated; }
  .poke-o-shake { animation: poke-shake-o 0.4s ease; image-rendering: pixelated; }
  .float-dmg    { animation: float-dmg 0.8s ease-out forwards; }
`

// ══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════
export function PokemonBattle() {
  // Phase
  const [phase, setPhase] = useState<'pick' | 'loading' | 'battle' | 'result'>('pick')

  // Pokémon data
  const [cachedStarters, setCachedStarters] = useState<Partial<Record<number, Pokemon>>>({})
  const [player, setPlayer] = useState<Pokemon | null>(null)
  const [opponent, setOpponent] = useState<Pokemon | null>(null)
  const [playerHp, setPlayerHp] = useState(0)
  const [opponentHp, setOpponentHp] = useState(0)
  const [opponentType, setOpponentType] = useState<PokeType>('normal')

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
  const [floatP, setFloatP] = useState<{ dmg: number; k: number } | null>(null)
  const [floatO, setFloatO] = useState<{ dmg: number; k: number } | null>(null)

  // Populate starter data — from cache if warm, otherwise fetch
  useEffect(() => {
    const fromCache = Object.fromEntries(
      STARTERS.filter((s) => pokeCache.has(s.id)).map((s) => [s.id, pokeCache.get(s.id)!])
    )
    if (Object.keys(fromCache).length > 0) setCachedStarters(fromCache)

    const missing = STARTERS.filter((s) => !pokeCache.has(s.id))
    if (missing.length > 0) {
      Promise.all(missing.map((s) => loadPokemon(s.id)))
        .then((pokemons) =>
          setCachedStarters((prev) => ({
            ...prev,
            ...Object.fromEntries(pokemons.map((p) => [p.id, p])),
          }))
        )
        .catch(() => {})
    }
  }, [])

  // ── Pick a starter ──────────────────────────────────
  async function pickStarter(idx: number) {
    setStarterIdx(idx)
    setFetchError(false)

    const opp = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)]
    if (!pokeCache.has(STARTERS[idx].id) || !pokeCache.has(opp.id)) setPhase('loading')

    try {
      const [pd, od] = await Promise.all([loadPokemon(STARTERS[idx].id), loadPokemon(opp.id)])
      setPlayer(pd)
      setOpponent(od)
      setOpponentType(opp.type)
      setPlayerHp(pd.maxHp)
      setOpponentHp(od.maxHp)
      setPotions(2)
      setOppMove(opp.move)
      setResult(null)
      setFloatP(null)
      setFloatO(null)
      setLog([`A wild ${cap(od.name)} appeared!`, `Go, ${cap(pd.name)}!`])
      setWaiting(true)
      setPhase('battle')
    } catch {
      setFetchError(true)
      setPhase('pick')
    }
  }

  // ── Take a turn ─────────────────────────────────────
  function takeTurn(action: 'move1' | 'move2' | 'bag') {
    if (!player || !opponent || !waiting) return
    setWaiting(false)

    const pName = cap(player.name)
    const oName = cap(opponent.name)
    const starter = STARTERS[starterIdx]
    const moveData = action === 'move2' ? starter.move2 : starter.move1
    const playerFirst = player.speed >= opponent.speed

    const pTypeMult = typeMultiplier(starter.type, opponentType)
    const oTypeMult = typeMultiplier(opponentType, starter.type)

    const pHit = calcDamage(player.attack, opponent.defense, {
      power: moveData.power * pTypeMult,
      acc: moveData.acc,
    })
    const oHit = calcDamage(opponent.attack, player.defense, { power: oTypeMult })

    const newLogs: string[] = []
    let newPlayerHp = playerHp
    let newOpponentHp = opponentHp
    let newPotions = potions
    let floatDmgP = 0
    let floatDmgO = 0

    if (action === 'bag') {
      const healed = Math.min(20, player.maxHp - playerHp)
      newPlayerHp = Math.min(player.maxHp, playerHp + 20)
      newPotions = potions - 1
      newLogs.push(`${pName} used a Potion! +${healed} HP!`)
      if (oHit.missed) {
        newLogs.push(`${oName} used ${oppMove}! Missed!`)
      } else {
        floatDmgP = oHit.damage
        newPlayerHp = Math.max(0, newPlayerHp - oHit.damage)
        newLogs.push(
          `${oName} used ${oppMove}! -${oHit.damage} dmg!` +
            (oHit.isCrit ? ' Critical hit!' : '') +
            effectivenessMsg(oTypeMult)
        )
      }
    } else if (playerFirst) {
      if (pHit.missed) {
        newLogs.push(`${pName} used ${moveData.name}! Missed!`)
      } else {
        floatDmgO = pHit.damage
        newOpponentHp = Math.max(0, opponentHp - pHit.damage)
        newLogs.push(
          `${pName} used ${moveData.name}! -${pHit.damage} dmg!` +
            (pHit.isCrit ? ' Critical hit!' : '') +
            effectivenessMsg(pTypeMult)
        )
      }
      if (newOpponentHp > 0) {
        if (oHit.missed) {
          newLogs.push(`${oName} used ${oppMove}! Missed!`)
        } else {
          floatDmgP = oHit.damage
          newPlayerHp = Math.max(0, playerHp - oHit.damage)
          newLogs.push(
            `${oName} used ${oppMove}! -${oHit.damage} dmg!` +
              (oHit.isCrit ? ' Critical hit!' : '') +
              effectivenessMsg(oTypeMult)
          )
        }
      }
    } else {
      if (oHit.missed) {
        newLogs.push(`${oName} used ${oppMove}! Missed!`)
      } else {
        floatDmgP = oHit.damage
        newPlayerHp = Math.max(0, playerHp - oHit.damage)
        newLogs.push(
          `${oName} used ${oppMove}! -${oHit.damage} dmg!` +
            (oHit.isCrit ? ' Critical hit!' : '') +
            effectivenessMsg(oTypeMult)
        )
      }
      if (newPlayerHp > 0) {
        if (pHit.missed) {
          newLogs.push(`${pName} used ${moveData.name}! Missed!`)
        } else {
          floatDmgO = pHit.damage
          newOpponentHp = Math.max(0, opponentHp - pHit.damage)
          newLogs.push(
            `${pName} used ${moveData.name}! -${pHit.damage} dmg!` +
              (pHit.isCrit ? ' Critical hit!' : '') +
              effectivenessMsg(pTypeMult)
          )
        }
      }
    }

    setTimeout(() => {
      const k = Date.now()
      if (floatDmgP > 0) {
        setShakeP(true)
        setTimeout(() => setShakeP(false), 420)
        setFloatP({ dmg: floatDmgP, k })
      }
      if (floatDmgO > 0) {
        setShakeO(true)
        setTimeout(() => setShakeO(false), 420)
        setFloatO({ dmg: floatDmgO, k: k + 1 })
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
    setFloatP(null)
    setFloatO(null)
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
            {STARTERS.map((s, idx) => {
              const data = cachedStarters[s.id]
              return (
                <button
                  key={s.id}
                  onClick={() => pickStarter(idx)}
                  className={`${s.bg} rounded-2xl p-3 text-center border-2 border-transparent hover:border-white/30 active:scale-95 transition-all hover:scale-105`}
                >
                  {data ? (
                    <img
                      src={data.sprite}
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
                  <span
                    className={`inline-block text-xs px-1.5 py-0.5 rounded-full capitalize mb-1.5 ${TYPE_COLORS[s.type]}`}
                  >
                    {s.type}
                  </span>
                  {data && (
                    <div className="space-y-0.5 text-left">
                      {(
                        [
                          ['HP', data.maxHp, 200],
                          ['ATK', data.attack, 80],
                          ['DEF', data.defense, 80],
                        ] as [string, number, number][]
                      ).map(([label, val, max]) => (
                        <div key={label} className="flex items-center gap-1">
                          <span className="text-white/40 text-xs w-5">{label}</span>
                          <div className="flex-1 bg-gray-700 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-kinder-yellow h-1 rounded-full"
                              style={{ width: `${Math.min(100, (val / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
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
            <div className="relative flex-shrink-0 w-20 h-20">
              <img
                src={opponent.sprite}
                alt={opponent.name}
                className={`w-20 h-20 object-contain ${shakeO ? 'poke-o-shake' : 'poke-o'}`}
              />
              {floatO && (
                <div
                  key={floatO.k}
                  className="absolute -top-5 inset-x-0 flex justify-center pointer-events-none"
                >
                  <span className="text-red-400 font-bold text-sm float-dmg">-{floatO.dmg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Player row — sprite left, info right */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-shrink-0 w-20 h-20">
              <img
                src={player.sprite}
                alt={player.name}
                className={`w-20 h-20 object-contain ${shakeP ? 'poke-p-shake' : 'poke-p'}`}
              />
              {floatP && (
                <div
                  key={floatP.k}
                  className="absolute -top-5 inset-x-0 flex justify-center pointer-events-none"
                >
                  <span className="text-red-400 font-bold text-sm float-dmg">-{floatP.dmg}</span>
                </div>
              )}
            </div>
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

          {/* Move buttons */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => takeTurn('move1')}
              disabled={!waiting}
              className="py-2.5 rounded-xl font-bold text-sm bg-kinder-orange text-white hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {STARTERS[starterIdx].move1.name}
            </button>
            <button
              onClick={() => takeTurn('move2')}
              disabled={!waiting}
              className="py-2 rounded-xl font-bold text-sm bg-kinder-purple text-white hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center leading-tight"
            >
              <span>{STARTERS[starterIdx].move2.name}</span>
              <span className="text-xs opacity-60 font-normal">
                {Math.round(STARTERS[starterIdx].move2.acc * 100)}% accuracy
              </span>
            </button>
          </div>

          {/* Potion */}
          <button
            onClick={() => takeTurn('bag')}
            disabled={!waiting || potions === 0 || playerHp >= player.maxHp}
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-kinder-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-2"
          >
            Potion ({potions})
          </button>

          <button
            onClick={resetToPick}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-600 hover:text-white transition-colors"
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
