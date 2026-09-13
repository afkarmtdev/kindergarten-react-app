import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '@/hooks/useT'

export interface PhotoLightboxProps {
  /** Ordered list of photo URLs the lightbox can page through. */
  urls: string[]
  /** Index of the open photo, or null when closed. */
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * Full-screen photo viewer for landing page sections — same look as the
 * gallery lightbox (dark blurred backdrop, prev/next, Escape + arrow keys).
 */
export function PhotoLightbox({ urls, index, onClose, onNavigate }: PhotoLightboxProps) {
  const t = useT()
  const count = urls.length
  const isOpen = index !== null && count > 0

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNavigate(index > 0 ? index - 1 : count - 1)
      if (e.key === 'ArrowRight') onNavigate(index < count - 1 ? index + 1 : 0)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, index, count, onClose, onNavigate])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('closeModal')}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
        >
          <X size={28} />
        </button>

        <img
          key={index}
          src={urls[index]}
          alt=""
          className="w-full max-h-[75vh] object-contain rounded-2xl lp-enter-0"
        />

        {count > 1 && (
          <>
            <p className="text-white/40 text-center text-xs mt-3">
              {index + 1} / {count}
            </p>
            <button
              type="button"
              onClick={() => onNavigate(index > 0 ? index - 1 : count - 1)}
              aria-label={t('previousPhoto')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft size={36} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate(index < count - 1 ? index + 1 : 0)}
              aria-label={t('nextPhoto')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-white/70 hover:text-white transition-colors"
            >
              <ChevronRight size={36} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
