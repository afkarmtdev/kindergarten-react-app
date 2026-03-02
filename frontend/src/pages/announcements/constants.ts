import type { Announcement } from '@/types'

export const CATEGORY_COLORS: Record<Announcement['category'], string> = {
  general: 'bg-kinder-blue/10 text-kinder-blue',
  holiday: 'bg-kinder-green/10 text-kinder-green',
  event: 'bg-kinder-purple/10 text-kinder-purple',
  reminder: 'bg-kinder-yellow/10 text-yellow-600',
}

export const CATEGORY_GRADIENTS: Record<Announcement['category'], string> = {
  general: 'from-kinder-blue/20 to-kinder-blue/10',
  holiday: 'from-kinder-green/20 to-kinder-green/10',
  event: 'from-kinder-purple/20 to-kinder-purple/10',
  reminder: 'from-kinder-yellow/20 to-kinder-yellow/10',
}

export function isExpired(expiresAt?: string) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date(new Date().toDateString())
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
