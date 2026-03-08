import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Dumbbell, Brain, MessageSquare, Heart, Palette } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { PortfolioEntry, PortfolioReport } from '../../types'

const DOMAIN_CONFIG = {
  physical: {
    icon: Dumbbell,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    labelKey: 'domainPhysical' as const,
  },
  cognitive: {
    icon: Brain,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    labelKey: 'domainCognitive' as const,
  },
  language: {
    icon: MessageSquare,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
    labelKey: 'domainLanguage' as const,
  },
  social_emotional: {
    icon: Heart,
    color: 'text-pink-600',
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    labelKey: 'domainSocialEmotional' as const,
  },
  creative: {
    icon: Palette,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    labelKey: 'domainCreative' as const,
  },
}

type Domain = keyof typeof DOMAIN_CONFIG

export default function PortalPortfolioPage() {
  usePageTitle('Portfolio')
  const { student } = useParentAuth()
  const t = useT()
  const [selectedTerm, setSelectedTerm] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['portal-portfolio', student?.id, selectedTerm],
    queryFn: () => portalDataApi.getPortfolio(selectedTerm || undefined),
    enabled: !!student,
  })

  const entries: PortfolioEntry[] = data?.entries ?? []
  const report: PortfolioReport | null = data?.report ?? null
  const terms: string[] = data?.terms ?? []

  // Group entries by domain
  const byDomain = entries.reduce<Record<Domain, PortfolioEntry[]>>(
    (acc, entry) => {
      const d = entry.domain as Domain
      if (!acc[d]) acc[d] = []
      acc[d].push(entry)
      return acc
    },
    {} as Record<Domain, PortfolioEntry[]>
  )

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('portfolio')}</h2>
        {terms.length > 0 && (
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kinder-orange"
          >
            <option value="">Latest</option>
            {terms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('noEntries')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Domain sections */}
          {(Object.keys(DOMAIN_CONFIG) as Domain[]).map((domain) => {
            const cfg = DOMAIN_CONFIG[domain]
            const Icon = cfg.icon
            const domainEntries = byDomain[domain] ?? []
            if (domainEntries.length === 0) return null

            return (
              <div
                key={domain}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                {/* Domain header */}
                <div className={`flex items-center gap-2 px-4 py-3 ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  <p className={`text-sm font-bold ${cfg.color}`}>{t(cfg.labelKey)}</p>
                  <span className={`ml-auto text-xs font-semibold ${cfg.color}`}>
                    {domainEntries.length} {domainEntries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Entries */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {domainEntries.map((entry) => (
                    <div key={entry.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {entry.observation}
                        </p>
                        {entry.photo_url && (
                          <img
                            src={entry.photo_url}
                            alt=""
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(entry.entry_date + 'T00:00:00').toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Report card comments */}
          {report && (report.teacher_comment || report.principal_comment) && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('reportCard')}</p>
              {report.teacher_comment && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {t('teacherComment')}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {report.teacher_comment}
                  </p>
                </div>
              )}
              {report.principal_comment && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {t('principalComment')}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {report.principal_comment}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
