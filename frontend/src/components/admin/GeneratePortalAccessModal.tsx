import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Copy,
  Check,
  KeyRound,
  ShieldOff,
  Monitor,
  Smartphone,
  Trash2,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { parentsApi } from '../../lib/api'
import { useT } from '../../hooks/useT'

function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `Expires in ${days}d ${hours}h`
  if (hours > 0) return `Expires in ${hours}h`
  return 'Expires soon'
}

interface Props {
  parentId: string
  parentName: string
  existingCode: string | null
  onClose: () => void
}

type Step = 'main' | 'set-pin' | 'confirm-revoke' | 'devices'

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

  const sessionsQuery = useQuery({
    queryKey: ['parent-sessions', parentId],
    queryFn: () => parentsApi.getSessions(parentId),
    enabled: step === 'devices',
  })

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => parentsApi.revokeSession(parentId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-sessions', parentId] })
      toast.success('Session revoked')
    },
    onError: () => toast.error('Failed to revoke session'),
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

              <button
                onClick={() => setStep('devices')}
                className="w-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-semibold text-sm hover:border-kinder-blue hover:text-kinder-blue transition-colors"
              >
                <Monitor className="w-4 h-4 inline mr-1.5" />
                Active Devices
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

        {/* Devices step */}
        {step === 'devices' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-kinder-blue" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Active Devices
              </span>
            </div>

            {sessionsQuery.isLoading && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-shimmer"
                  />
                ))}
              </div>
            )}

            {sessionsQuery.data && sessionsQuery.data.data.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No active sessions
              </p>
            )}

            {sessionsQuery.data?.data.map((session) => {
              const isMobile = /Android|iOS|iPhone|iPad/i.test(session.device_label)
              const Icon = isMobile ? Smartphone : Monitor
              const expiresIn = getTimeRemaining(session.expires_at)

              return (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session.device_label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{expiresIn}</p>
                  </div>
                  <button
                    onClick={() => revokeSessionMutation.mutate(session.id)}
                    disabled={revokeSessionMutation.isPending}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors shrink-0"
                    title="Revoke session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}

            <button
              onClick={() => setStep('main')}
              className="w-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
