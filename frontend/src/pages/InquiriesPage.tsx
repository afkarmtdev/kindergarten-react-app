import { useQuery } from '@tanstack/react-query'
import { Inbox } from 'lucide-react'
import { inquiriesApi } from '@/lib/api'
import { useInquiriesStore } from '@/store/inquiriesStore'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { TableRowSkeleton } from '@/components/ui/Skeletons'
import type { Inquiry } from '@/types'

const LIMIT = 20

export function InquiriesPage() {
  const t = useT()
  usePageTitle('Enquiries')

  const { page, search, setPage, setSearch } = useInquiriesStore()

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries', { page, search }],
    queryFn: () => inquiriesApi.getAll({ page, limit: LIMIT, search }),
    placeholderData: (prev) => prev,
  })

  const inquiries: Inquiry[] = data?.data ?? []
  const totalPages = data?.meta.totalPages ?? 1
  const total = data?.meta.total ?? 0

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('inquiries')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total} {t('inquiries').toLowerCase()}
          </p>
        </div>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('searchInquiries')}
          className="w-full md:w-72"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {t('inquiryParentName')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {t('inquiryPhone')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {t('inquiryChildName')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {t('inquiryChildAge')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hidden md:table-cell">
                  {t('inquiryMessage')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
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
                  <tr
                    key={inq.id}
                    className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {inq.parent_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <a
                        href={`tel:${inq.phone}`}
                        className="hover:text-kinder-orange transition-colors"
                      >
                        {inq.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inq.child_name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inq.child_age}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 hidden md:table-cell max-w-xs">
                      <span className="line-clamp-2">{inq.message || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(inq.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
