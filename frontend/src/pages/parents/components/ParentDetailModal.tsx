import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  User,
  Phone,
  Mail,
  Users,
  Shield,
  Monitor,
  Smartphone,
  Trash2,
  KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { parentsApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { GeneratePortalAccessModal } from '@/components/admin/GeneratePortalAccessModal'
import type { Parent, ParentRelationship } from '@/types'

interface Props {
  parentId: string
  onClose: () => void
}

function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `Expires in ${days}d ${hours}h`
  if (hours > 0) return `Expires in ${hours}h`
  return 'Expires soon'
}

function relationshipLabel(rel: ParentRelationship): string {
  switch (rel) {
    case 'parent':
      return 'Parent'
    case 'guardian':
      return 'Guardian'
    case 'step_parent':
      return 'Step Parent'
    case 'other':
      return 'Other'
  }
}

export function ParentDetailModal({ parentId, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const [showPortalModal, setShowPortalModal] = useState(false)

  const { data: parent, isLoading } = useQuery<Parent>({
    queryKey: ['parent-detail', parentId],
    queryFn: () => parentsApi.getById(parentId),
  })

  const sessionsQuery = useQuery({
    queryKey: ['parent-sessions', parentId],
    queryFn: () => parentsApi.getSessions(parentId),
  })

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => parentsApi.revokeSession(parentId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-sessions', parentId] })
      toast.success('Session revoked')
    },
    onError: () => toast.error('Failed to revoke session'),
  })

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-kinder-blue/10 dark:bg-kinder-blue/20 flex items-center justify-center">
              <User size={18} className="text-kinder-blue" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {t('parentDetail')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-shimmer"
                />
              ))}
            </div>
          ) : parent ? (
            <>
              {/* Parent info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-kinder-orange flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {parent.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {parent.full_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('parentAccount')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                  <Phone size={15} className="text-gray-400 flex-shrink-0" />
                  <span>{parent.phone}</span>
                </div>
                {parent.email && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                    <Mail size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{parent.email}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800" />

              {/* Linked children */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={15} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('linkedChildren')}
                  </span>
                </div>

                {!parent.children || parent.children.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
                    {t('noChildrenLinked')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {parent.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                      >
                        {child.photo_url ? (
                          <img
                            src={child.photo_url}
                            alt={child.full_name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-kinder-green/20 flex items-center justify-center text-kinder-green font-bold text-sm flex-shrink-0">
                            {child.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {child.full_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {child.class_name ?? '—'}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-lg flex-shrink-0">
                          {relationshipLabel(child.relationship)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800" />

              {/* Portal status */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={15} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('portalStatus')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${parent.access_code ? 'bg-kinder-green' : 'bg-gray-300 dark:bg-gray-600'}`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {parent.access_code ? t('configured') : t('notConfigured')}
                    </span>
                  </div>
                  {parent.access_code && (
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                      {parent.access_code}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setShowPortalModal(true)}
                  className="mt-2 w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-semibold hover:border-kinder-blue hover:text-kinder-blue dark:hover:border-kinder-blue dark:hover:text-kinder-blue transition-colors"
                >
                  <KeyRound size={15} />
                  {t('managePortalAccess')}
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800" />

              {/* Active sessions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Monitor size={15} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('activeSessions')}
                  </span>
                </div>

                {sessionsQuery.isLoading && (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-shimmer"
                      />
                    ))}
                  </div>
                )}

                {sessionsQuery.data && sessionsQuery.data.data.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
                    {t('noActiveSessions')}
                  </p>
                )}

                {sessionsQuery.data?.data.map((session) => {
                  const isMobile = /Android|iOS|iPhone|iPad/i.test(session.device_label)
                  const Icon = isMobile ? Smartphone : Monitor

                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2"
                    >
                      <Icon size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session.device_label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getTimeRemaining(session.expires_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => revokeSessionMutation.mutate(session.id)}
                        disabled={revokeSessionMutation.isPending}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex-shrink-0 disabled:opacity-50"
                        title="Revoke session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {showPortalModal && parent && (
        <GeneratePortalAccessModal
          parentId={parentId}
          parentName={parent.full_name}
          existingCode={parent.access_code ?? null}
          onClose={() => {
            setShowPortalModal(false)
            queryClient.invalidateQueries({ queryKey: ['parent-detail', parentId] })
            queryClient.invalidateQueries({ queryKey: ['parents'] })
          }}
        />
      )}
    </div>
  )

  return createPortal(modal, document.body)
}
