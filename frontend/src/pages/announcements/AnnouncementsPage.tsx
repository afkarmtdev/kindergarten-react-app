import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Megaphone } from 'lucide-react'
import { announcementsApi } from '@/lib/api'
import { useAnnouncementsStore } from '@/store/announcementsStore'
import { AnnouncementModal } from '@/components/admin/AnnouncementModal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { AnnouncementCardSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { AnnouncementCard } from './components/AnnouncementCard'
import type { Announcement } from '@/types'

const LIMIT = 9

export function AnnouncementsPage() {
  usePageTitle('Announcements')
  const t = useT()
  const queryClient = useQueryClient()
  const { page, search, categoryFilter, setPage, setSearch, setCategoryFilter } =
    useAnnouncementsStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (a: Announcement) => {
    setEditing(a)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

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
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['announcements'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['announcements'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['announcements'] },
        (old) =>
          old?.data
            ? {
                ...old,
                data: old.data.filter((item) => item.id !== id),
                meta: { ...old.meta, total: Math.max(0, (old.meta?.total ?? 1) - 1) },
              }
            : old
      )
      return { snapshot }
    },
    onSuccess: () => {
      toast.success('Announcement removed')
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Failed to remove announcement. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements-public'] })
    },
  })

  const announcements = data?.data ?? []
  const meta = data?.meta

  useEffect(() => {
    if (data && page < data.meta.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['announcements', { page: page + 1, search, categoryFilter }],
        queryFn: () =>
          announcementsApi.getAll({
            page: page + 1,
            limit: LIMIT,
            search: search || undefined,
            category: categoryFilter || undefined,
          }),
        staleTime: 30_000,
      })
    }
  }, [data, page, search, categoryFilter, queryClient])

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
          className="flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full md:w-auto"
        >
          <Plus size={18} />
          {t('addAnnouncement')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="w-full md:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder="Search announcements..." />
        </div>
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
      <div
        className={`transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
      >
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
            {announcements.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                onEdit={openEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={LIMIT}
            onPageChange={setPage}
          />
        </div>
      )}

      <AnnouncementModal open={modalOpen} onClose={closeModal} announcement={editing} />
    </div>
  )
}
