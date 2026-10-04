import { QrCode } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { Wave } from './Wave'
import { StickerBadge } from './StickerBadge'
import { StarField } from './StarField'
import { SectionBackdrop } from './SectionBackdrop'
import { SpotlightGlow, TITLE_GLOW_HEIGHT } from './SpotlightGlow'
import { CrayonWord } from './CrayonWord'
import { FloatingDoodle } from '@/components/landing/doodles/FloatingDoodle'
import { DoodleGiraffe } from '@/components/landing/doodles/DoodleGiraffe'
import { DoodleStar } from '@/components/landing/doodles/DoodleStar'
import { DoodlePaperPlane } from '@/components/landing/doodles/DoodlePaperPlane'
import { DoodleSparkle } from '@/components/landing/doodles/DoodleSparkle'

export interface RegisterSectionProps {
  /** The school's QR code image (Settings > Website > Registration QR). */
  qrUrl: string
  schoolName: string
  /** Fill of the NEXT section, painted on the closing wave. */
  waveFillClassName: string
}

/** "Scan to register" — the school's enrolment QR code; every Register Now button scrolls here. */
export function RegisterSection({ qrUrl, schoolName, waveFillClassName }: RegisterSectionProps) {
  const t = useT()
  const { ref, isVisible } = useFadeIn()

  return (
    <section
      id="register"
      className="relative lp-clip bg-wash-sky pt-24 transition-colors duration-200"
    >
      <SectionBackdrop tint="sky" pattern="polka">
        <SpotlightGlow
          position="top-0 left-1/2 -translate-x-1/2"
          color="#FF85A2"
          size={620}
          height={TITLE_GLOW_HEIGHT}
        />
        <FloatingDoodle ghost position="bottom-[-100px] right-[-120px]" mdUp>
          <DoodleStar size={600} color="#4D96FF" />
        </FloatingDoodle>
      </SectionBackdrop>
      <StarField variant="a" />
      {/* Giraffe — top-left, mirrored to face the code; shrinks on phones */}
      <FloatingDoodle
        position="top-8 left-8"
        animation="slow"
        delay={0.9}
        shrinkFrom="top-left"
        flip
      >
        <DoodleGiraffe size={360} color="#FF6B35" />
      </FloatingDoodle>
      {/* Small shapes in the side margins, clear of the code */}
      <FloatingDoodle position="top-10 right-12" animation="spin" mdUp>
        <DoodleSparkle size={108} color="#C77DFF" />
      </FloatingDoodle>
      <FloatingDoodle position="bottom-36 left-16" animation="alt" delay={1.4} mdUp>
        <DoodlePaperPlane size={140} color="#6BCB77" />
      </FloatingDoodle>

      <div
        ref={ref}
        className={`relative max-w-3xl mx-auto px-4 sm:px-6 ${isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        <div className="text-center mb-10">
          <div className="mb-5">
            <StickerBadge color="bg-kinder-yellow" textColor="text-gray-900" rotate={-3}>
              {t('registerNow')}
            </StickerBadge>
          </div>
          <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            <CrayonWord text={t('registerTitle')} color="#FF85A2" />
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg mt-3 max-w-xl mx-auto">
            {t('registerSubtitle')}
          </p>
        </div>

        {/* Taped up like the team prints. The tilt is safe: a QR code scans at any angle. */}
        <div className="flex justify-center pt-3">
          <figure className="relative -rotate-2 bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-5 border-2 border-gray-200 dark:border-gray-800">
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-[92px] h-[26px] rounded-[3px] bg-kinder-yellow/80 rotate-3"
              aria-hidden="true"
            />
            {/* Light in dark mode too: the code needs its light quiet zone to scan.
                Multiply tints the image's own white to the tile's warm white, so
                the upload does not show as a paler square on the card. */}
            <div className="bg-white rounded-2xl p-2">
              <img
                src={qrUrl}
                alt={t('registerQrAlt', { school: schoolName })}
                width={288}
                height={288}
                loading="lazy"
                decoding="async"
                className="block w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 mix-blend-multiply"
              />
            </div>
            <figcaption className="mt-3 flex items-center justify-center gap-2 font-fun font-bold text-lg text-gray-900 dark:text-white">
              <QrCode size={18} className="text-kinder-orange" aria-hidden="true" />
              {t('registerScanMe')}
            </figcaption>
          </figure>
        </div>
      </div>

      <div className="mt-16">
        <Wave variant="scallop" fillClassName={waveFillClassName} />
      </div>
    </section>
  )
}
