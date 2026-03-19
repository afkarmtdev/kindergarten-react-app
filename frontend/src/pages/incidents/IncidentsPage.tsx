import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { incidentsApi } from '@/lib/api'
import { useIncidentsStore } from '@/store/incidentsStore'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { IncidentModal } from '@/components/admin/IncidentModal'
import { IncidentRow } from './components/IncidentRow'
import type { Incident } from '@/types'

const LIMIT = 20

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'injury', label: 'Injury' },
  { value: 'illness', label: 'Illness' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'allergic_reaction', label: 'Allergic Reaction' },
  { value: 'other', label: 'Other' },
]

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'serious', label: 'Serious' },
]

export function IncidentsPage() {
  usePageTitle('Incidents')
  const t = useT()
  const queryClient = useQueryClient()

  const {
    page,
    search,
    typeFilter,
    severityFilter,
    statusFilter,
    setPage,
    setSearch,
    setTypeFilter,
    setSeverityFilter,
    setStatusFilter,
  } = useIncidentsStore()

  const [addModal, setAddModal] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null | undefined>(undefined)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['incidents', { page, search, typeFilter, severityFilter, statusFilter }],
    queryFn: () =>
      incidentsApi.getAll({
        page,
        limit: LIMIT,
        search: search || undefined,
        type: typeFilter || undefined,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => incidentsApi.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['incidents'] })
      const snapshot = queryClient.getQueriesData({ queryKey: ['incidents'] })
      queryClient.setQueriesData({ queryKey: ['incidents'] }, (old: unknown) => {
        const oldData = old as { data: Incident[]; meta: { total: number } } | undefined
        if (!oldData?.data) return old
        return {
          ...oldData,
          data: oldData.data.filter((item) => item.id !== id),
          meta: { ...oldData.meta, total: Math.max(0, (oldData.meta?.total ?? 1) - 1) },
        }
      })
      return { snapshot }
    },
    onSuccess: () => {
      toast.success(t('incidentDeleted'))
    },
    onError: (_err, _id, ctx) => {
      const context = ctx as { snapshot: [unknown, unknown][] } | undefined
      context?.snapshot?.forEach(([key, data]) =>
        queryClient.setQueryData(key as Parameters<typeof queryClient.setQueryData>[0], data)
      )
      toast.error('Failed to remove incident. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })

  const incidents = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1
  const total = data?.meta?.total ?? 0

  const statusTabs = [
    { value: '', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'resolved', label: t('resolved') },
  ]

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('incidentReports')}
            </h1>
            {total > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {total} {total === 1 ? 'report' : 'reports'}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          {t('newIncidentReport')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student name..." />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/30"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/30"
        >
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              statusFilter === tab.value
                ? 'text-kinder-orange border-b-2 border-kinder-orange'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-opacity ${
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {t('incidentDate')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  {t('incidentType')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('severity')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-shimmer w-24" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-shimmer w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 animate-shimmer" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-shimmer w-32" />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-shimmer w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full animate-shimmer w-16" />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full animate-shimmer w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-shimmer w-12" />
                    </td>
                  </tr>
                ))
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {t('noIncidents')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    onEdit={() => setEditingIncident(incident)}
                    onDelete={() => deleteMutation.mutate(incident.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={data?.meta?.total ?? 0}
          limit={20}
          onPageChange={setPage}
        />
      )}

      {/* Add / Edit modal */}
      <IncidentModal
        show={addModal || editingIncident !== undefined}
        incident={editingIncident ?? null}
        onClose={() => {
          setAddModal(false)
          setEditingIncident(undefined)
        }}
      />
    </div>
  )
}
