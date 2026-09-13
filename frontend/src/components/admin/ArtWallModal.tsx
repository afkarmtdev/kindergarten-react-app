import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Palette, Upload, Loader, Eye, EyeOff, RotateCw } from 'lucide-react'
import { artWallApi, studentsApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { compressImage } from '@/lib/compressImage'
import { useT } from '@/hooks/useT'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { parseFieldErrors } from '@/lib/parseFieldErrors'
import { DiscardDialog } from '@/components/ui/DiscardDialog'
import { ImageCropDialog } from '@/components/ui/ImageCropDialog'
import type { ArtWallItem } from '@/types'

interface ArtWallModalProps {
  show: boolean
  onClose: () => void
  editingItem: ArtWallItem | null
}

const empty = {
  photo_url: '',
  caption: '',
  student_id: '' as string,
  student_name: '' as string,
  artwork_date: '',
  display_order: 0,
  is_visible: true,
  tilt_angle: null as number | null,
}

export function ArtWallModal({ show, onClose, editingItem }: ArtWallModalProps) {
  const t = useT()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ ...empty })
  const [photoError, setPhotoError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  const { data: studentsData } = useQuery({
    queryKey: ['students-picker'],
    queryFn: () => studentsApi.getAll({ limit: 100 }),
    enabled: show,
  })

  useEffect(() => {
    if (editingItem) {
      setForm({
        photo_url: editingItem.photo_url,
        caption: editingItem.caption ?? '',
        student_id: editingItem.student_id ?? '',
        student_name: editingItem.student_name ?? '',
        artwork_date: editingItem.artwork_date ?? '',
        display_order: editingItem.display_order,
        is_visible: editingItem.is_visible,
        tilt_angle: editingItem.tilt_angle,
      })
    } else {
      setForm({ ...empty })
    }
    setPhotoError('')
    setUploadError('')
    resetDirty()
  }, [editingItem, show])

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        student_id: data.student_id || null,
        student_name: data.student_name || null,
        artwork_date: data.artwork_date || null,
      }
      return editingItem ? artWallApi.update(editingItem.id, payload) : artWallApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['art-wall'] })
      toast.success(editingItem ? 'Artwork updated' : 'Artwork added')
      onClose()
    },
    onError: (err: unknown) => {
      const fieldErrs = parseFieldErrors(err)
      if (fieldErrs) {
        if (fieldErrs.photo_url) setPhotoError(fieldErrs.photo_url)
        toast.error('Please fix the highlighted fields.')
      } else {
        toast.error('Failed to save artwork. Please try again.')
      }
    },
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    markDirty()
  }

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
      .from('artwork-photos')
      .upload(path, compressed, { upsert: false })

    if (error) {
      setUploadError(t('uploadFailed'))
      setUploading(false)
      return
    }

    // Delete the old file from storage if replacing an existing photo
    if (form.photo_url) {
      const oldPath = form.photo_url.split('/artwork-photos/')[1]
      if (oldPath) {
        await supabase.storage.from('artwork-photos').remove([oldPath])
      }
    }

    const { data: urlData } = supabase.storage.from('artwork-photos').getPublicUrl(path)

    set('photo_url', urlData.publicUrl)
    setUploading(false)
  }

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value
    if (!studentId) {
      setForm((f) => ({ ...f, student_id: '', student_name: '' }))
      markDirty()
      return
    }
    const student = studentsData?.data?.find((s) => s.id === studentId)
    setForm((f) => ({
      ...f,
      student_id: studentId,
      student_name: student?.full_name ?? '',
    }))
    markDirty()
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

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={requestClose} />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kinder-pink/10 rounded-2xl flex items-center justify-center">
              <Palette size={16} className="text-kinder-pink" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {editingItem ? t('editArtwork') : t('addArtwork')}
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-kinder-pink hover:text-kinder-pink dark:hover:border-kinder-pink dark:hover:text-kinder-pink transition-all disabled:opacity-60"
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
            <textarea
              value={form.caption}
              onChange={(e) => set('caption', e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Describe the artwork..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-pink/50 focus:border-kinder-pink transition-all resize-none"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">
              {form.caption.length}/500
            </p>
          </div>

          {/* Student Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('student')}
            </label>
            <select
              value={form.student_id}
              onChange={handleStudentChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-pink/50 focus:border-kinder-pink transition-all"
            >
              <option value="">{t('selectStudent')}</option>
              {studentsData?.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} — {s.class_name}
                </option>
              ))}
            </select>
          </div>

          {/* Artwork Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('artworkDate')}
            </label>
            <input
              type="date"
              value={form.artwork_date}
              onChange={(e) => set('artwork_date', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-pink/50 focus:border-kinder-pink transition-all"
            />
          </div>

          {/* Tilt angle */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              <RotateCw size={12} />
              Tilt angle
              <span className="ml-auto text-kinder-pink font-bold tabular-nums">
                {form.tilt_angle === null
                  ? 'Auto'
                  : `${form.tilt_angle > 0 ? '+' : ''}${form.tilt_angle}°`}
              </span>
            </label>
            <input
              type="range"
              min={-15}
              max={15}
              step={1}
              value={form.tilt_angle ?? 0}
              onChange={(e) => {
                set('tilt_angle', Number(e.target.value))
              }}
              className="w-full accent-kinder-pink"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">-15°</span>
              <button
                type="button"
                onClick={() => set('tilt_angle', null)}
                className="text-[10px] text-kinder-pink hover:underline"
              >
                Reset to auto
              </button>
              <span className="text-[10px] text-gray-400">+15°</span>
            </div>
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-pink/50 focus:border-kinder-pink transition-all"
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
              className="flex-1 py-2.5 rounded-xl bg-kinder-pink text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-sm"
            >
              {mutation.isPending ? t('saving2') : t('save')}
            </button>
          </div>
        </form>
      </div>
      <ImageCropDialog
        file={cropFile}
        shape="square"
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
