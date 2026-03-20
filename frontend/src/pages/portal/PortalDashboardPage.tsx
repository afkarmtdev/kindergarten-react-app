import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck2,
  CalendarX2,
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
import type { AttendanceRecord, FeeRecord, DailyReport } from '../../types'

const STATUS_ICON = {
  present: CalendarCheck2,
  absent: CalendarX2,
  late: Clock,
  excused: MinusCircle,
}
const STATUS_COLOR = {
  present: 'text-green-700 dark:text-green-400',
  absent: 'text-red-700 dark:text-red-400',
  late: 'text-yellow-700 dark:text-yellow-400',
  excused: 'text-blue-700 dark:text-blue-400',
}

const MOOD_ICON: Record<string, React.ElementType> = {
  happy: SmilePlus,
  okay: Sun,
  tired: Moon,
  upset: AlertCircle,
}

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

  const navCards: NavCard[] = [
    {
      to: '/portal/daily-reports',
      icon: ClipboardList,
      label: t('dailyReports'),
      color: 'text-kinder-green',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      to: '/portal/attendance',
      icon: CalendarDays,
      label: t('attendance'),
      color: 'text-kinder-blue',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      to: '/portal/fees',
      icon: Wallet,
      label: t('fees'),
      color: 'text-kinder-orange',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      to: '/portal/announcements',
      icon: Megaphone,
      label: t('announcements'),
      color: 'text-kinder-purple',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      to: '/portal/portfolio',
      icon: BookOpen,
      label: t('portfolio'),
      color: 'text-kinder-purple',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      to: '/portal/medical',
      icon: HeartPulse,
      label: t('medicalProfile'),
      color: 'text-kinder-pink',
      iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    },
    {
      to: '/portal/incidents',
      icon: ShieldAlert,
      label: t('incidents'),
      color: 'text-red-500',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      to: '/portal/devices',
      icon: Smartphone,
      label: t('myDevices'),
      color: 'text-gray-500 dark:text-gray-400',
      iconBg: 'bg-gray-100 dark:bg-gray-800',
    },
  ]

  function getBadge(to: string) {
    switch (to) {
      case '/portal/daily-reports':
        if (todayReport?.mood) {
          const MIcon = MOOD_ICON[todayReport.mood] ?? SmilePlus
          return <MIcon className="w-3.5 h-3.5 text-kinder-yellow" />
        }
        return (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            {t('noReportToday')}
          </span>
        )
      case '/portal/attendance':
        if (todayAttendance) {
          const SIcon = STATUS_ICON[todayAttendance.status]
          return (
            <span
              className={`flex items-center gap-1 text-[10px] font-semibold ${STATUS_COLOR[todayAttendance.status]}`}
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
            <span className="text-[10px] font-bold text-kinder-orange">
              {formatRM(totalOutstanding)}
            </span>
          )
        return (
          <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
            {t('allPaid')}
          </span>
        )
      case '/portal/announcements':
        if (announcementCount > 0)
          return (
            <span className="text-[10px] font-bold text-kinder-purple bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-full">
              {announcementCount}
            </span>
          )
        return null
      case '/portal/medical':
        if (allergyCount > 0)
          return (
            <span className="text-[10px] font-semibold text-red-500 dark:text-red-400">
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
      {/* Hero section */}
      <div
        className={`bg-gradient-to-br from-kinder-orange to-orange-400 dark:from-kinder-orange/90 dark:to-orange-500/80 rounded-2xl p-5 shadow-sm transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      >
        <p className="text-sm text-white/80 font-medium">{getGreeting()}!</p>
        <h2 className="text-lg font-bold text-white leading-tight truncate">
          {selectedChild?.full_name ?? parent?.full_name?.split(' ')[0]}
        </h2>
        <p className="text-xs text-white/70 mt-0.5">{dateString}</p>
        {selectedChild?.class_name && (
          <span className="inline-block mt-1.5 text-[11px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
            {selectedChild.class_name}
          </span>
        )}
      </div>

      {/* Navigation card grid */}
      <div className="grid grid-cols-2 gap-3">
        {navCards.map((card) => {
          const Icon = card.icon
          const badge = getBadge(card.to)
          return (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm text-left hover:border-gray-300 dark:hover:border-gray-700 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
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
