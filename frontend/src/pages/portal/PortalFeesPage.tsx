import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Wallet, Image } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { toast } from 'sonner'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { FeeRecord } from '../../types'

const STATUS_STYLES: Record<string, string> = {
  unpaid: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  partial: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  waived: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
}

const formatRM = (v: number) => `RM ${Number(v).toFixed(2)}`

const LIMIT = 100

type FilterTab = 'all' | 'unpaid' | 'paid'

export default function PortalFeesPage() {
  usePageTitle('Fees')
  const { selectedChild } = useParentAuth()
  const t = useT()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [viewingProof, setViewingProof] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['portal-fees', selectedChild?.id, { page: 1, limit: LIMIT }],
    queryFn: () => portalDataApi.getFees({ page: 1, limit: LIMIT, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
    placeholderData: (prev) => prev,
  })

  const allRecords: FeeRecord[] = data?.data ?? []

  const totalOwed = allRecords.reduce((sum, r) => sum + r.amount_owed, 0)
  const totalPaid = allRecords.reduce((sum, r) => sum + r.amount_paid, 0)
  const paidCount = allRecords.filter((r) => r.status === 'paid' || r.status === 'waived').length

  const radius = 50
  const circumference = 2 * Math.PI * radius
  const progress = totalOwed > 0 ? Math.min(totalPaid / totalOwed, 1) : 0
  const offset = circumference - progress * circumference

  const filteredRecords = allRecords.filter((r) => {
    if (filter === 'unpaid') return r.status === 'unpaid' || r.status === 'partial'
    if (filter === 'paid') return r.status === 'paid' || r.status === 'waived'
    return true
  })

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unpaid', label: 'Unpaid' },
    { key: 'paid', label: 'Paid' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-kinder-orange" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('fees')}</h2>
      </div>

      {/* Payment progress card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <svg width="120" height="120" className="transform -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-kinder-green"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                {formatRM(totalPaid)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                {formatRM(totalOwed)}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Payment Progress</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {paidCount} of {allRecords.length} items paid
            </p>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 dark:text-gray-500">Total paid</span>
                <span className="font-semibold text-kinder-green">{formatRM(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 dark:text-gray-500">Total owed</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {formatRM(totalOwed)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              filter === tab.key
                ? 'bg-kinder-orange text-white border-kinder-orange'
                : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-kinder-orange hover:text-kinder-orange'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
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
          {filteredRecords.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
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
                  <p className="font-semibold text-kinder-green">{formatRM(r.amount_paid)}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500">Balance</p>
                  <p
                    className={`font-semibold ${
                      r.status === 'paid' || r.status === 'waived'
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-kinder-orange'
                    }`}
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
              {r.status === 'paid' && r.receipt_number && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-kinder-blue dark:text-blue-400 font-semibold">
                  <FileText className="w-3 h-3" />
                  Receipt: {r.receipt_number}
                </div>
              )}
              {r.payment_proof_url && (
                <button
                  onClick={async () => {
                    try {
                      const { url } = await portalDataApi.getFeeProofUrl(r.id)
                      setViewingProof(url)
                    } catch {
                      toast.error('Failed to load payment proof')
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-kinder-blue hover:underline mt-1"
                >
                  <Image size={12} />
                  {t('viewProof')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setViewingProof(null)}
        >
          <div className="max-w-2xl max-h-[80vh] p-2" onClick={(e) => e.stopPropagation()}>
            {viewingProof.endsWith('.pdf') ? (
              <a
                href={viewingProof}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline text-lg"
              >
                Open PDF proof
              </a>
            ) : (
              <img
                src={viewingProof}
                alt="Payment proof"
                className="max-w-full max-h-[75vh] rounded-xl shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
