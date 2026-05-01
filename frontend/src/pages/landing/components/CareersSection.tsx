import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, MapPin, Banknote, X, ChevronRight } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { careersApi } from '@/lib/api'
import { Wave } from './Wave'
import { StarField } from './StarField'
import { ApplicationFormModal } from './ApplicationFormModal'
import type { JobPosting, JobType } from '@/types'

const TYPE_BADGE: Record<JobType, { bg: string; text: string }> = {
  full_time: {
    bg: 'bg-kinder-blue/10 dark:bg-kinder-blue/20',
    text: 'text-kinder-blue',
  },
  part_time: {
    bg: 'bg-kinder-green/10 dark:bg-kinder-green/20',
    text: 'text-kinder-green',
  },
  internship: {
    bg: 'bg-kinder-purple/10 dark:bg-kinder-purple/20',
    text: 'text-kinder-purple',
  },
  contract: {
    bg: 'bg-kinder-orange/10 dark:bg-kinder-orange/20',
    text: 'text-kinder-orange',
  },
}

const TYPE_KEY: Record<JobType, 'fullTime' | 'partTime' | 'internship' | 'contract'> = {
  full_time: 'fullTime',
  part_time: 'partTime',
  internship: 'internship',
  contract: 'contract',
}

export function CareersSection() {
  const t = useT()
  const { ref, isVisible } = useFadeIn()
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null)
  const [detailPosting, setDetailPosting] = useState<JobPosting | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['careers-public'],
    queryFn: () => careersApi.getPublicPostings(),
    staleTime: 60 * 60 * 1000,
  })

  const postings = data?.data ?? []

  if (postings.length === 0) return null

  const handleApply = (posting: JobPosting) => {
    setSelectedPosting(posting)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedPosting(null)
  }

  return (
    <section
      id="careers"
      className="relative overflow-hidden bg-orange-50 dark:bg-gray-950 pt-20 transition-colors duration-200"
    >
      <StarField variant="b" className="hidden dark:block" />
      <div
        ref={ref}
        className={`relative max-w-6xl mx-auto px-4 sm:px-6 ${isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-kinder-orange/10 dark:bg-kinder-orange/20 text-kinder-orange px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <Briefcase size={14} />
            {t('careers')}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-kinder-orange via-kinder-pink to-kinder-purple bg-clip-text text-transparent leading-tight">
            {t('weAreHiring')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mt-3 max-w-2xl mx-auto">
            {t('careersSubtitle')}
          </p>
        </div>

        {/* Job posting cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postings.map((posting) => {
            const badge = TYPE_BADGE[posting.type] ?? TYPE_BADGE.full_time
            return (
              <div
                key={posting.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Type badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
                  >
                    {t(TYPE_KEY[posting.type])}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {posting.title}
                </h3>

                {/* Department */}
                {posting.department && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin size={13} className="shrink-0" />
                    <span>{posting.department}</span>
                  </div>
                )}

                {/* Description (truncated) */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                  {posting.description}
                </p>

                {/* Salary */}
                {posting.salary_min != null && (
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-kinder-green mb-4">
                    <Banknote size={14} className="shrink-0" />
                    <span>
                      RM{' '}
                      {Number(posting.salary_min).toLocaleString('en-MY', {
                        minimumFractionDigits: 0,
                      })}
                      {posting.salary_max != null && posting.salary_max !== posting.salary_min && (
                        <>
                          {' '}
                          - RM{' '}
                          {Number(posting.salary_max).toLocaleString('en-MY', {
                            minimumFractionDigits: 0,
                          })}
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setDetailPosting(posting)}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    {t('viewDetails')}
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => handleApply(posting)}
                    className="flex-1 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                  >
                    {t('applyNow')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-16">
        <Wave fill="#6BCB77" />
      </div>

      {/* Job detail modal */}
      {detailPosting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDetailPosting(null)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 rounded-t-3xl border-b border-gray-200 dark:border-gray-800 p-6 pb-4 z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${(TYPE_BADGE[detailPosting.type] ?? TYPE_BADGE.full_time).bg} ${(TYPE_BADGE[detailPosting.type] ?? TYPE_BADGE.full_time).text}`}
                    >
                      {t(TYPE_KEY[detailPosting.type])}
                    </span>
                    {detailPosting.department && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin size={11} />
                        {detailPosting.department}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {detailPosting.title}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailPosting(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors mt-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t('jobDescription')}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {detailPosting.description}
                </p>
              </div>

              {/* Requirements */}
              {detailPosting.requirements && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t('requirements')}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {detailPosting.requirements}
                  </p>
                </div>
              )}

              {/* Salary */}
              {detailPosting.salary_min != null && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t('salaryRange')}
                  </h4>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-kinder-green">
                    <Banknote size={14} />
                    <span>
                      RM{' '}
                      {Number(detailPosting.salary_min).toLocaleString('en-MY', {
                        minimumFractionDigits: 0,
                      })}
                      {detailPosting.salary_max != null &&
                        detailPosting.salary_max !== detailPosting.salary_min && (
                          <>
                            {' '}
                            - RM{' '}
                            {Number(detailPosting.salary_max).toLocaleString('en-MY', {
                              minimumFractionDigits: 0,
                            })}
                          </>
                        )}
                    </span>
                  </div>
                </div>
              )}

              {/* Apply button */}
              <button
                onClick={() => {
                  const posting = detailPosting
                  setDetailPosting(null)
                  handleApply(posting)
                }}
                className="w-full bg-kinder-orange text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              >
                {t('applyNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application modal — rendered once */}
      <ApplicationFormModal show={modalOpen} posting={selectedPosting} onClose={handleCloseModal} />
    </section>
  )
}
