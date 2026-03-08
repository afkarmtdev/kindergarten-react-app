import { useQuery } from '@tanstack/react-query'
import { Megaphone, Pin } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { Announcement } from '../../types'

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  holiday: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  event: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  reminder: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
}

export default function PortalAnnouncementsPage() {
  usePageTitle('Announcements')
  const { parent } = useParentAuth()
  const t = useT()

  const { data, isLoading } = useQuery({
    queryKey: ['portal-announcements', parent?.id],
    queryFn: () => portalDataApi.getAnnouncements(),
    enabled: !!parent,
  })

  const announcements: Announcement[] = data?.data ?? []

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('announcements')}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">No announcements</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Check back later for updates
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {a.image_url && (
                <img
                  src={a.image_url}
                  alt=""
                  className="w-full h-32 object-cover rounded-xl mb-3"
                />
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                  {a.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  {a.is_pinned && (
                    <span className="flex items-center gap-0.5 text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-md font-semibold">
                      <Pin className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold capitalize ${CATEGORY_COLORS[a.category] ?? CATEGORY_COLORS.general}`}
                  >
                    {a.category}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{a.body}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {new Date(a.created_at).toLocaleDateString('en-MY', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
