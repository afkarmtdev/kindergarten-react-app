import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, MapPin, User, CheckCircle2 } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import { SEVERITY_CONFIG, TYPE_LABELS, STATUS_CONFIG } from '../incidents/constants'
import type { Incident } from '../../types'

export default function PortalIncidentsPage() {
  usePageTitle('Incidents')
  const { selectedChild } = useParentAuth()
  const t = useT()

  const { data, isLoading } = useQuery({
    queryKey: ['portal-incidents', selectedChild?.id],
    queryFn: () => portalDataApi.getIncidents({ student_id: selectedChild?.id, limit: 20 }),
    enabled: !!selectedChild,
  })

  const incidents: Incident[] = data?.data ?? []

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('incidentReports')}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('noIncidents')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => {
            const severityCfg =
              SEVERITY_CONFIG[incident.severity as keyof typeof SEVERITY_CONFIG] ??
              SEVERITY_CONFIG.minor
            const statusCfg =
              STATUS_CONFIG[incident.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open
            const typeLabel = TYPE_LABELS[incident.type] ?? incident.type

            return (
              <div
                key={incident.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 space-y-3"
              >
                {/* Top row: date + badges */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {incident.incident_date}
                      {incident.incident_time && (
                        <span className="ml-1.5 text-gray-400 dark:text-gray-500 font-normal">
                          {incident.incident_time}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{typeLabel}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${severityCfg.bg} ${severityCfg.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${severityCfg.dot}`} />
                      {severityCfg.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {incident.description}
                </p>

                {/* Location */}
                {incident.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{incident.location}</span>
                  </div>
                )}

                {/* Action taken */}
                {incident.action_taken && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                      {t('actionTaken')}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                      {incident.action_taken}
                    </p>
                  </div>
                )}

                {/* Witnessed by */}
                {incident.witnessed_by && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {t('witnessedBy')}: {incident.witnessed_by}
                    </span>
                  </div>
                )}

                {/* Parent notified */}
                {incident.parent_notified && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('parentNotified')}</span>
                    {incident.parent_notified_at && (
                      <span className="text-gray-400 dark:text-gray-500">
                        — {incident.parent_notified_at}
                      </span>
                    )}
                  </div>
                )}

                {/* Follow-up notes */}
                {incident.follow_up_notes && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      {t('followUpNotes')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {incident.follow_up_notes}
                    </p>
                  </div>
                )}

                {/* Photo */}
                {incident.photo_url && (
                  <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <img
                      src={incident.photo_url}
                      alt="Incident"
                      className="w-full object-cover max-h-48"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
