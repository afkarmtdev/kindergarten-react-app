import { useState, type ReactNode } from 'react'
import { Flag, Compass, MessageCircle, ZoomIn } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { StickerBadge } from './StickerBadge'
import { Wave } from './Wave'
import { PhotoLightbox } from './PhotoLightbox'
import { StoryChapter, type StoryChapterTone } from './StoryChapter'
import { DoodleOwl } from '@/components/landing/doodles/DoodleOwl'
import { FloatingDoodle } from '@/components/landing/doodles/FloatingDoodle'
import { DoodleStar } from '@/components/landing/doodles/DoodleStar'
import { DoodleSpiral } from '@/components/landing/doodles/DoodleSpiral'
import { DoodleCloud } from '@/components/landing/doodles/DoodleCloud'
import { DoodleZigzag } from '@/components/landing/doodles/DoodleZigzag'
import type { LucideIcon } from 'lucide-react'

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

const PHOTO_ROTATIONS = [3, -3, 6]
const BLOB_RADIUS = '48% 52% 42% 58% / 55% 40% 60% 45%'

/** Dotted path that winds between the chapters; stretched to the chapters' full height. */
const PATH_D =
  'M60 0 C60 120 20 180 40 300 C60 420 100 480 80 620 C60 760 20 820 40 940 C50 980 60 990 60 1000'

interface ChapterSpec {
  key: string
  title: string
  body: string
  tone: StoryChapterTone
  icon: LucideIcon
  aside: ReactNode | null
  footer?: ReactNode
  letter?: boolean
}

interface TakenPhoto {
  url: string
  index: number
}

/**
 * "Our Story" — the school's own words, told as up to three chapters along a
 * winding path: when we opened, how we teach, a word from the principal.
 * Rendered only when the school has turned it on and written something; see useLandingContent().
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
  const photos = photoUrls.slice(0, 3)
  const [openPhoto, setOpenPhoto] = useState<number | null>(null)

  const chapterLabels = [t('aboutChapterOne'), t('aboutChapterTwo'), t('aboutChapterThree')]

  // Photos are handed out to chapters in order; any beyond that are not shown.
  let nextPhoto = 0
  const takePhoto = (): TakenPhoto | null => {
    const url = photos[nextPhoto]
    if (url === undefined) return null
    return { url, index: nextPhoto++ }
  }

  const photoCard = (photo: TakenPhoto, className: string) => (
    <button
      type="button"
      onClick={() => setOpenPhoto(photo.index)}
      aria-label={t('viewPhoto')}
      className={`group/photo relative rounded-3xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-md bg-gray-100 dark:bg-gray-800 cursor-pointer transition-shadow duration-200 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-kinder-orange/50 ${className}`}
      style={{ transform: `rotate(${PHOTO_ROTATIONS[photo.index] ?? 0}deg)` }}
    >
      <img
        src={photo.url}
        alt=""
        className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-110"
        loading="lazy"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-200">
        <ZoomIn size={32} className="text-white drop-shadow" />
      </span>
    </button>
  )

  const sidePhoto = (photo: TakenPhoto | null) =>
    photo === null ? null : photoCard(photo, 'w-full max-w-[300px] aspect-[5/4]')

  const chapters: ChapterSpec[] = []

  if (story !== '') {
    chapters.push({
      key: 'story',
      title:
        foundedYear !== null
          ? t('aboutStoryTitleYear', { year: foundedYear })
          : t('aboutStoryTitle'),
      body: story,
      tone: 'peach',
      icon: Flag,
      aside: sidePhoto(takePhoto()),
    })
  }

  if (approach !== '') {
    chapters.push({
      key: 'approach',
      title: t('aboutApproachLabel'),
      body: approach,
      tone: 'mint',
      icon: Compass,
      aside: sidePhoto(takePhoto()),
    })
  }

  if (principalMessage !== '') {
    // The portrait alone sits beside the principal's message; a classroom photo
    // is only used here when there is no portrait.
    const aside =
      principalPhotoUrl !== null ? (
        <img
          src={principalPhotoUrl}
          alt={principalName || t('principalLabel')}
          className="w-64 h-64 sm:w-72 sm:h-72 object-cover border-4 border-white dark:border-gray-800 ring-2 ring-gray-200 dark:ring-gray-700 bg-gray-100 dark:bg-gray-800"
          style={{ borderRadius: BLOB_RADIUS }}
          loading="lazy"
        />
      ) : (
        sidePhoto(takePhoto())
      )

    chapters.push({
      key: 'principal',
      title:
        principalName !== ''
          ? t('aboutPrincipalTitle', { name: principalName })
          : t('principalMessageLabel'),
      body: principalMessage,
      tone: 'blush',
      icon: MessageCircle,
      aside,
      letter: true,
      footer: (
        <div className="flex flex-col gap-0.5 pt-4 border-t border-gray-100 dark:border-gray-800">
          {principalName !== '' && (
            <p className="font-fun font-semibold text-2xl text-ink-peach">{principalName}</p>
          )}
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {t('principalLabel')}
          </p>
        </div>
      ),
    })
  }

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-wash-butter dark:bg-wash-ocean pt-24 transition-colors duration-200"
    >
      {/* Animal doodle — shrunk on phones like every other section's animal */}
      <FloatingDoodle position="top-12 right-8" animation="float" shrinkFrom="top-right">
        <DoodleOwl size={380} color="#C77DFF" />
      </FloatingDoodle>
      {/* A few shapes at the edges, one per chapter side */}
      <FloatingDoodle position="top-8 left-1/4" animation="alt" delay={0.4} mdUp>
        <DoodleCloud size={208} color="#4D96FF" />
      </FloatingDoodle>
      <FloatingDoodle position="top-1/2 left-1/4" animation="alt" delay={2.6} mdUp>
        <DoodleSpiral size={160} color="#C77DFF" />
      </FloatingDoodle>
      <FloatingDoodle position="bottom-1/4 right-1/4" animation="float" delay={1.9}>
        <DoodleStar size={120} color="#4D96FF" />
      </FloatingDoodle>
      {/* Below lg the principal photo is centred, so the zigzag hugs the left edge there */}
      <FloatingDoodle position="bottom-32 -left-12 lg:left-1/3" animation="alt" delay={0.9}>
        <DoodleZigzag size={160} color="#FF85A2" />
      </FloatingDoodle>

      <div
        ref={fadeIn.ref}
        className={`relative max-w-6xl mx-auto px-4 sm:px-6 ${fadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        {/* Heading */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="mb-5">
            <StickerBadge color="bg-kinder-orange" textColor="text-white" rotate={-4}>
              {t('aboutBadge')}
            </StickerBadge>
          </div>
          <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            {t('aboutTitle', { school: schoolName })}
          </h2>
          {story === '' && foundedYear !== null && (
            <p className="mt-4 inline-flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-full px-4 py-1.5 font-fun font-bold text-sm text-gray-700 dark:text-gray-300">
              {t('aboutFoundedIn', { year: foundedYear })}
            </p>
          )}
        </div>

        {/* Chapters along the path */}
        <div className="relative">
          {chapters.length > 1 && (
            <svg
              className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-[120px] h-full text-kinder-orange pointer-events-none"
              viewBox="0 0 120 1000"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d={PATH_D}
                fill="none"
                stroke="currentColor"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="2 14"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          <div className="relative flex flex-col gap-16 lg:gap-24">
            {chapters.map((chapter, i) => (
              <StoryChapter
                key={chapter.key}
                index={i}
                label={chapterLabels[i] ?? ''}
                title={chapter.title}
                body={chapter.body}
                tone={chapter.tone}
                icon={chapter.icon}
                aside={chapter.aside}
                footer={chapter.footer}
                letter={chapter.letter}
              />
            ))}
          </div>
        </div>
      </div>

      <PhotoLightbox
        urls={photos.slice(0, nextPhoto)}
        index={openPhoto}
        onClose={() => setOpenPhoto(null)}
        onNavigate={setOpenPhoto}
      />
      <div className="mt-20">
        <Wave variant="scallop" fillClassName={waveFillClassName} />
      </div>
    </section>
  )
}
