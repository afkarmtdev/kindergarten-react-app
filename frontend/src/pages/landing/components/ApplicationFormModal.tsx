import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Upload, Loader, CheckCircle, FileText, Trash2 } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { careersApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import type { JobPosting } from '@/types'

interface Props {
  show: boolean
  posting: JobPosting | null
  onClose: () => void
}

const ACCEPTED_TYPES = ['application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function ApplicationFormModal({ show, posting, onClose }: Props) {
  const t = useT()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [view, setView] = useState<'form' | 'success'>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const [uploading, setUploading] = useState(false)

  const [applicantName, setApplicantName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverMessage, setCoverMessage] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')

  // Reset form whenever modal opens/closes or posting changes
  useEffect(() => {
    if (show) {
      setView('form')
      setErrorMsg('')
      setApplicantName('')
      setEmail('')
      setPhone('')
      setCoverMessage('')
      setResumeUrl('')
      setResumeFileName('')
      setUploading(false)
    }
  }, [show, posting?.id])

  const mutation = useMutation({
    mutationFn: () =>
      careersApi.submitApplication({
        posting_id: posting!.id,
        applicant_name: applicantName,
        email,
        phone,
        resume_url: resumeUrl || undefined,
        cover_message: coverMessage || undefined,
      }),
    onSuccess: () => {
      setView('success')
      setErrorMsg('')
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 429) {
        setErrorMsg(t('tooManyApplications'))
      } else {
        setErrorMsg(t('somethingWentWrong'))
      }
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMsg(t('invalidFileType'))
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(t('fileTooLarge'))
      return
    }

    setErrorMsg('')
    setUploading(true)

    const path = `applications/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`

    const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert: false })

    if (error) {
      setErrorMsg(t('uploadFailed'))
      setUploading(false)
      return
    }

    setResumeUrl(path)
    setResumeFileName(file.name)
    setUploading(false)
  }

  const handleRemoveResume = () => {
    if (resumeUrl) {
      supabase.storage.from('resumes').remove([resumeUrl])
    }
    setResumeUrl('')
    setResumeFileName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    mutation.mutate()
  }

  if (!show || !posting) return null

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-kinder-orange focus:ring-1 focus:ring-kinder-orange text-sm transition-colors'
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-kinder-orange mb-0.5">{t('applyingFor')}</p>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 truncate">{posting.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {view === 'success' ? (
          /* ── Success view ── */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-800/40 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-500 dark:text-green-400" />
            </div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-xl mb-2">
              {t('applicationThankYouTitle')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{t('applicationThankYouBody')}</p>
            <button
              onClick={onClose}
              className="bg-kinder-orange text-white px-8 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors"
            >
              {t('closeModal')}
            </button>
          </div>
        ) : (
          /* ── Form view ── */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Applicant Name */}
            <div>
              <label className={labelCls}>{t('applicantName')} *</label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className={inputCls}
                placeholder={t('applicantName')}
              />
            </div>

            {/* Email + Phone row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className={labelCls}>{t('inquiryPhone')} *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                  placeholder="+60XXXXXXXXX"
                />
              </div>
            </div>

            {/* Cover Message */}
            <div>
              <label className={labelCls}>{t('coverMessage')}</label>
              <textarea
                value={coverMessage}
                onChange={(e) => setCoverMessage(e.target.value)}
                maxLength={2000}
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder={t('coverMessage')}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">
                {coverMessage.length}/2000
              </p>
            </div>

            {/* Resume upload */}
            <div>
              <label className={labelCls}>{t('resume')}</label>

              {resumeUrl && resumeFileName ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <FileText size={16} className="text-kinder-orange shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                    {resumeFileName}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-kinder-orange hover:text-kinder-orange dark:hover:border-kinder-orange dark:hover:text-kinder-orange transition-all disabled:opacity-60"
                  >
                    {uploading ? (
                      <>
                        <Loader size={15} className="animate-spin" />
                        {t('uploading')}
                      </>
                    ) : (
                      <>
                        <Upload size={15} />
                        {t('uploadResume')}
                      </>
                    )}
                  </button>
                </>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t('resumeAcceptedFormats')}
              </p>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || uploading}
                className="flex-1 py-2.5 rounded-xl bg-kinder-orange text-white font-semibold text-sm hover:bg-orange-600 transition-all disabled:opacity-60 shadow-sm"
              >
                {mutation.isPending ? t('submittingApplication') : t('submitApplication')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
