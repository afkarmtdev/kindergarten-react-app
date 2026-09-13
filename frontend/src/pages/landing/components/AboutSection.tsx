import { Sparkles, Quote, Compass } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { StickerBadge } from './StickerBadge'
import { Wave } from './Wave'
import { DoodleGiraffe } from '@/components/landing/doodles/DoodleGiraffe'

export interface AboutSectionProps {
  schoolName: string
  foundedYear: number | null
  story: string
  approach: string
  principalName: string
  principalMessage: string
  principalPhotoUrl: string | null
  photoUrls: string[]
  /** Fill of the NEXT section, painted on the closing wave. */
  waveFillClassName: string
}

const PHOTO_ROTATIONS = [-3, 2, -1.5]

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * "Our Story" — the school's own words. Rendered only when the school has
 * turned it on and written something; see useLandingContent().
 */
export function AboutSection({
  schoolName,
  foundedYear,
  story,
  approach,
  principalName,
  principalMessage,
  principalPhotoUrl,
  photoUrls,
  waveFillClassName,
}: AboutSectionProps) {
  const t = useT()
  const fadeIn = useFadeIn()
  const hasPrincipal = principalMessage !== ''
  const hasPhotos = photoUrls.length > 0

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-wash-butter pt-24 transition-colors duration-200"
    >
      <div
        className="lp-float absolute top-10 right-8 opacity-20 pointer-events-none"
        aria-hidden="true"
      >
        <Sparkles size={44} className="text-ink-butter" />
      </div>
      <div
        className="lp-float-slow absolute bottom-24 left-6 opacity-25 pointer-events-none"
        style={{ animationDelay: '1.2s' }}
        aria-hidden="true"
      >
        <DoodleGiraffe size={150} color="#FF6B35" />
      </div>

      <div
        ref={fadeIn.ref}
        className={`relative max-w-6xl mx-auto px-4 sm:px-6 ${fadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="mb-5">
            <StickerBadge color="bg-kinder-orange" textColor="text-white" rotate={-4}>
              {t('aboutBadge')}
            </StickerBadge>
          </div>
          <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            {t('aboutTitle', { school: schoolName })}
          </h2>
          {foundedYear !== null && (
            <p className="mt-4 inline-flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-full px-4 py-1.5 font-fun font-bold text-sm text-gray-700 dark:text-gray-300">
              {t('aboutFoundedIn', { year: foundedYear })}
            </p>
          )}
        </div>

        <div className={`grid gap-8 lg:gap-12 ${hasPrincipal ? 'lg:grid-cols-5' : ''}`}>
          {/* Story + approach */}
          <div className={`space-y-6 ${hasPrincipal ? 'lg:col-span-3' : 'max-w-3xl mx-auto'}`}>
            {story !== '' && (
              <p className="text-gray-700 dark:text-gray-300 text-lg sm:text-xl leading-relaxed whitespace-pre-line">
                {story}
              </p>
            )}
            {approach !== '' && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-800 flex gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-wash-mint flex items-center justify-center">
                  <Compass size={24} className="text-ink-mint" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-fun font-bold text-gray-900 dark:text-white text-lg mb-1">
                    {t('aboutApproachLabel')}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {approach}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Principal message */}
          {hasPrincipal && (
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border-2 border-gray-200 dark:border-gray-800 h-full flex flex-col">
                <Quote size={28} className="text-kinder-orange mb-4" fill="#FF6B35" />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line flex-1">
                  {principalMessage}
                </p>
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                  {principalPhotoUrl ? (
                    <img
                      src={principalPhotoUrl}
                      alt={principalName || t('principalLabel')}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-200 dark:border-gray-800"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-wash-peach flex items-center justify-center font-fun font-bold text-ink-peach">
                      {initials(principalName) || 'P'}
                    </div>
                  )}
                  <div>
                    {principalName !== '' && (
                      <p className="font-fun font-bold text-gray-900 dark:text-white">
                        {principalName}
                      </p>
                    )}
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      {t('principalLabel')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Photos */}
        {hasPhotos && (
          <div className="mt-12 flex flex-wrap justify-center gap-5 sm:gap-8">
            {photoUrls.slice(0, 3).map((url, i) => (
              <div
                key={url}
                className="w-40 h-40 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-md bg-gray-100 dark:bg-gray-800"
                style={{ transform: `rotate(${PHOTO_ROTATIONS[i] ?? 0}deg)` }}
              >
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-16">
        <Wave variant="scallop" fillClassName={waveFillClassName} />
      </div>
    </section>
  )
}
