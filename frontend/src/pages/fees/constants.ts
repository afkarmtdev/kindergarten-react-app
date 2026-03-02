export const STATUS_STYLES: Record<string, string> = {
  unpaid:
    'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/40',
  partial:
    'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900/40',
  paid: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/40',
  waived:
    'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

export const TYPE_STYLES: Record<string, string> = {
  tuition: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
  activity: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300',
  uniform: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300',
  registration: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

export const formatRM = (v: number | string) => `RM ${Number(v).toFixed(2)}`
