import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Star,
  ZoomIn,
  Heart,
  Sun,
  Moon,
  ArrowUp,
  Camera,
  Lock,
  Megaphone,
  Pin,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users,
  School,
  Award,
  ChevronDown,
} from 'lucide-react'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSettingsStore } from '@/store/settingsStore'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useInViewport } from '@/hooks/useInViewport'
import { useFadeIn } from '@/hooks/useFadeIn'
import { galleryApi, announcementsApi, testimonialsApi, artWallApi, careersApi } from '@/lib/api'
import { CORK_STYLE, CORK_STYLE_DARK } from '@/pages/art-wall/constants'
import { useLandingContent } from '@/hooks/useLandingContent'
import { useFontsReady } from '@/hooks/useFontsReady'
import { useSettledOrTimeout } from '@/hooks/useSettledOrTimeout'
import { StickerBear } from '@/components/ui/StickerBear'
import { useMalaysiaDay } from '@/hooks/useMalaysiaDay'
import { Wave } from './components/Wave'
import { ArtworkCard } from '@/pages/art-wall/components/ArtworkCard'
import { ArtworkCardSkeleton } from '@/pages/art-wall/components/ArtworkCardSkeleton'
import { ArtworkLightbox } from '@/pages/art-wall/components/ArtworkLightbox'
import { StatCounter } from './components/StatCounter'
import { TypedText } from './components/TypedText'
import { FeatureCard } from './components/FeatureCard'
import { StickerBadge } from './components/StickerBadge'
import { MobileCTABar } from './components/MobileCTABar'
import { WhatsAppButton } from './components/WhatsAppButton'
import { InquiryForm } from './components/InquiryForm'
import { CoinFlipLogo } from '@/components/ui/CoinFlipLogo'
import type { Announcement } from '@/types'
import { CareersSection } from './components/CareersSection'
import { LocationSection } from './components/LocationSection'
import { LandingFooter } from './components/LandingFooter'
import { NoticeModal } from './components/NoticeModal'
import { StarField } from './components/StarField'
import { AboutSection } from './components/AboutSection'
import { TeamSection } from './components/TeamSection'
import { TestimonialCarousel } from './components/TestimonialCarousel'
import {
  KEYFRAMES,
  NOTICE_CATEGORY_COLORS,
  NOTICE_CATEGORY_GRADIENTS,
  GALLERY_PLACEHOLDERS,
} from './constants'
import { DoodleStar } from '@/components/landing/doodles/DoodleStar'
import { DoodleCloud } from '@/components/landing/doodles/DoodleCloud'
import { DoodleSun } from '@/components/landing/doodles/DoodleSun'
import { DoodleFlower } from '@/components/landing/doodles/DoodleFlower'
import { DoodleSpiral } from '@/components/landing/doodles/DoodleSpiral'
import { DoodleDino } from '@/components/landing/doodles/DoodleDino'
import { DoodleMonkey } from '@/components/landing/doodles/DoodleMonkey'
import { DoodleElephant } from '@/components/landing/doodles/DoodleElephant'
import { DoodleWhale } from '@/components/landing/doodles/DoodleWhale'
import { DoodleCat } from '@/components/landing/doodles/DoodleCat'
import { DoodleBunny } from '@/components/landing/doodles/DoodleBunny'
import { DoodleHeart } from '@/components/landing/doodles/DoodleHeart'
import { DoodleHeartSparkle } from '@/components/landing/doodles/DoodleHeartSparkle'
import { DoodlePuzzle } from '@/components/landing/doodles/DoodlePuzzle'
import { DoodlePaperPlane } from '@/components/landing/doodles/DoodlePaperPlane'
import { DoodleSparkle } from '@/components/landing/doodles/DoodleSparkle'
import { DoodleApple } from '@/components/landing/doodles/DoodleApple'
import { DoodleLadybird } from '@/components/landing/doodles/DoodleLadybird'
import { FloatingDoodle } from '@/components/landing/doodles/FloatingDoodle'
import { SectionBackdrop } from './components/SectionBackdrop'
import { SpotlightGlow, TITLE_GLOW_HEIGHT } from './components/SpotlightGlow'
import { OutlineWatermark } from './components/OutlineWatermark'
import { CrayonWord } from './components/CrayonWord'

const STAT_LABEL_KEYS = {
  students: 'statsStudentsLabel',
  staff: 'statsTeachersLabel',
  classes: 'statsClassesLabel',
  rating: 'statsRatingLabel',
} as const
const STAT_ICONS = {
  students: GraduationCap,
  staff: Users,
  classes: School,
  rating: Award,
} as const
const STAT_TINTS = { students: 'sky', staff: 'mint', classes: 'butter', rating: 'blush' } as const

export function LandingPage() {
  const t = useT()
  const { darkMode, lang, toggleDark, setLang } = useSettingsStore()
  const malaysiaDay = useMalaysiaDay()
  const { logoUrl, schoolName } = useSchoolInfo({ public: true })
  // Hero background effects (mesh drift, shooting stars, floating shapes) only
  // run while the hero is near the viewport — see useInViewport.
  const heroRef = useRef<HTMLElement>(null)
  const heroInView = useInViewport(heroRef)
  const heroAnim = (cls: string) => (heroInView ? cls : undefined)
  const content = useLandingContent()
  usePageTitle(undefined, schoolName)
  const [showTop, setShowTop] = useState(false)
  // Hold the hero entrance until fonts AND the school's copy are in. Either
  // arriving mid-animation reflows the h1, which iOS Safari paints as ghost text.
  // The wait is long enough to cover a slow mobile connection; a request that
  // fails settles isLoaded on its own, so the timeout only guards a hang.
  const fontsReady = useFontsReady()
  const contentReady = useSettledOrTimeout(content.isLoaded, 8000)
  const heroReady = fontsReady && contentReady

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxArtId, setLightboxArtId] = useState<string | null>(null)
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null)

  const galleryScrollRef = useRef<HTMLDivElement>(null)
  const artWallHeadingRef = useRef<HTMLElement>(null)

  const featuresFadeIn = useFadeIn()
  const galleryFadeIn = useFadeIn()
  const artWallFadeIn = useFadeIn()
  const noticesFadeIn = useFadeIn()
  const testimonialsFadeIn = useFadeIn()

  const ONE_HOUR = 60 * 60 * 1000

  const { data: galleryData } = useQuery({
    queryKey: ['gallery-public'],
    queryFn: () => galleryApi.getVisible(),
    staleTime: ONE_HOUR,
  })
  const galleryItems = galleryData?.data ?? []

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements-public'],
    queryFn: () => announcementsApi.getPublic(),
    staleTime: ONE_HOUR,
  })
  const notices = announcementsData?.data ?? []

  const { data: testimonialsData } = useQuery({
    queryKey: ['testimonials-public'],
    queryFn: () => testimonialsApi.getPublic(),
    staleTime: ONE_HOUR,
  })
  const testimonials = testimonialsData?.data ?? []

  const { data: careersData } = useQuery({
    queryKey: ['careers-public'],
    queryFn: () => careersApi.getPublicPostings(),
    staleTime: ONE_HOUR,
  })
  const hasCareers = (careersData?.data ?? []).length > 0

  // Section chain below the hero: each closing wave is painted in the NEXT
  // visible section's colour, so work out the order once here.
  // Order: hero → story → programmes → testimonials → notices → team → numbers
  //        → gallery → artists → enquiry → careers → promise strip
  const WHITE_FILL = 'fill-white dark:fill-gray-950'
  // The promise strip is a bright pink poster band in light; in dark it drops to the
  // blush nebula tint so it sits inside the galaxy instead of glowing on top of it.
  const PROMISE_FILL = 'fill-kinder-pink dark:fill-wash-blush'
  const hasTestimonials = testimonials.length > 0
  const afterFeaturesFill = hasTestimonials ? 'fill-wash-sky' : 'fill-wash-lavender'
  const afterAboutFill = content.features.show ? WHITE_FILL : afterFeaturesFill
  const afterTeamFill = content.stats.show ? 'fill-wash-peach dark:fill-wash-ocean' : WHITE_FILL
  const afterNoticesFill = content.team.show ? 'fill-wash-lavender' : afterTeamFill
  const afterInquiryFill = hasCareers ? 'fill-wash-mint' : PROMISE_FILL
  // The hero has no scallop wave: its mesh gradient (galaxy in dark) melts into
  // whatever colour the next band is through this bottom fade, so the join is
  // seamless. A short fade that starts around the monkey doodle's feet, in both modes.
  const afterHeroFade = content.about.show
    ? 'to-wash-butter dark:to-wash-ocean'
    : content.features.show
      ? 'to-white dark:to-gray-950'
      : hasTestimonials
        ? 'to-wash-sky'
        : 'to-wash-lavender'

  const {
    data: artWallInfiniteData,
    fetchNextPage: fetchMoreArtwork,
    hasNextPage: hasMoreArtwork,
    isFetchingNextPage: isLoadingMoreArtwork,
  } = useInfiniteQuery({
    queryKey: ['art-wall-public'],
    queryFn: ({ pageParam }) => artWallApi.getPublic({ page: pageParam as number, limit: 8 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: {
      data: import('@/types').ArtWallItem[]
      meta: { page: number; totalPages: number }
    }) => (lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined),
    staleTime: ONE_HOUR,
  })
  const allArtWallItems = (artWallInfiniteData?.pages.flatMap(
    (p: { data: import('@/types').ArtWallItem[] }) => p.data
  ) ?? []) as import('@/types').ArtWallItem[]
  const initialCount = typeof window !== 'undefined' && window.innerWidth < 640 ? 4 : 8
  const [displayedCount, setDisplayedCount] = useState(initialCount)
  // Track which index onwards should animate in — reset after animation completes
  const animatedFromIdx = useRef(-1)
  const artWallItems = allArtWallItems.slice(0, displayedCount)
  const hasMoreToShow = displayedCount < allArtWallItems.length || !!hasMoreArtwork

  function handleShowMore() {
    const newCount = displayedCount + 4
    animatedFromIdx.current = artWallItems.length
    if (newCount > allArtWallItems.length && hasMoreArtwork) {
      fetchMoreArtwork().then(() => setDisplayedCount(newCount))
    } else {
      setDisplayedCount(newCount)
    }
    setTimeout(() => {
      animatedFromIdx.current = -1
    }, 600)
  }

  function handleShowLess() {
    setDisplayedCount(initialCount)
    artWallHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 320)
      document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}`)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : galleryItems.length - 1))
      if (e.key === 'ArrowRight')
        setLightboxIndex((i) => (i !== null && i < galleryItems.length - 1 ? i + 1 : 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, galleryItems.length])

  return (
    <div className="cursor-bear min-h-screen bg-white dark:bg-gray-950 font-display lp-clip-x transition-colors duration-200">
      {/* Inject keyframe CSS */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* ════════════════════════════════════════════════════════
          NAVBAR — sticky, glass blur
      ════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <CoinFlipLogo
              logoUrl={logoUrl}
              frontClassName="w-12 h-12 flex items-center justify-center"
              backClassName={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-sm border ${
                logoUrl
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-kinder-orange/10 dark:bg-kinder-orange/20 border-kinder-orange/30'
              }`}
              back={
                <span className="text-base font-extrabold text-kinder-orange">
                  {schoolName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase() ?? '')
                    .join('')}
                </span>
              }
            >
              <StickerBear
                size={40}
                cap={darkMode ? 'nightcap' : 'none'}
                flag={malaysiaDay ? 'malaysia' : 'none'}
              />
            </CoinFlipLogo>
            <span
              className={`font-fun font-bold text-gray-900 dark:text-white tracking-tight max-w-[200px] md:max-w-xs truncate block ${
                schoolName.length > 30
                  ? 'text-base'
                  : schoolName.length > 20
                    ? 'text-lg'
                    : 'text-xl'
              } transition-all duration-300`}
              title={schoolName}
            >
              {schoolName}
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500 dark:text-gray-400">
            <a href="#about" className="hover:text-kinder-orange transition-colors">
              {t('about')}
            </a>
            <a href="#programs" className="hover:text-kinder-orange transition-colors">
              {t('ourPrograms')}
            </a>
            <a href="#notices" className="hover:text-kinder-orange transition-colors">
              {t('announcements')}
            </a>
            <a href="#contact" className="hover:text-kinder-orange transition-colors">
              {t('contact')}
            </a>
          </div>

          {/* Settings toggles */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-kinder-orange hover:text-kinder-orange dark:hover:border-kinder-orange dark:hover:text-kinder-orange transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Language toggle */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-bold">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-2 transition-colors ${
                  lang === 'en'
                    ? 'bg-kinder-orange text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-kinder-orange dark:hover:text-kinder-orange'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ms')}
                className={`px-3 py-2 transition-colors ${
                  lang === 'ms'
                    ? 'bg-kinder-orange text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-kinder-orange dark:hover:text-kinder-orange'
                }`}
              >
                BM
              </button>
            </div>

            {/* Admin Login CTA */}
            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-2 bg-kinder-orange text-white rounded-full font-bold text-sm shadow-sm hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-md transition-all w-9 h-9 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5"
            >
              <Lock size={15} />
              <span className="hidden sm:inline">{t('adminLogin')}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════
          HERO — gradient bg, floating shapes, big heading
      ════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        id={content.about.show ? 'home' : 'about'}
        className="relative lp-clip"
      >
        {/* Mesh gradient background — light mode */}
        <div
          className={`absolute inset-0 lp-mesh-gradient block dark:hidden ${heroAnim('lp-mesh-gradient-run') ?? ''}`}
          style={
            {
              '--lp-mesh':
                'linear-gradient(135deg, #FFFAF5 0%, #FFF3E4 22%, #FFEEF2 45%, #EAF1FF 68%, #FFFAF5 85%, #F5EEFF 100%)',
            } as CSSProperties
          }
          aria-hidden="true"
        />
        {/* Mesh gradient background — dark mode */}
        <div
          className={`absolute inset-0 lp-mesh-gradient hidden dark:block ${heroAnim('lp-mesh-gradient-run') ?? ''}`}
          style={
            {
              '--lp-mesh':
                'linear-gradient(135deg, #030712 0%, #111827 25%, #1e1b4b 50%, #0f172a 75%, #030712 100%)',
            } as CSSProperties
          }
          aria-hidden="true"
        />

        {/* ── Bottom fade — blends the mesh into the next band. Sits UNDER the
            grain so the speckle runs through the join instead of stopping on a
            flat strip and restarting at the next section's top edge. ── */}
        <div
          className={`absolute inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-b from-transparent ${afterHeroFade}`}
          aria-hidden="true"
        />

        {/* Paper grain over the mesh and the fade, under everything else */}
        <SectionBackdrop tint="neutral" />

        {/* ── Nebula glow blobs — dark mode only, cool-toned depth ── */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none hidden dark:block opacity-10"
          style={{
            background: 'radial-gradient(circle, #7C3AED, transparent 70%)',
            transform: 'translate(-50%,-50%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none hidden dark:block opacity-8"
          style={{
            background: 'radial-gradient(circle, #0D9488, transparent 70%)',
            transform: 'translate(50%,-50%)',
            opacity: 0.08,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 left-1/2 w-72 h-72 rounded-full pointer-events-none hidden dark:block"
          style={{
            background: 'radial-gradient(circle, #BE185D, transparent 70%)',
            transform: 'translate(-50%,50%)',
            opacity: 0.07,
          }}
          aria-hidden="true"
        />

        {/* ── Static background stars — tiny dim dots for depth (dark mode only) ── */}
        <div className="absolute inset-0 pointer-events-none hidden dark:block" aria-hidden="true">
          {(
            [
              [5, 10, 1],
              [8, 25, 2],
              [3, 50, 1],
              [11, 65, 1],
              [2, 80, 2],
              [15, 5, 1],
              [18, 30, 1],
              [20, 48, 2],
              [12, 70, 1],
              [25, 85, 1],
              [30, 15, 2],
              [28, 42, 1],
              [35, 60, 1],
              [22, 90, 1],
              [40, 8, 1],
              [45, 35, 2],
              [42, 55, 1],
              [38, 75, 1],
              [48, 92, 1],
              [55, 20, 1],
              [50, 45, 2],
              [58, 65, 1],
              [65, 88, 1],
              [60, 12, 1],
              [70, 50, 1],
            ] as [number, number, number][]
          ).map(([top, left, size], i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ top: `${top}%`, left: `${left}%`, width: size, height: size, opacity: 0.22 }}
            />
          ))}
        </div>

        {/* ── Star field — dark mode only ── */}
        <StarField variant="a" />

        {/* ── Shooting stars — dark mode only; fire every ~13s at staggered times ── */}
        <div
          className={`absolute pointer-events-none hidden dark:block ${heroAnim('lp-shooting-star') ?? ''}`}
          style={{
            opacity: 0,
            top: '12%',
            right: '22%',
            width: 110,
            height: 2,
            background: 'linear-gradient(90deg, white, transparent)',
            animationDelay: '1s',
            animationFillMode: 'backwards',
          }}
          aria-hidden="true"
        />
        <div
          className={`absolute pointer-events-none hidden dark:block ${heroAnim('lp-shooting-star') ?? ''}`}
          style={{
            opacity: 0,
            top: '28%',
            right: '48%',
            width: 80,
            height: 1.5,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.75), transparent)',
            animationDelay: '7.5s',
            animationFillMode: 'backwards',
          }}
          aria-hidden="true"
        />

        {/* ── Floating decorative shapes (with parallax outer wrapper) ── */}
        <div
          className="hidden md:block lp-parallax-fast absolute top-16 left-6 pointer-events-none"
          aria-hidden="true"
        >
          <div className={heroAnim('lp-float')} style={{ opacity: 0.6 }}>
            <DoodleStar size={120} color="#FFD93D" />
          </div>
        </div>

        <div
          className="lp-parallax-medium absolute top-20 right-10 pointer-events-none"
          aria-hidden="true"
        >
          <div className={heroAnim('lp-float-alt')} style={{ opacity: 0.5, animationDelay: '-1s' }}>
            <DoodleCloud size={224} color="#4D96FF" />
          </div>
        </div>

        {/* Animal doodles — lg+ only so they never crowd the phone hero */}

        <div
          className="hidden lg:block lp-parallax-medium absolute bottom-8 left-[37%] pointer-events-none"
          aria-hidden="true"
        >
          <div
            className={heroAnim('lp-float-alt')}
            style={{ opacity: 0.45, animationDelay: '-2.4s' }}
          >
            <DoodleMonkey size={360} color="#C77DFF" />
          </div>
        </div>

        <div
          className="lp-parallax-slow absolute top-1/2 left-16 pointer-events-none"
          aria-hidden="true"
        >
          <div className={heroAnim('lp-float-alt')} style={{ opacity: 0.4, animationDelay: '-2s' }}>
            <DoodleSpiral size={160} color="#C77DFF" />
          </div>
        </div>

        <div
          className="lp-parallax-slow absolute top-1/2 right-6 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className={heroAnim('lp-float-slow')}
            style={{ opacity: 0.45, animationDelay: '-1.2s' }}
          >
            <DoodleHeart size={100} color="#FF6B35" />
          </div>
        </div>

        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 dark:opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FF6B35, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* ── Hero content ── */}
        <div
          className={`relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-6 ${heroReady ? '' : 'lp-fonts-pending'}`}
        >
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Text column */}
            <div className="text-center lg:text-left">
              <div
                className="lp-enter-0 inline-flex items-center gap-2 bg-kinder-yellow text-gray-900 border-2 border-white dark:border-gray-900 px-5 py-2 rounded-full font-fun text-sm font-bold shadow-md mb-8"
                style={{ transform: 'rotate(-3deg)' }}
              >
                <Star size={13} fill="#FF6B35" stroke="#FF6B35" />
                {content.hero.tagline}
              </div>

              <h1 className="lp-enter-1 font-fun text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-[1.05] tracking-tight mb-6">
                <span className="block">{content.hero.headlineStart}</span>
                <span className="relative inline-block text-kinder-orange mx-1">
                  {/* Never type the built-in placeholder: wait for the school's word. */}
                  {content.isLoaded ? (
                    <TypedText
                      key={content.hero.headlineHighlight}
                      text={content.hero.headlineHighlight}
                      delay={800}
                      speed={80}
                    />
                  ) : (
                    ' '
                  )}
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 10 Q50 2 100 9 Q150 16 196 7"
                      stroke="#FFD93D"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
                <span className="block xl:inline"> {content.hero.headlineEnd}</span>
              </h1>

              <p className="lp-enter-2 text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10">
                {content.hero.subtitle}
              </p>

              <div className="lp-enter-2 relative z-30 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-16">
                <a
                  href="#contact"
                  className="bg-kinder-orange text-white px-6 sm:px-10 py-3 sm:py-4 rounded-full font-extrabold text-base sm:text-lg shadow-lg shadow-orange-200 dark:shadow-orange-900/40 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-200 dark:hover:shadow-orange-900/50 hover:bg-orange-600 transition-all duration-200 text-center"
                >
                  {t('bookTour')}
                </a>
                <a
                  href="#programs"
                  className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-6 sm:px-10 py-3 sm:py-4 rounded-full font-extrabold text-base sm:text-lg hover:-translate-y-1.5 hover:border-kinder-orange hover:text-kinder-orange dark:hover:border-kinder-orange dark:hover:text-kinder-orange transition-all duration-200 text-center"
                >
                  {t('ourPrograms')}
                </a>
              </div>
            </div>

            {/* Right column — gallery photo (if available) or bear mascot */}
            {galleryItems.length > 0 ? (
              <div className="hidden lg:block lp-enter-2 relative">
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <clipPath id="hero-blob" clipPathUnits="objectBoundingBox">
                      <path d="M0.5,0.02 C0.73,0.02 0.92,0.1 0.97,0.3 C1.02,0.5 0.95,0.7 0.85,0.85 C0.75,0.95 0.6,0.99 0.45,0.98 C0.3,0.97 0.12,0.9 0.05,0.73 C-0.02,0.55 0.01,0.35 0.1,0.2 C0.2,0.08 0.35,0.02 0.5,0.02" />
                    </clipPath>
                  </defs>
                </svg>
                <div
                  className="w-full aspect-square max-w-lg mx-auto"
                  style={{ clipPath: 'url(#hero-blob)' }}
                >
                  <img
                    src={galleryItems[0].photo_url}
                    alt="School life"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="absolute inset-0 max-w-lg mx-auto aspect-square rounded-full border-4 border-dashed border-kinder-yellow/30 -z-10 scale-110"
                  aria-hidden="true"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          OUR STORY — school-written (Settings > Website > Our Story)
      ════════════════════════════════════════════════════════ */}
      {content.about.show && (
        <AboutSection
          schoolName={schoolName}
          foundedYear={content.about.foundedYear}
          story={content.about.story}
          approach={content.about.approach}
          principalName={content.about.principalName}
          principalMessage={content.about.principalMessage}
          principalPhotoUrl={content.about.principalPhotoUrl}
          photoUrls={content.about.photoUrls}
          waveFillClassName={afterAboutFill}
        />
      )}

      {/* ════════════════════════════════════════════════════════
          FEATURES — programme cards the school picked
      ════════════════════════════════════════════════════════ */}
      {content.features.show && (
        <section
          id="programs"
          className="relative lp-clip bg-white dark:bg-gray-950 pt-24 transition-colors duration-200"
        >
          <SectionBackdrop tint="neutral" pattern="dots">
            <SpotlightGlow
              position="top-0 left-1/2 -translate-x-1/2"
              color="#C77DFF"
              size={600}
              height={TITLE_GLOW_HEIGHT}
            />
            <SpotlightGlow position="bottom-10 left-[-120px]" color="#4D96FF" size={480} />
            <OutlineWatermark
              text="ABC"
              position="bottom-10 md:bottom-auto md:top-10 right-[-2rem]"
              rotate={-6}
            />
            <FloatingDoodle ghost position="bottom-[-120px] right-1/4" mdUp>
              <DoodleCloud size={640} color="#4D96FF" />
            </FloatingDoodle>
          </SectionBackdrop>
          <StarField variant="b" />
          <FloatingDoodle position="top-10 left-6" animation="slow" shrinkFrom="top-left" flip>
            <DoodleElephant size={380} color="#4D96FF" />
          </FloatingDoodle>
          {/* Shapes in the side margins, clear of the card grid */}
          <FloatingDoodle position="top-10 right-10" animation="alt" delay={0.5} mdUp>
            <DoodleCloud size={216} color="#C77DFF" />
          </FloatingDoodle>
          <FloatingDoodle position="bottom-24 left-12" animation="alt" delay={1.8}>
            <DoodlePuzzle size={112} color="#6BCB77" />
          </FloatingDoodle>
          <FloatingDoodle position="bottom-36 right-12" animation="float" delay={0.9} mdUp>
            <DoodleFlower size={156} color="#FFD93D" />
          </FloatingDoodle>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <div className="mb-5">
                <StickerBadge color="bg-kinder-purple" textColor="text-white" rotate={-3}>
                  {t('ourPrograms')}
                </StickerBadge>
              </div>
              <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                <CrayonWord text={t('featuresTitle')} color="#FFD93D" />
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
                {t('featuresSubtitle')}
              </p>
            </div>

            <div ref={featuresFadeIn.ref} className="grid md:grid-cols-3 gap-6 md:items-start">
              {content.features.cards.map(
                ({ key, icon, color, titleKey, descKey, expandedKey }, idx) => (
                  <FeatureCard
                    key={key}
                    icon={icon}
                    color={color}
                    titleKey={titleKey}
                    descKey={descKey}
                    expandedKey={expandedKey}
                    badge={
                      idx === 0 ? (
                        <StickerBadge color="bg-kinder-pink" textColor="text-white" rotate={8}>
                          {t('badgePopular')}
                        </StickerBadge>
                      ) : idx === 3 ? (
                        <StickerBadge
                          color="bg-kinder-yellow"
                          textColor="text-gray-900"
                          rotate={-10}
                        >
                          {t('badgeLoved')}
                        </StickerBadge>
                      ) : undefined
                    }
                    className={featuresFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}
                    style={
                      featuresFadeIn.isVisible ? { animationDelay: `${idx * 100}ms` } : undefined
                    }
                  />
                )
              )}
            </div>
          </div>

          <div className="mt-16">
            <Wave variant="scallop" fillClassName={afterFeaturesFill} />
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          TESTIMONIALS — what parents say
      ════════════════════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="relative lp-clip bg-wash-sky pt-24 transition-colors duration-200">
          <SectionBackdrop tint="sky" pattern="hearts">
            <SpotlightGlow
              position="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              color="#FF85A2"
              size={720}
            />
            <FloatingDoodle
              ghost
              position="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              mdUp
            >
              <DoodleHeart size={760} color="#FF85A2" />
            </FloatingDoodle>
          </SectionBackdrop>
          <StarField variant="b" />
          {/* Animal doodle — shrunk on phones like every other section's animal */}
          <FloatingDoodle
            position="top-6 left-8"
            animation="slow"
            delay={1.4}
            shrinkFrom="top-left"
          >
            <DoodleLadybird size={440} color="#FF6B35" />
          </FloatingDoodle>
          {/* Shapes in the side margins, clear of the carousel */}
          <FloatingDoodle position="top-8 right-12" animation="alt" delay={0.7} mdUp>
            <DoodleCloud size={200} color="#C77DFF" />
          </FloatingDoodle>
          <FloatingDoodle
            position="top-1/2 right-20 -translate-y-1/2"
            animation="none"
            opacity={0.35}
            mdUp
          >
            <DoodleApple size={144} color="#6BCB77" />
          </FloatingDoodle>
          <FloatingDoodle position="bottom-16 left-10" animation="alt" delay={1.1}>
            <DoodleHeartSparkle size={104} color="#FF85A2" />
          </FloatingDoodle>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div
              className={`text-center mb-14 ${testimonialsFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
              ref={testimonialsFadeIn.ref}
            >
              <div className="mb-5">
                <StickerBadge color="bg-kinder-yellow" textColor="text-gray-900" rotate={4}>
                  {t('testimonialsBadge')}
                </StickerBadge>
              </div>
              <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                <CrayonWord text={t('testimonialsTitle')} color="#FF85A2" />
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                {t('testimonialsSubtitle', { school: schoolName })}
              </p>
            </div>

            <TestimonialCarousel testimonials={testimonials} />
          </div>

          <div className="mt-16">
            <Wave variant="scallop" fillClassName="fill-wash-lavender" />
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          NOTICES
      ════════════════════════════════════════════════════════ */}
      <section
        id="notices"
        className="relative lp-clip bg-wash-lavender pt-24 transition-colors duration-200"
      >
        <SectionBackdrop tint="lavender" pattern="grid">
          <SpotlightGlow
            position="top-0 left-1/2 -translate-x-1/2"
            color="#4D96FF"
            size={600}
            height={TITLE_GLOW_HEIGHT}
          />
        </SectionBackdrop>
        <StarField variant="a" />
        {/* Floating decorative shapes */}
        <FloatingDoodle position="top-8 left-8 text-ink-lavender" opacity={0.25}>
          <Megaphone size={176} strokeWidth={1.25} />
        </FloatingDoodle>
        {/* Phones: top-right beside the heading, since the cards below are opaque */}
        <FloatingDoodle
          position="top-6 -right-6 md:top-1/2 md:right-6 md:-translate-y-1/2"
          animation="slow"
          delay={2}
          shrinkFrom="top-right"
        >
          <DoodleDino size={360} color="#6BCB77" />
        </FloatingDoodle>
        {/* Sun sits two-thirds down the left edge, well clear of the megaphone above it */}
        <FloatingDoodle position="top-2/3 left-12 -translate-y-1/2" animation="spin" mdUp>
          <DoodleSun size={124} color="#FF6B35" />
        </FloatingDoodle>

        <div
          ref={noticesFadeIn.ref}
          className={`relative max-w-7xl mx-auto px-4 sm:px-6 mb-10 text-center ${noticesFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
        >
          <div className="mb-5">
            <StickerBadge color="bg-kinder-purple" textColor="text-white" rotate={-3}>
              {t('noticesBadge')}
            </StickerBadge>
          </div>
          <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            <CrayonWord text={t('noticesTitle')} color="#FFD93D" />
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            {t('noticesSubtitle', { school: schoolName })}
          </p>
        </div>

        {notices.length > 0 ? (
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {notices.slice(0, 6).map((notice, idx) => (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => setSelectedNotice(notice)}
                  className={`text-left flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-sm border-2 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-kinder-orange ${
                    notice.is_pinned
                      ? 'border-kinder-yellow dark:border-kinder-yellow'
                      : 'border-gray-200 dark:border-gray-800'
                  } ${noticesFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
                  style={noticesFadeIn.isVisible ? { animationDelay: `${idx * 80}ms` } : undefined}
                >
                  {notice.image_url ? (
                    <div className="h-36 overflow-hidden">
                      <img
                        src={notice.image_url}
                        alt={notice.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).parentElement!.className =
                            `h-36 bg-gradient-to-br ${NOTICE_CATEGORY_GRADIENTS[notice.category]}`
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`h-36 bg-gradient-to-br ${NOTICE_CATEGORY_GRADIENTS[notice.category]}`}
                    />
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${NOTICE_CATEGORY_COLORS[notice.category]}`}
                      >
                        {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
                      </span>
                      {notice.is_pinned && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-kinder-yellow/20 text-yellow-700 dark:text-yellow-500 flex items-center gap-1">
                          <Pin size={10} />
                          {t('pinnedBadge')}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug mb-1.5 line-clamp-2">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                      {notice.body}
                    </p>

                    {notice.expires_at && (
                      <div className="flex items-center gap-1 mt-auto pt-3 text-xs text-gray-400 dark:text-gray-500">
                        <Calendar size={11} />
                        {new Date(notice.expires_at).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
            <div className="bg-white/70 dark:bg-gray-900/60 border-2 border-dashed border-ink-lavender/40 rounded-3xl p-10 text-center">
              <div className="w-14 h-14 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Megaphone size={26} className="text-ink-lavender" />
              </div>
              <h3 className="font-fun font-bold text-gray-900 dark:text-white text-lg mb-2">
                {t('noticesEmptyTitle')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {t('noticesEmptySubtitle')}
              </p>
            </div>
          </div>
        )}

        <div className="mt-16">
          <Wave variant="scallop" fillClassName={afterNoticesFill} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MEET THE TEAM — school-written (Settings > Website > Team)
      ════════════════════════════════════════════════════════ */}
      {content.team.show && (
        <TeamSection members={content.team.members} waveFillClassName={afterTeamFill} />
      )}

      {/* ════════════════════════════════════════════════════════
          STATS — the school's own numbers (Settings > Website > Numbers)
      ════════════════════════════════════════════════════════ */}
      {content.stats.show && (
        <section className="relative lp-clip bg-wash-peach dark:bg-wash-ocean transition-colors duration-200">
          {/* Peach in light; steel-blue ocean in dark, since a warm tint under a
              yellow glow and orange gingham reads as brown against the galaxy. */}
          <SectionBackdrop tint="peach" darkTint="ocean" pattern="gingham">
            <SpotlightGlow
              position="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              color="#FFD93D"
              darkColor="#C77DFF"
              size={680}
            />
            {/* The "123" is this section's ghost layer: far parallax, no spiral behind it */}
            <OutlineWatermark text="123" position="bottom-6 left-[-1rem]" rotate={5} ghost />
          </SectionBackdrop>
          <StarField variant="b" />
          {/* Cat sits top-right so it does not stack under the team penguin on the left edge */}
          <FloatingDoodle position="top-6 right-8" animation="slow" shrinkFrom="top-right">
            <DoodleCat size={300} color="#4D96FF" />
          </FloatingDoodle>
          <FloatingDoodle position="top-8 left-1/4" animation="alt" delay={0.8}>
            <DoodleHeart size={100} color="#C77DFF" />
          </FloatingDoodle>
          <FloatingDoodle position="bottom-6 right-1/4" animation="float" delay={2.2} mdUp>
            <DoodleSpiral size={164} color="#FFD93D" />
          </FloatingDoodle>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
            <div className="text-center mb-10 sm:mb-14">
              <div className="mb-5">
                <StickerBadge color="bg-kinder-yellow" textColor="text-gray-900" rotate={-3}>
                  {t('statsBadge')}
                </StickerBadge>
              </div>
              <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                <CrayonWord text={t('statsTitle')} color="#4D96FF" />
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto mt-4">
                {t('statsSubtitle', { school: schoolName })}
              </p>
            </div>
            <div
              className={`grid gap-4 sm:gap-8 md:gap-12 ${
                content.stats.tiles.length === 1
                  ? 'grid-cols-1 max-w-xs mx-auto'
                  : content.stats.tiles.length === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : 'grid-cols-2 md:grid-cols-4'
              }`}
            >
              {content.stats.tiles.map((tile) => (
                <StatCounter
                  key={tile.key}
                  target={tile.value}
                  suffix={tile.suffix}
                  decimals={tile.decimals}
                  label={t(STAT_LABEL_KEYS[tile.key])}
                  icon={STAT_ICONS[tile.key]}
                  tint={STAT_TINTS[tile.key]}
                />
              ))}
            </div>
          </div>

          <Wave variant="scallop" fillClassName={WHITE_FILL} />
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          GALLERY — horizontal scroll strip
      ════════════════════════════════════════════════════════ */}
      <section
        id="gallery"
        className="relative lp-clip bg-white dark:bg-gray-950 py-20 transition-colors duration-200"
      >
        <SectionBackdrop tint="neutral" pattern="polka">
          <SpotlightGlow
            position="top-0 left-1/2 -translate-x-1/2"
            color="#4D96FF"
            size={640}
            height={TITLE_GLOW_HEIGHT}
          />
          <SpotlightGlow position="bottom-0 right-[-80px]" color="#FFD93D" size={520} />
          <FloatingDoodle ghost position="top-[-80px] left-1/2 -translate-x-1/2" mdUp>
            <DoodleCloud size={800} color="#4D96FF" />
          </FloatingDoodle>
        </SectionBackdrop>
        <StarField variant="a" />
        <FloatingDoodle
          position="top-8 right-10"
          animation="alt"
          delay={0.6}
          shrinkFrom="top-right"
        >
          <DoodleWhale size={400} color="#4D96FF" />
        </FloatingDoodle>
        <FloatingDoodle position="top-6 left-1/4" animation="spin" mdUp>
          <DoodleStar size={108} color="#FFD93D" />
        </FloatingDoodle>
        {/* Bottom corners, outside the photo grid */}
        <FloatingDoodle position="bottom-32 left-8" animation="float" delay={1.9} mdUp>
          <DoodleFlower size={188} color="#C77DFF" />
        </FloatingDoodle>
        <FloatingDoodle position="bottom-28 right-10" animation="spin" delay={1.2} mdUp>
          <DoodleSpiral size={132} color="#6BCB77" />
        </FloatingDoodle>
        <div
          ref={galleryFadeIn.ref}
          className={`relative max-w-7xl mx-auto px-4 sm:px-6 mb-10 text-center ${galleryFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
        >
          <div className="mb-5">
            <StickerBadge color="bg-kinder-blue" textColor="text-white" rotate={3}>
              {t('galleryBadge')}
            </StickerBadge>
          </div>
          <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            <CrayonWord text={t('galleryTitle')} color="#4D96FF" />
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
            {t('gallerySubtitle')}
          </p>
        </div>

        {/* Mobile/tablet: horizontal scroll with arrows */}
        <div className="lg:hidden relative group/gallery">
          <button
            onClick={() => galleryScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 opacity-70 group-hover/gallery:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-700"
            aria-label="Scroll gallery left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => galleryScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 opacity-70 group-hover/gallery:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-700"
            aria-label="Scroll gallery right"
          >
            <ChevronRight size={20} />
          </button>
          <div
            ref={galleryScrollRef}
            className="overflow-x-auto scroll-smooth snap-x snap-mandatory pl-4 sm:pl-6 scrollbar-hide"
          >
            <div className="flex gap-4 w-max pr-4 sm:pr-6 pb-2">
              {galleryItems.length > 0
                ? galleryItems.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setLightboxIndex(idx)}
                      className="snap-start w-56 sm:w-72 h-40 sm:h-52 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border-2 border-gray-200 dark:border-gray-800 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer relative group/card"
                    >
                      <img
                        src={item.photo_url}
                        alt={item.caption ?? 'Gallery photo'}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-110"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                        <ZoomIn size={32} className="text-white drop-shadow" />
                      </span>
                      {item.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-8 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                          <p className="text-white text-xs font-semibold line-clamp-2">
                            {item.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                : GALLERY_PLACEHOLDERS.map((p) => (
                    <div
                      key={p.id}
                      className={`snap-start w-56 sm:w-72 h-40 sm:h-52 rounded-2xl flex-shrink-0 bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center gap-3 shadow-sm border-2 border-gray-200 dark:border-gray-800 hover:-translate-y-1 hover:shadow-md transition-all duration-200`}
                    >
                      <Camera size={32} className="text-gray-500/60 dark:text-gray-300/60" />
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {p.label}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Desktop: masonry grid */}
        {galleryItems.length > 0 && (
          <div className="hidden lg:block relative max-w-7xl mx-auto px-6">
            <div
              className={`${galleryItems.length < 6 ? 'columns-2' : 'columns-3'} gap-4 space-y-4`}
            >
              {galleryItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="break-inside-avoid rounded-2xl overflow-hidden shadow-sm border-2 border-gray-200 dark:border-gray-800 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer relative group/card"
                >
                  <img
                    src={item.photo_url}
                    alt={item.caption ?? 'Gallery photo'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover/card:scale-110"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                    <ZoomIn size={32} className="text-white drop-shadow" />
                  </span>
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-8 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                      <p className="text-white text-xs font-semibold line-clamp-2">
                        {item.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {galleryItems.length === 0 && (
          <div className="hidden lg:block relative max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-4">
              {GALLERY_PLACEHOLDERS.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl h-52 bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center gap-3 shadow-sm border-2 border-gray-200 dark:border-gray-800`}
                >
                  <Camera size={32} className="text-gray-500/60 dark:text-gray-300/60" />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {artWallItems.length === 0 && (
          <div className="mt-16">
            <Wave variant="scallop" fillClassName="fill-wash-blush" />
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════
          OUR LITTLE ARTISTS — art wall pin board
      ════════════════════════════════════════════════════════ */}
      {artWallItems.length > 0 && (
        <section
          ref={artWallHeadingRef}
          className="relative lp-clip bg-white dark:bg-gray-950 pt-16 md:pt-24 transition-colors duration-200"
        >
          <SectionBackdrop tint="neutral" pattern="dots">
            <SpotlightGlow
              position="top-0 left-1/2 -translate-x-1/2"
              color="#FF85A2"
              size={600}
              height={TITLE_GLOW_HEIGHT}
            />
            <FloatingDoodle ghost position="top-1/2 right-[-140px] -translate-y-1/2" mdUp>
              <DoodleHeartSparkle size={560} color="#FF85A2" />
            </FloatingDoodle>
          </SectionBackdrop>
          {/* Glimmering stars — dark mode only, outside the cork border */}
          <StarField variant="a" />
          <FloatingDoodle position="top-10 left-8" animation="float" shrinkFrom="top-left">
            <DoodleBunny size={340} color="#6BCB77" />
          </FloatingDoodle>
          {/* Shapes spread down the section's side margins — the turtle holds the
              top-left, so the rest sit at the middle and bottom, outside the board */}
          <FloatingDoodle position="top-1/2 right-10" animation="spin" mdUp>
            <DoodleSparkle size={104} color="#C77DFF" />
          </FloatingDoodle>
          <FloatingDoodle position="bottom-44 left-10" animation="alt" delay={1.0}>
            <DoodlePaperPlane size={136} color="#FF6B35" />
          </FloatingDoodle>
          <FloatingDoodle position="bottom-32 right-8" animation="slow" delay={2.0} mdUp>
            <DoodleCloud size={212} color="#4D96FF" />
          </FloatingDoodle>
          <div
            ref={artWallFadeIn.ref}
            className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center ${artWallFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
          >
            <div className="mb-5">
              <StickerBadge color="bg-kinder-pink" textColor="text-white" rotate={-4}>
                {t('artWallBadge')}
              </StickerBadge>
            </div>
            <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              <CrayonWord text={t('ourLittleArtists')} color="#FF85A2" />
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
              {t('artWallLandingSubtitle')}
            </p>
          </div>

          {/* Artwork board — framed cork board with border, matching admin page */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="bg-amber-100/80 dark:bg-amber-950/40 rounded-3xl p-6 md:p-8 border border-amber-300/60 dark:border-amber-800/30"
              style={darkMode ? CORK_STYLE_DARK : CORK_STYLE}
            >
              {/* Fix 2: pt-8 gives 32px above first row so -top-3 pins are never clipped */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 pt-8 pb-2">
                {artWallItems.map((item, idx) => {
                  const nudgeX = ((idx * 7 + (idx % 4) * 3) % 5) - 2
                  const isNew = animatedFromIdx.current >= 0 && idx >= animatedFromIdx.current
                  return (
                    <div
                      key={item.id}
                      className={`hover:z-10 ${isNew ? 'lp-pin-in' : ''}`}
                      style={{
                        transform: `translateX(${nudgeX}px)`,
                        animationDelay: isNew ? `${(idx - animatedFromIdx.current) * 40}ms` : '0ms',
                      }}
                    >
                      <ArtworkCard
                        item={item}
                        design="polaroid"
                        size="md"
                        onView={(item) => setLightboxArtId(item.id)}
                      />
                    </div>
                  )
                })}
                {/* Skeleton cards while next page loads */}
                {isLoadingMoreArtwork &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <ArtworkCardSkeleton
                      key={`skel-${i}`}
                      design="polaroid"
                      size="md"
                      index={artWallItems.length + i}
                    />
                  ))}
              </div>

              {/* Show More / Show Less */}
              {(hasMoreToShow || displayedCount > initialCount) && (
                <div className="flex justify-center gap-3 mt-8">
                  {displayedCount > initialCount && (
                    <button
                      onClick={handleShowLess}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border border-amber-300/40 dark:border-gray-700 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:shadow-md transition-all duration-200"
                    >
                      <ChevronDown size={16} className="rotate-180" />
                      {t('showLess')}
                    </button>
                  )}
                  {hasMoreToShow && (
                    <button
                      onClick={handleShowMore}
                      disabled={isLoadingMoreArtwork}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border border-amber-300/40 dark:border-gray-700 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      {t('showMore')}
                      <ChevronDown size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-16">
            <Wave variant="scallop" fillClassName="fill-wash-blush" />
          </div>
        </section>
      )}

      <InquiryForm waveFillClassName={afterInquiryFill} />

      <CareersSection />

      {/* ════════════════════════════════════════════════════════
          PROMISE STRIP — the poster's "safe · caring · nurturing" band
      ════════════════════════════════════════════════════════ */}
      <div className="relative lp-clip bg-kinder-pink dark:bg-wash-blush text-white py-5 px-4 transition-colors duration-200">
        {/* Grain on the band too, so the texture the wave carries in does not stop on a
            flat strip at the base of the bumps and restart at the next section */}
        <SectionBackdrop tint="blush" />
        <div className="relative max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-fun font-semibold text-lg sm:text-2xl text-center">
          <Heart size={20} fill="white" stroke="white" aria-hidden="true" />
          <span>{t('stripSafe')}</span>
          <span className="opacity-70" aria-hidden="true">
            ·
          </span>
          <span>{t('stripCaring')}</span>
          <span className="opacity-70" aria-hidden="true">
            ·
          </span>
          <span>{t('stripNurturing')}</span>
          <Heart size={20} fill="white" stroke="white" aria-hidden="true" />
        </div>
      </div>

      <LocationSection />

      <LandingFooter />

      {/* ── Scroll-to-top button ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={`fixed bottom-[4.5rem] right-4 sm:right-8 lg:bottom-4 z-50 w-12 h-12 rounded-full bg-kinder-orange text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
          showTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUp size={22} strokeWidth={2.5} />
      </button>

      {/* ── WhatsApp floating button ── */}
      <WhatsAppButton />

      {/* ── Mobile sticky CTA bar ── */}
      <MobileCTABar />

      {/* ── Gallery lightbox ── */}
      {lightboxIndex !== null && galleryItems.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>

            <img
              key={lightboxIndex}
              src={galleryItems[lightboxIndex].photo_url}
              alt={galleryItems[lightboxIndex].caption ?? 'Gallery photo'}
              className="w-full max-h-[75vh] object-contain rounded-2xl lp-enter-0"
            />

            {galleryItems[lightboxIndex].caption && (
              <p className="text-white/70 text-center mt-3 text-sm">
                {galleryItems[lightboxIndex].caption}
              </p>
            )}

            <p className="text-white/40 text-center text-xs mt-1">
              {lightboxIndex + 1} / {galleryItems.length}
            </p>

            {galleryItems.length > 1 && (
              <button
                onClick={() =>
                  setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : galleryItems.length - 1))
                }
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft size={36} />
              </button>
            )}

            {galleryItems.length > 1 && (
              <button
                onClick={() =>
                  setLightboxIndex((i) => (i !== null && i < galleryItems.length - 1 ? i + 1 : 0))
                }
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight size={36} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Art wall lightbox */}
      <ArtworkLightbox
        items={artWallItems}
        activeId={lightboxArtId}
        onClose={() => setLightboxArtId(null)}
        onNavigate={setLightboxArtId}
      />

      {/* ── Notice modal ── */}
      <NoticeModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />
    </div>
  )
}
