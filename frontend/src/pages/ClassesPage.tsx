import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, School, Users, Trash2, Pencil } from 'lucide-react'
import { classesApi } from '@/lib/api'
import { useClassesStore } from '@/store/classesStore'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { ClassCardSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { ClassModal } from '@/components/admin/ClassModal'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { ClassRoom } from '@/types'

const LIMIT = 9
const CLASS_COLORS = [
  'bg-kinder-blue',
  'bg-kinder-purple',
  'bg-kinder-green',
  'bg-kinder-orange',
  'bg-kinder-pink',
]

export function ClassesPage() {
  usePageTitle('Classes')
  const t = useT()
  const queryClient = useQueryClient()
  const { page, search, setPage, setSearch } = useClassesStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null)
  const [deletingClass, setDeletingClass] = useState<ClassRoom | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['classes', { page, search }],
    queryFn: () => classesApi.getAll({ page, limit: LIMIT, search }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: classesApi.delete,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['classes'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['classes'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['classes'] },
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
      toast.success('Class removed')
      setDeletingClass(null)
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Failed to remove class. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })

  const classes = data?.data ?? []
  const meta = data?.meta

  useEffect(() => {
    if (data && page < data.meta.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['classes', { page: page + 1, search }],
        queryFn: () => classesApi.getAll({ page: page + 1, limit: LIMIT, search }),
        staleTime: 30_000,
      })
    }
  }, [data, page, search, queryClient])

  const openAdd = () => {
    setEditingClass(null)
    setModalOpen(true)
  }
  const openEdit = (cls: ClassRoom) => {
    setEditingClass(cls)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditingClass(null)
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('classes')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {meta ? `${meta.total} ${t('classrooms')}` : t('loading')}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-100 w-full md:w-auto"
        >
          <Plus size={18} />
          {t('addClass')}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 w-full md:w-72">
        <SearchBar value={search} onChange={setSearch} placeholder={t('searchClasses')} />
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
        ) : classes.length === 0 ? (
          <EmptyState
            icon={School}
            title={t('noClassesFound')}
            subtitle={search ? t('noResultsFor', { q: search }) : t('createFirstClass')}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls: ClassRoom, i: number) => {
              const studentCount = Array.isArray(cls.students)
                ? typeof cls.students[0] === 'object' && 'count' in (cls.students[0] as object)
                  ? (cls.students[0] as unknown as { count: number }).count
                  : cls.students.length
                : 0
              const fillPct = Math.min(Math.round((studentCount / cls.capacity) * 100), 100)
              const color = CLASS_COLORS[i % CLASS_COLORS.length]

              return (
                <div
                  key={cls.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-sm`}
                    >
                      <School className="text-white" size={22} />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEdit(cls)}
                        className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-kinder-blue dark:hover:text-kinder-blue transition-colors rounded-lg"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingClass(cls)}
                        className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{cls.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {t('teacher')}: {cls.teacher_name}
                  </p>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{t('students_count', { n: studentCount })}</span>
                      </div>
                      <span className={fillPct >= 90 ? 'text-red-500 font-semibold' : ''}>
                        {fillPct}
                        {t('full')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${fillPct >= 90 ? 'bg-red-400' : color}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                      {t('capacity', { n: cls.capacity })}
                    </p>
                  </div>
                </div>
              )
            })}
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
      <ClassModal open={modalOpen} onClose={closeModal} classroom={editingClass} />
      <DeleteDialog
        show={!!deletingClass}
        itemName={deletingClass?.name}
        onConfirm={() => {
          if (deletingClass) {
            deleteMutation.mutate(deletingClass.id)
            setDeletingClass(null)
          }
        }}
        onCancel={() => setDeletingClass(null)}
      />
    </div>
  )
}
