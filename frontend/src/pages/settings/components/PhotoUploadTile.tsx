import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/hooks/useT'
import { uploadSchoolMedia } from '@/lib/uploadSchoolMedia'
import type { SchoolMediaFolder } from '@/lib/uploadSchoolMedia'

interface PhotoUploadTileProps {
  value: string | null
  onChange: (url: string | null) => void
  folder: SchoolMediaFolder
  shape?: 'square' | 'circle'
  size?: 'sm' | 'lg'
  onUploadingChange?: (uploading: boolean) => void
}

/** Dashed drop tile that uploads one photo and shows it once done, with a remove button. */
export function PhotoUploadTile({
  value,
  onChange,
  folder,
  shape = 'square',
  size = 'lg',
  onUploadingChange,
}: PhotoUploadTileProps) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const setBusy = (busy: boolean) => {
    setUploading(busy)
    onUploadingChange?.(busy)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      onChange(await uploadSchoolMedia(file, folder))
    } catch {
      toast.error('Photo upload failed. Please try again.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const dims = size === 'lg' ? 'w-32 h-32' : 'w-20 h-20'
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'

  return (
    <div className={`relative ${dims} shrink-0`}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`w-full h-full ${radius} border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-1 hover:border-kinder-orange hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 overflow-hidden group`}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <>
            <Upload
              size={size === 'lg' ? 20 : 16}
              className="text-gray-400 dark:text-gray-500 group-hover:text-kinder-orange transition-colors"
            />
            {size === 'lg' && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500 group-hover:text-kinder-orange transition-colors font-medium px-2 text-center">
                {uploading ? t('uploading') : t('uploadPhoto')}
              </span>
            )}
          </>
        )}
      </button>
      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={t('removePhoto')}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
