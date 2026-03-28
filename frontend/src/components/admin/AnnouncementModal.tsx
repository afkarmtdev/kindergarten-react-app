import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Megaphone, Upload, Loader, Pin } from 'lucide-react'
import { announcementsApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { compressImage } from '@/lib/compressImage'
import { useT } from '@/hooks/useT'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { parseFieldErrors } from '@/lib/parseFieldErrors'
import { DiscardDialog } from '@/components/ui/DiscardDialog'
import type { Announcement } from '@/types'

interface AnnouncementModalProps {
  open: boolean
  onClose: () => void
  announcement?: Announcement | null
}

const empty = {
  title: '',
  body: '',
  category: 'general' as Announcement['category'],
  image_url: '',
  is_pinned: false,
  expires_at: '',
}

export function AnnouncementModal({ open, onClose, announcement }: AnnouncementModalProps) {
  const t = useT()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState<Partial<Record<'title' | 'body', string>>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  useEffect(() => {
    if (announcement) {
      setForm({
        title: announcement.title,
        body: announcement.body,
        category: announcement.category,
        image_url: announcement.image_url ?? '',
        is_pinned: announcement.is_pinned,
        expires_at: announcement.expires_at ?? '',
      })
    } else {
      setForm({ ...empty })
    }
    setErrors({})
    setUploadError('')
    resetDirty()
  }, [announcement, open])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k as 'title' | 'body'])
      setErrors((prev) => {
        const next = { ...prev }
        delete next[k as 'title' | 'body']
        return next
      })
    markDirty()
  }

  const validate = () => {
    const e: Partial<Record<'title' | 'body', string>> = {}
    if (!form.title.trim()) e.title = t('required')
    if (!form.body.trim()) e.body = t('required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        image_url: data.image_url || undefined,
        expires_at: data.expires_at || undefined,
      }
      return announcement
        ? announcementsApi.update(announcement.id, payload)
        : announcementsApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements-public'] })
      toast.success(announcement ? 'Announcement updated' : 'Announcement posted')
      onClose()
    },
    onError: (err: unknown) => {
      const fieldErrs = parseFieldErrors(err)
      if (fieldErrs) {
        setErrors((prev) => ({ ...prev, ...fieldErrs }))
        toast.error('Please fix the highlighted fields.')
      } else {
        toast.error('Failed to save announcement. Please try again.')
      }
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploading(true)

    const compressed = await compressImage(file)
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

    const { error } = await supabase.storage
      .from('announcement-banners')
      .upload(path, compressed, { upsert: false })

    if (error) {
      setUploadError(t('uploadFailed'))
      setUploading(false)
      return
    }

    // Delete the old file from storage if replacing an existing banner
    if (form.image_url) {
      const oldPath = form.image_url.split('/announcement-banners/')[1]
      if (oldPath) {
        await supabase.storage.from('announcement-banners').remove([oldPath])
      }
    }

    const { data: urlData } = supabase.storage.from('announcement-banners').getPublicUrl(path)

    set('image_url', urlData.publicUrl)
    setUploading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate(form)
  }

  const inputCls = (field: 'title' | 'body') =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 dark:text-gray-100 ${
      errors[field]
        ? 'border-red-400 focus:ring-red-300'
        : 'border-gray-200 dark:border-gray-600 focus:ring-kinder-orange/50 focus:border-kinder-orange'
    }`

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={requestClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kinder-orange rounded-2xl flex items-center justify-center">
              <Megaphone size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {announcement ? t('editAnnouncement') : t('addAnnouncement')}
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('announcementTitle')} *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Sports Day 2026..."
              className={inputCls('title')}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('announcementBody')} *
            </label>
            <textarea
              rows={4}
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder="Please join us for..."
              className={`${inputCls('body')} resize-none`}
            />
            {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body}</p>}
          </div>

          {/* Category + Pinned in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('category')}
              </label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as Announcement['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange transition-all"
              >
                <option value="general">{t('categoryGeneral')}</option>
                <option value="holiday">{t('categoryHoliday')}</option>
                <option value="event">{t('categoryEvent')}</option>
                <option value="reminder">{t('categoryReminder')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('pinned')}
              </label>
              <button
                type="button"
                onClick={() => set('is_pinned', !form.is_pinned)}
                className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.is_pinned
                    ? 'bg-kinder-yellow/20 border-kinder-yellow text-yellow-600 dark:bg-kinder-yellow/10'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                <Pin size={14} />
                {form.is_pinned ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('expiresAt')}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => set('expires_at', e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange transition-all"
              />
              {form.expires_at && (
                <button
                  type="button"
                  onClick={() => set('expires_at', '')}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-red-500 hover:border-red-300 transition-all text-sm"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Banner image upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Banner Image (optional)
            </label>

            {form.image_url && (
              <div className="mb-3 w-full h-36 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <img
                  src={form.image_url}
                  alt="banner preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
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
                  {form.image_url ? t('changeBanner') : t('uploadBanner')}
                </>
              )}
            </button>
            {form.image_url && !uploading && (
              <button
                type="button"
                onClick={() => set('image_url', '')}
                className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors w-full text-center"
              >
                {t('removePhoto')}
              </button>
            )}
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
      <DiscardDialog show={showConfirm} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  )
}
