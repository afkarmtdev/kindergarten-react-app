import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, User, Trash2, Phone, Mail, Filter, Pencil } from 'lucide-react'
import { studentsApi } from '@/lib/api'
import { useStudentsStore } from '@/store/studentsStore'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { StudentCardSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { StudentModal } from '@/components/admin/StudentModal'
import { useT } from '@/hooks/useT'
import type { Student } from '@/types'

const LIMIT = 12

export function StudentsPage() {
  const t = useT()
  const queryClient = useQueryClient()
  const { page, search, classFilter, genderFilter, setPage, setSearch, setClassFilter, setGenderFilter } =
    useStudentsStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['students', { page, search, class_name: classFilter, gender: genderFilter }],
    queryFn: () =>
      studentsApi.getAll({ page, limit: LIMIT, search, class_name: classFilter, gender: genderFilter }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: studentsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  })

  const students = data?.data ?? []
  const meta = data?.meta

  const openAdd = () => { setEditingStudent(null); setModalOpen(true) }
  const openEdit = (s: Student) => { setEditingStudent(s); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingStudent(null) }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{t('students')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {meta ? `${meta.total} ${t('enrolled').toLowerCase()}` : t('loading')}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-100"
        >
          <Plus size={18} />
          {t('addStudent')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="w-72">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={t('searchStudents')}
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 text-gray-600"
        >
          <option value="">{t('allClasses')}</option>
          <option value="Sunflower">Sunflower</option>
          <option value="Rainbow">Rainbow</option>
          <option value="Butterfly">Butterfly</option>
          <option value="Star">Star</option>
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 text-gray-600"
        >
          <option value="">{t('allGenders')}</option>
          <option value="male">{t('boys')}</option>
          <option value="female">{t('girls')}</option>
        </select>

        {(search || classFilter || genderFilter) && (
          <button
            onClick={() => { setSearch(''); setClassFilter(''); setGenderFilter('') }}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2"
          >
            <Filter size={12} />
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* Grid */}
      <div className={`transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
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
              <div
                key={student.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.full_name}
                      className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-kinder-blue rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">{student.full_name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{student.full_name}</h3>
                    <span className="inline-block bg-orange-50 dark:bg-orange-900/30 text-kinder-orange text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
                      {student.class_name}
                    </span>
                    <span className={`ml-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                      student.gender === 'male'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                    }`}>
                      {student.gender === 'male' ? t('boy') : t('girl')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(student)}
                      className="text-gray-300 dark:text-gray-600 hover:text-kinder-blue dark:hover:text-kinder-blue transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('removeConfirm', { name: student.full_name })))
                          deleteMutation.mutate(student.id)
                      }}
                      className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <User size={11} className="flex-shrink-0" />
                    <span className="truncate">{t('parent')}: {student.parent_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Mail size={11} className="flex-shrink-0" />
                    <span className="truncate">{student.parent_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Phone size={11} className="flex-shrink-0" />
                    <span>{student.parent_phone}</span>
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
      <StudentModal
        open={modalOpen}
        onClose={closeModal}
        student={editingStudent}
      />
    </div>
  )
}
