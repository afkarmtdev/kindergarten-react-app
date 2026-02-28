import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Zap, Download, Pencil, Trash2, Receipt, FileText, LayoutList } from 'lucide-react'
import { toast } from 'sonner'
import { feesApi, classesApi } from '@/lib/api'
import { useFeesStore } from '@/store/feesStore'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { TableRowSkeleton } from '@/components/ui/Skeletons'
import { FeeRecordModal } from '@/components/admin/FeeRecordModal'
import { GenerateFeesModal } from '@/components/admin/GenerateFeesModal'
import { RecordPaymentModal } from '@/components/admin/RecordPaymentModal'
import { ReceiptView } from '@/components/admin/ReceiptView'
import type { FeeRecord } from '@/types'

const LIMIT = 20

const STATUS_STYLES: Record<string, string> = {
  unpaid:
    'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/40',
  partial:
    'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900/40',
  paid: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/40',
  waived:
    'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

const TYPE_STYLES: Record<string, string> = {
  tuition: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
  activity: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300',
  uniform: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300',
  registration: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

export function FeesPage() {
  usePageTitle('Fees')
  const t = useT()
  const queryClient = useQueryClient()
  const {
    page,
    search,
    statusFilter,
    monthFilter,
    classFilter,
    setPage,
    setSearch,
    setStatusFilter,
    setMonthFilter,
    setClassFilter,
  } = useFeesStore()

  const [addModal, setAddModal] = useState(false)
  const [editRecord, setEditRecord] = useState<FeeRecord | null | undefined>(undefined)
  const [generateModal, setGenerateModal] = useState(false)
  const [paymentRecord, setPaymentRecord] = useState<FeeRecord | null>(null)
  const [receiptData, setReceiptData] = useState<{ record: FeeRecord; amount: number } | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'fees',
      { page, search, status: statusFilter, month: monthFilter, class_name: classFilter },
    ],
    queryFn: () =>
      feesApi.getAll({
        page,
        limit: LIMIT,
        search: search || undefined,
        status: statusFilter || undefined,
        month: monthFilter || undefined,
        class_name: classFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes', { page: 1, search: '' }],
    queryFn: () => classesApi.getAll({ limit: 50 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      toast.success('Fee record removed')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to remove. Please try again.'
      toast.error(msg)
    },
  })

  const handleExport = async () => {
    try {
      const blob = await feesApi.exportCsv(monthFilter)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fees-${monthFilter}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to export CSV.')
    }
  }

  const records = data?.data ?? []
  const totalPages = data?.meta.totalPages ?? 1
  const totalRecords = data?.meta.total ?? 0
  const classes = classesData?.data ?? []

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      unpaid: t('feeStatusUnpaid'),
      partial: t('feeStatusPartial'),
      paid: t('feeStatusPaid'),
      waived: t('feeStatusWaived'),
    }
    return map[s] ?? s
  }

  const typeLabel = (tp: string) => {
    const map: Record<string, string> = {
      tuition: t('feeTypeTuition'),
      activity: t('feeTypeActivity'),
      uniform: t('feeTypeUniform'),
      registration: t('feeTypeRegistration'),
      other: t('feeTypeOther'),
    }
    return map[tp] ?? tp
  }

  const formatRM = (v: number | string) => `RM ${Number(v).toFixed(2)}`

  const selectCls =
    'px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange transition-colors'

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('fees')}
          </h1>
          {data && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {data.meta.total} records
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Link
            to="/admin/fee-plans"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <LayoutList size={15} />
            {t('feePlans')}
          </Link>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download size={15} />
            {t('exportCsv')}
          </button>
          <button
            onClick={() => setGenerateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-kinder-blue text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Zap size={15} />
            {t('generateFees')}
          </button>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-kinder-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            <Plus size={15} />
            {t('addFeeRecord')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder={t('searchFees')} />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectCls}
        >
          <option value="">{t('allStatuses')}</option>
          {['unpaid', 'partial', 'paid', 'waived'].map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className={selectCls}
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className={selectCls}
        >
          <option value="">{t('allClasses')}</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.name}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-opacity ${isFetching ? 'opacity-60' : ''}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                  {t('feeStudent')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                  {t('feeType')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden md:table-cell">
                  {t('feeDesc')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden lg:table-cell">
                  {t('feeDueDate')}
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                  {t('feeOwed')}
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden md:table-cell">
                  {t('feePaid')}
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                  {t('feeStatus')}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 dark:text-gray-600">
                    {search || statusFilter ? t('noFeesFound') : t('addFirstFee')}
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Student */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {record.students?.full_name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {record.students?.class_name}
                        </p>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_STYLES[record.type] ?? TYPE_STYLES.other}`}
                        >
                          {typeLabel(record.type)}
                        </span>
                      </td>
                      {/* Description */}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-40 truncate hidden md:table-cell">
                        {record.description}
                      </td>
                      {/* Due date */}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                        {record.due_date ?? '—'}
                      </td>
                      {/* Owed */}
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                        {formatRM(record.amount_owed)}
                      </td>
                      {/* Paid */}
                      <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400 tabular-nums hidden md:table-cell">
                        {formatRM(record.amount_paid)}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[record.status] ?? ''}`}
                        >
                          {statusLabel(record.status)}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Record payment — only for unpaid/partial */}
                          {(record.status === 'unpaid' || record.status === 'partial') && (
                            <button
                              onClick={() => setPaymentRecord(record)}
                              title={t('recordPayment')}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-green hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                            >
                              <Receipt size={14} />
                            </button>
                          )}
                          {/* Print receipt */}
                          {record.receipt_number && (
                            <button
                              onClick={() =>
                                setReceiptData({ record, amount: Number(record.amount_paid) })
                              }
                              title={t('printReceipt')}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            >
                              <FileText size={14} />
                            </button>
                          )}
                          {/* View statement */}
                          <Link
                            to={`/admin/fees/statement/${record.student_id}`}
                            title={t('viewStatement')}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-purple hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                          >
                            <FileText size={14} />
                          </Link>
                          {/* Edit */}
                          <button
                            onClick={() => setEditRecord(record)}
                            title={t('editFeeRecord')}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          {/* Delete (unpaid only) */}
                          {record.status === 'unpaid' && (
                            <button
                              onClick={() => {
                                if (confirm(t('removeFeeConfirm'))) deleteMutation.mutate(record.id)
                              }}
                              title="Delete"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalRecords}
            limit={LIMIT}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modals */}
      {addModal && <FeeRecordModal record={null} onClose={() => setAddModal(false)} />}
      {editRecord !== undefined && (
        <FeeRecordModal record={editRecord} onClose={() => setEditRecord(undefined)} />
      )}
      {generateModal && <GenerateFeesModal onClose={() => setGenerateModal(false)} />}
      {paymentRecord && (
        <RecordPaymentModal
          record={paymentRecord}
          onClose={() => setPaymentRecord(null)}
          onPaymentDone={(updated) => {
            setPaymentRecord(null)
            setReceiptData({ record: updated, amount: updated.this_payment })
          }}
        />
      )}
      {receiptData && (
        <ReceiptView
          record={receiptData.record}
          thisPayment={receiptData.amount}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  )
}
