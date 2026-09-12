import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Briefcase } from 'lucide-react'
import { careersApi } from '@/lib/api'
import { useCareersStore } from '@/store/careersStore'
import { JobPostingModal } from '@/components/admin/JobPostingModal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { AnnouncementCardSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { JobPostingCard } from './components/JobPostingCard'
import type { JobPosting } from '@/types'

const LIMIT = 9

const POSTING_STATUSES = ['draft', 'published', 'closed'] as const

const STATUS_TAB_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  published: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400',
}

export function CareersPage() {
  usePageTitle('Careers')
  const t = useT()
  const queryClient = useQueryClient()
  const { page, search, statusFilter, setPage, setSearch, setStatusFilter } = useCareersStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<JobPosting | null>(null)

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (posting: JobPosting) => {
    setEditing(posting)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['job-postings', { page, search, status: statusFilter }],
    queryFn: () =>
      careersApi.getPostings({
        page,
        limit: LIMIT,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: careersApi.deletePosting,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['job-postings'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['job-postings'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['job-postings'] },
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
      toast.success(t('postingRemoved'))
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Failed to remove posting. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] })
    },
  })

  const postingsList = data?.data ?? []
  const meta = data?.meta

  useEffect(() => {
    if (data && page < data.meta.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['job-postings', { page: page + 1, search, status: statusFilter }],
        queryFn: () =>
          careersApi.getPostings({
            page: page + 1,
            limit: LIMIT,
            search: search || undefined,
            status: statusFilter || undefined,
          }),
        staleTime: 30_000,
      })
    }
  }, [data, page, search, statusFilter, queryClient])

  return (
    <div className="p-4 md:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-fun font-bold text-gray-900 dark:text-white">
            {t('jobPostings')}
          </h1>
          {meta && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {meta.total} {t('jobPostings').toLowerCase()}
            </p>
          )}
        </div>

        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full md:w-auto"
        >
          <Plus size={18} />
          {t('addPosting')}
        </button>
      </div>

      {/* Search + Status tabs */}
      <div className="mb-6 space-y-4">
        <div className="w-full md:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder={t('searchPostings')} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['', ...POSTING_STATUSES] as const).map((s) => {
            const isActive = statusFilter === s
            const label = s === '' ? t('all') : t(`posting_${s}` as keyof typeof t)
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  isActive
                    ? s === ''
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                      : (STATUS_TAB_STYLES[s] || '') + ' border-current'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <div
        className={`transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}
      >
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <AnnouncementCardSkeleton key={i} />
            ))}
          </div>
        ) : postingsList.length === 0 ? (
          <EmptyState icon={Briefcase} title={t('noPostings')} subtitle={t('addFirstPosting')} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {postingsList.map((posting) => (
              <JobPostingCard
                key={posting.id}
                posting={posting}
                onEdit={() => openEdit(posting)}
                onDelete={() => deleteMutation.mutate(posting.id)}
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

      <JobPostingModal show={modalOpen} onClose={closeModal} posting={editing} />
    </div>
  )
}
