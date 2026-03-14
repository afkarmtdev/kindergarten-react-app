import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  CalendarCheck,
  BookOpen,
  Palette,
  Wallet,
  Award,
  ClipboardList,
  ChevronDown,
  Clock,
} from 'lucide-react'
import { studentsApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/translations'
import type { TimelineEvent, TimelineEventType } from '@/types'

const EVENT_CONFIG: Record<
  TimelineEventType,
  {
    icon: React.ElementType
    labelKey: TranslationKey
    bg: string
    text: string
    border: string
    iconBg: string
  }
> = {
  attendance: {
    icon: CalendarCheck,
    labelKey: 'attendance',
    bg: 'bg-green-100/70 dark:bg-gray-800/50',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-l-kinder-green',
    iconBg: 'bg-kinder-green',
  },
  portfolio: {
    icon: BookOpen,
    labelKey: 'portfolio',
    bg: 'bg-purple-100/70 dark:bg-gray-800/50',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-l-kinder-purple',
    iconBg: 'bg-kinder-purple',
  },
  artwork: {
    icon: Palette,
    labelKey: 'artWall',
    bg: 'bg-pink-100/70 dark:bg-gray-800/50',
    text: 'text-pink-700 dark:text-pink-400',
    border: 'border-l-kinder-pink',
    iconBg: 'bg-kinder-pink',
  },
  fee_payment: {
    icon: Wallet,
    labelKey: 'fees',
    bg: 'bg-orange-100/70 dark:bg-gray-800/50',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-l-kinder-orange',
    iconBg: 'bg-kinder-orange',
  },
  report_card: {
    icon: Award,
    labelKey: 'portfolio',
    bg: 'bg-blue-100/70 dark:bg-gray-800/50',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-l-kinder-blue',
    iconBg: 'bg-kinder-blue',
  },
  daily_report: {
    icon: ClipboardList,
    labelKey: 'dailyReports',
    bg: 'bg-yellow-100/70 dark:bg-gray-800/50',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-l-kinder-yellow',
    iconBg: 'bg-kinder-yellow',
  },
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Merge consecutive same-status attendance events into streaks */
type DisplayItem =
  | { kind: 'event'; event: TimelineEvent }
  | { kind: 'streak'; status: string; startDate: string; endDate: string; count: number }

function collapseAttendanceStreaks(events: TimelineEvent[]): DisplayItem[] {
  const items: DisplayItem[] = []
  let streak: { status: string; dates: string[] } | null = null

  for (const event of events) {
    if (event.type === 'attendance') {
      if (streak && streak.status === event.title) {
        streak.dates.push(event.date)
      } else {
        if (streak) items.push(flushStreak(streak))
        streak = { status: event.title, dates: [event.date] }
      }
    } else {
      if (streak) {
        items.push(flushStreak(streak))
        streak = null
      }
      items.push({ kind: 'event', event })
    }
  }
  if (streak) items.push(flushStreak(streak))
  return items
}

function flushStreak(streak: { status: string; dates: string[] }): DisplayItem {
  if (streak.dates.length === 1) {
    return {
      kind: 'event',
      event: { type: 'attendance', date: streak.dates[0], title: streak.status },
    }
  }
  return {
    kind: 'streak',
    status: streak.status,
    startDate: streak.dates[streak.dates.length - 1],
    endDate: streak.dates[0],
    count: streak.dates.length,
  }
}

function getItemDate(item: DisplayItem): string {
  return item.kind === 'event' ? item.event.date : item.endDate
}

export function StudentTimeline({ studentId }: { studentId: string }) {
  const t = useT()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['student-timeline', studentId],
    queryFn: ({ pageParam }) =>
      studentsApi.getTimeline(studentId, {
        limit: 20,
        before: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 60_000,
  })

  const allEvents: TimelineEvent[] = data?.pages.flatMap((p) => p.events) ?? []

  // Collapse attendance streaks and group by month
  const grouped = useMemo(() => {
    const items = collapseAttendanceStreaks(allEvents)
    const groups: { month: string; items: DisplayItem[] }[] = []
    let currentMonth = ''
    for (const item of items) {
      const month = formatMonthYear(getItemDate(item))
      if (month !== currentMonth) {
        currentMonth = month
        groups.push({ month, items: [] })
      }
      groups[groups.length - 1].items.push(item)
    }
    return groups
  }, [allEvents])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 animate-shimmer bg-[length:200%_100%] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-36 rounded-lg bg-gray-100 dark:bg-gray-800 animate-shimmer bg-[length:200%_100%]" />
              <div className="h-2.5 w-20 rounded-lg bg-gray-100 dark:bg-gray-800 animate-shimmer bg-[length:200%_100%]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Clock size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm font-medium">{t('timelineEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.month}>
          {/* Month header */}
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1">
            {group.month}
          </p>

          {/* Events */}
          <div className="relative ml-4 pl-6 border-l-2 border-gray-200 dark:border-gray-800">
            <div className="space-y-2.5">
              {group.items.map((item, i) => {
                if (item.kind === 'streak') {
                  return <StreakCard key={`streak-${item.endDate}-${i}`} item={item} />
                }
                return (
                  <EventCard
                    key={`${item.event.type}-${item.event.date}-${i}`}
                    event={item.event}
                  />
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Load more */}
      {hasNextPage && (
        <div className="text-center pt-2 pb-1">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-kinder-orange dark:hover:text-kinder-orange border border-gray-200 dark:border-gray-700 rounded-xl hover:border-kinder-orange/50 transition-all disabled:opacity-50"
          >
            <ChevronDown size={13} />
            {isFetchingNextPage ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}

function EventCard({ event }: { event: TimelineEvent }) {
  const t = useT()
  const config = EVENT_CONFIG[event.type]
  const Icon = config.icon

  return (
    <div
      className={`relative flex items-start gap-3 p-3 rounded-xl ${config.bg} border-l-4 ${config.border}`}
    >
      {/* Icon circle */}
      <div
        className={`w-8 h-8 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 cursor-default`}
        title={t(config.labelKey)}
      >
        <Icon size={14} className="text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
          {event.title}
        </p>
        {event.subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
            {event.subtitle}
          </p>
        )}
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 tabular-nums">
          {formatDay(event.date)}
        </p>
      </div>
    </div>
  )
}

function StreakCard({ item }: { item: Extract<DisplayItem, { kind: 'streak' }> }) {
  const t = useT()
  const config = EVENT_CONFIG.attendance
  const Icon = config.icon
  const statusLower = item.status.toLowerCase()
  const isPositive = statusLower === 'present' || statusLower === 'late'

  return (
    <div
      className={`relative flex items-start gap-3 p-3 rounded-xl ${config.bg} border-l-4 ${config.border}`}
    >
      {/* Icon circle */}
      <div
        className={`w-8 h-8 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 cursor-default`}
        title={t(config.labelKey)}
      >
        <Icon size={14} className="text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
          {item.status} for {item.count} days
          {isPositive && item.count >= 5 && (
            <span className="ml-1.5 text-[10px] font-bold text-kinder-orange">Streak!</span>
          )}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 tabular-nums">
          {formatDay(item.startDate)} — {formatDay(item.endDate)}
        </p>
      </div>

      {/* Count badge */}
      <span
        className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}
      >
        {item.count}d
      </span>
    </div>
  )
}
