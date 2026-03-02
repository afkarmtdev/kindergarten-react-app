import { Check, X, Clock, FileX } from 'lucide-react'

export const STATUS_CONFIG = {
  present: {
    icon: Check,
    bg: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    dot: 'bg-green-500',
  },
  absent: {
    icon: X,
    bg: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    dot: 'bg-red-500',
  },
  late: {
    icon: Clock,
    bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  excused: {
    icon: FileX,
    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
} as const

export type Status = keyof typeof STATUS_CONFIG
