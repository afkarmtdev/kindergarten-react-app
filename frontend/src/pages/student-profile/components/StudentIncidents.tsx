import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, Plus, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { incidentsApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { IncidentModal } from '@/components/admin/IncidentModal'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import type { Incident, IncidentSeverity, IncidentType } from '@/types'

interface Props {
  studentId: string
}

const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  minor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  serious: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TYPE_LABEL: Record<IncidentType, string> = {
  injury: 'Injury',
  illness: 'Illness',
  behavioral: 'Behavioral',
  allergic_reaction: 'Allergic Reaction',
  other: 'Other',
}

export function StudentIncidents({ studentId }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['incidents-student', studentId],
    queryFn: () => incidentsApi.getByStudent(studentId, { limit: 5 }),
    enabled: !!studentId,
  })

  const incidents: Incident[] = data?.data ?? []
  const total = data?.meta?.total ?? 0

  const deleteMutation = useMutation({
    mutationFn: (id: string) => incidentsApi.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['incidents-student', studentId] })
      const snapshot = queryClient.getQueriesData<{ data: Incident[]; meta: { total: number } }>({
        queryKey: ['incidents-student', studentId],
      })
      queryClient.setQueriesData<{ data: Incident[]; meta: { total: number } }>(
        { queryKey: ['incidents-student', studentId] },
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
    onSuccess: () => toast.success(t('incidentDeleted')),
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, val]) => queryClient.setQueryData(key, val))
      toast.error('Failed to remove incident report. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-student', studentId] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })

  const openEdit = (incident: Incident) => {
    setEditingIncident(incident)
    setModalOpen(true)
  }

  const openNew = () => {
    setEditingIncident(null)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingIncident(null)
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mt-6 animate-pulse">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="px-5 py-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mt-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-500 dark:text-red-400" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {t('incidentReports')}
            </p>
            {total > 0 && (
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">({total})</span>
            )}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('newIncidentReport')}
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {incidents.length === 0 ? (
            <div className="py-6 text-center">
              <ShieldAlert
                className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600"
                strokeWidth={1.5}
              />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('noIncidents')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                  onClick={() => openEdit(incident)}
                >
                  {/* Date */}
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 tabular-nums w-16">
                    {new Date(incident.incident_date + 'T00:00:00').toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>

                  {/* Type */}
                  <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {TYPE_LABEL[incident.type] ?? incident.type}
                  </span>

                  {/* Severity Badge */}
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_STYLES[incident.severity]}`}
                  >
                    {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      incident.status === 'resolved'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {incident.status === 'resolved' ? t('resolved') : 'Open'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {total > 0 && (
          <div className="px-5 pb-4">
            <Link
              to={`/admin/incidents?student_id=${studentId}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-kinder-orange dark:hover:text-kinder-orange transition-colors"
            >
              <ExternalLink size={12} />
              {t('viewAllIncidents')}
            </Link>
          </div>
        )}
      </div>

      <IncidentModal
        show={modalOpen}
        onClose={handleModalClose}
        incident={editingIncident}
        defaultStudentId={studentId}
      />

      <DeleteDialog
        show={!!deletingIncident}
        itemName="incident report"
        onConfirm={() => {
          if (deletingIncident) {
            setDeletingIncident(null)
            deleteMutation.mutate(deletingIncident.id)
          }
        }}
        onCancel={() => setDeletingIncident(null)}
      />
    </>
  )
}
