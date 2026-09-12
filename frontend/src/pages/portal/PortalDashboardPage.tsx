import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck2,
  CalendarX2,
  Check,
  Clock,
  MinusCircle,
  AlertCircle,
  Wallet,
  Megaphone,
  ClipboardList,
  CalendarDays,
  BookOpen,
  HeartPulse,
  ShieldAlert,
  Smartphone,
  SmilePlus,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import { StickerBadge } from '../landing/components/StickerBadge'
import { DoodleSun } from '../../components/landing/doodles/DoodleSun'
import type { TranslationKey } from '../../lib/translations'
import type { AttendanceRecord, FeeRecord, DailyReport } from '../../types'

const STATUS_ICON = {
  present: CalendarCheck2,
  absent: CalendarX2,
  late: Clock,
  excused: MinusCircle,
}
const STATUS_COLOR = {
  present: 'text-ink-mint',
  absent: 'text-red-500',
  late: 'text-ink-butter',
  excused: 'text-ink-sky',
}
const STATUS_LINE_KEY: Record<AttendanceRecord['status'], TranslationKey> = {
  present: 'todayStrip_present',
  absent: 'todayStrip_absent',
  late: 'todayStrip_late',
  excused: 'todayStrip_excused',
}

const MOOD_ICON: Record<string, React.ElementType> = {
  happy: SmilePlus,
  okay: Sun,
  tired: Moon,
  upset: AlertCircle,
}
const MOOD_LABEL_KEY: Record<string, TranslationKey> = {
  happy: 'moodHappy',
  okay: 'moodOkay',
  tired: 'moodTired',
  upset: 'moodUpset',
}
const MEALS_LABEL_KEY: Record<string, TranslationKey> = {
  all: 'mealsAll',
  most: 'mealsMost',
  some: 'mealsSome',
  none: 'mealsNone',
}

// Tiny stars scattered across the dark-mode greeting card (night sky).
const HERO_STARS = [
  { top: '12%', left: '6%', size: 2 },
  { top: '22%', left: '17%', size: 1 },
  { top: '9%', left: '30%', size: 2 },
  { top: '34%', left: '11%', size: 1 },
  { top: '18%', left: '44%', size: 1 },
  { top: '46%', left: '33%', size: 2 },
  { top: '11%', left: '58%', size: 1 },
  { top: '40%', left: '66%', size: 2 },
]

function formatRM(n: number) {
  return `RM ${n.toFixed(2)}`
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface NavCard {
  to: string
  icon: React.ElementType
  label: string
  color: string
  iconBg: string
}

export default function PortalDashboardPage() {
  usePageTitle('Parent Portal')
  const { parent, selectedChild } = useParentAuth()
  const navigate = useNavigate()
  const t = useT()

  const [heroVisible, setHeroVisible] = useState(false)
  useEffect(() => {
    setHeroVisible(true)
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const dateString = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Fetch data for live badges
  const { data: attendanceData } = useQuery({
    queryKey: ['portal-attendance', selectedChild?.id, { page: 1, limit: 5 }],
    queryFn: () =>
      portalDataApi.getAttendance({ page: 1, limit: 5, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
  })

  const { data: feesData } = useQuery({
    queryKey: ['portal-fees', selectedChild?.id],
    queryFn: () => portalDataApi.getFees({ page: 1, limit: 50, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
  })

  const { data: announcementsData } = useQuery({
    queryKey: ['portal-announcements', parent?.id],
    queryFn: () => portalDataApi.getAnnouncements(),
    enabled: !!parent,
  })

  const { data: dailyReportData } = useQuery({
    queryKey: ['portal-daily-reports', selectedChild?.id, { page: 1, limit: 1 }],
    queryFn: () => portalDataApi.getDailyReports({ limit: 1, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
  })

  const { data: medicalData } = useQuery({
    queryKey: ['portal-medical', selectedChild?.id],
    queryFn: () => portalDataApi.getMedical(selectedChild?.id),
    enabled: !!selectedChild,
  })

  const { data: incidentsData } = useQuery({
    queryKey: ['portal-incidents', selectedChild?.id, { page: 1, limit: 1 }],
    queryFn: () => portalDataApi.getIncidents({ page: 1, limit: 1, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
  })

  // Derive badge data
  const todayAttendance = (attendanceData?.data as AttendanceRecord[] | undefined)?.find(
    (r) => r.date === today
  )

  const unpaidFees = ((feesData?.data as FeeRecord[] | undefined) ?? []).filter(
    (f) => f.status === 'unpaid' || f.status === 'partial'
  )
  const totalOutstanding = unpaidFees.reduce(
    (sum, f) => sum + (f.amount_owed - f.amount_paid - f.discount_amount),
    0
  )

  const latestReport = (dailyReportData?.data as DailyReport[] | undefined)?.[0]
  const todayReport = latestReport && latestReport.report_date === today ? latestReport : null

  const announcementCount = (announcementsData?.data as unknown[] | undefined)?.length ?? 0
  const allergyCount = medicalData?.data?.allergies?.length ?? 0
  const openIncidents = incidentsData?.meta?.total ?? 0

  // Today strip content
  const stripParts: string[] = []
  if (todayReport?.mood) {
    stripParts.push(t('todayStripMoodLine', { mood: t(MOOD_LABEL_KEY[todayReport.mood]) }))
  }
  if (todayReport?.meals_eaten) {
    stripParts.push(
      t('todayStripMealsLine', { meals: t(MEALS_LABEL_KEY[todayReport.meals_eaten]).toLowerCase() })
    )
  }
  const stripTitle = todayAttendance
    ? t(STATUS_LINE_KEY[todayAttendance.status])
    : t('noAttendanceYetToday')
  const stripSubtitle = stripParts.length > 0 ? stripParts.join(' · ') : t('noReportToday')
  const StripIcon = todayAttendance ? Check : Clock
  const stripTile = todayAttendance ? 'bg-wash-mint' : 'bg-wash-butter'
  const stripIconColor = todayAttendance ? 'text-ink-mint' : 'text-ink-butter'

  const navCards: NavCard[] = [
    {
      to: '/portal/daily-reports',
      icon: ClipboardList,
      label: t('dailyReports'),
      color: 'text-ink-butter',
      iconBg: 'bg-wash-butter',
    },
    {
      to: '/portal/attendance',
      icon: CalendarDays,
      label: t('attendance'),
      color: 'text-ink-mint',
      iconBg: 'bg-wash-mint',
    },
    {
      to: '/portal/fees',
      icon: Wallet,
      label: t('fees'),
      color: 'text-ink-peach',
      iconBg: 'bg-wash-peach',
    },
    {
      to: '/portal/announcements',
      icon: Megaphone,
      label: t('announcements'),
      color: 'text-ink-lavender',
      iconBg: 'bg-wash-lavender',
    },
    {
      to: '/portal/portfolio',
      icon: BookOpen,
      label: t('portfolio'),
      color: 'text-ink-sky',
      iconBg: 'bg-wash-sky',
    },
    {
      to: '/portal/medical',
      icon: HeartPulse,
      label: t('medicalProfile'),
      color: 'text-ink-blush',
      iconBg: 'bg-wash-blush',
    },
    {
      to: '/portal/incidents',
      icon: ShieldAlert,
      label: t('incidents'),
      color: 'text-gray-600 dark:text-gray-400',
      iconBg: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      to: '/portal/devices',
      icon: Smartphone,
      label: t('myDevices'),
      color: 'text-gray-600 dark:text-gray-400',
      iconBg: 'bg-gray-100 dark:bg-gray-800',
    },
  ]

  function getBadge(to: string) {
    switch (to) {
      case '/portal/daily-reports':
        if (todayReport?.mood) {
          const MIcon = MOOD_ICON[todayReport.mood] ?? SmilePlus
          return <MIcon className="w-3.5 h-3.5 text-ink-butter" />
        }
        return (
          <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium">
            {t('noReportToday')}
          </span>
        )
      case '/portal/attendance':
        if (todayAttendance) {
          const SIcon = STATUS_ICON[todayAttendance.status]
          return (
            <span
              className={`flex items-center gap-1 text-[10px] font-bold ${STATUS_COLOR[todayAttendance.status]}`}
            >
              <SIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{todayAttendance.status}</span>
            </span>
          )
        }
        return null
      case '/portal/fees':
        if (totalOutstanding > 0)
          return (
            <span className="text-[10px] font-bold text-ink-peach">
              {formatRM(totalOutstanding)}
            </span>
          )
        return <span className="text-[10px] font-bold text-ink-mint">{t('allPaid')}</span>
      case '/portal/announcements':
        if (announcementCount > 0)
          return (
            <span className="text-[10px] font-bold text-ink-lavender bg-wash-lavender px-1.5 py-0.5 rounded-full">
              {announcementCount}
            </span>
          )
        return null
      case '/portal/medical':
        if (allergyCount > 0)
          return (
            <span className="text-[10px] font-bold text-red-500">
              {allergyCount} {t('allergies').toLowerCase()}
            </span>
          )
        return null
      case '/portal/incidents':
        if (openIncidents > 0)
          return (
            <span className="text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
              {openIncidents}
            </span>
          )
        return null
      default:
        return null
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-lg mx-auto">
      {/* Hero greeting card — pastel sky in light, night sky in dark */}
      <div
        className={`bg-wash-sky rounded-3xl relative overflow-hidden p-5 transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      >
        {/* Dark mode night-sky ground + stars */}
        <div
          aria-hidden="true"
          className="hidden dark:block absolute inset-0"
          style={{ background: 'linear-gradient(135deg,#16233F 0%,#1E1B4B 100%)' }}
        >
          {HERO_STARS.map((star) => (
            <span
              key={`${star.top}-${star.left}`}
              className="absolute rounded-full bg-white opacity-50"
              style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
            />
          ))}
        </div>

        {/* Decor — sun in light, moon in dark */}
        <DoodleSun size={54} className="block dark:hidden absolute right-3 top-2" />
        <Moon
          aria-hidden="true"
          className="hidden dark:block absolute right-4 top-3 w-10 h-10 text-kinder-yellow fill-kinder-yellow"
        />

        <div className="relative flex flex-col gap-1.5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{getGreeting()}</p>
          <h2 className="font-fun font-bold text-2xl leading-tight text-gray-900 dark:text-white truncate">
            {selectedChild?.full_name ?? parent?.full_name?.split(' ')[0]}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">{dateString}</p>
          {selectedChild?.class_name && (
            <div className="mt-2 self-start">
              <StickerBadge color="bg-kinder-yellow" textColor="text-gray-900" rotate={-3}>
                {selectedChild.class_name}
              </StickerBadge>
            </div>
          )}
        </div>
      </div>

      {/* Today strip */}
      {selectedChild && (
        <button
          onClick={() => navigate('/portal/daily-reports')}
          className="w-full bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-3.5 flex items-center gap-3 text-left hover:border-gray-300 dark:hover:border-gray-700 active:scale-[0.99] transition-all"
        >
          <div
            className={`w-11 h-11 rounded-2xl ${stripTile} flex items-center justify-center shrink-0`}
          >
            <StripIcon className={`w-5 h-5 ${stripIconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
              {stripTitle}
            </p>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">
              {stripSubtitle}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 shrink-0" />
        </button>
      )}

      {/* Navigation card grid */}
      <div className="grid grid-cols-2 gap-3">
        {navCards.map((card) => {
          const Icon = card.icon
          const badge = getBadge(card.to)
          return (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-4 text-left hover:border-gray-300 dark:hover:border-gray-700 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl ${card.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">
                {card.label}
              </p>
              {badge && <div className="mt-1.5">{badge}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
