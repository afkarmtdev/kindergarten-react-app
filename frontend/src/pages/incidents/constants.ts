export const SEVERITY_CONFIG = {
  minor: {
    label: 'Minor',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    dot: 'bg-green-500',
  },
  moderate: {
    label: 'Moderate',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  serious: {
    label: 'Serious',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
} as const

export const TYPE_LABELS: Record<string, string> = {
  injury: 'Injury',
  illness: 'Illness',
  behavioral: 'Behavioral',
  allergic_reaction: 'Allergic Reaction',
  other: 'Other',
}

export const STATUS_CONFIG = {
  open: {
    label: 'Open',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
  },
} as const
