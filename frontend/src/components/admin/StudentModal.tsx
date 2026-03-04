import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, User, Upload, Loader } from 'lucide-react'
import { studentsApi, classesApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { compressImage } from '@/lib/compressImage'
import { useT } from '@/hooks/useT'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { DiscardDialog } from '@/components/ui/DiscardDialog'
import type { Student } from '@/types'

interface StudentModalProps {
  open: boolean
  onClose: () => void
  student?: Student | null
}

const empty = {
  full_name: '',
  date_of_birth: '',
  gender: '' as 'male' | 'female' | '',
  class_name: '',
  parent_name: '',
  parent_email: '',
  parent_phone: '',
  photo_url: '',
}

export function StudentModal({ open, onClose, student }: StudentModalProps) {
  const t = useT()
  const queryClient = useQueryClient()

  const { data: classesData } = useQuery({
    queryKey: ['classes', { page: 1, search: '' }],
    queryFn: () => classesApi.getAll({ limit: 50 }),
    staleTime: 60_000,
  })
  const classes = classesData?.data ?? []

  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof empty, string>>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  useEffect(() => {
    if (student) {
      setForm({
        full_name: student.full_name,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        class_name: student.class_name,
        parent_name: student.parent_name,
        parent_email: student.parent_email,
        parent_phone: student.parent_phone,
        photo_url: student.photo_url ?? '',
      })
    } else {
      setForm({ ...empty })
    }
    setErrors({})
    setUploadError('')
    resetDirty()
  }, [student, open])

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      student ? studentsApi.update(student.id, data) : studentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success(student ? 'Student updated' : 'Student added')
      onClose()
    },
    onError: () => {
      toast.error('Failed to save student. Please try again.')
    },
  })

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    markDirty()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploading(true)

    const compressed = await compressImage(file)
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

    const { error } = await supabase.storage
      .from('student-photos')
      .upload(path, compressed, { upsert: false })

    if (error) {
      setUploadError(t('uploadFailed'))
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('student-photos').getPublicUrl(path)

    set('photo_url', urlData.publicUrl)
    setUploading(false)
  }

  const validate = () => {
    const e: Partial<Record<keyof typeof empty, string>> = {}
    if (!form.full_name.trim()) e.full_name = t('required')
    if (!form.date_of_birth) e.date_of_birth = t('required')
    if (!form.gender) e.gender = t('required')
    if (!form.class_name) e.class_name = t('required')
    if (!form.parent_name.trim()) e.parent_name = t('required')
    if (!form.parent_email.trim()) e.parent_email = t('required')
    else if (!/\S+@\S+\.\S+/.test(form.parent_email)) e.parent_email = t('invalidEmail')
    if (!form.parent_phone.trim()) e.parent_phone = t('required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate(form)
  }

  if (!open) return null

  const inputCls = (field: keyof typeof empty) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 dark:text-gray-100 ${
      errors[field]
        ? 'border-red-400 focus:ring-red-300'
        : 'border-gray-200 dark:border-gray-600 focus:ring-kinder-orange/50 focus:border-kinder-orange'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={requestClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kinder-blue rounded-2xl flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {student ? t('editStudent') : t('addStudent')}
            </h2>
          </div>
          <button
            onClick={requestClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('fullName')} *
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              className={inputCls('full_name')}
              placeholder="Ahmad bin Abdullah"
            />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>

          {/* DOB + Gender in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('dateOfBirth')} *
              </label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => set('date_of_birth', e.target.value)}
                className={inputCls('date_of_birth')}
              />
              {errors.date_of_birth && (
                <p className="text-xs text-red-500 mt-1">{errors.date_of_birth}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('gender')} *
              </label>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                className={inputCls('gender')}
              >
                <option value="">{t('selectGender')}</option>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
            </div>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('className')} *
            </label>
            <select
              value={form.class_name}
              onChange={(e) => set('class_name', e.target.value)}
              className={inputCls('class_name')}
            >
              <option value="">{t('selectClass')}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.class_name && <p className="text-xs text-red-500 mt-1">{errors.class_name}</p>}
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />

          {/* Parent Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('parentName')} *
            </label>
            <input
              type="text"
              value={form.parent_name}
              onChange={(e) => set('parent_name', e.target.value)}
              className={inputCls('parent_name')}
              placeholder="Abdullah bin Ibrahim"
            />
            {errors.parent_name && (
              <p className="text-xs text-red-500 mt-1">{errors.parent_name}</p>
            )}
          </div>

          {/* Parent Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('parentEmail')} *
              </label>
              <input
                type="email"
                value={form.parent_email}
                onChange={(e) => set('parent_email', e.target.value)}
                className={inputCls('parent_email')}
                placeholder="parent@email.com"
              />
              {errors.parent_email && (
                <p className="text-xs text-red-500 mt-1">{errors.parent_email}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('parentPhone')} *
              </label>
              <input
                type="tel"
                value={form.parent_phone}
                onChange={(e) => set('parent_phone', e.target.value)}
                className={inputCls('parent_phone')}
                placeholder="+60 12-345 6789"
              />
              {errors.parent_phone && (
                <p className="text-xs text-red-500 mt-1">{errors.parent_phone}</p>
              )}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('photo')}
            </label>
            <div className="flex items-center gap-3">
              {/* Preview */}
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {form.photo_url ? (
                  <img
                    src={form.photo_url}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <User size={20} className="text-gray-300 dark:text-gray-600" />
                )}
              </div>

              {/* Upload button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-kinder-orange hover:text-kinder-orange dark:hover:border-kinder-orange dark:hover:text-kinder-orange transition-all disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader size={15} className="animate-spin" />
                      {t('uploading')}
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      {form.photo_url ? t('changePhoto') : t('uploadPhoto')}
                    </>
                  )}
                </button>
                {form.photo_url && !uploading && (
                  <button
                    type="button"
                    onClick={() => set('photo_url', '')}
                    className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors w-full text-center"
                  >
                    {t('removePhoto')}
                  </button>
                )}
              </div>
            </div>
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>

          {/* Error from server */}
          {mutation.isError && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              Something went wrong. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || uploading}
              className="flex-1 py-2.5 rounded-xl bg-kinder-orange text-white font-semibold text-sm hover:bg-orange-600 transition-all disabled:opacity-60 shadow-sm"
            >
              {mutation.isPending ? t('saving2') : t('save')}
            </button>
          </div>
        </form>
      </div>
      <DiscardDialog show={showConfirm} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  )
}
