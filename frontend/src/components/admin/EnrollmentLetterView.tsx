// ─── EnrollmentLetterView ─────────────────────────────────────────────────────
// Printable enrollment confirmation letter.
// Only shown when record.type === 'registration' && record.status === 'paid'.

import { createPortal } from 'react-dom'
import { X, Printer } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { formatRM } from '@/pages/fees/constants'
import type { FeeRecord } from '@/types'

interface Props {
  record: FeeRecord
  onClose: () => void
}

export function EnrollmentLetterView({ record, onClose }: Props) {
  const t = useT()
  const { schoolName, address, phone, email, logoUrl, principalName, registrationNumber } =
    useSchoolInfo()

  const today = new Date()
  const todayFormatted = today.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const currentYear = today.getFullYear()
  const refNo = `ENR-${record.id.slice(0, 8).toUpperCase()}`

  const paidDate = record.paid_at
    ? new Date(record.paid_at).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : todayFormatted

  const content = (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .enrollment-print, .enrollment-print * { visibility: visible !important; }
          .enrollment-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; padding: 40px !important; }
          .enrollment-no-print { display: none !important; }
          @page { size: A4 portrait; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 enrollment-no-print sticky top-0 bg-white dark:bg-gray-900 z-10">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t('enrollmentLetterTitle')}
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

          {/* Letter body */}
          <div className="enrollment-print p-8">
            {/* Header — school info left, date/ref right */}
            <div className="flex justify-between items-start mb-8">
              <div>
                {logoUrl && <img src={logoUrl} alt="" className="h-12 mb-2 object-contain" />}
                <h1 className="text-lg font-extrabold text-gray-900">{schoolName}</h1>
                {address && (
                  <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{address}</p>
                )}
                {registrationNumber && (
                  <p className="text-xs text-gray-500 mt-0.5">Reg. No: {registrationNumber}</p>
                )}
                {phone && <p className="text-xs text-gray-500 mt-0.5">Tel: {phone}</p>}
                {email && <p className="text-xs text-gray-500 mt-0.5">Email: {email}</p>}
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-500 text-xs mb-0.5">{todayFormatted}</p>
                <p className="text-gray-500 text-xs">
                  {t('enrollmentRef')}: {refNo}
                </p>
              </div>
            </div>

            <div className="border-b-2 border-gray-900 mb-1" />
            <div className="border-b border-gray-400 mb-8" />

            {/* Salutation */}
            <p className="text-sm text-gray-800 mb-5">
              {t('enrollmentDear').replace(
                '{name}',
                record.students?.parent_name ?? 'Parent / Guardian'
              )}
            </p>

            {/* Body */}
            <p className="text-sm text-gray-800 mb-4 leading-relaxed">
              {t('enrollmentBody')
                .replace('{student}', record.students?.full_name ?? '—')
                .replace('{school}', schoolName)
                .replace('{year}', String(currentYear))}
            </p>

            {/* Details block */}
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-5 text-sm">
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <div className="p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                    {t('enrollmentClassAssigned')}
                  </p>
                  <p className="font-bold text-gray-900">{record.students?.class_name ?? '—'}</p>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                    {t('enrollmentRegFee')}
                  </p>
                  <p className="font-bold text-gray-900">{formatRM(record.amount_owed)}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 grid grid-cols-2 divide-x divide-gray-200">
                <div className="p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                    {t('enrollmentReceiptNo')}
                  </p>
                  <p className="font-bold text-gray-900">{record.receipt_number ?? '—'}</p>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                    {t('receiptDate')}
                  </p>
                  <p className="font-bold text-gray-900">{paidDate}</p>
                </div>
              </div>
            </div>

            {/* LHDN note */}
            <p className="text-xs text-gray-500 mb-8 leading-relaxed">{t('enrollmentLhdn')}</p>

            {/* Closing */}
            <p className="text-sm text-gray-800 mb-8">{t('enrollmentSincerely')}</p>

            <div className="mb-8">
              <div className="border-b border-gray-400 w-56 mb-1" />
              <p className="text-sm font-bold text-gray-900">
                {principalName || t('collectionSheetSignatureLine')}
              </p>
              <p className="text-sm text-gray-600">{t('signaturePrincipal')}</p>
              <p className="text-sm text-gray-600">{schoolName}</p>
              <p className="text-sm text-gray-500 mt-2">{t('enrollmentDateLine')}</p>
            </div>

            {/* Footer */}
            <div className="border-t border-dashed border-gray-300 pt-3 text-center">
              <p className="text-xs text-gray-400">
                {t('enrollmentOfficialDoc').replace('{school}', schoolName)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
