import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { FeeRecord } from '../../types'

const STATUS_STYLES: Record<string, string> = {
  unpaid: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  partial: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  waived: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
}

function formatRM(n: number) {
  return `RM ${n.toFixed(2)}`
}

const LIMIT = 20

export default function PortalFeesPage() {
  usePageTitle('Fees')
  const { student } = useParentAuth()
  const t = useT()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['portal-fees', student?.id, { page, limit: LIMIT }],
    queryFn: () => portalDataApi.getFees({ page, limit: LIMIT }),
    enabled: !!student,
    placeholderData: (prev) => prev,
  })

  const records: FeeRecord[] = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = data?.meta?.totalPages ?? 1

  const outstanding = records
    .filter((r) => r.status === 'unpaid' || r.status === 'partial')
    .reduce((sum, r) => sum + (r.amount_owed - r.amount_paid - r.discount_amount), 0)

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-kinder-orange" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('fees')}</h2>
      </div>

      {/* Outstanding summary */}
      {outstanding > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
            Total Outstanding
          </p>
          <p className="text-2xl font-bold text-kinder-orange mt-1">{formatRM(outstanding)}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">No fee records</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Fee information will appear when available
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {r.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">
                    {r.type}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-lg capitalize shrink-0 ${STATUS_STYLES[r.status]}`}
                >
                  {r.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-400 dark:text-gray-500">Owed</p>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    {formatRM(r.amount_owed)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500">Paid</p>
                  <p className="font-semibold text-green-600">{formatRM(r.amount_paid)}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500">Balance</p>
                  <p
                    className={`font-semibold ${r.status === 'paid' || r.status === 'waived' ? 'text-gray-400' : 'text-kinder-orange'}`}
                  >
                    {formatRM(Math.max(0, r.amount_owed - r.amount_paid - r.discount_amount))}
                  </p>
                </div>
              </div>
              {r.due_date && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Due:{' '}
                  {new Date(r.due_date + 'T00:00:00').toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-kinder-orange transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {page} / {totalPages} ({total} records)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-kinder-orange transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
