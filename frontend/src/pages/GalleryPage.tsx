import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Camera, Pencil, Trash2, Eye, EyeOff, ZoomIn } from 'lucide-react'
import { galleryApi } from '@/lib/api'
import { useGalleryStore } from '@/store/galleryStore'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { ClassCardSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { GalleryModal } from '@/components/admin/GalleryModal'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import { PhotoLightbox } from '@/pages/landing/components/PhotoLightbox'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { GalleryItem } from '@/types'

const LIMIT = 9

export function GalleryPage() {
  usePageTitle('Gallery')
  const t = useT()
  const queryClient = useQueryClient()
  const { page, search, setPage, setSearch } = useGalleryStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<GalleryItem | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['gallery', { page, search }],
    queryFn: () => galleryApi.getAll({ page, limit: LIMIT, search }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: galleryApi.delete,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['gallery'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['gallery'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['gallery'] },
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
      toast.success('Photo removed')
      setDeletingItem(null)
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Failed to remove photo. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })

  const items = data?.data ?? []
  const meta = data?.meta

  useEffect(() => {
    if (data && page < data.meta.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['gallery', { page: page + 1, search }],
        queryFn: () => galleryApi.getAll({ page: page + 1, limit: LIMIT, search }),
        staleTime: 30_000,
      })
    }
  }, [data, page, search, queryClient])

  const openAdd = () => {
    setEditingItem(null)
    setModalOpen(true)
  }
  const openEdit = (item: GalleryItem) => {
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
          <h1 className="text-2xl md:text-3xl font-fun font-bold text-gray-900 dark:text-gray-100">
            {t('gallery')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {meta ? `${meta.total} photos` : t('loading')}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors w-full md:w-auto"
        >
          <Plus size={18} />
          {t('addPhoto')}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 w-full md:w-72">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by caption..." />
      </div>

      <div
        className={`transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
      >
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <ClassCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Camera}
            title={t('noGalleryPhotos')}
            subtitle={search ? t('noResultsFor', { q: search }) : t('addFirstPhoto')}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item: GalleryItem, idx: number) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border-2 border-gray-200 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden"
              >
                {/* Photo thumbnail */}
                <div className="relative w-full h-36 sm:h-44 bg-gray-100 dark:bg-gray-800">
                  {item.photo_url ? (
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      aria-label={t('viewPhoto')}
                      className="group/photo relative block w-full h-full overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-kinder-orange/50"
                    >
                      <img
                        src={item.photo_url}
                        alt={item.caption ?? 'Gallery photo'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-110"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-200">
                        <ZoomIn size={32} className="text-white drop-shadow" />
                      </span>
                    </button>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera size={32} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  {/* Visible badge overlay */}
                  <div
                    className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.is_visible ? 'bg-kinder-green text-white' : 'bg-gray-500 text-white'
                    }`}
                  >
                    {item.is_visible ? <Eye size={10} /> : <EyeOff size={10} />}
                    {item.is_visible ? 'Visible' : 'Hidden'}
                  </div>
                </div>

                {/* Card footer */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {item.caption || <span className="text-gray-400 italic">No caption</span>}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Order: {item.display_order}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-kinder-blue dark:hover:text-kinder-blue transition-colors rounded-lg"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-500 transition-colors rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
      <GalleryModal open={modalOpen} onClose={closeModal} item={editingItem} />
      <PhotoLightbox
        urls={items.map((item: GalleryItem) => item.photo_url)}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
      <DeleteDialog
        show={!!deletingItem}
        itemName={deletingItem?.caption || undefined}
        onConfirm={() => {
          if (deletingItem) {
            deleteMutation.mutate(deletingItem.id)
            setDeletingItem(null)
          }
        }}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}
