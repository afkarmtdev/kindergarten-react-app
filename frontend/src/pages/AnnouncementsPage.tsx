import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Megaphone, Pin, Calendar } from 'lucide-react'
import { announcementsApi } from '@/lib/api'
import { useAnnouncementsStore } from '@/store/announcementsStore'
import { AnnouncementModal } from '@/components/admin/AnnouncementModal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { AnnouncementCardSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { useT } from '@/hooks/useT'
import type { Announcement } from '@/types'

const LIMIT = 9

const CATEGORY_COLORS: Record<Announcement['category'], string> = {
  general:  'bg-kinder-blue/10 text-kinder-blue',
  holiday:  'bg-kinder-green/10 text-kinder-green',
  event:    'bg-kinder-purple/10 text-kinder-purple',
  reminder: 'bg-kinder-yellow/10 text-yellow-600',
}

const CATEGORY_GRADIENTS: Record<Announcement['category'], string> = {
  general:  'from-kinder-blue/20 to-kinder-blue/10',
  holiday:  'from-kinder-green/20 to-kinder-green/10',
  event:    'from-kinder-purple/20 to-kinder-purple/10',
  reminder: 'from-kinder-yellow/20 to-kinder-yellow/10',
}

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date(new Date().toDateString())
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AnnouncementsPage() {
  const t = useT()
  const queryClient = useQueryClient()
  const { page, search, categoryFilter, setPage, setSearch, setCategoryFilter } =
    useAnnouncementsStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (a: Announcement) => { setEditing(a); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['announcements', { page, search, categoryFilter }],
    queryFn: () =>
      announcementsApi.getAll({
        page,
        limit: LIMIT,
        search: search || undefined,
        category: categoryFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: announcementsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements-public'] })
      toast.success('Announcement removed')
    },
    onError: () => {
      toast.error('Failed to remove announcement. Please try again.')
    },
  })

  const announcements = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="p-4 md:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('announcements')}
          </h1>
          {meta && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {meta.total} {t('announcements').toLowerCase()}
            </p>
          )}
        </div>

        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-100 w-full md:w-auto"
        >
          <Plus size={18} />
          {t('addAnnouncement')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search announcements..."
          className="w-full md:w-72"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex-1 md:flex-none md:w-44 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 transition-all"
        >
          <option value="">{t('allCategories')}</option>
          <option value="general">{t('categoryGeneral')}</option>
          <option value="holiday">{t('categoryHoliday')}</option>
          <option value="event">{t('categoryEvent')}</option>
          <option value="reminder">{t('categoryReminder')}</option>
        </select>
      </div>

      {/* Grid */}
      <div className={`transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <AnnouncementCardSkeleton key={i} />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={t('noAnnouncementsFound')}
            subtitle={t('addFirstAnnouncement')}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {announcements.map((a) => {
              const expired = isExpired(a.expires_at)
              return (
                <div
                  key={a.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 ${
                    a.is_pinned
                      ? 'border-kinder-yellow dark:border-kinder-yellow'
                      : 'border-gray-100 dark:border-gray-800'
                  }`}
                >
                  {/* Banner */}
                  <div className="relative">
                    {a.image_url ? (
                      <div className="h-36 overflow-hidden">
                        <img
                          src={a.image_url}
                          alt={a.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.className =
                              `h-36 bg-gradient-to-br ${CATEGORY_GRADIENTS[a.category]}`
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`h-36 bg-gradient-to-br ${CATEGORY_GRADIENTS[a.category]}`} />
                    )}

                    {/* Badges overlay */}
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[a.category]}`}>
                        {t(`category${a.category.charAt(0).toUpperCase()}${a.category.slice(1)}` as 'categoryGeneral')}
                      </span>
                      {a.is_pinned && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-kinder-yellow/20 text-yellow-700 dark:text-yellow-500 flex items-center gap-1">
                          <Pin size={10} />
                          {t('pinnedBadge')}
                        </span>
                      )}
                      {expired && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {t('expiredBadge')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug mb-1.5 line-clamp-2">
                      {a.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {a.body}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4">
                      {a.expires_at ? (
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <Calendar size={11} />
                          {formatDate(a.expires_at)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                      )}

                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(a)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-kinder-blue/10 transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('removeAnnouncementConfirm').replace('{title}', a.title))) {
                              deleteMutation.mutate(a.id)
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <AnnouncementModal open={modalOpen} onClose={closeModal} announcement={editing} />
    </div>
  )
}
