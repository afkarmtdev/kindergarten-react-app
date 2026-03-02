import { Check, X, Clock, FileX } from 'lucide-react'

export const STATUS_CONFIG = {
  present: {
    labelKey: 'present' as const,
    icon: Check,
    bg: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800',
    dot: 'bg-green-500',
  },
  absent: {
    labelKey: 'absent' as const,
    icon: X,
    bg: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800',
    dot: 'bg-red-500',
  },
  late: {
    labelKey: 'late' as const,
    icon: Clock,
    bg: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800',
    dot: 'bg-yellow-500',
  },
  excused: {
    labelKey: 'excused' as const,
    icon: FileX,
    bg: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
} as const

export type Status = keyof typeof STATUS_CONFIG
