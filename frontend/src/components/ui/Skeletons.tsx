import { useState, useEffect } from 'react'
import { Loader } from 'lucide-react'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/translations'

function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-shimmer rounded-xl ${className}`}
    />
  )
}

export function StudentCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex items-start gap-4">
        <Bone className="w-14 h-14 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-3/4" />
          <Bone className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-4/5" />
        <Bone className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export function ClassCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex items-start justify-between mb-5">
        <Bone className="w-12 h-12 rounded-2xl" />
        <Bone className="w-6 h-6 rounded-lg" />
      </div>
      <Bone className="h-5 w-1/2 mb-2" />
      <Bone className="h-3 w-2/3 mb-4" />
      <Bone className="h-2 w-full rounded-full" />
      <Bone className="h-3 w-1/3 mt-2" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Bone className={`h-4 ${i === 0 ? 'w-3/4' : 'w-1/2'}`} />
        </td>
      ))}
    </tr>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-3 md:gap-4 bg-white dark:bg-gray-900 rounded-2xl p-4 md:p-5 border border-gray-200 dark:border-gray-800">
      <Bone className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex-shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Bone className="h-6 w-14" />
        <Bone className="h-3 w-24" />
      </div>
    </div>
  )
}

const LOADING_KEYS: TranslationKey[] = [
  'loadingMsg0',
  'loadingMsg1',
  'loadingMsg2',
  'loadingMsg3',
  'loadingMsg4',
  'loadingMsg5',
  'loadingMsg6',
  'loadingMsg7',
  'loadingMsg8',
  'loadingMsg9',
  'loadingMsg10',
  'loadingMsg11',
]

export function CuteLoader() {
  const t = useT()
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * LOADING_KEYS.length))

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % LOADING_KEYS.length)
    }, 1800)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader size={32} className="text-kinder-orange animate-spin" />
      <p className="text-gray-400 dark:text-gray-500 font-semibold text-sm">
        {t(LOADING_KEYS[idx])}
      </p>
    </div>
  )
}

export function AnnouncementCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <Bone className="w-full h-36 rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <Bone className="h-5 w-16 rounded-full" />
          <Bone className="h-5 w-12 rounded-full" />
        </div>
        <Bone className="h-5 w-3/4" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-5/6" />
        <Bone className="h-3 w-24 mt-2" />
      </div>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  subtitle,
}: {
  icon?: React.ElementType
  title?: string
  subtitle?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {Icon && <Icon size={36} className="text-gray-300 dark:text-gray-600" />}
      <p className="font-bold text-gray-700 dark:text-gray-300">{title}</p>
      {subtitle && <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs">{subtitle}</p>}
    </div>
  )
}
