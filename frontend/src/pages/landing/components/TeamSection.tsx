import { Users } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { StickerBadge } from './StickerBadge'
import { Wave } from './Wave'
import { DoodleBunny } from '@/components/landing/doodles/DoodleBunny'
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** "Meet the team" — the adults a parent will actually meet at the gate. */
export function TeamSection({ members, waveFillClassName }: TeamSectionProps) {
  const t = useT()
  const fadeIn = useFadeIn()

  return (
    <section className="relative overflow-hidden bg-wash-lavender pt-24 transition-colors duration-200">
      <div
        className="lp-float absolute top-10 right-8 opacity-25 pointer-events-none"
        style={{ animationDelay: '0.9s' }}
        aria-hidden="true"
      >
        <DoodleBunny size={120} color="#C77DFF" />
      </div>
      <div
        ref={fadeIn.ref}
        className={`relative max-w-6xl mx-auto px-4 sm:px-6 ${fadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        <div className="text-center mb-12">
          <div className="mb-5">
            <StickerBadge color="bg-kinder-purple" textColor="text-white" rotate={3}>
              {t('teamBadge')}
            </StickerBadge>
          </div>
          <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('teamTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
            {t('teamSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {members.map((m, i) => {
            const tint = TILE_TINTS[i % TILE_TINTS.length]
            return (
              <div
                key={m.id}
                className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 border-2 border-gray-200 dark:border-gray-800 text-center hover:-translate-y-1 transition-transform duration-200"
                style={fadeIn.isVisible ? { animationDelay: `${i * 60}ms` } : undefined}
              >
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    loading="lazy"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-sm"
                  />
                ) : (
                  <div
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full ${tint.bg} ${tint.text} flex items-center justify-center mx-auto mb-4 font-fun font-bold text-2xl`}
                  >
                    {initials(m.name) || <Users size={28} />}
                  </div>
                )}
                <p className="font-fun font-bold text-gray-900 dark:text-white text-lg leading-tight">
                  {m.name}
                </p>
                {m.role !== '' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{m.role}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-16">
        <Wave variant="scallop" fillClassName={waveFillClassName} />
      </div>
    </section>
  )
}
