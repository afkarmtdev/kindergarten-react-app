import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Crop, ZoomIn, ZoomOut } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { CROP_SHAPES, cropImageFile } from '@/lib/cropImage'
import type { CropShape } from '@/lib/cropImage'

interface ImageCropDialogProps {
  /** The freshly picked file. Pass null to keep the dialog closed. */
  file: File | null
  /** Matches how the photo is displayed: square tile, round avatar, 4:3 card, 16:9 banner. */
  shape: CropShape
  onCancel: () => void
  /** Receives the cropped JPEG; the caller uploads it exactly as it would the original. */
  onConfirm: (file: File) => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3

/**
 * Full-screen crop step shown between picking a photo and uploading it.
 * Renders above every modal (z-60) so it works inside the add/edit dialogs.
 */
export function ImageCropDialog({ file, shape, onCancel, onConfirm }: ImageCropDialogProps) {
  const t = useT()
  const [src, setSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!file) {
      setSrc(null)
      return
    }
    const url = URL.createObjectURL(file)
    setSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(MIN_ZOOM)
    setArea(null)
    setFailed(false)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!file) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [file, onCancel])

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), [])

  const handleConfirm = async () => {
    if (!file || !area) return
    setBusy(true)
    try {
      onConfirm(await cropImageFile(file, area))
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  if (!file || !src) return null

  const { aspect, round } = CROP_SHAPES[shape]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-dialog-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl w-full max-w-md border-2 border-gray-200 dark:border-gray-800 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-wash-peach rounded-xl flex items-center justify-center flex-shrink-0">
            <Crop size={16} className="text-ink-peach" />
          </div>
          <div className="min-w-0">
            <h3
              id="crop-dialog-title"
              className="font-fun font-bold text-base text-gray-900 dark:text-gray-100"
            >
              {t('cropPhoto')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('cropHint')}</p>
          </div>
        </div>

        <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={round ? 'round' : 'rect'}
            showGrid={!round}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <ZoomOut size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label={t('cropZoom')}
            className="flex-1 accent-kinder-orange"
          />
          <ZoomIn size={16} className="text-gray-400 flex-shrink-0" />
        </div>

        {failed && <p className="text-xs text-red-500 mt-3">{t('uploadFailed')}</p>}

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 px-4 py-2.5 rounded-full border-2 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-sm font-extrabold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !area}
            className="flex-1 bg-kinder-orange text-white px-4 py-2.5 rounded-full text-sm font-extrabold hover:bg-orange-500 transition-colors disabled:opacity-50"
          >
            {busy ? t('uploading') : t('usePhoto')}
          </button>
        </div>
      </div>
    </div>
  )
}
