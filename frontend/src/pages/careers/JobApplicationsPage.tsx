import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Inbox, ChevronDown, MessageCircle, Mail, Eye, Trash2, FileText, X } from 'lucide-react'
import { careersApi } from '@/lib/api'
import { useJobApplicationsStore } from '@/store/jobApplicationsStore'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { TableRowSkeleton } from '@/components/ui/Skeletons'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import type { JobApplication, JobPosting } from '@/types'

const LIMIT = 20

const APP_STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  reviewed: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  interviewed: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  hired: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400',
}

const APP_STATUSES = ['new', 'reviewed', 'interviewed', 'hired', 'rejected'] as const

export function JobApplicationsPage() {
  const t = useT()
  usePageTitle('Applications')
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const {
    page,
    search,
    statusFilter,
    postingFilter,
    setPage,
    setSearch,
    setStatusFilter,
    setPostingFilter,
  } = useJobApplicationsStore()

  // Initialize postingFilter from URL param on mount
  useEffect(() => {
    const postingId = searchParams.get('posting_id')
    if (postingId) {
      setPostingFilter(postingId)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [detailApp, setDetailApp] = useState<JobApplication | null>(null)
  const [deletingApp, setDeletingApp] = useState<JobApplication | null>(null)

  // Fetch postings for the filter dropdown
  const { data: postingsData } = useQuery({
    queryKey: ['job-postings-list'],
    queryFn: () => careersApi.getPostings({ limit: 100 }),
    staleTime: 60_000,
  })
  const postings: JobPosting[] = postingsData?.data ?? []

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'job-applications',
      { page, search, status: statusFilter, posting_id: postingFilter },
    ],
    queryFn: () =>
      careersApi.getApplications({
        page,
        limit: LIMIT,
        search: search || undefined,
        status: statusFilter || undefined,
        posting_id: postingFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      careersApi.updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] })
      toast.success(t('applicationStatusUpdated'))
    },
    onError: () => {
      toast.error('Failed to update status. Please try again.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: careersApi.deleteApplication,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['job-applications'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['job-applications'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['job-applications'] },
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
      toast.success(t('applicationRemoved'))
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Failed to remove application. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] })
    },
  })

  const applications: JobApplication[] = data?.data ?? []
  const totalPages = data?.meta.totalPages ?? 1
  const total = data?.meta.total ?? 0

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('jobApplications')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total} {t('jobApplications').toLowerCase()}
          </p>
        </div>
        <div className="w-full md:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder={t('searchApplications')} />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['', ...APP_STATUSES] as const).map((s) => {
          const isActive = statusFilter === s
          const label = s === '' ? t('all') : t(`app_${s}` as keyof typeof t)
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                isActive
                  ? s === ''
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                    : (APP_STATUS_STYLES[s] || '') + ' border-current'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Posting filter */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={postingFilter}
          onChange={(e) => setPostingFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50"
        >
          <option value="">{t('allPostings')}</option>
          {postings.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60 [&>th:first-child]:rounded-tl-2xl [&>th:last-child]:rounded-tr-2xl">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {t('applicantName')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                  {t('positionAppliedFor')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                  {t('status')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  {t('date')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                  {/* Actions */}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Inbox size={40} className="text-gray-200 dark:text-gray-700" />
                      <p className="font-semibold text-gray-400 dark:text-gray-500">
                        {t('noApplications')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    application={app}
                    onStatusChange={(status) => statusMutation.mutate({ id: app.id, status })}
                    onView={() => setDetailApp(app)}
                    onDelete={() => setDeletingApp(app)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}

      {/* Application Detail Modal */}
      {detailApp && (
        <ApplicationDetailModal application={detailApp} onClose={() => setDetailApp(null)} />
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        show={!!deletingApp}
        itemName={deletingApp?.applicant_name}
        onConfirm={() => {
          if (deletingApp) {
            deleteMutation.mutate(deletingApp.id)
            setDeletingApp(null)
          }
        }}
        onCancel={() => setDeletingApp(null)}
      />
    </div>
  )
}

function ApplicationRow({
  application,
  onStatusChange,
  onView,
  onDelete,
}: {
  application: JobApplication
  onStatusChange: (status: string) => void
  onView: () => void
  onDelete: () => void
}) {
  const t = useT()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const currentStatus = application.status ?? 'new'

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left })
    }
    setDropdownOpen(true)
  }

  const phoneDigits = application.phone.replace(/\D/g, '')

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {application.applicant_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{application.email}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
        {application.posting_title || '--'}
      </td>
      <td className="px-4 py-3">
        <button
          ref={btnRef}
          onClick={openDropdown}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${APP_STATUS_STYLES[currentStatus] ?? APP_STATUS_STYLES.new}`}
        >
          {t(`app_${currentStatus}` as keyof typeof t)}
          <ChevronDown size={10} />
        </button>
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
            <div
              className="fixed z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 w-32"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              {APP_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange(s)
                    setDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                    s === currentStatus
                      ? 'text-kinder-orange bg-orange-50 dark:bg-orange-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`app_${s}` as keyof typeof t)}
                </button>
              ))}
            </div>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap text-xs">
        {new Date(application.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onView}
            className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-kinder-blue/10 transition-all"
            title={t('applicationDetails')}
          >
            <Eye size={14} />
          </button>
          {phoneDigits && (
            <a
              href={`https://wa.me/${phoneDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
              title="WhatsApp"
            >
              <MessageCircle size={14} />
            </a>
          )}
          <a
            href={`mailto:${application.email}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-orange hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
            title="Email"
          >
            <Mail size={14} />
          </a>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function ApplicationDetailModal({
  application,
  onClose,
}: {
  application: JobApplication
  onClose: () => void
}) {
  const t = useT()
  const currentStatus = application.status ?? 'new'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('applicationDetails')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {t('applicantName')}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {application.applicant_name}
            </p>
          </div>

          {/* Position */}
          {application.posting_title && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('positionAppliedFor')}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {application.posting_title}
              </p>
            </div>
          )}

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Email
              </p>
              <a
                href={`mailto:${application.email}`}
                className="text-sm text-kinder-blue hover:underline"
              >
                {application.email}
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Phone
              </p>
              <a
                href={`tel:${application.phone}`}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-kinder-orange transition-colors"
              >
                {application.phone}
              </a>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {t('status')}
            </p>
            <span
              className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${APP_STATUS_STYLES[currentStatus] ?? APP_STATUS_STYLES.new}`}
            >
              {t(`app_${currentStatus}` as keyof typeof t)}
            </span>
          </div>

          {/* Cover message */}
          {application.cover_message && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('coverMessage')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {application.cover_message}
              </p>
            </div>
          )}

          {/* Resume link */}
          {application.resume_url && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('resume')}
              </p>
              <a
                href={application.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-kinder-blue hover:underline"
              >
                <FileText size={14} />
                {t('downloadResume')}
              </a>
            </div>
          )}

          {/* Date */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {t('date')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(application.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('closeModal')}
          </button>
        </div>
      </div>
    </div>
  )
}
