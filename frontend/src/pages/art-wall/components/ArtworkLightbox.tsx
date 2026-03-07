import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import type { ArtWallItem } from '@/types'

interface Props {
  items: ArtWallItem[]
  activeId: string | null
  onClose: () => void
  onNavigate: (id: string) => void
}

export function ArtworkLightbox({ items, activeId, onClose, onNavigate }: Props) {
  const activeIndex = activeId != null ? items.findIndex((i) => i.id === activeId) : -1
  const item = activeIndex >= 0 ? items[activeIndex] : null
  const hasPrev = activeIndex > 0
  const hasNext = activeIndex < items.length - 1

  useEffect(() => {
    if (!item) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(items[activeIndex - 1].id)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(items[activeIndex + 1].id)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [item, activeIndex, hasPrev, hasNext, items, onClose, onNavigate])

  if (!item) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        onClick={onClose}
      >
        <X size={18} />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          className="absolute left-3 sm:left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(items[activeIndex - 1].id)
          }}
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Polaroid card */}
      <div
        className="bg-white shadow-2xl w-full max-w-[280px] sm:max-w-xs"
        style={{ padding: '14px 14px 0' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aspect-square overflow-hidden">
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.caption ?? 'Artwork'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ImageIcon size={40} className="text-gray-400" />
            </div>
          )}
        </div>
        <div className="px-2 py-5 text-center min-h-[80px] flex flex-col items-center justify-center gap-1">
          {item.caption && (
            <p
              className="text-sm text-gray-700 leading-snug"
              style={{ fontFamily: "'Segoe Print', 'Comic Sans MS', cursive" }}
            >
              {item.caption}
            </p>
          )}
          {item.student_name && (
            <p
              className="text-xs text-gray-400"
              style={{ fontFamily: "'Segoe Print', 'Comic Sans MS', cursive" }}
            >
              — {item.student_name}
            </p>
          )}
          {item.artwork_date && (
            <p className="text-xs text-gray-400">
              {new Date(item.artwork_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Next */}
      {hasNext && (
        <button
          className="absolute right-3 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(items[activeIndex + 1].id)
          }}
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Counter */}
      {items.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium tabular-nums">
          {activeIndex + 1} / {items.length}
        </div>
      )}
    </div>,
    document.body
  )
}
