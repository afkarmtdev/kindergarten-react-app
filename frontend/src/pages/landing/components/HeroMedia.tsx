import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useInViewport } from '@/hooks/useInViewport'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface HeroMediaProps {
  /** School's clip from Settings > Website > Hero Copy; takes the blob when set. */
  videoUrl: string | null
  /** First visible gallery photo; the blob image, or the video's poster. */
  photoUrl: string | null
}

/**
 * Right column of the hero: the school's clip (muted loop) or the first gallery
 * photo, clipped to the blob. The column is lg+ only, and the video element is
 * not even mounted below lg so phones never download it. The clip plays only
 * while on screen; reduced-motion visitors get a still frame until they turn
 * the sound on.
 */
export function HeroMedia({ videoUrl, photoUrl }: HeroMediaProps) {
  const t = useT()
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const inView = useInViewport(wrapRef)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [muted, setMuted] = useState(true)

  const showVideo = videoUrl !== null && isDesktop
  const shouldPlay = inView && (!reducedMotion || !muted)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // play() rejects when the browser blocks it; the poster stays up instead
    if (shouldPlay) video.play().catch(() => {})
    else video.pause()
  }, [shouldPlay, showVideo])

  // The wrapper always renders, even before school info and gallery load:
  // useInViewport observes the element it finds on mount and never re-attaches.
  return (
    <div ref={wrapRef} className="hidden lg:block lp-enter-2">
      {(videoUrl || photoUrl) && (
        <>
          <svg width="0" height="0" className="absolute">
            <defs>
              <clipPath id="hero-blob" clipPathUnits="objectBoundingBox">
                <path d="M0.5,0.02 C0.73,0.02 0.92,0.1 0.97,0.3 C1.02,0.5 0.95,0.7 0.85,0.85 C0.75,0.95 0.6,0.99 0.45,0.98 C0.3,0.97 0.12,0.9 0.05,0.73 C-0.02,0.55 0.01,0.35 0.1,0.2 C0.2,0.08 0.35,0.02 0.5,0.02" />
              </clipPath>
            </defs>
          </svg>
          <div className="relative w-full max-w-lg mx-auto">
            <div className="w-full aspect-square" style={{ clipPath: 'url(#hero-blob)' }}>
              {showVideo ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  poster={photoUrl ?? undefined}
                  muted={muted}
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              ) : (
                photoUrl && (
                  <img src={photoUrl} alt="School life" className="w-full h-full object-cover" />
                )
              )}
            </div>
            <div
              className="absolute inset-0 rounded-full border-4 border-dashed border-kinder-yellow/30 -z-10 scale-110"
              aria-hidden="true"
            />
            {showVideo && (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? t('heroVideoSoundOn') : t('heroVideoSoundOff')}
                className="absolute bottom-[10%] right-[14%] w-11 h-11 rounded-full bg-white/90 dark:bg-gray-900/90 border-2 border-white dark:border-gray-900 shadow-md flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-kinder-orange dark:hover:text-kinder-orange hover:-translate-y-0.5 transition-all"
              >
                {muted ? (
                  <VolumeX size={18} strokeWidth={2.5} />
                ) : (
                  <Volume2 size={18} strokeWidth={2.5} />
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
