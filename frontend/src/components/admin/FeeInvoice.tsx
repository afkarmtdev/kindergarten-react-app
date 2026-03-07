// ─── FeeInvoice ───────────────────────────────────────────────────────────────
// Printable fee invoice or overdue balance notice.
// variant='invoice' (default) — standard fee invoice
// variant='overdue-notice' — includes days-overdue badge + principal signature block

import { createPortal } from 'react-dom'
import { X, Printer } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { formatRM } from '@/pages/fees/constants'
import type { FeeRecord } from '@/types'

interface Props {
  record: FeeRecord
  variant?: 'invoice' | 'overdue-notice'
  onClose: () => void
}

export function FeeInvoice({ record, variant = 'invoice', onClose }: Props) {
  const t = useT()
  const { schoolName, address, phone, logoUrl, principalName, registrationNumber } = useSchoolInfo()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayFormatted = today.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const invoiceNo = `INV-${record.id.slice(0, 8).toUpperCase()}`
  const balance =
    Number(record.amount_owed) - Number(record.discount_amount) - Number(record.amount_paid)

  const daysOverdue =
    variant === 'overdue-notice' && record.due_date
      ? Math.max(
          0,
          Math.floor(
            (today.getTime() - new Date(record.due_date).getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0

  const title = variant === 'overdue-notice' ? t('overdueNoticeTitle') : t('feeInvoiceTitle')
  const docTitle = variant === 'overdue-notice' ? 'OVERDUE BALANCE NOTICE' : 'FEE INVOICE'

  const content = (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print, .invoice-print * { visibility: visible !important; }
          .invoice-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; padding: 32px !important; }
          .invoice-no-print { display: none !important; }
          @page { size: A4 portrait; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 invoice-no-print sticky top-0 bg-white dark:bg-gray-900 z-10">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kinder-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                <Printer size={15} />
                {t('printButton')}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Invoice body */}
          <div className="invoice-print p-6">
            {/* School header */}
            <div className="text-center mb-5">
              {logoUrl && <img src={logoUrl} alt="" className="h-12 mx-auto mb-2 object-contain" />}
              <h1 className="text-xl font-extrabold text-gray-900">{schoolName}</h1>
              {address && (
                <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{address}</p>
              )}
              {registrationNumber && (
                <p className="text-xs text-gray-500 mt-0.5">Reg. No: {registrationNumber}</p>
              )}
              {phone && <p className="text-xs text-gray-500 mt-0.5">Tel: {phone}</p>}
              <div className="border-b-2 border-gray-900 mt-4 mb-1" />
              <div className="border-b border-gray-400" />
            </div>

            {/* Document title */}
            <div className="text-center mb-5">
              <h2 className="text-base font-bold text-gray-900 tracking-wide">{docTitle}</h2>
              {variant === 'overdue-notice' && daysOverdue > 0 && (
                <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                  {t('daysOverdue').replace('{n}', String(daysOverdue))}
                </span>
              )}
            </div>

            {/* Invoice No + Date */}
            <div className="flex justify-between text-sm mb-5">
              <div>
                <p className="text-gray-500 text-xs">{t('invoiceNo')}</p>
                <p className="font-bold text-gray-900">{invoiceNo}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">{t('receiptDate')}</p>
                <p className="font-bold text-gray-900">{todayFormatted}</p>
              </div>
            </div>

            {/* Bill to */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
                {t('billTo')}
              </p>
              {record.students?.parent_name && (
                <p className="font-bold text-gray-900">{record.students.parent_name}</p>
              )}
              <p
                className={`${record.students?.parent_name ? 'text-sm text-gray-700' : 'font-bold text-gray-900'}`}
              >
                {record.students?.full_name ?? '—'}
              </p>
              {record.students?.class_name && (
                <p className="text-sm text-gray-600">{record.students.class_name}</p>
              )}
            </div>

            {/* Fee table */}
            <table className="w-full text-sm mb-5">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 text-gray-500 font-semibold text-xs">
                    {t('receiptDescription')}
                  </th>
                  <th className="text-right py-1.5 text-gray-500 font-semibold text-xs">
                    {t('feeOwed')}
                  </th>
                  <th className="text-right py-1.5 text-gray-500 font-semibold text-xs">
                    {t('feeDiscount')}
                  </th>
                  <th className="text-right py-1.5 text-gray-500 font-semibold text-xs">
                    {t('netPayable')}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 text-gray-800">{record.description}</td>
                  <td className="text-right py-2 font-semibold text-gray-900">
                    {formatRM(record.amount_owed)}
                  </td>
                  <td className="text-right py-2 text-green-600 font-semibold">
                    {Number(record.discount_amount) > 0
                      ? `-${formatRM(record.discount_amount)}`
                      : '—'}
                  </td>
                  <td className="text-right py-2 font-bold text-gray-900">
                    {formatRM(Number(record.amount_owed) - Number(record.discount_amount))}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="py-1.5 text-sm text-green-700 font-semibold">
                    {t('amountPaidLabel')}
                  </td>
                  <td className="text-right py-1.5 font-semibold text-green-700">
                    {formatRM(record.amount_paid)}
                  </td>
                </tr>
                <tr className={balance > 0.001 ? 'bg-red-50' : ''}>
                  <td
                    colSpan={3}
                    className={`py-2 font-extrabold pl-2 rounded-l ${balance > 0.001 ? 'text-red-700' : 'text-gray-700'}`}
                  >
                    {t('outstandingBalance')}
                  </td>
                  <td
                    className={`text-right py-2 font-extrabold pr-2 rounded-r ${balance > 0.001 ? 'text-red-700' : 'text-gray-700'}`}
                  >
                    {formatRM(Math.max(0, balance))}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Payment instructions */}
            <div className="border border-dashed border-gray-300 rounded-xl p-4 mb-5 text-sm text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">{t('paymentInstructions')}:</p>
              <p>{schoolName}</p>
              {phone && <p>Tel: {phone}</p>}
              {record.due_date && record.due_date >= todayStr && (
                <p className="mt-1 text-xs text-gray-500">
                  {t('feeDueDate')}: {record.due_date}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-dashed border-gray-300 pt-4 text-center">
              <p className="text-xs text-gray-400">{t('computerGeneratedDoc')}</p>
            </div>

            {/* Signature block — overdue notice only */}
            {variant === 'overdue-notice' && (
              <div className="mt-8 pt-4">
                <p className="text-sm text-gray-700 mb-6">{t('enrollmentSincerely')}</p>
                <div className="text-sm text-gray-900">
                  <div className="border-b border-gray-400 w-48 mb-1" />
                  <p className="font-bold">{principalName || t('collectionSheetSignatureLine')}</p>
                  <p className="text-gray-600">{t('signaturePrincipal')}</p>
                  <p className="text-gray-600">{schoolName}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
