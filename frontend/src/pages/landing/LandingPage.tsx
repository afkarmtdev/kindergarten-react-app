import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Star,
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
  Palette,
  ChevronDown,
} from 'lucide-react'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSettingsStore } from '@/store/settingsStore'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useFadeIn } from '@/hooks/useFadeIn'
import { galleryApi, announcementsApi, testimonialsApi, artWallApi } from '@/lib/api'
import { CORK_STYLE, CORK_STYLE_DARK } from '@/pages/art-wall/constants'
import { APP_NAME } from '@/lib/version'
import {
  BaseBearMascot,
  BearLogo,
  type BearMascotHandle,
} from '@/components/landing/bear/BaseBearMascot'
import { BearToggle } from '@/components/landing/bear/BearToggle'
import { Wave } from './components/Wave'
import { ArtworkCard } from '@/pages/art-wall/components/ArtworkCard'
import { ArtworkCardSkeleton } from '@/pages/art-wall/components/ArtworkCardSkeleton'
import { ArtworkLightbox } from '@/pages/art-wall/components/ArtworkLightbox'
import { StatCounter } from './components/StatCounter'
import { TypedText } from './components/TypedText'
import { FeatureCard } from './components/FeatureCard'
import { MobileCTABar } from './components/MobileCTABar'
import { WhatsAppButton } from './components/WhatsAppButton'
import { InquiryForm } from './components/InquiryForm'
import { CoinFlipLogo } from '@/components/ui/CoinFlipLogo'
import { CareersSection } from './components/CareersSection'
import { LocationSection } from './components/LocationSection'
import { LandingFooter } from './components/LandingFooter'
import { StarField } from './components/StarField'
import {
  KEYFRAMES,
  FEATURES,
  NOTICE_CATEGORY_COLORS,
  NOTICE_CATEGORY_GRADIENTS,
  GALLERY_PLACEHOLDERS,
} from './constants'
import { DoodleStar } from '@/components/landing/doodles/DoodleStar'
import { DoodleCloud } from '@/components/landing/doodles/DoodleCloud'
import { DoodleSun } from '@/components/landing/doodles/DoodleSun'
import { DoodleFlower } from '@/components/landing/doodles/DoodleFlower'
import { DoodleSpiral } from '@/components/landing/doodles/DoodleSpiral'

export function LandingPage() {
  const t = useT()
  const { darkMode, lang, toggleDark, setLang } = useSettingsStore()
  const { email: schoolEmail, logoUrl, schoolName } = useSchoolInfo({ public: true })
  usePageTitle(undefined, schoolName)
  const [showTop, setShowTop] = useState(false)
  const [navFlipped, setNavFlipped] = useState(false)
  const navFlipCount = useRef(0)
  const handleNavFlip = useCallback((flipped: boolean) => {
    navFlipCount.current++
    setNavFlipped(flipped)
  }, [])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxArtId, setLightboxArtId] = useState<string | null>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [cardAnim, setCardAnim] = useState<'enter' | 'exit'>('enter')
  const [isPaused, setIsPaused] = useState(false)
  const [bearVisible, setBearVisible] = useState(
    () => localStorage.getItem('bear-visible') !== 'false'
  )

  const galleryScrollRef = useRef<HTMLDivElement>(null)
  const artWallHeadingRef = useRef<HTMLElement>(null)

  // Bear bounce
  const heroRef = useRef<HTMLElement>(null)
  const bearBounceRef = useRef<HTMLDivElement>(null)
  const bearMascotRef = useRef<BearMascotHandle>(null)
  const bearRotateRef = useRef<HTMLDivElement>(null)
  const bearPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const bearVelRef = useRef<{ vx: number; vy: number }>({ vx: -90, vy: -65 })
  const bearPausedRef = useRef(false)
  const bearRafRef = useRef<number | null>(null)
  const bearRotRef = useRef(0)
  const heroDimsRef = useRef({ w: 0, h: 0 })

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

  useEffect(() => {
    if (isPaused || testimonials.length === 0) return
    const timer = setInterval(() => {
      setActiveTestimonial((i) => (i + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isPaused, activeTestimonial, testimonials.length])

  // Slide out → swap content → slide in
  useEffect(() => {
    setCardAnim('exit')
    const swap = setTimeout(() => {
      setDisplayIndex(activeTestimonial)
      setCardAnim('enter')
    }, 150)
    return () => clearTimeout(swap)
  }, [activeTestimonial])

  // Bear DVD bounce
  useEffect(() => {
    if (!bearVisible) return
    const heroEl = heroRef.current
    const bearEl = bearBounceRef.current
    const rotEl = bearRotateRef.current
    if (!heroEl || !bearEl || !rotEl) return

    const heroRect = heroEl.getBoundingClientRect()
    if (heroRect.width === 0) return

    const BEAR_W = 120
    const BEAR_H = 140
    const PAD = 15
    const MIN_X = PAD
    const MIN_Y = PAD
    const ROT_SPEED = 45

    heroDimsRef.current = { w: heroRect.width, h: heroRect.height }

    const mxX = () => heroDimsRef.current.w - BEAR_W - PAD
    const mxY = () => heroDimsRef.current.h - BEAR_H - PAD

    bearPosRef.current = {
      x: Math.max(MIN_X, Math.min(heroRect.width * 0.5, mxX())),
      y: Math.max(MIN_Y, Math.min(heroRect.height * 0.5, mxY())),
    }
    bearMascotRef.current?.setFlip(true)
    bearEl.style.left = `${bearPosRef.current.x}px`
    bearEl.style.top = `${bearPosRef.current.y}px`

    let lastTime: number | null = null
    let rafId: number

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick)
      bearRafRef.current = rafId

      const delta = lastTime !== null ? Math.min(now - lastTime, 50) : 16
      lastTime = now
      const dt = delta / 1000

      if (bearPausedRef.current) {
        bearRotRef.current *= 0.82
        if (Math.abs(bearRotRef.current) < 0.3) bearRotRef.current = 0
        rotEl.style.transform = `rotate(${bearRotRef.current}deg)`
        lastTime = null
        return
      }

      bearRotRef.current += ROT_SPEED * dt
      rotEl.style.transform = `rotate(${bearRotRef.current}deg)`

      let { x, y } = bearPosRef.current
      let { vx, vy } = bearVelRef.current

      x += vx * dt
      y += vy * dt

      const maxXv = mxX()
      const maxYv = mxY()

      if (x <= MIN_X) {
        x = MIN_X
        vx = Math.abs(vx)
        bearMascotRef.current?.setFlip(false)
      } else if (x >= maxXv) {
        x = maxXv
        vx = -Math.abs(vx)
        bearMascotRef.current?.setFlip(true)
      }
      if (y <= MIN_Y) {
        y = MIN_Y
        vy = Math.abs(vy)
      } else if (y >= maxYv) {
        y = maxYv
        vy = -Math.abs(vy)
      }

      bearPosRef.current = { x, y }
      bearVelRef.current = { vx, vy }
      bearEl.style.left = `${x}px`
      bearEl.style.top = `${y}px`
    }

    rafId = requestAnimationFrame(tick)
    bearRafRef.current = rafId

    const ro = new ResizeObserver(() => {
      const r = heroEl.getBoundingClientRect()
      heroDimsRef.current = { w: r.width, h: r.height }
      bearPosRef.current.x = Math.max(MIN_X, Math.min(bearPosRef.current.x, mxX()))
      bearPosRef.current.y = Math.max(MIN_Y, Math.min(bearPosRef.current.y, mxY()))
    })
    ro.observe(heroEl)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [bearVisible])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-display overflow-x-hidden transition-colors duration-200">
      {/* Inject keyframe CSS */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* ════════════════════════════════════════════════════════
          NAVBAR — sticky, glass blur
      ════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <CoinFlipLogo
              logoUrl={logoUrl}
              frontClassName="w-10 h-10 flex items-center justify-center"
              backClassName="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
              onFlip={handleNavFlip}
            >
              <BearLogo size={40} />
            </CoinFlipLogo>
            <span className="font-extrabold text-gray-900 dark:text-white text-xl tracking-tight">
              {navFlipCount.current === 0 ? (
                APP_NAME
              ) : (
                <TypedText
                  key={navFlipCount.current}
                  text={navFlipped ? schoolName : APP_NAME}
                  delay={200}
                  speed={50}
                />
              )}
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
      <section id="about" ref={heroRef} className="relative overflow-hidden">
        {/* Mesh gradient background — light mode */}
        <div
          className="absolute inset-0 lp-mesh-gradient block dark:hidden"
          style={{
            background:
              'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 20%, #FFF1F2 40%, #FDF2F8 60%, #FFF7ED 80%, #FFFBEB 100%)',
          }}
          aria-hidden="true"
        />
        {/* Mesh gradient background — dark mode */}
        <div
          className="absolute inset-0 lp-mesh-gradient hidden dark:block"
          style={{
            background:
              'linear-gradient(135deg, #030712 0%, #111827 25%, #1e1b4b 50%, #0f172a 75%, #030712 100%)',
          }}
          aria-hidden="true"
        />

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
          className="absolute pointer-events-none hidden dark:block lp-shooting-star"
          style={{
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
          className="absolute pointer-events-none hidden dark:block lp-shooting-star"
          style={{
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
          className="lp-parallax-fast absolute top-16 left-6 pointer-events-none"
          aria-hidden="true"
        >
          <div className="lp-float opacity-60">
            <DoodleStar size={52} color="#FFD93D" />
          </div>
        </div>

        <div
          className="lp-parallax-medium absolute top-20 right-10 pointer-events-none"
          aria-hidden="true"
        >
          <div className="lp-float-alt opacity-50" style={{ animationDelay: '1s' }}>
            <DoodleCloud size={56} color="#4D96FF" />
          </div>
        </div>

        <div
          className="lp-parallax-slow absolute top-1/3 left-10 pointer-events-none"
          aria-hidden="true"
        >
          <div className="lp-float opacity-55" style={{ animationDelay: '0.5s' }}>
            <Heart size={44} fill="#FF85A2" stroke="#FF85A2" />
          </div>
        </div>

        <div
          className="lp-parallax-fast absolute top-24 left-1/3 pointer-events-none"
          aria-hidden="true"
        >
          <div className="lp-spin-slow opacity-45">
            <Star size={30} fill="#FF6B35" stroke="#FF6B35" />
          </div>
        </div>

        <div
          className="lp-parallax-medium absolute bottom-36 right-14 pointer-events-none"
          aria-hidden="true"
        >
          <div className="lp-float-slow opacity-40">
            <DoodleFlower size={60} color="#6BCB77" />
          </div>
        </div>

        <div
          className="lp-parallax-slow absolute top-1/2 left-16 pointer-events-none"
          aria-hidden="true"
        >
          <div className="lp-float-alt opacity-40" style={{ animationDelay: '2s' }}>
            <DoodleSpiral size={44} color="#C77DFF" />
          </div>
        </div>

        <div
          className="lp-parallax-fast absolute top-1/3 right-20 pointer-events-none"
          aria-hidden="true"
        >
          <div className="lp-float opacity-35" style={{ animationDelay: '1.5s' }}>
            <svg width="48" height="48" viewBox="0 0 48 48">
              <polygon points="24,2 46,44 2,44" fill="#FF6B35" />
            </svg>
          </div>
        </div>

        <div
          className="lp-parallax-medium absolute bottom-40 right-1/3 pointer-events-none"
          aria-hidden="true"
        >
          <div className="lp-float-alt opacity-60" style={{ animationDelay: '0.8s' }}>
            <Star size={24} fill="#FFD93D" stroke="#FFD93D" />
          </div>
        </div>

        <div
          className="lp-parallax-slow absolute top-1/2 right-6 pointer-events-none"
          aria-hidden="true"
        >
          <div className="lp-float-slow opacity-45" style={{ animationDelay: '1.2s' }}>
            <Heart size={32} fill="#FF85A2" stroke="#FF85A2" />
          </div>
        </div>

        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 dark:opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FF6B35, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-15 dark:opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #4D96FF, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* ── Hero content ── */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-6">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Text column */}
            <div className="text-center lg:text-left">
              <div className="lp-enter-0 inline-flex items-center gap-2 bg-kinder-orange/10 dark:bg-kinder-orange/20 border border-kinder-orange/30 text-kinder-orange px-5 py-2 rounded-full text-sm font-bold mb-8">
                <Star size={13} fill="#FF6B35" stroke="#FF6B35" />
                {t('heroTagline')}
              </div>

              <h1 className="lp-enter-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.05] tracking-tight mb-6">
                <span className="block">{t('heroPart1')}</span>
                <span className="relative inline-block text-kinder-orange mx-1">
                  <TypedText text={t('heroHighlight')} delay={800} speed={80} />
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
                <span className="block xl:inline"> {t('heroPart2')}</span>
              </h1>

              <p className="lp-enter-2 text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10">
                {t('heroSubtitle')}
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

        {/* Bear mascot — direct child of section so position:absolute uses section as containing block */}
        {bearVisible && (
          <div
            ref={bearBounceRef}
            className="hidden lg:block absolute z-20 lp-enter-2"
            style={{ left: 0, top: 0 }}
            onMouseEnter={() => {
              bearPausedRef.current = true
              const r = bearRotRef.current
              bearRotRef.current = (((r % 360) + 540) % 360) - 180
            }}
            onMouseLeave={() => {
              bearPausedRef.current = false
            }}
          >
            <div
              style={{
                display: 'inline-block',
                filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.18))',
              }}
            >
              <div ref={bearRotateRef}>
                <BaseBearMascot ref={bearMascotRef} />
              </div>
            </div>
          </div>
        )}

        {/* Bear toggle — subtle pill button, bottom-right of hero, only on lg+ */}
        <BearToggle
          visible={bearVisible}
          onToggle={() => {
            const next = !bearVisible
            setBearVisible(next)
            localStorage.setItem('bear-visible', String(next))
          }}
        />

        <Wave fill="#FF6B35" variant="peak" />
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS — kinder-orange bg, animated counters
      ════════════════════════════════════════════════════════ */}
      <section className="bg-kinder-orange">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 md:gap-12">
            <StatCounter
              target={500}
              suffix="+"
              label={t('statsStudentsLabel')}
              icon={GraduationCap}
            />
            <StatCounter target={50} suffix="+" label={t('statsTeachersLabel')} icon={Users} />
            <StatCounter target={20} suffix="+" label={t('statsClassesLabel')} icon={School} />
            <StatCounter target={5} suffix=" ★" label={t('statsRatingLabel')} icon={Award} />
          </div>
        </div>

        <div className="block dark:hidden">
          <Wave fill="#ffffff" variant="bumpy" />
        </div>
        <div className="hidden dark:block">
          <Wave fill="#030712" variant="bumpy" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURES — white/dark bg, large icon cards
      ════════════════════════════════════════════════════════ */}
      <section id="programs" className="relative overflow-hidden bg-white dark:bg-gray-950 py-24">
        <StarField variant="b" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-kinder-orange via-kinder-pink to-kinder-purple bg-clip-text text-transparent mb-4 leading-tight">
              {t('featuresTitle')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div ref={featuresFadeIn.ref} className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, color, titleKey, descKey, expandedKey }, idx) => (
              <FeatureCard
                key={titleKey}
                icon={icon}
                color={color}
                titleKey={titleKey}
                descKey={descKey}
                expandedKey={expandedKey}
                className={featuresFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}
                style={featuresFadeIn.isVisible ? { animationDelay: `${idx * 100}ms` } : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          GALLERY — horizontal scroll strip
      ════════════════════════════════════════════════════════ */}
      <section
        id="gallery"
        className="relative overflow-hidden bg-white dark:bg-gray-950 py-20 transition-colors duration-200"
      >
        <StarField variant="a" />
        <div
          ref={galleryFadeIn.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 mb-10 text-center ${galleryFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-kinder-orange via-kinder-pink to-kinder-purple bg-clip-text text-transparent mb-4 leading-tight">
            {t('galleryTitle')}
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
                      className="snap-start w-56 sm:w-72 h-40 sm:h-52 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer relative group/card"
                    >
                      <img
                        src={item.photo_url}
                        alt={item.caption ?? 'Gallery photo'}
                        className="w-full h-full object-cover"
                      />
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
                      className={`snap-start w-56 sm:w-72 h-40 sm:h-52 rounded-2xl flex-shrink-0 bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-md transition-all duration-200`}
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
          <div className="hidden lg:block max-w-7xl mx-auto px-6">
            <div
              className={`${galleryItems.length < 6 ? 'columns-2' : 'columns-3'} gap-4 space-y-4`}
            >
              {galleryItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="break-inside-avoid rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer relative group/card"
                >
                  <img
                    src={item.photo_url}
                    alt={item.caption ?? 'Gallery photo'}
                    className="w-full h-auto object-cover"
                  />
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
          <div className="hidden lg:block max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-4">
              {GALLERY_PLACEHOLDERS.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl h-52 bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800`}
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
      </section>

      {/* ════════════════════════════════════════════════════════
          OUR LITTLE ARTISTS — art wall pin board
      ════════════════════════════════════════════════════════ */}
      {artWallItems.length > 0 && (
        <section
          ref={artWallHeadingRef}
          className="relative overflow-hidden bg-amber-50 dark:bg-gray-950 py-16 md:py-24 transition-colors duration-200"
        >
          {/* Glimmering stars — dark mode only, outside the cork border */}
          <StarField variant="a" />
          <div
            ref={artWallFadeIn.ref}
            className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center ${artWallFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-kinder-yellow/20 dark:bg-kinder-yellow/10 mb-4">
              <Palette size={28} className="text-kinder-yellow" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-kinder-orange via-kinder-yellow to-kinder-green bg-clip-text text-transparent mb-4 leading-tight">
              {t('ourLittleArtists')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
              {t('artWallLandingSubtitle')}
            </p>
          </div>

          {/* Artwork board — framed cork board with border, matching admin page */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          NOTICES
      ════════════════════════════════════════════════════════ */}
      <section
        id="notices"
        className="relative overflow-hidden bg-gray-50 dark:bg-gray-900 py-20 transition-colors duration-200"
      >
        <StarField variant="b" />
        <div
          ref={noticesFadeIn.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 mb-10 text-center ${noticesFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('noticesTitle')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
            {t('noticesSubtitle')}
          </p>
        </div>

        {notices.length > 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {notices.slice(0, 6).map((notice, idx) => (
                <div
                  key={notice.id}
                  className={`flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                    notice.is_pinned
                      ? 'border-kinder-yellow dark:border-kinder-yellow'
                      : 'border-gray-100 dark:border-gray-700'
                  } ${noticesFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
                  style={noticesFadeIn.isVisible ? { animationDelay: `${idx * 80}ms` } : undefined}
                >
                  {notice.image_url ? (
                    <div className="h-36 overflow-hidden">
                      <img
                        src={notice.image_url}
                        alt={notice.title}
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
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-200 dark:border-amber-700 rounded-3xl p-10 text-center">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-800/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Megaphone size={26} className="text-amber-400 dark:text-amber-500" />
              </div>
              <h3 className="font-bold text-amber-800 dark:text-amber-300 text-lg mb-2">
                {t('noticesEmptyTitle')}
              </h3>
              <p className="text-amber-600/80 dark:text-amber-400/70 text-sm leading-relaxed">
                {t('noticesEmptySubtitle')}
              </p>
            </div>
          </div>
        )}

        {testimonials.length > 0 ? (
          <div className="mt-16">
            <Wave fill="#C77DFF" />
          </div>
        ) : (
          <>
            <div className="mt-16 block dark:hidden">
              <Wave fill="#ffffff" />
            </div>
            <div className="mt-16 hidden dark:block">
              <Wave fill="#030712" />
            </div>
          </>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════
          testimonials — kinder-purple bg, star ratings
      ════════════════════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="bg-kinder-purple py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div
              className={`text-center mb-14 ${testimonialsFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
              ref={testimonialsFadeIn.ref}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
                {t('testimonialsTitle')}
              </h2>
              <p className="text-white/70 text-base sm:text-lg">{t('testimonialsSubtitle')}</p>
            </div>

            <div
              className="max-w-2xl mx-auto"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="relative">
                {testimonials.length >= 3 && (
                  <div className="absolute inset-0 translate-x-12 translate-y-3 bg-white/5 border border-white/[0.08] rounded-3xl" />
                )}
                {testimonials.length >= 2 && (
                  <div className="absolute inset-0 translate-x-6 translate-y-1.5 bg-white/10 border border-white/[0.12] rounded-3xl" />
                )}

                <div
                  className={`relative z-10 bg-white/20 backdrop-blur-sm border border-white/25 rounded-3xl p-8 sm:p-10 ${cardAnim === 'exit' ? 'lp-card-exit' : 'lp-card-enter'}`}
                >
                  {/* Decorative quote mark */}
                  <div
                    className="absolute top-4 right-6 text-white/10 text-8xl sm:text-9xl font-serif leading-none pointer-events-none select-none"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </div>
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="#FFD93D" stroke="#FFD93D" />
                    ))}
                  </div>
                  <p className="text-white/90 leading-relaxed mb-6 italic text-lg">
                    &ldquo;{(testimonials[displayIndex] ?? testimonials[0]).quote}&rdquo;
                  </p>
                  <div className="border-t border-white/20 pt-4 flex items-center gap-3">
                    {(testimonials[displayIndex] ?? testimonials[0]).avatar_url ? (
                      <img
                        src={(testimonials[displayIndex] ?? testimonials[0]).avatar_url!}
                        alt={(testimonials[displayIndex] ?? testimonials[0]).parent_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(testimonials[displayIndex] ?? testimonials[0]).parent_name
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-extrabold text-white">
                        {(testimonials[displayIndex] ?? testimonials[0]).parent_name}
                      </p>
                      <p className="text-white/60 text-sm mt-0.5">
                        {(testimonials[displayIndex] ?? testimonials[0]).parent_role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {testimonials.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {testimonials.map((_, i) =>
                    i === activeTestimonial ? (
                      <button
                        key={i}
                        onClick={() => setActiveTestimonial(i)}
                        className="relative w-10 h-2.5 bg-white/20 rounded-full overflow-hidden"
                      >
                        <div
                          key={displayIndex}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(255,255,255,0.75)',
                            borderRadius: '9999px',
                            animation: 'lp-progress 4s linear both',
                            animationPlayState: isPaused ? 'paused' : 'running',
                          }}
                        />
                      </button>
                    ) : (
                      <button
                        key={i}
                        onClick={() => setActiveTestimonial(i)}
                        className="w-2.5 h-2.5 bg-white/30 hover:bg-white/60 rounded-full transition-colors duration-300"
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 block dark:hidden">
            <Wave fill="#ffffff" />
          </div>
          <div className="mt-8 hidden dark:block">
            <Wave fill="#030712" />
          </div>
        </section>
      )}

      <InquiryForm />

      <CareersSection />

      {/* ════════════════════════════════════════════════════════
          CTA — kinder-green bg, pill buttons
      ════════════════════════════════════════════════════════ */}
      <section id="contact" className="relative overflow-hidden bg-kinder-green py-24">
        {/* Floating shapes — spread across full section width */}
        <div
          className="lp-float absolute top-8 left-6 opacity-20 pointer-events-none"
          aria-hidden="true"
        >
          <Star size={52} fill="white" stroke="white" />
        </div>
        <div
          className="lp-float-alt absolute bottom-20 left-12 opacity-15 pointer-events-none"
          style={{ animationDelay: '1.2s' }}
          aria-hidden="true"
        >
          <Heart size={38} fill="white" stroke="white" />
        </div>
        <div
          className="lp-spin-slow absolute top-12 right-8 opacity-15 pointer-events-none"
          aria-hidden="true"
        >
          <DoodleStar size={48} color="white" />
        </div>
        <div
          className="lp-float absolute bottom-16 right-16 opacity-20 pointer-events-none"
          style={{ animationDelay: '2s' }}
          aria-hidden="true"
        >
          <DoodleFlower size={44} color="white" />
        </div>
        <div
          className="lp-float-slow absolute top-1/2 left-1/4 opacity-10 pointer-events-none"
          style={{ animationDelay: '0.8s' }}
          aria-hidden="true"
        >
          <DoodleCloud size={52} color="white" />
        </div>
        <div
          className="lp-float-alt absolute top-6 left-1/2 opacity-12 pointer-events-none"
          style={{ animationDelay: '3s', opacity: 0.12 }}
          aria-hidden="true"
        >
          <DoodleSpiral size={36} color="white" />
        </div>
        <div
          className="lp-float absolute top-1/3 right-1/4 opacity-15 pointer-events-none"
          style={{ animationDelay: '1.6s' }}
          aria-hidden="true"
        >
          <DoodleSun size={46} color="white" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t('ctaTitle')}
          </h2>
          <p className="text-white/80 text-lg sm:text-xl mb-10">{t('ctaSubtitle')}</p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={schoolEmail ? `mailto:${schoolEmail}` : '#contact'}
              className="bg-white text-kinder-green px-6 sm:px-10 py-3 sm:py-4 rounded-full font-extrabold text-base sm:text-lg shadow-lg hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200"
            >
              {t('scheduleVisit')}
            </a>
          </div>
        </div>

        <div className="mt-16">
          <Wave fill="#111827" />
        </div>
      </section>

      <LocationSection />

      <LandingFooter />

      {/* ── Scroll-to-top button ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={`fixed bottom-[4.5rem] right-4 sm:bottom-8 sm:right-8 lg:bottom-4 z-50 w-12 h-12 rounded-full bg-kinder-orange text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
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
    </div>
  )
}
