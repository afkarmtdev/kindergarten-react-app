import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, User, Filter, Upload } from 'lucide-react'
import { studentsApi, classesApi } from '@/lib/api'
import { useStudentsStore } from '@/store/studentsStore'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { StudentCardSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { StudentModal } from '@/components/admin/StudentModal'
import { BulkImportModal } from '@/components/admin/BulkImportModal'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { StudentCard } from './components/StudentCard'
import type { Student } from '@/types'

const LIMIT = 12

export function StudentsPage() {
  usePageTitle('Students')
  const t = useT()
  const queryClient = useQueryClient()
  const {
    page,
    search,
    classFilter,
    genderFilter,
    statusFilter,
    setPage,
    setSearch,
    setClassFilter,
    setGenderFilter,
    setStatusFilter,
  } = useStudentsStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  const { data: classesData } = useQuery({
    queryKey: ['classes', { page: 1, search: '', status: 'active' }],
    queryFn: () => classesApi.getAll({ limit: 50, status: 'active' }),
    staleTime: 60_000,
  })

  const classes = classesData?.data ?? []

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'students',
      { page, search, class_id: classFilter, gender: genderFilter, status: statusFilter },
    ],
    queryFn: () =>
      studentsApi.getAll({
        page,
        limit: LIMIT,
        search,
        class_id: classFilter,
        gender: genderFilter,
        status: statusFilter,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: studentsApi.delete,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['students'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['students'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['students'] },
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
      toast.success('Student removed')
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Failed to remove student. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const students = data?.data ?? []
  const meta = data?.meta

  useEffect(() => {
    if (data && page < data.meta.totalPages) {
      queryClient.prefetchQuery({
        queryKey: [
          'students',
          {
            page: page + 1,
            search,
            class_id: classFilter,
            gender: genderFilter,
            status: statusFilter,
          },
        ],
        queryFn: () =>
          studentsApi.getAll({
            page: page + 1,
            limit: LIMIT,
            search,
            class_id: classFilter,
            gender: genderFilter,
            status: statusFilter,
          }),
        staleTime: 30_000,
      })
    }
  }, [data, page, search, classFilter, genderFilter, statusFilter, queryClient])

  const openAdd = () => {
    setEditingStudent(null)
    setModalOpen(true)
  }
  const openEdit = (s: Student) => {
    setEditingStudent(s)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditingStudent(null)
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('students')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {meta ? `${meta.total} ${t('enrolled').toLowerCase()}` : t('loading')}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex-1 md:flex-none"
          >
            <Upload size={16} />
            {t('importCsv')}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors flex-1 md:flex-none"
          >
            <Plus size={18} />
            {t('addStudent')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="w-full md:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder={t('searchStudents')} />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="flex-1 md:flex-none border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 text-gray-600"
        >
          <option value="">{t('allClasses')}</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="flex-1 md:flex-none border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 text-gray-600"
        >
          <option value="">{t('allGenders')}</option>
          <option value="male">{t('boys')}</option>
          <option value="female">{t('girls')}</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex-1 md:flex-none border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 text-gray-600"
        >
          <option value="">{t('allStatuses')}</option>
          <option value="active">{t('statusActive')}</option>
          <option value="graduated">{t('statusGraduated')}</option>
          <option value="inactive">{t('statusInactive')}</option>
        </select>

        {(search || classFilter || genderFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch('')
              setClassFilter('')
              setGenderFilter('')
              setStatusFilter('')
            }}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2"
          >
            <Filter size={12} />
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* Grid */}
      <div
        className={`transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
      >
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <StudentCardSkeleton key={i} />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={User}
            title={t('noStudentsFound')}
            subtitle={search ? t('noResultsFor', { q: search }) : t('addFirstStudent')}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {students.map((student: Student) => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={openEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
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

      {/* Modals */}
      <StudentModal open={modalOpen} onClose={closeModal} student={editingStudent} />
      <BulkImportModal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} />
    </div>
  )
}
