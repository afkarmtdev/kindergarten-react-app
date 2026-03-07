// ─── ReceiptView ──────────────────────────────────────────────────────────────
// Printable receipt shown in a modal after recording a payment.
// Uses window.print() with a .receipt-print CSS class to scope what gets printed.

import { X, Printer } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import type { FeeRecord } from '@/types'

interface Props {
  record: FeeRecord
  thisPayment: number
  onClose: () => void
}

export function ReceiptView({ record, thisPayment, onClose }: Props) {
  const t = useT()
  const { schoolName, address, logoUrl } = useSchoolInfo()

  const formatRM = (v: number | string) => `RM ${Number(v).toFixed(2)}`
  const balance =
    Number(record.amount_owed) - Number(record.discount_amount) - Number(record.amount_paid)
  const previouslyPaid = Number(record.amount_paid) - thisPayment
  const today = new Date().toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      {/* Print-scope CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .receipt-print, .receipt-print * { visibility: visible !important; }
          .receipt-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; padding: 32px !important; }
          .receipt-no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm receipt-no-print-overlay">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 receipt-no-print">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t('receiptTitle')}
            </h2>
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

          {/* Receipt body — this is what gets printed */}
          <div className="receipt-print p-6">
            {/* School header */}
            <div className="text-center mb-6">
              {logoUrl && <img src={logoUrl} alt="" className="h-10 mx-auto mb-2 object-contain" />}
              <h1 className="text-xl font-extrabold text-gray-900">{schoolName}</h1>
              {address && (
                <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{address}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">Official Receipt</p>
              <div className="border-b-2 border-gray-900 mt-4 mb-1" />
              <div className="border-b border-gray-400" />
            </div>

            {/* Receipt number + date */}
            <div className="flex justify-between text-sm mb-5">
              <div>
                <p className="text-gray-500 text-xs">{t('receiptNumber')}</p>
                <p className="font-bold text-gray-900">{record.receipt_number ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">{t('receiptDate')}</p>
                <p className="font-bold text-gray-900">{today}</p>
              </div>
            </div>

            {/* Bill to */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
                {t('billTo')}
              </p>
              <p className="font-bold text-gray-900">{record.students?.full_name ?? 'Student'}</p>
              {record.students?.class_name && (
                <p className="text-sm text-gray-600">{record.students.class_name}</p>
              )}
            </div>

            {/* Line items */}
            <table className="w-full text-sm mb-5">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 text-gray-500 font-semibold text-xs">
                    {t('receiptDescription')}
                  </th>
                  <th className="text-right py-1.5 text-gray-500 font-semibold text-xs">
                    {t('receiptAmountOwed')}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1.5 text-gray-800">{record.description}</td>
                  <td className="text-right py-1.5 font-semibold text-gray-900">
                    {formatRM(record.amount_owed)}
                  </td>
                </tr>
                {Number(record.discount_amount) > 0 && (
                  <tr>
                    <td className="py-1 text-gray-500 text-xs">
                      {t('receiptDiscount')}
                      {record.discount_reason ? ` (${record.discount_reason})` : ''}
                    </td>
                    <td className="text-right py-1 text-green-600 font-semibold text-xs">
                      -{formatRM(record.discount_amount)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td className="py-1.5 font-bold text-gray-900">{t('receiptTotal')}</td>
                  <td className="text-right py-1.5 font-bold text-gray-900">
                    {formatRM(Number(record.amount_owed) - Number(record.discount_amount))}
                  </td>
                </tr>
                {previouslyPaid > 0.001 && (
                  <tr>
                    <td className="py-1 text-gray-500 text-sm">{t('receiptPreviouslyPaid')}</td>
                    <td className="text-right py-1 text-gray-500 text-sm">
                      -{formatRM(previouslyPaid)}
                    </td>
                  </tr>
                )}
                <tr className="bg-orange-50">
                  <td className="py-2 font-extrabold text-kinder-orange pl-2 rounded-l">
                    {t('receiptThisPayment')}
                  </td>
                  <td className="text-right py-2 font-extrabold text-kinder-orange pr-2 rounded-r">
                    {formatRM(thisPayment)}
                  </td>
                </tr>
                {balance > 0.001 && (
                  <tr>
                    <td className="py-1 text-gray-500 text-sm">{t('receiptBalance')}</td>
                    <td className="text-right py-1 font-semibold text-red-600 text-sm">
                      {formatRM(balance)}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>

            {/* Footer */}
            <div className="border-t border-dashed border-gray-300 pt-4 text-center">
              <p className="text-sm font-semibold text-gray-700">{t('receiptThankYou')}</p>
              <p className="text-xs text-gray-400 mt-1">{schoolName} — Official Receipt</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
