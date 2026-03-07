import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Palette } from 'lucide-react'
import { artWallApi } from '@/lib/api'
import { useArtWallStore } from '@/store/artWallStore'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/Skeletons'
import { ArtWallModal } from '@/components/admin/ArtWallModal'
import { ArtworkCard } from './components/ArtworkCard'
import { ArtworkCardSkeleton } from './components/ArtworkCardSkeleton'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { CORK_STYLE, CORK_STYLE_DARK } from './constants'
import { useSettingsStore } from '@/store/settingsStore'
import type { ArtWallItem } from '@/types'

const LIMIT = 12

export function ArtWallPage() {
  usePageTitle('Art Wall')
  const t = useT()
  const queryClient = useQueryClient()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const { page, search, setPage, setSearch } = useArtWallStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ArtWallItem | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['art-wall', { page, limit: LIMIT, search }],
    queryFn: () => artWallApi.getAll({ page, limit: LIMIT, search }),
    placeholderData: (prev: unknown) => prev,
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: artWallApi.delete,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['art-wall'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['art-wall'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['art-wall'] },
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
      toast.success('Artwork removed')
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Failed to remove artwork. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['art-wall'] })
    },
  })

  const items = data?.data ?? []
  const meta = data?.meta

  useEffect(() => {
    if (data && page < data.meta.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['art-wall', { page: page + 1, limit: LIMIT, search }],
        queryFn: () => artWallApi.getAll({ page: page + 1, limit: LIMIT, search }),
        staleTime: 30_000,
      })
    }
  }, [data, page, search, queryClient])

  const openAdd = () => {
    setEditingItem(null)
    setModalOpen(true)
  }
  const openEdit = (item: ArtWallItem) => {
    setEditingItem(item)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditingItem(null)
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('artWall')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {meta ? `${meta.total} artworks` : t('loading')}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full md:w-auto"
        >
          <Plus size={18} />
          {t('addArtwork')}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 w-full md:w-72">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by caption..." />
      </div>

      {/* Cork board container */}
      <div
        className="bg-amber-100/80 dark:bg-amber-950/40 rounded-3xl p-6 md:p-8 border border-amber-300/60 dark:border-amber-800/30"
        style={darkMode ? CORK_STYLE_DARK : CORK_STYLE}
      >
        <div
          className={`transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
        >
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6 pt-8">
              {Array.from({ length: LIMIT }).map((_, i) => (
                <ArtworkCardSkeleton key={i} design="polaroid" size="lg" index={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Palette}
              title={t('noArtwork')}
              subtitle={search ? t('noResultsFor', { q: search }) : t('addFirstArtwork')}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((item: ArtWallItem) => (
                <ArtworkCard
                  key={item.id}
                  item={item}
                  design="polaroid"
                  size="lg"
                  onEdit={openEdit}
                  onDelete={(item) => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}

      {/* Modal */}
      <ArtWallModal show={modalOpen} onClose={closeModal} editingItem={editingItem} />
    </div>
  )
}
