import { useState, type CSSProperties } from 'react'
import { Camera, ChevronDown, ZoomIn } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import type { GalleryItem } from '@/types'

/** Slats on show; the rest of the gallery is reached through the lightbox. */
const MAX_SLATS = 6
/** Height in px of the scallop bite where one photo runs into the next. */
const SEAM = 14
const BUMPS = 8
const BUMP_WIDTH = 200
const MASK_WIDTH = BUMPS * BUMP_WIDTH

const CLOSED_HEIGHT = '4rem'
/** 4:3 is the shape gallery photos are cropped to, so the open photo shows whole. */
const OPEN_HEIGHT = `calc(min(75vw, 26rem) + ${SEAM}px)`

const BUMP_CURVE = Array.from(
  { length: BUMPS },
  (_, i) => `Q${i * BUMP_WIDTH + BUMP_WIDTH / 2},${-SEAM} ${(i + 1) * BUMP_WIDTH},${SEAM}`
).join(' ')

function seamMask(d: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${MASK_WIDTH} ${SEAM}' preserveAspectRatio='none'><path d='${d}'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// Bumps of this photo rising into the one above it
const RISE = seamMask(`M0,${SEAM} ${BUMP_CURVE} Z`)
// The same bumps cut out of the last photo, so the section's paper rises into it
const CUT = seamMask(`M0,0 L0,${SEAM} ${BUMP_CURVE} L${MASK_WIDTH},0 Z`)
const SOLID = 'linear-gradient(#000, #000)'

function mask(image: string, size: string, position: string): CSSProperties {
  return {
    WebkitMaskImage: image,
    maskImage: image,
    WebkitMaskSize: size,
    maskSize: size,
    WebkitMaskPosition: position,
    maskPosition: position,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  }
}

// The layers overlap by 1px so no hairline shows between a seam and the photo body
const SLAT_MASK = mask(
  `${RISE}, ${SOLID}`,
  `100% ${SEAM}px, 100% calc(100% - ${SEAM - 1}px)`,
  'top, bottom'
)
const LAST_SLAT_MASK = mask(
  `${RISE}, ${SOLID}, ${CUT}`,
  `100% ${SEAM}px, 100% calc(100% - ${2 * SEAM - 2}px), 100% ${SEAM}px`,
  'top, center, bottom'
)

const ON_PHOTO_TEXT = '[text-shadow:0_1px_3px_rgb(0_0_0/0.55)]'

export interface GalleryBlindsProps {
  items: GalleryItem[]
  /** Opens the lightbox on the photo at this index of `items`. */
  onOpen: (index: number) => void
  className?: string
}

/**
 * Phone layout of the landing gallery: the photos run edge to edge as a stack of
 * blinds. One slat is open and shows its whole photo; the others are letterbox
 * slivers of theirs. Tapping a sliver opens it and closes the open one, so the
 * stack keeps its height; tapping the open photo sends it to the lightbox.
 *
 * Each slat is masked with the page's scallop along its top edge and overlaps
 * the slat above by the same amount, so photo bites into photo the way one
 * landing band bites into the next.
 */
export function GalleryBlinds({ items, onOpen, className = '' }: GalleryBlindsProps) {
  const t = useT()
  const fadeIn = useFadeIn()
  const [activeIndex, setActiveIndex] = useState(0)

  const slats = items.slice(0, MAX_SLATS)
  if (slats.length === 0) return null

  const active = Math.min(activeIndex, slats.length - 1)
  const extra = items.length - slats.length

  return (
    <div
      ref={fadeIn.ref}
      className={`relative ${fadeIn.isVisible ? 'lp-fade-up' : 'opacity-0'} ${className}`}
    >
      {slats.map((item, i) => {
        const open = i === active
        const number = String(i + 1).padStart(2, '0')
        const label = t(open ? 'galleryOpenPhoto' : 'galleryShowPhoto', { n: i + 1 })
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => (open ? onOpen(i) : setActiveIndex(i))}
            aria-expanded={open}
            aria-label={item.caption ? `${label}: ${item.caption}` : label}
            className="relative block w-full overflow-hidden text-left transition-[height] duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-kinder-yellow"
            style={{
              height: open ? OPEN_HEIGHT : CLOSED_HEIGHT,
              marginTop: i === 0 ? 0 : -SEAM,
              ...(i === slats.length - 1 ? LAST_SLAT_MASK : SLAT_MASK),
            }}
          >
            <img
              src={item.photo_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-[50%_40%]"
            />

            {/* Closed: dimmed sliver with its number and caption */}
            <span
              aria-hidden="true"
              className={`absolute inset-0 flex items-center gap-3 px-4 bg-gray-950/35 transition-opacity duration-300 ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className={`font-fun font-bold text-lg text-white ${ON_PHOTO_TEXT}`}>
                {number}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-sm font-bold text-white ${ON_PHOTO_TEXT}`}
              >
                {item.caption}
              </span>
              <ChevronDown size={18} className="flex-shrink-0 text-white/90" />
            </span>

            {/* Open: caption strip, kept clear of the seam the next slat covers */}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 pt-14 bg-gradient-to-t from-gray-950/70 to-transparent transition-opacity duration-300 ${
                open ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ paddingBottom: SEAM + 12 }}
            >
              <span className="min-w-0">
                <span className={`block leading-none text-white ${ON_PHOTO_TEXT}`}>
                  <span className="font-fun font-bold text-2xl">{number}</span>
                  <span className="font-bold text-sm text-white/75"> / {items.length}</span>
                </span>
                {item.caption && (
                  <span
                    className={`block mt-1.5 text-sm font-bold text-white line-clamp-2 ${ON_PHOTO_TEXT}`}
                  >
                    {item.caption}
                  </span>
                )}
              </span>
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 shadow-md flex items-center justify-center">
                <ZoomIn size={18} />
              </span>
            </span>
          </button>
        )
      })}

      {extra > 0 && (
        <div className="mt-6 px-4 text-center">
          <button
            type="button"
            onClick={() => onOpen(slats.length)}
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-800 px-5 py-2.5 rounded-full font-extrabold text-sm active:scale-95 transition-transform duration-200"
          >
            <Camera size={16} />
            {t('galleryMorePhotos', { n: extra })}
          </button>
        </div>
      )}
    </div>
  )
}
