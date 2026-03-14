import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  Dumbbell,
  Brain,
  MessageSquare,
  Heart,
  Palette,
  ChevronDown,
  ChevronUp,
  Quote,
} from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { PortfolioEntry, PortfolioReport } from '../../types'

const DOMAIN_CONFIG = {
  physical: {
    icon: Dumbbell,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-l-blue-500',
    labelKey: 'domainPhysical' as const,
  },
  cognitive: {
    icon: Brain,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-l-purple-500',
    labelKey: 'domainCognitive' as const,
  },
  language: {
    icon: MessageSquare,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-l-green-500',
    labelKey: 'domainLanguage' as const,
  },
  social_emotional: {
    icon: Heart,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-l-pink-500',
    labelKey: 'domainSocialEmotional' as const,
  },
  creative: {
    icon: Palette,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-l-orange-500',
    labelKey: 'domainCreative' as const,
  },
}

type Domain = keyof typeof DOMAIN_CONFIG

export default function PortalPortfolioPage() {
  usePageTitle('Portfolio')
  const { selectedChild } = useParentAuth()
  const t = useT()
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    new Set(Object.keys(DOMAIN_CONFIG))
  )

  const { data, isLoading } = useQuery({
    queryKey: ['portal-portfolio', selectedChild?.id, selectedTerm],
    queryFn: () => portalDataApi.getPortfolio(selectedTerm || undefined, selectedChild?.id),
    enabled: !!selectedChild,
  })

  const entries: PortfolioEntry[] = data?.entries ?? []
  const report: PortfolioReport | null = data?.report ?? null
  const terms: string[] = data?.terms ?? []

  const byDomain = entries.reduce<Record<Domain, PortfolioEntry[]>>(
    (acc, entry) => {
      const d = entry.domain as Domain
      if (!acc[d]) acc[d] = []
      acc[d].push(entry)
      return acc
    },
    {} as Record<Domain, PortfolioEntry[]>
  )

  function toggleDomain(domain: string) {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) {
        next.delete(domain)
      } else {
        next.add(domain)
      }
      return next
    })
  }

  const allTerms = ['', ...terms]

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-orange-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('portfolio')}</h2>
      </div>

      {/* Term selector — horizontal scrollable pills */}
      {allTerms.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {allTerms.map((term) => {
            const isSelected = selectedTerm === term
            return (
              <button
                key={term || '__latest__'}
                onClick={() => setSelectedTerm(term)}
                className={`shrink-0 text-sm font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-kinder-orange text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-kinder-orange hover:text-kinder-orange'
                }`}
              >
                {term || 'Latest'}
              </button>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">{t('noEntries')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Portfolio entries will be added by the teacher
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Domain sections */}
          {(Object.keys(DOMAIN_CONFIG) as Domain[]).map((domain) => {
            const cfg = DOMAIN_CONFIG[domain]
            const Icon = cfg.icon
            const domainEntries = byDomain[domain] ?? []
            if (domainEntries.length === 0) return null
            const isExpanded = expandedDomains.has(domain)

            return (
              <div
                key={domain}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
              >
                {/* Collapsible header */}
                <button
                  onClick={() => toggleDomain(domain)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${cfg.bg}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                    <span className={`text-sm font-bold ${cfg.color}`}>{t(cfg.labelKey)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 ${cfg.color}`}
                    >
                      {domainEntries.length}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className={`w-4 h-4 ${cfg.color}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${cfg.color}`} />
                    )}
                  </div>
                </button>

                {/* Entry cards */}
                {isExpanded && (
                  <div className="p-3 pt-2 space-y-2">
                    {domainEntries.map((entry) => {
                      const dateStr = new Date(entry.entry_date + 'T00:00:00').toLocaleDateString(
                        'en-MY',
                        { day: 'numeric', month: 'short', year: 'numeric' }
                      )

                      if (entry.photo_url) {
                        return (
                          <div
                            key={entry.id}
                            className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                          >
                            <img
                              src={entry.photo_url}
                              alt=""
                              className="w-full h-32 object-cover rounded-t-xl"
                            />
                            <div className="px-3 py-2">
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {entry.observation}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {dateStr}
                              </p>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={entry.id}
                          className={`border-l-4 ${cfg.border} bg-gray-50 dark:bg-gray-800/50 rounded-r-xl px-3 py-2`}
                        >
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {entry.observation}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{dateStr}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Report card comments */}
          {report && (report.teacher_comment || report.principal_comment) && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-3">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('reportCard')}</p>

              {report.teacher_comment && (
                <div className="relative border-l-4 border-l-kinder-orange bg-orange-50 dark:bg-orange-900/10 rounded-r-xl px-4 py-3">
                  <Quote className="w-4 h-4 text-kinder-orange opacity-40 absolute top-2.5 right-3" />
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1.5">
                    {t('teacherComment')}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {report.teacher_comment}
                  </p>
                </div>
              )}

              {report.principal_comment && (
                <div className="relative border-l-4 border-l-kinder-blue bg-blue-50 dark:bg-blue-900/10 rounded-r-xl px-4 py-3">
                  <Quote className="w-4 h-4 text-kinder-blue opacity-40 absolute top-2.5 right-3" />
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">
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
