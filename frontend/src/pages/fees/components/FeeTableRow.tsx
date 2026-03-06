import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt, FileText, Pencil, Trash2, AlertCircle, BookOpen } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import { STATUS_STYLES, TYPE_STYLES, formatRM } from '../constants'
import type { FeeRecord } from '@/types'

export function FeeTableRow({
  record,
  onPay,
  onPrintReceipt,
  onEdit,
  onDelete,
  onPrintInvoice,
  onPrintOverdue,
  onPrintEnrollment,
}: {
  record: FeeRecord
  onPay: (record: FeeRecord) => void
  onPrintReceipt: (record: FeeRecord) => void
  onEdit: (record: FeeRecord) => void
  onDelete: (id: string) => void
  onPrintInvoice?: (record: FeeRecord) => void
  onPrintOverdue?: (record: FeeRecord) => void
  onPrintEnrollment?: (record: FeeRecord) => void
}) {
  const t = useT()
  const [showDelete, setShowDelete] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const isUnpaidOrPartial = record.status === 'unpaid' || record.status === 'partial'
  const isOverdue = isUnpaidOrPartial && !!record.due_date && record.due_date < today
  const isEnrollmentPaid = record.type === 'registration' && record.status === 'paid'

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

  return (
    <>
      <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
        {/* Student */}
        <td className="px-4 py-3">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {record.students?.full_name ?? '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{record.students?.class_name}</p>
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
            {isUnpaidOrPartial && (
              <button
                onClick={() => onPay(record)}
                title={t('recordPayment')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-green hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
              >
                <Receipt size={14} />
              </button>
            )}
            {record.receipt_number && (
              <button
                onClick={() => onPrintReceipt(record)}
                title={t('printReceipt')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                <FileText size={14} />
              </button>
            )}
            {isUnpaidOrPartial && onPrintInvoice && (
              <button
                onClick={() => onPrintInvoice(record)}
                title={t('feeInvoiceTitle')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                <FileText size={14} />
              </button>
            )}
            {isOverdue && onPrintOverdue && (
              <button
                onClick={() => onPrintOverdue(record)}
                title={t('overdueNoticeTitle')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
              >
                <AlertCircle size={14} />
              </button>
            )}
            {isEnrollmentPaid && onPrintEnrollment && (
              <button
                onClick={() => onPrintEnrollment(record)}
                title={t('enrollmentLetterTitle')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-green hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
              >
                <BookOpen size={14} />
              </button>
            )}
            <Link
              to={`/admin/fees/statement/${record.student_id}`}
              title={t('viewStatement')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-purple hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
            >
              <FileText size={14} />
            </Link>
            <button
              onClick={() => onEdit(record)}
              title={t('editFeeRecord')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              <Pencil size={14} />
            </button>
            {record.status === 'unpaid' && (
              <button
                onClick={() => setShowDelete(true)}
                title="Delete"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
      <DeleteDialog
        show={showDelete}
        itemName={record.description ?? record.students?.full_name}
        onConfirm={() => {
          onDelete(record.id)
          setShowDelete(false)
        }}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}
