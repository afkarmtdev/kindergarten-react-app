import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, Heart, BookOpen, Sun, Music, Palette, Shield, Users, Moon, ArrowUp, Camera } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useSettingsStore } from '@/store/settingsStore'
import { galleryApi } from '@/lib/api'

// ─── CSS keyframe animations ─────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes lp-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-18px) rotate(6deg); }
  }
  @keyframes lp-float-alt {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%      { transform: translateY(-12px) rotate(-8deg); }
    66%      { transform: translateY(-6px)  rotate(4deg); }
  }
  @keyframes lp-float-slow {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%      { transform: translateY(-26px) scale(1.06); }
  }
  @keyframes lp-spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes lp-entrance {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lp-float      { animation: lp-float      4s   ease-in-out infinite; }
  .lp-float-alt  { animation: lp-float-alt  5.5s ease-in-out infinite; }
  .lp-float-slow { animation: lp-float-slow 7s   ease-in-out infinite; }
  .lp-spin-slow  { animation: lp-spin-slow  12s  linear     infinite; }
  .lp-enter-0    { animation: lp-entrance 0.8s ease         both; }
  .lp-enter-1    { animation: lp-entrance 0.8s ease 0.18s   both; }
  .lp-enter-2    { animation: lp-entrance 0.8s ease 0.36s   both; }
`

// ─── Wavy SVG divider ────────────────────────────────────────────────────────
function Wave({ fill }: { fill: string }) {
  return (
    <div style={{ lineHeight: 0, display: 'block' }}>
      <svg
        viewBox="0 0 1440 88"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: '88px' }}
      >
        <path
          d="M0,44 C180,88 360,0 540,44 C720,88 900,0 1080,44 C1260,88 1380,22 1440,44 L1440,88 L0,88 Z"
          fill={fill}
        />
      </svg>
    </div>
  )
}

// ─── Animated stat counter (IntersectionObserver + rAF) ──────────────────────
function StatCounter({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 2000
          const start = Date.now()
          const tick = () => {
            const progress = Math.min((Date.now() - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
            else setCount(target)
          }
          requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="text-center px-2">
      <p className="text-5xl lg:text-6xl font-extrabold text-white leading-none mb-2">
        {count}
        {suffix}
      </p>
      <p className="text-white/70 font-bold text-xs uppercase tracking-widest">{label}</p>
    </div>
  )
}

// ─── Features data ────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: BookOpen, color: 'bg-kinder-blue',   titleKey: 'featureLearnTitle',   descKey: 'featureLearnDesc'   },
  { icon: Shield,   color: 'bg-kinder-pink',   titleKey: 'featureSafeTitle',    descKey: 'featureSafeDesc'    },
  { icon: Music,    color: 'bg-kinder-purple', titleKey: 'featureArtsTitle',    descKey: 'featureArtsDesc'    },
  { icon: Palette,  color: 'bg-kinder-green',  titleKey: 'featurePlayTitle',    descKey: 'featurePlayDesc'    },
  { icon: Sun,      color: 'bg-kinder-yellow', titleKey: 'featureOutdoorTitle', descKey: 'featureOutdoorDesc' },
  { icon: Users,    color: 'bg-kinder-orange', titleKey: 'featureClassTitle',   descKey: 'featureClassDesc'   },
] as const

// ─── Testimonials data ────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: 'KinderCare has been a wonderful experience for our daughter. She comes home every day excited to share what she learned!',
    name: 'Puan Siti Rahimah',
    role: 'Parent of Aisyah, Sunflower Class',
  },
  {
    quote: "The teachers are incredibly dedicated. Our son's confidence has grown so much since joining KinderCare.",
    name: 'Encik Ahmad Fauzi',
    role: 'Parent of Haziq, Rainbow Class',
  },
  {
    quote: "A safe, nurturing environment with a fantastic curriculum. We couldn't be happier with our choice!",
    name: 'Mrs. Priya Krishnan',
    role: 'Parent of Arjun, Butterfly Class',
  },
]

// ─── Gallery placeholder data ─────────────────────────────────────────────────
const GALLERY_PLACEHOLDERS = [
  { id: 'p1', gradient: 'from-kinder-yellow/40 to-kinder-orange/30', label: 'Classroom Moments' },
  { id: 'p2', gradient: 'from-kinder-blue/30 to-kinder-purple/20',   label: 'Art & Craft' },
  { id: 'p3', gradient: 'from-kinder-green/30 to-kinder-blue/20',    label: 'Outdoor Play' },
  { id: 'p4', gradient: 'from-kinder-pink/30 to-kinder-purple/30',   label: 'Story Time' },
  { id: 'p5', gradient: 'from-kinder-orange/30 to-kinder-yellow/20', label: 'Music & Dance' },
  { id: 'p6', gradient: 'from-kinder-purple/30 to-kinder-pink/20',   label: 'Science Explore' },
]

// ─── Main component ───────────────────────────────────────────────────────────
export function LandingPage() {
  const t = useT()
  const { darkMode, lang, toggleDark, setLang } = useSettingsStore()
  const [showTop, setShowTop] = useState(false)

  const { data: galleryData } = useQuery({
    queryKey: ['gallery-public'],
    queryFn: () => galleryApi.getVisible(),
    staleTime: 5 * 60 * 1000,
  })
  const galleryItems = galleryData?.data ?? []

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 320)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-display overflow-x-hidden transition-colors duration-200">
      {/* Inject keyframe CSS */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* ════════════════════════════════════════════════════════
          NAVBAR — sticky, glass blur
      ════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-kinder-orange rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-base">K</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white text-xl tracking-tight">
              KinderCare
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500 dark:text-gray-400">
            <a href="#about"    className="hover:text-kinder-orange transition-colors">{t('about')}</a>
            <a href="#programs" className="hover:text-kinder-orange transition-colors">{t('ourPrograms')}</a>
            <a href="#contact"  className="hover:text-kinder-orange transition-colors">{t('contact')}</a>
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
              className="bg-kinder-orange text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-sm hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              {t('adminLogin')}
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
        {/* Triangle top-left */}
        <div className="lp-float absolute top-16 left-6 opacity-60 pointer-events-none" aria-hidden="true">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <polygon points="30,4 56,54 4,54" fill="#FFD93D" />
          </svg>
        </div>

        {/* Circle top-right */}
        <div className="lp-float-alt absolute top-20 right-10 opacity-50 pointer-events-none" style={{ animationDelay: '1s' }} aria-hidden="true">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" fill="#4D96FF" />
          </svg>
        </div>

        {/* Heart left-center */}
        <div className="lp-float absolute top-1/3 left-10 opacity-55 pointer-events-none" style={{ animationDelay: '0.5s' }} aria-hidden="true">
          <Heart size={44} fill="#FF85A2" stroke="#FF85A2" />
        </div>

        {/* Spinning star near heading */}
        <div className="lp-spin-slow absolute top-24 left-1/3 opacity-45 pointer-events-none" aria-hidden="true">
          <Star size={30} fill="#FF6B35" stroke="#FF6B35" />
        </div>

        {/* Rounded square bottom-right */}
        <div className="lp-float-slow absolute bottom-36 right-14 opacity-40 pointer-events-none" aria-hidden="true">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <rect x="6" y="6" width="56" height="56" rx="18" fill="#6BCB77" />
          </svg>
        </div>

        {/* Small circle left */}
        <div className="lp-float-alt absolute top-1/2 left-16 opacity-40 pointer-events-none" style={{ animationDelay: '2s' }} aria-hidden="true">
          <svg width="38" height="38" viewBox="0 0 38 38">
            <circle cx="19" cy="19" r="17" fill="#C77DFF" />
          </svg>
        </div>

        {/* Triangle right-center */}
        <div className="lp-float absolute top-1/3 right-20 opacity-35 pointer-events-none" style={{ animationDelay: '1.5s' }} aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <polygon points="24,2 46,44 2,44" fill="#FF6B35" />
          </svg>
        </div>

        {/* Star bottom-center */}
        <div className="lp-float-alt absolute bottom-40 right-1/3 opacity-60 pointer-events-none" style={{ animationDelay: '0.8s' }} aria-hidden="true">
          <Star size={24} fill="#FFD93D" stroke="#FFD93D" />
        </div>

        {/* Heart right side */}
        <div className="lp-float-slow absolute top-1/2 right-6 opacity-45 pointer-events-none" style={{ animationDelay: '1.2s' }} aria-hidden="true">
          <Heart size={32} fill="#FF85A2" stroke="#FF85A2" />
        </div>

        {/* Large blurred circle bg accent */}
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
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-6 text-center">
          {/* Enrollment badge */}
          <div className="lp-enter-0 inline-flex items-center gap-2 bg-kinder-orange/10 dark:bg-kinder-orange/20 border border-kinder-orange/30 text-kinder-orange px-5 py-2 rounded-full text-sm font-bold mb-8">
            <Star size={13} fill="#FF6B35" stroke="#FF6B35" />
            {t('heroTagline')}
          </div>

          {/* Big bubbly heading */}
          <h1 className="lp-enter-1 text-6xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 dark:text-white leading-[1.05] tracking-tight mb-6">
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

          {/* Subtitle */}
          <p className="lp-enter-2 text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            {t('heroSubtitle')}
          </p>

          {/* CTA buttons */}
          <div className="lp-enter-2 flex flex-wrap gap-4 justify-center mb-16">
            <a
              href="#contact"
              className="bg-kinder-orange text-white px-10 py-4 rounded-full font-extrabold text-lg shadow-lg shadow-orange-200 dark:shadow-orange-900/40 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-200 dark:hover:shadow-orange-900/50 hover:bg-orange-600 transition-all duration-200"
            >
              {t('bookTour')}
            </a>
            <a
              href="#programs"
              className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-10 py-4 rounded-full font-extrabold text-lg hover:-translate-y-1.5 hover:border-kinder-orange hover:text-kinder-orange dark:hover:border-kinder-orange dark:hover:text-kinder-orange transition-all duration-200"
            >
              {t('ourPrograms')}
            </a>
          </div>
        </div>

        {/* Wave bottom of hero → Stats (orange) */}
        <Wave fill="#FF6B35" />
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS — kinder-orange bg, animated counters
      ════════════════════════════════════════════════════════ */}
      <section className="bg-kinder-orange">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <StatCounter target={500} suffix="+"  label={t('statsStudentsLabel')} />
            <StatCounter target={50}  suffix="+"  label={t('statsTeachersLabel')} />
            <StatCounter target={20}  suffix="+"  label={t('statsClassesLabel')} />
            <StatCounter target={5}   suffix=" ★" label={t('statsRatingLabel')} />
          </div>
        </div>

        {/* Wave: Stats → Features (light / dark) */}
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
        <div className="max-w-7xl mx-auto px-6">
          {/* Section heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
              {t('featuresTitle')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="group bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-default"
              >
                <div
                  className={`w-16 h-16 ${color} rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={28} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-xl mb-3">
                  {t(titleKey)}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ════════════════════════════════════════════════════════
          GALLERY — horizontal scroll strip
      ════════════════════════════════════════════════════════ */}
      <section id="gallery" className="bg-white dark:bg-gray-950 py-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('galleryTitle')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('gallerySubtitle')}</p>
        </div>

        {/* Scroll strip */}
        <div className="overflow-x-auto scroll-smooth snap-x snap-mandatory pl-6">
          <div className="flex gap-4 w-max pr-6 pb-2">
            {galleryItems.length > 0
              ? galleryItems.map((item) => (
                  <div
                    key={item.id}
                    className="snap-start w-72 h-52 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-md transition-all duration-200"
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
                    className={`snap-start w-72 h-52 rounded-2xl flex-shrink-0 bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-md transition-all duration-200`}
                  >
                    <Camera size={32} className="text-gray-500/60 dark:text-gray-300/60" />
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{p.label}</span>
                  </div>
                ))}
          </div>
        </div>

        {/* Wave: Gallery → Testimonials (purple) */}
        <div className="mt-16">
          <Wave fill="#C77DFF" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TESTIMONIALS — kinder-purple bg, star ratings
      ════════════════════════════════════════════════════════ */}
      <section className="bg-kinder-purple py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Heading */}
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              {t('testimonialsTitle')}
            </h2>
            <p className="text-white/70 text-lg">{t('testimonialsSubtitle')}</p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div
                key={name}
                className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:bg-white/20 transition-all"
              >
                {/* Star row */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill="#FFD93D" stroke="#FFD93D" />
                  ))}
                </div>
                <p className="text-white/90 leading-relaxed mb-6 italic">"{quote}"</p>
                <div className="border-t border-white/20 pt-4">
                  <p className="font-extrabold text-white">{name}</p>
                  <p className="text-white/60 text-sm mt-0.5">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave: Testimonials → CTA (green) */}
        <div className="mt-8">
          <Wave fill="#6BCB77" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA — kinder-green bg, pill buttons
      ════════════════════════════════════════════════════════ */}
      <section id="contact" className="bg-kinder-green py-24">
        {/* Floating accents */}
        <div className="relative max-w-3xl mx-auto px-6 text-center overflow-hidden">
          <div className="lp-float absolute -top-8 -left-8 opacity-30 pointer-events-none" aria-hidden="true">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <polygon points="32,4 60,58 4,58" fill="white" />
            </svg>
          </div>
          <div className="lp-float-alt absolute -bottom-4 -right-4 opacity-25 pointer-events-none" aria-hidden="true">
            <Star size={48} fill="white" stroke="white" />
          </div>

          <h2 className="relative text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t('ctaTitle')}
          </h2>
          <p className="relative text-white/80 text-xl mb-10">{t('ctaSubtitle')}</p>

          <div className="relative flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:hello@kindercare.edu"
              className="bg-white text-kinder-green px-10 py-4 rounded-full font-extrabold text-lg shadow-lg hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200"
            >
              {t('scheduleVisit')}
            </a>
          </div>
        </div>

        {/* Wave: CTA → Footer */}
        <div className="mt-16">
          <Wave fill="#111827" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOOTER — dark, wavy top edge baked in via wave above
      ════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 py-10 text-center font-display">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-kinder-orange rounded-xl flex items-center justify-center">
            <span className="text-white font-extrabold text-xs">K</span>
          </div>
          <span className="font-extrabold text-white text-lg">KinderCare</span>
        </div>
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} KinderCare. Made with care for little learners.
        </p>
      </footer>

      {/* ── Scroll-to-top button ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={`fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-kinder-orange text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
          showTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUp size={22} strokeWidth={2.5} />
      </button>
    </div>
  )
}
