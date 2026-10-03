import { useRef, useState } from 'react'
import { Film, X } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/hooks/useT'
import { uploadHeroVideo } from '@/lib/uploadSchoolMedia'
import { checkHeroVideo, HERO_VIDEO_MAX_MB, HERO_VIDEO_TYPES } from '@/lib/heroVideo'

interface HeroVideoUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  onUploadingChange?: (uploading: boolean) => void
}

/** Settings > Website > Hero Copy: one short clip for the hero blob, with a looping preview. */
export function HeroVideoUpload({ value, onChange, onUploadingChange }: HeroVideoUploadProps) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const setBusy = (busy: boolean) => {
    setUploading(busy)
    onUploadingChange?.(busy)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const problem = checkHeroVideo(file)
    if (problem === 'type') {
      toast.error('Please choose an MP4 or WebM video.')
      return
    }
    if (problem === 'size') {
      toast.error(`Video is too large. Keep it under ${HERO_VIDEO_MAX_MB} MB.`)
      return
    }

    setBusy(true)
    try {
      onChange(await uploadHeroVideo(file))
      toast.success('Video uploaded. Save to publish it.')
    } catch {
      toast.error('Video upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
        {t('settingsHeroVideo')}
      </p>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="relative w-32 h-32 shrink-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label={value ? t('replaceVideo') : t('uploadVideo')}
            className="w-full h-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-1 hover:border-kinder-orange hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 overflow-hidden group"
          >
            {value && !uploading ? (
              <video
                key={value}
                src={value}
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <Film
                  size={20}
                  className="text-gray-400 dark:text-gray-500 group-hover:text-kinder-orange transition-colors"
                />
                <span className="text-[11px] text-gray-400 dark:text-gray-500 group-hover:text-kinder-orange transition-colors font-medium px-2 text-center">
                  {uploading ? t('uploading') : t('uploadVideo')}
                </span>
              </>
            )}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={t('removeVideo')}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
            >
              <X size={12} strokeWidth={3} />
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={HERO_VIDEO_TYPES.join(',')}
            className="hidden"
            onChange={handleFile}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 sm:pt-1 max-w-sm">
          {t('settingsHeroVideoHint', { mb: HERO_VIDEO_MAX_MB })}
        </p>
      </div>
    </div>
  )
}
