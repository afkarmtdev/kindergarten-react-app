import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, User, Mail, Phone, MessageSquare, FileText, Briefcase } from 'lucide-react'
import { careersApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import type { JobApplication, ApplicationStatus } from '@/types'

interface Props {
  show: boolean
  application: JobApplication | null
  onClose: () => void
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  new: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  reviewed: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  interviewed: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  hired: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_OPTIONS: ApplicationStatus[] = ['new', 'reviewed', 'interviewed', 'hired', 'rejected']

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  interviewed: 'Interviewed',
  hired: 'Hired',
  rejected: 'Rejected',
}

export function ApplicationDetailModal({ show, application, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      careersApi.updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] })
      toast.success(t('applicationStatusUpdated'))
    },
    onError: () => {
      toast.error('Failed to update application status. Please try again.')
    },
  })

  const handleStatusChange = (status: string) => {
    if (!application) return
    statusMutation.mutate({ id: application.id, status })
  }

  const whatsAppUrl = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`

  if (!show || !application) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kinder-purple rounded-2xl flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {t('applicationDetails')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Applicant Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('applicantName')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {application.applicant_name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <a
                  href={`mailto:${application.email}`}
                  className="text-sm text-kinder-blue hover:underline"
                >
                  {application.email}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${application.phone}`}
                    className="text-sm text-kinder-blue hover:underline"
                  >
                    {application.phone}
                  </a>
                  <a
                    href={whatsAppUrl(application.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Position Applied For */}
          {application.posting_title && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('positionAppliedFor')}
                </h3>
                <div className="flex items-center gap-3">
                  <Briefcase size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {application.posting_title}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800" />
            </>
          )}

          {/* Cover Message */}
          {application.cover_message && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('coverMessage')}
                </h3>
                <div className="flex gap-3">
                  <MessageSquare size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {application.cover_message}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800" />
            </>
          )}

          {/* Resume */}
          {application.resume_url && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('resume')}
                </h3>
                <a
                  href={application.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-kinder-blue hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <FileText size={16} />
                  {t('downloadResume')}
                </a>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800" />
            </>
          )}

          {/* Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('status')}
            </h3>

            {/* Current status badge */}
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[application.status]}`}
              >
                {STATUS_LABELS[application.status]}
              </span>
            </div>

            {/* Status update dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('updateStatus')}
              </label>
              <select
                value={application.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusMutation.isPending}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange transition-all disabled:opacity-60"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Close button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
