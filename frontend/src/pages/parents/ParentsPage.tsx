import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useT } from '@/hooks/useT'
import { useParentsStore } from '@/store/parentsStore'
import { parentsApi } from '@/lib/api'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { TableRowSkeleton } from '@/components/ui/Skeletons'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import { ParentDetailModal } from './components/ParentDetailModal'
import type { Parent } from '@/types'

const LIMIT = 12

export function ParentsPage() {
  usePageTitle('Parents')
  const t = useT()
  const queryClient = useQueryClient()

  const { page, search, setPage, setSearch } = useParentsStore()
  const [deletingParent, setDeletingParent] = useState<Parent | null>(null)
  const [viewingParentId, setViewingParentId] = useState<string | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['parents', { page, search }],
    queryFn: () => parentsApi.getAll({ page, limit: LIMIT, search }),
    placeholderData: (prev) => prev,
  })

  // Prefetch next page
  useEffect(() => {
    if (data?.meta && page < data.meta.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['parents', { page: page + 1, search }],
        queryFn: () => parentsApi.getAll({ page: page + 1, limit: LIMIT, search }),
      })
    }
  }, [page, search, data?.meta, queryClient])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => parentsApi.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['parents'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['parents'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['parents'] },
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
      toast.success('Parent removed')
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Failed to remove parent. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
    },
  })

  const parents = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t('parents')}
          </h1>
          {meta && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {meta.total} {t('parents').toLowerCase()}
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone..."
          debounceMs={350}
        />
      </div>

      {/* Table */}
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-opacity duration-150 ${
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Phone
                </th>
                <th className="hidden md:table-cell text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Children
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Portal
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : parents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={36} className="text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        No parents found
                      </p>
                      {search && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          No results for "{search}"
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                parents.map((parent) => (
                  <tr
                    key={parent.id}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-kinder-orange flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {parent.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">
                          {parent.full_name}
                        </span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {parent.phone}
                    </td>

                    {/* Email — hidden on mobile */}
                    <td className="hidden md:table-cell px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[180px]">
                      <span className="truncate block">{parent.email ?? '—'}</span>
                    </td>

                    {/* Children count */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 bg-kinder-blue/10 text-kinder-blue text-xs font-semibold px-2 py-0.5 rounded-lg">
                        <Users size={11} />
                        {parent.children_count ?? parent.children?.length ?? 0}
                      </span>
                    </td>

                    {/* Portal status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            parent.access_code ? 'bg-kinder-green' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            parent.access_code
                              ? 'text-kinder-green'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {parent.access_code ? t('configured') : t('notConfigured')}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingParentId(parent.id)}
                          className="text-xs font-semibold text-kinder-blue hover:underline px-2 py-1 rounded-lg hover:bg-kinder-blue/10 dark:hover:bg-kinder-blue/20 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setDeletingParent(parent)}
                          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete parent"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={LIMIT}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Delete dialog */}
      <DeleteDialog
        show={!!deletingParent}
        itemName={deletingParent?.full_name}
        onConfirm={() => {
          if (deletingParent) {
            setDeletingParent(null)
            deleteMutation.mutate(deletingParent.id)
          }
        }}
        onCancel={() => setDeletingParent(null)}
      />

      {/* Parent detail modal */}
      {viewingParentId && (
        <ParentDetailModal parentId={viewingParentId} onClose={() => setViewingParentId(null)} />
      )}
    </div>
  )
}
