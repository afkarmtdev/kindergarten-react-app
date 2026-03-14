import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Monitor, Smartphone, Trash2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { portalDataApi } from '../../lib/api'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useParentAuth } from '../../hooks/useParentAuth'
import type { DeviceSession } from '@/types'

function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `Expires in ${days}d ${hours}h`
  if (hours > 0) return `Expires in ${hours}h`
  return 'Expires soon'
}

function getDeviceIcon(label: string) {
  const isMobile = /Android|iOS|iPhone|iPad/i.test(label)
  return isMobile ? Smartphone : Monitor
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface DeviceCardProps {
  device: DeviceSession
  onRemove: (id: string) => void
  isRemoving: boolean
}

function DeviceCard({ device, onRemove, isRemoving }: DeviceCardProps) {
  const [confirmSelf, setConfirmSelf] = useState(false)
  const DeviceIcon = getDeviceIcon(device.device_label)

  function handleRemoveClick() {
    if (device.is_current) {
      setConfirmSelf(true)
    } else {
      onRemove(device.id)
    }
  }

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border shadow-sm flex items-start gap-4 transition-opacity ${
        device.is_current
          ? 'border-kinder-orange/30 dark:border-kinder-orange/20'
          : 'border-gray-200 dark:border-gray-800'
      } ${isRemoving ? 'opacity-60' : 'opacity-100'}`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          device.is_current
            ? 'bg-orange-50 dark:bg-orange-900/20 text-kinder-orange'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}
      >
        <DeviceIcon className="w-5 h-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {device.device_label}
          </p>
          {device.is_current && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-kinder-orange text-white shrink-0">
              <Shield className="w-2.5 h-2.5" />
              This device
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Signed in {formatDate(device.created_at)}
        </p>
        <p
          className={`text-xs mt-0.5 font-medium ${
            new Date(device.expires_at).getTime() - Date.now() < 0
              ? 'text-red-500'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {getTimeRemaining(device.expires_at)}
        </p>

        {/* Inline self-removal confirmation */}
        {confirmSelf && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
              This will log you out immediately. Continue?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRemove(device.id)}
                disabled={isRemoving}
                className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Yes, log me out
              </button>
              <button
                onClick={() => setConfirmSelf(false)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Remove button — hidden when self-confirmation is shown */}
      {!confirmSelf && (
        <button
          onClick={handleRemoveClick}
          disabled={isRemoving}
          aria-label={`Remove ${device.device_label}`}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 shrink-0 mt-0.5"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default function PortalDevicesPage() {
  usePageTitle('My Devices')
  const queryClient = useQueryClient()
  const { logout } = useParentAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['portal-devices'],
    queryFn: portalDataApi.getDevices,
    placeholderData: (prev) => prev,
  })

  const removeMutation = useMutation({
    mutationFn: (sessionId: string) => portalDataApi.removeDevice(sessionId),
    onSuccess: (_result, sessionId) => {
      const removed = data?.data.find((d) => d.id === sessionId)
      if (removed?.is_current) {
        logout()
        return
      }
      queryClient.invalidateQueries({ queryKey: ['portal-devices'] })
      toast.success('Device removed')
    },
    onError: () => toast.error('Failed to remove device. Please try again.'),
  })

  const devices = data?.data ?? []
  const maxDevices = data?.max_devices ?? 3

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Devices</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage devices that have access to your portal account.
        </p>
      </div>

      {/* Usage indicator */}
      {!isLoading && !isError && (
        <div className="mb-4 flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: maxDevices }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-colors ${
                  i < devices.length ? 'w-6 bg-kinder-orange' : 'w-6 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {devices.length} of {maxDevices} devices
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            Could not load devices.
          </p>
          <p className="text-xs text-red-500 dark:text-red-500 mt-1">Please try again later.</p>
        </div>
      )}

      {/* Device list */}
      {!isLoading && !isError && devices.length > 0 && (
        <div className="space-y-3">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onRemove={(id) => removeMutation.mutate(id)}
              isRemoving={removeMutation.isPending && removeMutation.variables === device.id}
            />
          ))}
        </div>
      )}

      {/* Empty state — shouldn't normally happen since the user is logged in */}
      {!isLoading && !isError && devices.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <Monitor className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No devices found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Your active session should appear here.
          </p>
        </div>
      )}

      {/* Info note */}
      {!isLoading && !isError && devices.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
          Sessions expire after 30 days. Removing a device revokes its access immediately.
        </p>
      )}
    </div>
  )
}
