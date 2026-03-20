import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { incidentsApi, studentsApi, classesApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { useDiscardGuard } from '../../hooks/useDiscardGuard'
import { DiscardDialog } from '../ui/DiscardDialog'
import type { Incident, IncidentType, IncidentSeverity, IncidentStatus, Student } from '../../types'

interface Props {
  show: boolean
  onClose: () => void
  incident: Incident | null
  defaultStudentId?: string
}

export function IncidentModal({ show, onClose, incident, defaultStudentId }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  const isEdit = !!incident
  const needsStudentPicker = !isEdit && !defaultStudentId

  const [classFilter, setClassFilter] = useState('')
  const [studentId, setStudentId] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [incidentTime, setIncidentTime] = useState('')
  const [type, setType] = useState<IncidentType>('injury')
  const [severity, setSeverity] = useState<IncidentSeverity>('minor')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [witnessedBy, setWitnessedBy] = useState('')
  const [parentNotified, setParentNotified] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoUrlError, setPhotoUrlError] = useState('')
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [status, setStatus] = useState<IncidentStatus>('open')

  const { data: classesData } = useQuery({
    queryKey: ['classes', { page: 1, limit: 100, status: 'active' }],
    queryFn: () => classesApi.getAll({ limit: 100, status: 'active' }),
    enabled: needsStudentPicker && show,
  })
  const classes = classesData?.data ?? []

  const { data: studentsData } = useQuery({
    queryKey: ['students', { page: 1, limit: 100 }],
    queryFn: () => studentsApi.getAll({ limit: 100 }),
    enabled: needsStudentPicker && show,
  })
  const allStudents: Student[] = studentsData?.data ?? []
  const filteredStudents = classFilter
    ? allStudents.filter((s) => s.class_id === classFilter)
    : allStudents

  useEffect(() => {
    if (show) {
      if (incident) {
        setStudentId(incident.student_id)
        setIncidentDate(incident.incident_date)
        setIncidentTime(incident.incident_time ?? '')
        setType(incident.type)
        setSeverity(incident.severity)
        setLocation(incident.location ?? '')
        setDescription(incident.description)
        setActionTaken(incident.action_taken)
        setWitnessedBy(incident.witnessed_by ?? '')
        setParentNotified(incident.parent_notified)
        setPhotoUrl(incident.photo_url ?? '')
        setPhotoUrlError('')
        setFollowUpNotes(incident.follow_up_notes ?? '')
        setStatus(incident.status)
      } else {
        setStudentId(defaultStudentId ?? '')
        setIncidentDate(new Date().toISOString().split('T')[0])
        setIncidentTime('')
        setType('injury')
        setSeverity('minor')
        setLocation('')
        setDescription('')
        setActionTaken('')
        setWitnessedBy('')
        setParentNotified(false)
        setPhotoUrl('')
        setPhotoUrlError('')
        setFollowUpNotes('')
        setStatus('open')
      }
      resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, incident, defaultStudentId])

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = {
        student_id: studentId,
        incident_date: incidentDate,
        incident_time: incidentTime || null,
        type,
        severity,
        location: location.trim() || null,
        description: description.trim(),
        action_taken: actionTaken.trim(),
        witnessed_by: witnessedBy.trim() || null,
        parent_notified: parentNotified,
        photo_url: photoUrl.trim() || null,
        follow_up_notes: followUpNotes.trim() || null,
        status,
      }
      return isEdit ? incidentsApi.update(incident!.id, data) : incidentsApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      const sid = incident?.student_id ?? defaultStudentId
      if (sid) {
        queryClient.invalidateQueries({ queryKey: ['incidents-student', sid] })
      }
      toast.success(t('incidentSaved'))
      onClose()
    },
    onError: () => toast.error('Failed to save incident report. Please try again.'),
  })

  const canSave =
    description.trim().length > 0 &&
    actionTaken.trim().length > 0 &&
    studentId.trim().length > 0 &&
    incidentDate.length > 0 &&
    photoUrlError === ''

  if (!show) return null

  const inputClass =
    'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange outline-none transition-colors'
  const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'

  const modal = (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={requestClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {isEdit ? t('editIncidentReport') : t('newIncidentReport')}
          </h2>
          <button
            onClick={requestClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Student picker */}
          {needsStudentPicker ? (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>{t('classes')}</label>
                <select
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value)
                    setStudentId('')
                  }}
                  className={inputClass}
                >
                  <option value="">{t('allClasses') ?? 'All classes'}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  {t('students')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value)
                    markDirty()
                  }}
                  className={inputClass}
                >
                  <option value="">Select student...</option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                      {s.class_name ? ` — ${s.class_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>{t('students')}</label>
              <div className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-700 dark:text-gray-300">
                {incident?.students?.full_name ?? studentId}
              </div>
            </div>
          )}

          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('incidentDate')}</label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => {
                  setIncidentDate(e.target.value)
                  markDirty()
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('incidentTime')}</label>
              <input
                type="time"
                value={incidentTime}
                onChange={(e) => {
                  setIncidentTime(e.target.value)
                  markDirty()
                }}
                className={inputClass}
              />
            </div>
          </div>

          {/* Type + Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('incidentType')}</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as IncidentType)
                  markDirty()
                }}
                className={inputClass}
              >
                <option value="injury">{t('injury')}</option>
                <option value="illness">{t('illness')}</option>
                <option value="behavioral">{t('behavioral')}</option>
                <option value="allergic_reaction">{t('allergicReaction')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('severity')}</label>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value as IncidentSeverity)
                  markDirty()
                }}
                className={inputClass}
              >
                <option value="minor">{t('minor')}</option>
                <option value="moderate">{t('moderate')}</option>
                <option value="serious">{t('serious')}</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>{t('incidentLocation')}</label>
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                markDirty()
              }}
              placeholder="e.g. Playground, Classroom"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                markDirty()
              }}
              rows={3}
              placeholder="Describe what happened..."
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Action Taken */}
          <div>
            <label className={labelClass}>
              {t('actionTaken')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={actionTaken}
              onChange={(e) => {
                setActionTaken(e.target.value)
                markDirty()
              }}
              rows={3}
              placeholder="Describe actions taken..."
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Witnessed By */}
          <div>
            <label className={labelClass}>{t('witnessedBy')}</label>
            <input
              type="text"
              value={witnessedBy}
              onChange={(e) => {
                setWitnessedBy(e.target.value)
                markDirty()
              }}
              placeholder="Name of witness"
              className={inputClass}
            />
          </div>

          {/* Parent Notified */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={parentNotified}
                onChange={(e) => {
                  setParentNotified(e.target.checked)
                  markDirty()
                }}
                className="rounded border-gray-300 dark:border-gray-600 text-kinder-orange focus:ring-kinder-orange"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('parentNotified')}
              </span>
            </label>
          </div>

          {/* Photo URL */}
          <div>
            <label className={labelClass}>Photo URL</label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => {
                const val = e.target.value
                setPhotoUrl(val)
                markDirty()
                if (val.trim()) {
                  try {
                    new URL(val.trim())
                    setPhotoUrlError('')
                  } catch {
                    setPhotoUrlError('Please enter a valid URL.')
                  }
                } else {
                  setPhotoUrlError('')
                }
              }}
              placeholder="https://..."
              className={
                inputClass +
                (photoUrlError
                  ? ' border-red-400 dark:border-red-500 focus:ring-red-400/50 focus:border-red-400'
                  : '')
              }
            />
            {photoUrlError && <p className="mt-1 text-xs text-red-500">{photoUrlError}</p>}
          </div>

          {/* Follow-up Notes */}
          <div>
            <label className={labelClass}>{t('followUpNotes')}</label>
            <textarea
              value={followUpNotes}
              onChange={(e) => {
                setFollowUpNotes(e.target.value)
                markDirty()
              }}
              rows={2}
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Status — edit mode only */}
          {isEdit && (
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as IncidentStatus)
                  markDirty()
                }}
                className={inputClass}
              >
                <option value="open">Open</option>
                <option value="resolved">{t('resolved')}</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5 pt-2 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={requestClose}
            className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
            className="flex-1 bg-kinder-orange text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>

        <DiscardDialog show={showConfirm} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
