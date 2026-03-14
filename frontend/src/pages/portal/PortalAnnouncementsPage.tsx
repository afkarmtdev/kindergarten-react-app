import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, Pin } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { Announcement } from '../../types'

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  general: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  holiday: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  event: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  reminder: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  general: 'bg-blue-400',
  holiday: 'bg-green-400',
  event: 'bg-purple-400',
  reminder: 'bg-orange-400',
}

const STORAGE_KEY = 'portal_read_announcements'

function getReadIds(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function markAsRead(id: string) {
  const ids = getReadIds()
  ids.add(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function PortalAnnouncementsPage() {
  usePageTitle('Announcements')
  const { parent } = useParentAuth()
  const t = useT()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds())

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
    if (!readIds.has(id)) {
      markAsRead(id)
      setReadIds((prev) => new Set([...prev, id]))
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['portal-announcements', parent?.id],
    queryFn: () => portalDataApi.getAnnouncements(),
    enabled: !!parent,
  })

  const announcements: Announcement[] = data?.data ?? []
  const featured = announcements.find((a) => a.is_pinned) ?? null
  const rest = announcements.filter((a) => a.id !== featured?.id)

  useEffect(() => {
    if (featured) {
      markAsRead(featured.id)
      setReadIds((prev) => new Set([...prev, featured.id]))
    }
  }, [featured?.id])

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('announcements')}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No announcements</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Check back later for updates
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Featured pinned card */}
          {featured && (
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
              {featured.image_url ? (
                <div className="relative h-40">
                  <img
                    src={featured.image_url}
                    alt=""
                    className="w-full h-40 object-cover rounded-t-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span
                      className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md font-semibold capitalize mb-1 ${CATEGORY_BADGE_COLORS[featured.category] ?? CATEGORY_BADGE_COLORS.general}`}
                    >
                      {featured.category}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                      {featured.title}
                    </h3>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-kinder-orange to-orange-400 p-4">
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-md font-semibold capitalize mb-2 bg-white/20 text-white">
                    {featured.category}
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug">{featured.title}</h3>
                </div>
              )}
              <div className="bg-white dark:bg-gray-900 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {featured.body}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {formatDate(featured.created_at)}
                </p>
              </div>
            </div>
          )}

          {/* Regular cards */}
          {rest.map((a) => {
            const isExpanded = expandedId === a.id
            const dotColor = CATEGORY_DOT_COLORS[a.category] ?? CATEGORY_DOT_COLORS.general

            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleExpand(a.id)}
                className="w-full text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {!readIds.has(a.id) && (
                    <span className="w-2 h-2 rounded-full bg-kinder-blue animate-pulse shrink-0" />
                  )}
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {a.is_pinned && <Pin className="w-3 h-3 text-yellow-500 shrink-0" />}
                      <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {a.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatDate(a.created_at)}
                    </p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                    {a.image_url && (
                      <img
                        src={a.image_url}
                        alt=""
                        className="w-full h-36 object-cover rounded-xl mt-3 mb-3"
                      />
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
                      {a.body}
                    </p>
                    <span
                      className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md font-semibold capitalize mt-3 ${CATEGORY_BADGE_COLORS[a.category] ?? CATEGORY_BADGE_COLORS.general}`}
                    >
                      {a.category}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
