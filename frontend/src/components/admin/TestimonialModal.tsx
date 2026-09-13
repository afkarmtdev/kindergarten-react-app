import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Quote, Upload, Loader, Eye } from 'lucide-react'
import { testimonialsApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { compressImage } from '@/lib/compressImage'
import { useT } from '@/hooks/useT'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { parseFieldErrors } from '@/lib/parseFieldErrors'
import { DiscardDialog } from '@/components/ui/DiscardDialog'
import { ImageCropDialog } from '@/components/ui/ImageCropDialog'
import type { Testimonial } from '@/types'

interface TestimonialModalProps {
  open: boolean
  onClose: () => void
  testimonial?: Testimonial | null
}

const empty = {
  parent_name: '',
  parent_role: '',
  quote: '',
  avatar_url: '',
  display_order: 0,
  is_visible: true,
}

export function TestimonialModal({ open, onClose, testimonial }: TestimonialModalProps) {
  const t = useT()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState<Partial<Record<'parent_name' | 'quote', string>>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  useEffect(() => {
    if (testimonial) {
      setForm({
        parent_name: testimonial.parent_name,
        parent_role: testimonial.parent_role ?? '',
        quote: testimonial.quote,
        avatar_url: testimonial.avatar_url ?? '',
        display_order: testimonial.display_order,
        is_visible: testimonial.is_visible,
      })
    } else {
      setForm({ ...empty })
    }
    setErrors({})
    setUploadError('')
    resetDirty()
  }, [testimonial, open])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k as 'parent_name' | 'quote'])
      setErrors((prev) => {
        const next = { ...prev }
        delete next[k as 'parent_name' | 'quote']
        return next
      })
    markDirty()
  }

  const validate = () => {
    const e: Partial<Record<'parent_name' | 'quote', string>> = {}
    if (!form.parent_name.trim()) e.parent_name = t('required')
    if (!form.quote.trim()) e.quote = t('required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        parent_role: data.parent_role || undefined,
        avatar_url: data.avatar_url || undefined,
      }
      return testimonial
        ? testimonialsApi.update(testimonial.id, payload)
        : testimonialsApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['testimonials-public'] })
      toast.success(testimonial ? 'Testimonial updated' : 'Testimonial added')
      onClose()
    },
    onError: (err: unknown) => {
      const fieldErrs = parseFieldErrors(err)
      if (fieldErrs) {
        setErrors((prev) => ({ ...prev, ...fieldErrs }))
        toast.error('Please fix the highlighted fields.')
      } else {
        toast.error('Failed to save testimonial. Please try again.')
      }
    },
  })

  const [cropFile, setCropFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setCropFile(file)
  }

  const uploadPhoto = async (file: File) => {
    setUploadError('')
    setUploading(true)

    const compressed = await compressImage(file)
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

    const { error } = await supabase.storage
      .from('testimonial-avatars')
      .upload(path, compressed, { upsert: false })

    if (error) {
      setUploadError(t('uploadFailed'))
      setUploading(false)
      return
    }

    // Delete the old file from storage if replacing an existing avatar
    if (form.avatar_url) {
      const oldPath = form.avatar_url.split('/testimonial-avatars/')[1]
      if (oldPath) {
        await supabase.storage.from('testimonial-avatars').remove([oldPath])
      }
    }

    const { data: urlData } = supabase.storage.from('testimonial-avatars').getPublicUrl(path)

    set('avatar_url', urlData.publicUrl)
    setUploading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate(form)
  }

  const inputCls = (field: 'parent_name' | 'quote') =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 dark:text-gray-100 ${
      errors[field]
        ? 'border-red-400 focus:ring-red-300'
        : 'border-gray-200 dark:border-gray-600 focus:ring-kinder-orange/50 focus:border-kinder-orange'
    }`

  const baseCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange transition-all'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={requestClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kinder-purple rounded-2xl flex items-center justify-center">
              <Quote size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {testimonial ? t('editTestimonial') : t('addTestimonial')}
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
          {/* Parent name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('testimonialName')} *
            </label>
            <input
              type="text"
              value={form.parent_name}
              onChange={(e) => set('parent_name', e.target.value)}
              placeholder="Puan Siti Rahimah"
              className={inputCls('parent_name')}
            />
            {errors.parent_name && (
              <p className="text-xs text-red-500 mt-1">{errors.parent_name}</p>
            )}
          </div>

          {/* Parent role */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('testimonialRole')}
            </label>
            <input
              type="text"
              value={form.parent_role}
              onChange={(e) => set('parent_role', e.target.value)}
              placeholder="Parent of Aisyah, Sunflower Class"
              className={baseCls}
            />
          </div>

          {/* Quote */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('testimonialQuote')} *
            </label>
            <textarea
              rows={4}
              value={form.quote}
              onChange={(e) => set('quote', e.target.value)}
              placeholder="The teachers are incredibly dedicated..."
              className={`${inputCls('quote')} resize-none`}
            />
            {errors.quote && <p className="text-xs text-red-500 mt-1">{errors.quote}</p>}
          </div>

          {/* Display order + Visible in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('testimonialOrder')}
              </label>
              <input
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => set('display_order', parseInt(e.target.value) || 0)}
                className={baseCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('testimonialVisible')}
              </label>
              <button
                type="button"
                onClick={() => set('is_visible', !form.is_visible)}
                className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.is_visible
                    ? 'bg-kinder-green/10 border-kinder-green text-kinder-green dark:bg-kinder-green/10'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                <Eye size={14} />
                {form.is_visible ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Avatar upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('testimonialAvatar')}
            </label>

            {form.avatar_url && (
              <div className="mb-3 flex items-center gap-3">
                <img
                  src={form.avatar_url}
                  alt="avatar preview"
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => set('avatar_url', '')}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  {t('removePhoto')}
                </button>
              </div>
            )}

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
                  {form.avatar_url ? 'Change Avatar' : 'Upload Avatar'}
                </>
              )}
            </button>
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>

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
      <ImageCropDialog
        file={cropFile}
        shape="round"
        onCancel={() => setCropFile(null)}
        onConfirm={(f) => {
          setCropFile(null)
          void uploadPhoto(f)
        }}
      />
      <DiscardDialog show={showConfirm} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  )
}
