import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Quote } from 'lucide-react'
import { testimonialsApi } from '@/lib/api'
import { useTestimonialsStore } from '@/store/testimonialsStore'
import { TestimonialModal } from '@/components/admin/TestimonialModal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { AnnouncementCardSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { TestimonialCard } from './components/TestimonialCard'
import type { Testimonial } from '@/types'

const LIMIT = 9

export function TestimonialsPage() {
  usePageTitle('Testimonials')
  const t = useT()
  const queryClient = useQueryClient()
  const { page, search, setPage, setSearch } = useTestimonialsStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (testimonial: Testimonial) => {
    setEditing(testimonial)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['testimonials', { page, search }],
    queryFn: () =>
      testimonialsApi.getAll({
        page,
        limit: LIMIT,
        search: search || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: testimonialsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['testimonials-public'] })
      toast.success('Testimonial removed')
    },
    onError: () => {
      toast.error('Failed to remove testimonial. Please try again.')
    },
  })

  const testimonialsList = data?.data ?? []
  const meta = data?.meta

  useEffect(() => {
    if (data && page < data.meta.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['testimonials', { page: page + 1, search }],
        queryFn: () =>
          testimonialsApi.getAll({
            page: page + 1,
            limit: LIMIT,
            search: search || undefined,
          }),
        staleTime: 30_000,
      })
    }
  }, [data, page, search, queryClient])

  return (
    <div className="p-4 md:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('testimonials')}
          </h1>
          {meta && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {meta.total} {t('testimonials').toLowerCase()}
            </p>
          )}
        </div>

        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-100 w-full md:w-auto"
        >
          <Plus size={18} />
          {t('addTestimonial')}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="w-full md:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder="Search testimonials..." />
        </div>
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
        ) : testimonialsList.length === 0 ? (
          <EmptyState
            icon={Quote}
            title={t('noTestimonialsFound')}
            subtitle={t('addFirstTestimonial')}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonialsList.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
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

      <TestimonialModal open={modalOpen} onClose={closeModal} testimonial={editing} />
    </div>
  )
}
