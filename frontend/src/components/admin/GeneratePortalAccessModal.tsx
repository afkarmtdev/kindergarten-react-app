import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Copy, Check, KeyRound, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { parentsApi } from '../../lib/api'
import { useT } from '../../hooks/useT'

interface Props {
  parentId: string
  parentName: string
  existingCode: string | null
  onClose: () => void
}

type Step = 'main' | 'set-pin' | 'confirm-revoke'

export function GeneratePortalAccessModal({ parentId, parentName, existingCode, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('main')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [copied, setCopied] = useState(false)

  const generateMutation = useMutation({
    mutationFn: () => parentsApi.generateAccessCode(parentId),
    onSuccess: (data) => {
      setGeneratedCode(data.access_code)
      queryClient.invalidateQueries({ queryKey: ['parent-by-student'] })
      toast.success('Access code generated')
    },
    onError: () => toast.error('Failed to generate access code'),
  })

  const pinMutation = useMutation({
    mutationFn: (p: string) => parentsApi.setPortalPin(parentId, p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-by-student'] })
      toast.success('PIN set successfully')
      setStep('main')
      setPin('')
      setConfirmPin('')
    },
    onError: () => toast.error('Failed to set PIN'),
  })

  const revokeMutation = useMutation({
    mutationFn: () => parentsApi.revokePortalAccess(parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-by-student'] })
      toast.success(t('portalAccessRevoked'))
      onClose()
    },
    onError: () => toast.error('Failed to revoke access'),
  })

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const pinMismatch = confirmPin.length === 6 && pin !== confirmPin

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {t('portalAccess')} — {parentName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main step */}
        {step === 'main' && (
          <div className="space-y-4">
            {/* Current / generated code */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t('accessCodeLabel')}
              </p>
              {generatedCode || existingCode ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-wider">
                    {generatedCode ?? existingCode}
                  </span>
                  <button
                    onClick={() => copyCode(generatedCode ?? existingCode!)}
                    className="ml-auto text-gray-400 hover:text-kinder-orange transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('accessCodeNotSet')}</p>
              )}
            </div>

            {/* Help text */}
            {(generatedCode || existingCode) && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('pinHelp')}</p>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full bg-kinder-orange text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
              >
                {generateMutation.isPending ? 'Generating...' : t('generateAccessCode')}
              </button>

              <button
                onClick={() => setStep('set-pin')}
                className="w-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-semibold text-sm hover:border-kinder-blue hover:text-kinder-blue transition-colors"
              >
                <KeyRound className="w-4 h-4 inline mr-1.5" />
                {t('setPin')}
              </button>

              {(existingCode || generatedCode) && (
                <button
                  onClick={() => setStep('confirm-revoke')}
                  className="w-full border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <ShieldOff className="w-4 h-4 inline mr-1.5" />
                  {t('revokeAccess')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Set PIN step */}
        {step === 'set-pin' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('setPin')}
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('pinPlaceholder')}
                inputMode="numeric"
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-kinder-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Confirm PIN
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('pinPlaceholder')}
                inputMode="numeric"
                maxLength={6}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-kinder-orange ${
                  pinMismatch
                    ? 'border-red-400 dark:border-red-600'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {pinMismatch && <p className="text-xs text-red-500 mt-1">PINs do not match</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStep('main')
                  setPin('')
                  setConfirmPin('')
                }}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => pinMutation.mutate(pin)}
                disabled={pin.length !== 6 || pin !== confirmPin || pinMutation.isPending}
                className="flex-1 bg-kinder-orange text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
              >
                {pinMutation.isPending ? 'Saving...' : 'Set PIN'}
              </button>
            </div>
          </div>
        )}

        {/* Confirm revoke step */}
        {step === 'confirm-revoke' && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
              This will remove the access code, clear the PIN, and log out all active portal
              sessions for <strong>{parentName}</strong>. This cannot be undone.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('main')}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => revokeMutation.mutate()}
                disabled={revokeMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {revokeMutation.isPending ? 'Revoking...' : t('revokeAccess')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
