import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import { SEVERITY_CONFIG, TYPE_LABELS, STATUS_CONFIG } from '../constants'
import type { Incident } from '@/types'

export function IncidentRow({
  incident,
  onEdit,
  onDelete,
}: {
  incident: Incident
  onEdit: () => void
  onDelete: () => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  const severityCfg =
    SEVERITY_CONFIG[incident.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.minor
  const statusCfg =
    STATUS_CONFIG[incident.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open
  const typeLabel = TYPE_LABELS[incident.type] ?? incident.type

  return (
    <>
      <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        {/* Date */}
        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
          {incident.incident_date}
        </td>
        {/* Time */}
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell">
          {incident.incident_time ?? '--'}
        </td>
        {/* Student */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            {incident.students?.photo_url ? (
              <img
                src={incident.students.photo_url}
                alt={incident.students.full_name}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-kinder-blue/20 flex items-center justify-center flex-shrink-0 text-kinder-blue font-bold text-xs">
                {incident.students?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {incident.students?.full_name ?? '--'}
              </p>
              {incident.students?.class_name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {incident.students.class_name}
                </p>
              )}
            </div>
          </div>
        </td>
        {/* Type */}
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
          {typeLabel}
        </td>
        {/* Severity */}
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${severityCfg.bg} ${severityCfg.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${severityCfg.dot}`} />
            {severityCfg.label}
          </span>
        </td>
        {/* Status */}
        <td className="px-4 py-3 hidden sm:table-cell">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}
          >
            {statusCfg.label}
          </span>
        </td>
        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={onEdit}
              title="Edit"
              className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              title="Delete"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      <DeleteDialog
        show={showDelete}
        itemName={`incident for ${incident.students?.full_name ?? 'student'} on ${incident.incident_date}`}
        onConfirm={() => {
          onDelete()
          setShowDelete(false)
        }}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}
