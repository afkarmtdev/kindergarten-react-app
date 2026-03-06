import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Zap, Download, LayoutList, ClipboardList, BarChart2, TrendingUp } from 'lucide-react'
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
import { FeeInvoice } from '@/components/admin/FeeInvoice'
import { EnrollmentLetterView } from '@/components/admin/EnrollmentLetterView'
import { MonthlyCollectionReport } from '@/components/admin/MonthlyCollectionReport'
import { FeeTableRow } from './components/FeeTableRow'
import { ClassCollectionSheet } from './components/ClassCollectionSheet'
import type { FeeRecord } from '@/types'

const LIMIT = 20

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

  // Finance document modals
  const [invoiceRecord, setInvoiceRecord] = useState<FeeRecord | null>(null)
  const [overdueRecord, setOverdueRecord] = useState<FeeRecord | null>(null)
  const [enrollmentRecord, setEnrollmentRecord] = useState<FeeRecord | null>(null)
  const [collectionSheetOpen, setCollectionSheetOpen] = useState(false)
  const [monthlyReportOpen, setMonthlyReportOpen] = useState(false)

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
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['fees'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['fees'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['fees'] },
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
      toast.success('Fee record removed')
    },
    onError: (err: unknown, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to remove. Please try again.'
      toast.error(msg)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
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
            onClick={() => setCollectionSheetOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ClipboardList size={15} />
            {t('printCollectionSheet')}
          </button>
          <button
            onClick={() => setMonthlyReportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <BarChart2 size={15} />
            {t('monthlyReport')}
          </button>
          <Link
            to="/admin/fees/annual-report"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <TrendingUp size={15} />
            {t('annualReport')}
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
                records.map((record) => (
                  <FeeTableRow
                    key={record.id}
                    record={record}
                    onPay={setPaymentRecord}
                    onPrintReceipt={(r) =>
                      setReceiptData({ record: r, amount: Number(r.amount_paid) })
                    }
                    onEdit={setEditRecord}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onPrintInvoice={setInvoiceRecord}
                    onPrintOverdue={setOverdueRecord}
                    onPrintEnrollment={setEnrollmentRecord}
                  />
                ))
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
      {invoiceRecord && (
        <FeeInvoice record={invoiceRecord} onClose={() => setInvoiceRecord(null)} />
      )}
      {overdueRecord && (
        <FeeInvoice
          record={overdueRecord}
          variant="overdue-notice"
          onClose={() => setOverdueRecord(null)}
        />
      )}
      {enrollmentRecord && (
        <EnrollmentLetterView record={enrollmentRecord} onClose={() => setEnrollmentRecord(null)} />
      )}
      {collectionSheetOpen && (
        <ClassCollectionSheet
          initialClass={classFilter}
          initialMonth={monthFilter}
          onClose={() => setCollectionSheetOpen(false)}
        />
      )}
      {monthlyReportOpen && (
        <MonthlyCollectionReport month={monthFilter} onClose={() => setMonthlyReportOpen(false)} />
      )}
    </div>
  )
}
