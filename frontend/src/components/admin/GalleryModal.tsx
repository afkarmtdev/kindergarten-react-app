import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Camera, Upload, Loader, Eye, EyeOff } from 'lucide-react'
import { galleryApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { compressImage } from '@/lib/compressImage'
import { useT } from '@/hooks/useT'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { parseFieldErrors } from '@/lib/parseFieldErrors'
import { DiscardDialog } from '@/components/ui/DiscardDialog'
import type { GalleryItem } from '@/types'

interface GalleryModalProps {
  open: boolean
  onClose: () => void
  item?: GalleryItem | null
}

const empty = {
  photo_url: '',
  caption: '',
  display_order: 0,
  is_visible: true,
}

export function GalleryModal({ open, onClose, item }: GalleryModalProps) {
  const t = useT()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ ...empty })
  const [photoError, setPhotoError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  useEffect(() => {
    if (item) {
      setForm({
        photo_url: item.photo_url,
        caption: item.caption ?? '',
        display_order: item.display_order,
        is_visible: item.is_visible,
      })
    } else {
      setForm({ ...empty })
    }
    setPhotoError('')
    setUploadError('')
    resetDirty()
  }, [item, open])

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      item ? galleryApi.update(item.id, data) : galleryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
      toast.success(item ? 'Photo updated' : 'Photo added')
      onClose()
    },
    onError: (err: unknown) => {
      const fieldErrs = parseFieldErrors(err)
      if (fieldErrs) {
        if (fieldErrs.photo_url) setPhotoError(fieldErrs.photo_url)
        toast.error('Please fix the highlighted fields.')
      } else {
        toast.error('Failed to save photo. Please try again.')
      }
    },
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
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
      .from('gallery-photos')
      .upload(path, compressed, { upsert: false })

    if (error) {
      setUploadError(t('uploadFailed'))
      setUploading(false)
      return
    }

    // Delete the old file from storage if replacing an existing photo
    if (form.photo_url) {
      const oldPath = form.photo_url.split('/gallery-photos/')[1]
      if (oldPath) {
        await supabase.storage.from('gallery-photos').remove([oldPath])
      }
    }

    const { data: urlData } = supabase.storage.from('gallery-photos').getPublicUrl(path)

    set('photo_url', urlData.publicUrl)
    setUploading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.photo_url.trim()) {
      setPhotoError(t('required'))
      return
    }
    setPhotoError('')
    mutation.mutate(form)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={requestClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kinder-purple rounded-2xl flex items-center justify-center">
              <Camera size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {item ? t('editPhoto') : t('addPhoto')}
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
          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('photo')} *
            </label>

            {/* Preview */}
            {form.photo_url && (
              <div className="mb-3 w-full h-40 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <img
                  src={form.photo_url}
                  alt="preview"
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-kinder-purple hover:text-kinder-purple dark:hover:border-kinder-purple dark:hover:text-kinder-purple transition-all disabled:opacity-60"
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
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
            {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('caption')}
            </label>
            <input
              type="text"
              value={form.caption}
              onChange={(e) => set('caption', e.target.value)}
              placeholder="Classroom moments..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-purple/50 focus:border-kinder-purple transition-all"
            />
          </div>

          {/* Display Order + Visible in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('displayOrder')}
              </label>
              <input
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => set('display_order', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-purple/50 focus:border-kinder-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('isVisible')}
              </label>
              <button
                type="button"
                onClick={() => set('is_visible', !form.is_visible)}
                className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.is_visible
                    ? 'bg-kinder-green/10 border-kinder-green text-kinder-green dark:bg-kinder-green/20'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {form.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                {form.is_visible ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Server error */}
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
              className="flex-1 py-2.5 rounded-xl bg-kinder-purple text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-sm"
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
