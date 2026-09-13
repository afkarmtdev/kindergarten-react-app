import { Users } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { StickerBadge } from './StickerBadge'
import { Wave } from './Wave'
import { DoodlePenguin } from '@/components/landing/doodles/DoodlePenguin'
import { FloatingDoodle } from '@/components/landing/doodles/FloatingDoodle'
import { DoodleStar } from '@/components/landing/doodles/DoodleStar'
import { DoodleFlower } from '@/components/landing/doodles/DoodleFlower'
import { DoodleCloud } from '@/components/landing/doodles/DoodleCloud'
import type { ResolvedTeamMember } from '@/hooks/useLandingContent'

export interface TeamSectionProps {
  members: ResolvedTeamMember[]
  /** Fill of the NEXT section, painted on the closing wave. */
  waveFillClassName: string
}

const TILE_TINTS = [
  { bg: 'bg-wash-sky', text: 'text-ink-sky' },
  { bg: 'bg-wash-mint', text: 'text-ink-mint' },
  { bg: 'bg-wash-blush', text: 'text-ink-blush' },
  { bg: 'bg-wash-peach', text: 'text-ink-peach' },
  { bg: 'bg-wash-butter', text: 'text-ink-butter' },
]

/** Each print leans a little differently, like photos taped up by hand. */
const PRINT_TILTS = ['-rotate-3', 'rotate-2', '-rotate-2', 'rotate-3', '-rotate-1', 'rotate-2']

/** Washi tape across the top edge — translucent brights, each strip tilted the other way. */
const TAPES = [
  'bg-kinder-yellow/80 -rotate-6',
  'bg-kinder-pink/80 rotate-3',
  'bg-kinder-blue/70 -rotate-3',
  'bg-kinder-green/75 rotate-6',
  'bg-kinder-yellow/80 -rotate-3',
  'bg-kinder-purple/70 rotate-3',
]

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Splits "Meet the team" into ["Meet the ", "team"] so the last word can be the bright one. */
function splitLastWord(title: string): [string, string] {
  const idx = title.lastIndexOf(' ')
  return idx === -1 ? ['', title] : [title.slice(0, idx + 1), title.slice(idx + 1)]
}

/** "Meet the team" — the adults a parent will actually meet at the gate, as prints taped to the wall. */
export function TeamSection({ members, waveFillClassName }: TeamSectionProps) {
  const t = useT()
  const fadeIn = useFadeIn()
  const [titleStart, titleHighlight] = splitLastWord(t('teamTitle'))

  return (
    <section className="relative overflow-hidden bg-wash-lavender pt-24 transition-colors duration-200">
      {/* Phones: top-left beside the heading, since the member cards are opaque */}
      <FloatingDoodle
        position="top-6 -left-6 md:top-auto md:bottom-36 md:left-8"
        animation="slow"
        delay={1.8}
        shrinkFrom="top-left"
      >
        <DoodlePenguin size={380} color="#4D96FF" />
      </FloatingDoodle>
      {/* A few shapes at the edges */}
      <FloatingDoodle position="top-10 left-8" animation="spin" mdUp>
        <DoodleStar size={160} color="#FF6B35" />
      </FloatingDoodle>
      <FloatingDoodle position="top-1/3 right-1/4" animation="float" delay={1.3} mdUp>
        <DoodleFlower size={176} color="#6BCB77" />
      </FloatingDoodle>
      <FloatingDoodle position="bottom-32 right-1/4" animation="float" delay={0.3}>
        <DoodleCloud size={200} color="#4D96FF" />
      </FloatingDoodle>
      <div
        ref={fadeIn.ref}
        className={`relative max-w-6xl mx-auto px-4 sm:px-6 ${fadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        <div className="text-center mb-14">
          <div className="mb-5">
            <StickerBadge color="bg-kinder-purple" textColor="text-white" rotate={3}>
              {t('teamBadge')}
            </StickerBadge>
          </div>
          <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {titleStart}
            <span className="relative inline-block text-kinder-orange">
              {titleHighlight}
              <svg
                className="absolute -bottom-1.5 left-0 w-full"
                viewBox="0 0 110 12"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 8 C 30 2, 60 10, 107 4"
                  stroke="#FFD93D"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
            {t('teamSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-12 max-w-4xl mx-auto pt-4">
          {members.map((m, i) => {
            const tint = TILE_TINTS[i % TILE_TINTS.length]
            const tilt = PRINT_TILTS[i % PRINT_TILTS.length]
            const tape = TAPES[i % TAPES.length]
            // Middle column hangs a little lower on desktop, so the wall reads as hand-arranged
            const stagger = i % 3 === 1 ? 'md:mt-10' : ''
            return (
              <div
                key={m.id}
                className={`relative bg-white dark:bg-gray-900 rounded-[14px] p-3 pb-4 border-2 border-gray-200 dark:border-gray-800 flex flex-col gap-3 shadow-[0_10px_24px_rgba(52,42,34,0.10)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.40)] ${tilt} ${stagger} hover:-translate-y-1 transition-transform duration-200`}
                style={fadeIn.isVisible ? { animationDelay: `${i * 60}ms` } : undefined}
              >
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 w-[92px] h-[26px] rounded-[3px] ${tape}`}
                  aria-hidden="true"
                />
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    loading="lazy"
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className={`w-full aspect-square rounded-lg ${tint.bg} ${tint.text} flex items-center justify-center font-fun font-bold text-4xl`}
                  >
                    {initials(m.name) || <Users size={36} />}
                  </div>
                )}
                <div className="text-center">
                  <p className="font-fun font-bold text-gray-900 dark:text-white text-lg sm:text-xl leading-tight">
                    {m.name}
                  </p>
                  {m.role !== '' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{m.role}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-20">
        <Wave variant="scallop" fillClassName={waveFillClassName} />
      </div>
    </section>
  )
}
