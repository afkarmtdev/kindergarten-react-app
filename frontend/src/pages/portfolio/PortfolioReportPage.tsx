import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PDFDownloadLink } from '@react-pdf/renderer'
import {
  ArrowLeft,
  Download,
  Dumbbell,
  Brain,
  MessageSquare,
  Heart,
  Palette,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { portfolioEntriesApi, portfolioReportsApi, studentsApi } from '@/lib/api'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PortfolioReportPDF, type PDFLabels } from './PortfolioReportPDF'
import type { PortfolioEntry, PortfolioDomain } from '@/types'

const DOMAIN_CONFIG: Record<
  PortfolioDomain,
  { icon: typeof Dumbbell; label: string; color: string; bg: string }
> = {
  physical: {
    icon: Dumbbell,
    label: 'Physical (Fizikal)',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  cognitive: {
    icon: Brain,
    label: 'Cognitive (Kognitif)',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  language: {
    icon: MessageSquare,
    label: 'Language (Bahasa)',
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  social_emotional: {
    icon: Heart,
    label: 'Social-Emotional (Sosial & Emosi)',
    color: 'text-pink-600',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
  },
  creative: {
    icon: Palette,
    label: 'Creative (Kreativiti)',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
}

export function PortfolioReportPage() {
  const { id: studentId, term } = useParams<{ id: string; term: string }>()
  const t = useT()
  const { schoolName, address, phone, email, logoUrl, registrationNumber } = useSchoolInfo()

  usePageTitle(`Portfolio — ${term}`)

  const { data: studentData } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsApi.getById(studentId!),
    enabled: !!studentId,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-report', studentId, term],
    queryFn: () => portfolioEntriesApi.getReport(studentId!, term!),
    enabled: !!studentId && !!term,
  })

  const entries: PortfolioEntry[] = data?.entries ?? []
  const report = data?.report

  const [teacherComment, setTeacherComment] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const lastSavedRef = useRef({ teacher: '', principal: '' })

  useEffect(() => {
    if (report) {
      const teacher = report.teacher_comment ?? ''
      const principal = report.principal_comment ?? ''
      setTeacherComment(teacher)
      setPrincipalComment(principal)
      lastSavedRef.current = { teacher, principal }
    }
  }, [report])

  const saveMutation = useMutation({
    mutationFn: (payload: { teacher_comment: string | null; principal_comment: string | null }) =>
      portfolioReportsApi.upsert(studentId!, term!, payload),
    onSuccess: () => toast.success('Saved'),
    onError: () => toast.error('Failed to save'),
  })

  const autoSave = useCallback(
    (field: 'teacher' | 'principal', value: string) => {
      if (value === lastSavedRef.current[field]) return
      lastSavedRef.current = { ...lastSavedRef.current, [field]: value }
      saveMutation.mutate({
        teacher_comment: field === 'teacher' ? value || null : teacherComment || null,
        principal_comment: field === 'principal' ? value || null : principalComment || null,
      })
    },
    [teacherComment, principalComment, saveMutation]
  )

  const pdfLabels: PDFLabels = {
    reportTitle: t('studentProgressReport'),
    termPrefix: t('term'),
    teacherComment: t('teacherComment'),
    principalComment: t('principalComment'),
    teacherSignature: t('teacherSignature'),
    principalSignature: t('principalSignature'),
    noEntries: t('noEntries'),
    observationsByDomain: t('observationsByDomain'),
    generatedOn: t('generatedOn'),
    domainLabels: {
      physical: DOMAIN_CONFIG.physical.label,
      cognitive: DOMAIN_CONFIG.cognitive.label,
      language: DOMAIN_CONFIG.language.label,
      social_emotional: DOMAIN_CONFIG.social_emotional.label,
      creative: DOMAIN_CONFIG.creative.label,
    },
  }

  const byDomain = entries.reduce<Partial<Record<PortfolioDomain, PortfolioEntry[]>>>((acc, e) => {
    const d = e.domain as PortfolioDomain
    if (!acc[d]) acc[d] = []
    acc[d]!.push(e)
    return acc
  }, {})

  const [expandedDomains, setExpandedDomains] = useState<Set<PortfolioDomain>>(new Set())
  const toggleDomain = (domain: PortfolioDomain) =>
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-kinder-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/admin/students/${studentId}`}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-kinder-orange transition-colors font-semibold"
        >
          <ArrowLeft size={16} />
          {t('backToStudent')}
        </Link>
        <PDFDownloadLink
          document={
            <PortfolioReportPDF
              studentName={studentData?.full_name ?? ''}
              className={studentData?.class_name ?? ''}
              schoolName={schoolName}
              schoolAddress={address || undefined}
              schoolPhone={phone || undefined}
              schoolEmail={email || undefined}
              schoolLogoUrl={logoUrl}
              schoolRegNo={registrationNumber || undefined}
              term={term!}
              entries={entries}
              report={report}
              labels={pdfLabels}
            />
          }
          fileName={`report-${studentData?.full_name?.replace(/\s+/g, '-') ?? 'student'}-${term}.pdf`}
          className="flex items-center gap-2 bg-kinder-orange text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-500 transition-colors"
        >
          {({ loading }) => (
            <>
              <Download className="w-4 h-4" />
              {loading ? t('preparingPDF') : t('downloadPDF')}
            </>
          )}
        </PDFDownloadLink>
      </div>

      {/* Report card body */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-kinder-orange p-6 text-white">
          <p className="text-sm font-medium opacity-80">{schoolName}</p>
          <h1 className="text-xl font-bold mt-1">{t('studentProgressReport')}</h1>
          <p className="text-sm mt-1 opacity-80">
            {t('term')}: {term}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Domain sections */}
          {(Object.keys(DOMAIN_CONFIG) as PortfolioDomain[]).map((domain) => {
            const cfg = DOMAIN_CONFIG[domain]
            const Icon = cfg.icon
            const domainEntries = byDomain[domain] ?? []
            const isExpanded = expandedDomains.has(domain)

            return (
              <div
                key={domain}
                className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleDomain(domain)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 ${cfg.bg} cursor-pointer`}
                >
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
                  <span className={`ml-auto text-xs ${cfg.color}`}>
                    {domainEntries.length} {domainEntries.length === 1 ? 'entry' : 'entries'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 ${cfg.color} transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isExpanded &&
                  (domainEntries.length > 0 ? (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {domainEntries.map((e) => (
                        <li key={e.id} className="px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {e.observation}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {new Date(e.entry_date + 'T00:00:00').toLocaleDateString('en-MY', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-600">
                      No entries for this term
                    </p>
                  ))}
              </div>
            )
          })}

          {/* Teacher comment */}
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {t('teacherComment')}
            </p>
            <textarea
              value={teacherComment}
              onChange={(e) => setTeacherComment(e.target.value)}
              onBlur={() => autoSave('teacher', teacherComment)}
              placeholder={t('teacherCommentPlaceholder')}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kinder-orange resize-none text-sm"
            />
          </div>

          {/* Principal comment */}
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {t('principalComment')}
            </p>
            <textarea
              value={principalComment}
              onChange={(e) => setPrincipalComment(e.target.value)}
              onBlur={() => autoSave('principal', principalComment)}
              placeholder={t('principalCommentPlaceholder')}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kinder-orange resize-none text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
