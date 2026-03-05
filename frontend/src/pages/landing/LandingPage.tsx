import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
} from 'lucide-react'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSettingsStore } from '@/store/settingsStore'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useFadeIn } from '@/hooks/useFadeIn'
import { galleryApi, announcementsApi, testimonialsApi } from '@/lib/api'
import { APP_NAME } from '@/lib/version'
import { BaseBearMascot, BearLogo } from '@/components/landing/bear/BaseBearMascot'
import { Wave } from './components/Wave'
import { StatCounter } from './components/StatCounter'
import { WhatsAppButton } from './components/WhatsAppButton'
import { InquiryForm } from './components/InquiryForm'
import { LocationSection } from './components/LocationSection'
import { LandingFooter } from './components/LandingFooter'
import {
  KEYFRAMES,
  FEATURES,
  NOTICE_CATEGORY_COLORS,
  NOTICE_CATEGORY_GRADIENTS,
  GALLERY_PLACEHOLDERS,
} from './constants'

export function LandingPage() {
  usePageTitle()
  const t = useT()
  const { darkMode, lang, toggleDark, setLang } = useSettingsStore()
  const { email: schoolEmail } = useSchoolInfo({ public: true })
  const [showTop, setShowTop] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [cardAnim, setCardAnim] = useState<'enter' | 'exit'>('enter')
  const [isPaused, setIsPaused] = useState(false)

  const featuresFadeIn = useFadeIn()
  const galleryFadeIn = useFadeIn()
  const noticesFadeIn = useFadeIn()
  const testimonialsFadeIn = useFadeIn()

  const { data: galleryData } = useQuery({
    queryKey: ['gallery-public'],
    queryFn: () => galleryApi.getVisible(),
    staleTime: 5 * 60 * 1000,
  })
  const galleryItems = galleryData?.data ?? []

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements-public'],
    queryFn: () => announcementsApi.getPublic(),
    staleTime: 5 * 60 * 1000,
  })
  const notices = announcementsData?.data ?? []

  const { data: testimonialsData } = useQuery({
    queryKey: ['testimonials-public'],
    queryFn: () => testimonialsApi.getPublic(),
    staleTime: 5 * 60 * 1000,
  })
  const testimonials = testimonialsData?.data ?? []

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 320)
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
            <BearLogo size={40} />
            <span className="font-extrabold text-gray-900 dark:text-white text-xl tracking-tight">
              {APP_NAME}
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
        id="about"
        className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
      >
        {/* ── Floating decorative shapes ── */}
        <div
          className="lp-float absolute top-16 left-6 opacity-60 pointer-events-none"
          aria-hidden="true"
        >
          <svg width="60" height="60" viewBox="0 0 60 60">
            <polygon points="30,4 56,54 4,54" fill="#FFD93D" />
          </svg>
        </div>

        <div
          className="lp-float-alt absolute top-20 right-10 opacity-50 pointer-events-none"
          style={{ animationDelay: '1s' }}
          aria-hidden="true"
        >
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" fill="#4D96FF" />
          </svg>
        </div>

        <div
          className="lp-float absolute top-1/3 left-10 opacity-55 pointer-events-none"
          style={{ animationDelay: '0.5s' }}
          aria-hidden="true"
        >
          <Heart size={44} fill="#FF85A2" stroke="#FF85A2" />
        </div>

        <div
          className="lp-spin-slow absolute top-24 left-1/3 opacity-45 pointer-events-none"
          aria-hidden="true"
        >
          <Star size={30} fill="#FF6B35" stroke="#FF6B35" />
        </div>

        <div
          className="lp-float-slow absolute bottom-36 right-14 opacity-40 pointer-events-none"
          aria-hidden="true"
        >
          <svg width="68" height="68" viewBox="0 0 68 68">
            <rect x="6" y="6" width="56" height="56" rx="18" fill="#6BCB77" />
          </svg>
        </div>

        <div
          className="lp-float-alt absolute top-1/2 left-16 opacity-40 pointer-events-none"
          style={{ animationDelay: '2s' }}
          aria-hidden="true"
        >
          <svg width="38" height="38" viewBox="0 0 38 38">
            <circle cx="19" cy="19" r="17" fill="#C77DFF" />
          </svg>
        </div>

        <div
          className="lp-float absolute top-1/3 right-20 opacity-35 pointer-events-none"
          style={{ animationDelay: '1.5s' }}
          aria-hidden="true"
        >
          <svg width="48" height="48" viewBox="0 0 48 48">
            <polygon points="24,2 46,44 2,44" fill="#FF6B35" />
          </svg>
        </div>

        <div
          className="lp-float-alt absolute bottom-40 right-1/3 opacity-60 pointer-events-none"
          style={{ animationDelay: '0.8s' }}
          aria-hidden="true"
        >
          <Star size={24} fill="#FFD93D" stroke="#FFD93D" />
        </div>

        <div
          className="lp-float-slow absolute top-1/2 right-6 opacity-45 pointer-events-none"
          style={{ animationDelay: '1.2s' }}
          aria-hidden="true"
        >
          <Heart size={32} fill="#FF85A2" stroke="#FF85A2" />
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

        {/* ── Bear mascot ── */}
        <div
          className="hidden lg:block absolute bottom-24 left-16 xl:left-28 z-20"
          style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.13))' }}
          aria-hidden="true"
        >
          <BaseBearMascot />
        </div>

        {/* ── Hero content ── */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-6 text-center">
          <div className="lp-enter-0 inline-flex items-center gap-2 bg-kinder-orange/10 dark:bg-kinder-orange/20 border border-kinder-orange/30 text-kinder-orange px-5 py-2 rounded-full text-sm font-bold mb-8">
            <Star size={13} fill="#FF6B35" stroke="#FF6B35" />
            {t('heroTagline')}
          </div>

          <h1 className="lp-enter-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.05] tracking-tight mb-6">
            <span className="block">{t('heroPart1')}</span>
            <span className="relative inline-block text-kinder-orange mx-1">
              {t('heroHighlight')}
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
            <span className="block md:inline"> {t('heroPart2')}</span>
          </h1>

          <p className="lp-enter-2 text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            {t('heroSubtitle')}
          </p>

          <div className="lp-enter-2 flex flex-col sm:flex-row gap-4 justify-center mb-16">
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

        <Wave fill="#FF6B35" />
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS — kinder-orange bg, animated counters
      ════════════════════════════════════════════════════════ */}
      <section className="bg-kinder-orange">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 md:gap-12">
            <StatCounter target={500} suffix="+" label={t('statsStudentsLabel')} />
            <StatCounter target={50} suffix="+" label={t('statsTeachersLabel')} />
            <StatCounter target={20} suffix="+" label={t('statsClassesLabel')} />
            <StatCounter target={5} suffix=" ★" label={t('statsRatingLabel')} />
          </div>
        </div>

        <div className="block dark:hidden">
          <Wave fill="#ffffff" />
        </div>
        <div className="hidden dark:block">
          <Wave fill="#030712" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURES — white/dark bg, large icon cards
      ════════════════════════════════════════════════════════ */}
      <section id="programs" className="bg-white dark:bg-gray-950 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
              {t('featuresTitle')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div ref={featuresFadeIn.ref} className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, titleKey, descKey }, idx) => (
              <div
                key={titleKey}
                className={`group bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-8 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-default ${featuresFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
                style={featuresFadeIn.isVisible ? { animationDelay: `${idx * 100}ms` } : undefined}
              >
                <div
                  className={`w-16 h-16 ${color} rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={28} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-xl mb-3">
                  {t(titleKey)}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          GALLERY — horizontal scroll strip
      ════════════════════════════════════════════════════════ */}
      <section
        id="gallery"
        className="bg-white dark:bg-gray-950 py-20 transition-colors duration-200"
      >
        <div
          ref={galleryFadeIn.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 mb-10 text-center ${galleryFadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('galleryTitle')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
            {t('gallerySubtitle')}
          </p>
        </div>

        <div className="overflow-x-auto scroll-smooth snap-x snap-mandatory pl-4 sm:pl-6">
          <div className="flex gap-4 w-max pr-4 sm:pr-6 pb-2">
            {galleryItems.length > 0
              ? galleryItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setLightboxIndex(idx)}
                    className="snap-start w-56 sm:w-72 h-40 sm:h-52 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <img
                      src={item.photo_url}
                      alt={item.caption ?? 'Gallery photo'}
                      className="w-full h-full object-cover"
                    />
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
      </section>

      {/* ════════════════════════════════════════════════════════
          NOTICES
      ════════════════════════════════════════════════════════ */}
      <section
        id="notices"
        className="bg-gray-50 dark:bg-gray-900 py-20 transition-colors duration-200"
      >
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

        <div className="mt-16 block dark:hidden">
          <Wave fill="#ffffff" />
        </div>
        <div className="mt-16 hidden dark:block">
          <Wave fill="#030712" />
        </div>
      </section>

      <InquiryForm />

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
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="#FFD93D" stroke="#FFD93D" />
                    ))}
                  </div>
                  <p className="text-white/90 leading-relaxed mb-6 italic text-lg">
                    &ldquo;{(testimonials[displayIndex] ?? testimonials[0]).quote}&rdquo;
                  </p>
                  <div className="border-t border-white/20 pt-4">
                    <p className="font-extrabold text-white">
                      {(testimonials[displayIndex] ?? testimonials[0]).parent_name}
                    </p>
                    <p className="text-white/60 text-sm mt-0.5">
                      {(testimonials[displayIndex] ?? testimonials[0]).parent_role}
                    </p>
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

          <div className="mt-8">
            <Wave fill="#6BCB77" />
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          CTA — kinder-green bg, pill buttons
      ════════════════════════════════════════════════════════ */}
      <section id="contact" className="bg-kinder-green py-24">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center overflow-hidden">
          <div
            className="lp-float absolute -top-8 -left-8 opacity-30 pointer-events-none"
            aria-hidden="true"
          >
            <svg width="64" height="64" viewBox="0 0 64 64">
              <polygon points="32,4 60,58 4,58" fill="white" />
            </svg>
          </div>
          <div
            className="lp-float-alt absolute -bottom-4 -right-4 opacity-25 pointer-events-none"
            aria-hidden="true"
          >
            <Star size={48} fill="white" stroke="white" />
          </div>

          <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t('ctaTitle')}
          </h2>
          <p className="relative text-white/80 text-lg sm:text-xl mb-10">{t('ctaSubtitle')}</p>

          <div className="relative flex flex-wrap gap-4 justify-center">
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
        className={`fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 w-12 h-12 rounded-full bg-kinder-orange text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
          showTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUp size={22} strokeWidth={2.5} />
      </button>

      {/* ── WhatsApp floating button ── */}
      <WhatsAppButton />

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
    </div>
  )
}
