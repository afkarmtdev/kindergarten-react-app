import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Inbox, Filter, ChevronDown, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useState, useRef } from 'react'
import { inquiriesApi } from '@/lib/api'
import { useInquiriesStore } from '@/store/inquiriesStore'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { TableRowSkeleton } from '@/components/ui/Skeletons'
import type { Inquiry } from '@/types'

const LIMIT = 20

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  enrolled: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const STATUSES = ['new', 'contacted', 'enrolled', 'closed'] as const

export function InquiriesPage() {
  const t = useT()
  usePageTitle('Enquiries')
  const queryClient = useQueryClient()

  const {
    page,
    search,
    statusFilter,
    dateFrom,
    dateTo,
    setPage,
    setSearch,
    setStatusFilter,
    setDateFrom,
    setDateTo,
    clearFilters,
  } = useInquiriesStore()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['inquiries', { page, search, status: statusFilter, from: dateFrom, to: dateTo }],
    queryFn: () =>
      inquiriesApi.getAll({
        page,
        limit: LIMIT,
        search,
        status: statusFilter,
        from: dateFrom,
        to: dateTo,
      }),
    placeholderData: (prev) => prev,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      inquiriesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      toast.success('Status updated')
    },
    onError: () => {
      toast.error('Failed to update status. Please try again.')
    },
  })

  const inquiries: Inquiry[] = data?.data ?? []
  const totalPages = data?.meta.totalPages ?? 1
  const total = data?.meta.total ?? 0
  const hasFilters = search || statusFilter || dateFrom || dateTo

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-fun font-bold text-gray-900 dark:text-gray-100">
            {t('inquiries')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total} {t('inquiries').toLowerCase()}
          </p>
        </div>
        <div className="w-full md:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder={t('searchInquiries')} />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['', ...STATUSES] as const).map((s) => {
          const isActive = statusFilter === s
          const label = s === '' ? t('all') : t(`inquiry_${s}` as keyof typeof t)
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                isActive
                  ? s === ''
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                    : (STATUS_STYLES[s] || '') + ' border-current'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Date range filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
            {t('fromDate')}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
            {t('toDate')}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2"
          >
            <Filter size={12} />
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border-2 border-gray-200 dark:border-gray-800 transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60 [&>th:first-child]:rounded-tl-3xl [&>th:last-child]:rounded-tr-3xl">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {t('inquiryParentName')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {t('inquiryPhone')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {t('inquiryChildName')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                  {t('inquiryChildAge')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {t('inquiryMessage')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                  {t('status')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  {t('date')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Inbox size={40} className="text-gray-200 dark:text-gray-700" />
                      <p className="font-semibold text-gray-400 dark:text-gray-500">
                        {t('noInquiriesFound')}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 max-w-xs">
                        {t('noInquiriesFoundSub')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => (
                  <InquiryRow
                    key={inq.id}
                    inquiry={inq}
                    onStatusChange={(status) => statusMutation.mutate({ id: inq.id, status })}
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
    </div>
  )
}

function InquiryRow({
  inquiry,
  onStatusChange,
}: {
  inquiry: Inquiry
  onStatusChange: (status: string) => void
}) {
  const t = useT()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const currentStatus = inquiry.status ?? 'new'

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left })
    }
    setDropdownOpen(true)
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
        {inquiry.parent_name}
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <a href={`tel:${inquiry.phone}`} className="hover:text-kinder-orange transition-colors">
            {inquiry.phone}
          </a>
          <a
            href={`https://wa.me/${inquiry.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-green-500 transition-colors shrink-0"
            title="WhatsApp"
          >
            <MessageCircle size={14} />
          </a>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inquiry.child_name}</td>
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inquiry.child_age}</td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-500 hidden md:table-cell max-w-xs">
        <span className="line-clamp-2">{inquiry.message || '--'}</span>
      </td>
      <td className="px-4 py-3">
        <button
          ref={btnRef}
          onClick={openDropdown}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${STATUS_STYLES[currentStatus] ?? STATUS_STYLES.new}`}
        >
          {t(`inquiry_${currentStatus}` as keyof typeof t)}
          <ChevronDown size={10} />
        </button>
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
            <div
              className="fixed z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 w-32"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              {STATUSES.map((s) => (
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
                  {t(`inquiry_${s}` as keyof typeof t)}
                </button>
              ))}
            </div>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap text-xs">
        {new Date(inquiry.created_at).toLocaleDateString()}
      </td>
    </tr>
  )
}
