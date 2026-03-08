import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { portfolioEntriesApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import type { PortfolioEntry, PortfolioDomain } from '../../types'

interface Props {
  studentId: string
  term: string
  entry?: PortfolioEntry | null
  onClose: () => void
}

const DOMAINS: PortfolioDomain[] = [
  'physical',
  'cognitive',
  'language',
  'social_emotional',
  'creative',
]
const DOMAIN_LABEL: Record<PortfolioDomain, string> = {
  physical: 'Physical (Fizikal)',
  cognitive: 'Cognitive (Kognitif)',
  language: 'Language (Bahasa)',
  social_emotional: 'Social-Emotional (Sosial & Emosi)',
  creative: 'Creative (Kreativiti)',
}

export function PortfolioEntryModal({ studentId, term, entry, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()

  const [domain, setDomain] = useState<PortfolioDomain>(entry?.domain ?? 'cognitive')
  const [observation, setObservation] = useState(entry?.observation ?? '')
  const [entryDate, setEntryDate] = useState(
    entry?.entry_date ?? new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    if (entry) {
      setDomain(entry.domain)
      setObservation(entry.observation)
      setEntryDate(entry.entry_date)
    }
  }, [entry])

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = { student_id: studentId, domain, observation, term, entry_date: entryDate }
      return entry ? portfolioEntriesApi.update(entry.id, data) : portfolioEntriesApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-entries', studentId] })
      toast.success(entry ? 'Entry updated' : 'Entry added')
      onClose()
    },
    onError: () => toast.error('Failed to save entry'),
  })

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {entry ? t('editEntry') : t('addEntry')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('domain')}
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as PortfolioDomain)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-kinder-orange"
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {DOMAIN_LABEL[d]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('observation')}
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Describe what you observed..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kinder-orange resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('entryDate')}
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-kinder-orange"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!observation.trim() || saveMutation.isPending}
              className="flex-1 bg-kinder-orange text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
