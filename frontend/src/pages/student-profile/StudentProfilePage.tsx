import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, BookOpen, Plus, FileText, Clock } from 'lucide-react'
import { studentsApi, attendanceApi, portfolioEntriesApi, parentsApi } from '@/lib/api'
import { StudentModal } from '@/components/admin/StudentModal'
import { GeneratePortalAccessModal } from '@/components/admin/GeneratePortalAccessModal'
import { PortfolioEntryModal } from '@/components/admin/PortfolioEntryModal'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { type Status } from './constants'
import { StudentInfoCard } from './components/StudentInfoCard'
import { AttendanceHeatmap } from './components/AttendanceHeatmap'
import { StudentArtwork } from './components/StudentArtwork'
import { AttendanceHistoryTable } from './components/AttendanceHistoryTable'
import { PortalAccessCard } from './components/PortalAccessCard'
import { StudentTimeline } from './components/StudentTimeline'
import { MedicalProfileCard } from './components/MedicalProfileCard'
import { StudentIncidents } from './components/StudentIncidents'
import type { Student, AttendanceRecord, PortfolioEntry, Parent } from '@/types'

const LIMIT = 15

const DOMAIN_LABEL: Record<string, string> = {
  physical: 'Physical',
  cognitive: 'Cognitive',
  language: 'Language',
  social_emotional: 'Social-Emotional',
  creative: 'Creative',
}

export function StudentProfilePage() {
  const t = useT()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [portalModalOpen, setPortalModalOpen] = useState(false)
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PortfolioEntry | null>(null)
  const [portfolioTerm, setPortfolioTerm] = useState(() => {
    const now = new Date()
    const month = now.getMonth() + 1
    const termNum = month <= 4 ? 1 : month <= 8 ? 2 : 3
    return `${now.getFullYear()}-T${termNum}`
  })

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.getById(id!),
    enabled: !!id,
  })

  usePageTitle(student?.full_name)

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance-history', id, page],
    queryFn: () => attendanceApi.getByStudent(id!, { page, limit: LIMIT }),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  const { data: portfolioData } = useQuery({
    queryKey: ['portfolio-entries', id, portfolioTerm],
    queryFn: () => portfolioEntriesApi.getAll({ student_id: id!, term: portfolioTerm, limit: 50 }),
    enabled: !!id,
  })
  const portfolioEntries: PortfolioEntry[] = portfolioData?.data ?? []

  const { data: allTermsData } = useQuery({
    queryKey: ['portfolio-terms', id],
    queryFn: () => portfolioEntriesApi.getAll({ student_id: id!, limit: 100 }),
    enabled: !!id,
  })
  const { data: parentData } = useQuery({
    queryKey: ['parent-by-student', id],
    queryFn: () => parentsApi.getByStudent(id!) as Promise<{ data: Parent | null }>,
    enabled: !!id,
  })
  const linkedParent: Parent | null = parentData?.data ?? null

  const existingTerms = [...new Set((allTermsData?.data ?? []).map((e: PortfolioEntry) => e.term))]
    .sort()
    .reverse() as string[]
  const tabTerms = existingTerms.length > 0 ? existingTerms : [portfolioTerm]

  // Auto-select the most recent term with entries once data loads
  useEffect(() => {
    if (existingTerms.length > 0 && !existingTerms.includes(portfolioTerm)) {
      setPortfolioTerm(existingTerms[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTermsData])

  const records: AttendanceRecord[] = historyData?.data ?? []
  const meta = historyData?.meta
  const s: Student | undefined = student

  const stats = records.reduce(
    (acc, r) => {
      acc[r.status as Status] = (acc[r.status as Status] ?? 0) + 1
      return acc
    },
    {} as Record<Status, number>
  )
  const totalInPage = records.length
  const totalAll = meta?.total ?? 0
  const presentRate =
    totalAll > 0
      ? Math.round(
          ((historyData?.data ?? []).filter((r: AttendanceRecord) => r.status === 'present')
            .length /
            totalInPage) *
            100
        )
      : 0

  const closeModal = () => {
    setEditModalOpen(false)
    queryClient.invalidateQueries({ queryKey: ['student', id] })
  }

  return (
    <div className="p-4 md:p-8">
      {/* Back + Edit header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/admin/students"
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-kinder-orange dark:hover:text-kinder-orange transition-colors font-semibold"
        >
          <ArrowLeft size={16} />
          {t('backToStudents')}
        </Link>
        {s && (
          <button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-semibold hover:border-kinder-blue hover:text-kinder-blue dark:hover:text-kinder-blue transition-all"
          >
            <Pencil size={14} />
            {t('editStudent')}
          </button>
        )}
      </div>

      {studentLoading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
          </div>
        </div>
      ) : s ? (
        <>
          <StudentInfoCard
            student={s}
            stats={stats}
            presentRate={presentRate}
            totalAll={totalAll}
            onEdit={() => setEditModalOpen(true)}
          />

          <AttendanceHeatmap studentId={s.id} />

          <MedicalProfileCard studentId={s.id} />
          <StudentIncidents studentId={s.id} />

          {/* Portfolio section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mt-6">
            {/* Row 1 — title + primary action */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-kinder-purple" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('portfolio')}</p>
              </div>
              <button
                onClick={() => {
                  setEditingEntry(null)
                  setPortfolioModalOpen(true)
                }}
                className="flex items-center gap-1.5 bg-kinder-purple text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('addEntry')}
              </button>
            </div>
            {/* Row 2 — spreadsheet-style term tabs */}
            <div className="flex items-end justify-between border-b border-gray-200 dark:border-gray-800 px-5">
              <div className="flex items-end gap-1">
                {tabTerms.map((term) => (
                  <button
                    key={term}
                    onClick={() => setPortfolioTerm(term)}
                    className={`text-xs font-semibold px-3 py-2 rounded-t-lg border transition-colors ${
                      term === portfolioTerm
                        ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-900 text-kinder-purple -mb-px'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border-b-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
              {portfolioEntries.length > 0 && (
                <Link
                  to={`/admin/students/${s.id}/portfolio/${encodeURIComponent(portfolioTerm)}`}
                  className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-kinder-blue dark:hover:text-kinder-blue transition-colors pb-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {t('reportCard')}
                </Link>
              )}
            </div>
            <div className="overflow-hidden rounded-b-2xl">
              {portfolioEntries.length === 0 ? (
                <div className="py-8 text-center text-gray-400 dark:text-gray-600 text-sm">
                  {t('noEntries')} for {portfolioTerm}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {portfolioEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => {
                        setEditingEntry(entry)
                        setPortfolioModalOpen(true)
                      }}
                    >
                      <span className="text-xs font-semibold text-kinder-purple bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-md shrink-0">
                        {DOMAIN_LABEL[entry.domain] ?? entry.domain}
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {entry.observation}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 ml-auto shrink-0">
                        {new Date(entry.entry_date + 'T00:00:00').toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <StudentArtwork studentId={s.id} />

          {/* Portal Access card */}
          <PortalAccessCard linkedParent={linkedParent} onManage={() => setPortalModalOpen(true)} />

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mt-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-kinder-blue rounded-xl flex items-center justify-center shrink-0">
                <Clock size={16} className="text-white" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('timeline')}</h2>
            </div>
            <StudentTimeline studentId={id!} />
          </div>

          <div className="mt-6">
            <AttendanceHistoryTable
              records={records}
              isLoading={historyLoading}
              meta={meta}
              page={page}
              onPageChange={setPage}
            />
          </div>
        </>
      ) : null}

      {s && <StudentModal open={editModalOpen} onClose={closeModal} student={s} />}
      {s && linkedParent && portalModalOpen && (
        <GeneratePortalAccessModal
          parentId={linkedParent.id}
          parentName={linkedParent.full_name}
          existingCode={linkedParent.access_code ?? null}
          onClose={() => setPortalModalOpen(false)}
        />
      )}
      {s && portfolioModalOpen && (
        <PortfolioEntryModal
          studentId={s.id}
          term={portfolioTerm}
          entry={editingEntry}
          onClose={() => {
            setPortfolioModalOpen(false)
            setEditingEntry(null)
          }}
        />
      )}
    </div>
  )
}
