import { useEffect, useState } from 'react'
import { StickerBear, type BearEyeState } from './StickerBear'
import { Wave } from '@/pages/landing/components/Wave'
import { useT } from '@/hooks/useT'
import {
  CURTAIN_BLINK_EVERY_MS,
  CURTAIN_BLINK_FOR_MS,
  CURTAIN_EXIT_HOLD_MS,
} from '@/lib/reloadCurtain'

/**
 * Full-screen sky-wash curtain shown while the landing page reloads from the
 * update banner. Two halves, played by two different builds of the app:
 *
 *   enter  Old build, right after the Reload tap. The curtain drops from the top
 *          with a scalloped hem, the bear pops in and blinks while the service
 *          worker installs. It holds for as long as that takes; the page reload
 *          unmounts it.
 *   exit   New build, first render (see ReloadCurtainHandoff). The curtain is
 *          already down, the bear grins, then the whole thing lifts away and
 *          calls onDone.
 *
 * The hem is the landing page scallop Wave flipped upside down so it hangs off
 * the bottom edge; it sits below the viewport once the curtain is fully down,
 * so it only shows while the edge sweeps past. z-[70] sits above the banner (60).
 */
export function ReloadCurtain({ phase, onDone }: { phase: 'enter' | 'exit'; onDone?: () => void }) {
  const t = useT()
  const [eyeState, setEyeState] = useState<BearEyeState>('open')
  const [lifting, setLifting] = useState(false)

  // Waiting bear blinks every few seconds so the hold never reads as frozen.
  useEffect(() => {
    if (phase !== 'enter') return
    let closeTimer: ReturnType<typeof setTimeout> | undefined
    const blink = setInterval(() => {
      setEyeState('closed')
      closeTimer = setTimeout(() => setEyeState('open'), CURTAIN_BLINK_FOR_MS)
    }, CURTAIN_BLINK_EVERY_MS)
    return () => {
      clearInterval(blink)
      if (closeTimer) clearTimeout(closeTimer)
    }
  }, [phase])

  // Exit: hold on the grin, then lift. Reduced motion has no lift animation to
  // wait for, so the fallback timer finishes the job either way.
  useEffect(() => {
    if (phase !== 'exit') return
    const hold = setTimeout(() => setLifting(true), CURTAIN_EXIT_HOLD_MS)
    const fallback = setTimeout(() => onDone?.(), CURTAIN_EXIT_HOLD_MS + 900)
    return () => {
      clearTimeout(hold)
      clearTimeout(fallback)
    }
  }, [phase, onDone])

  const motion = phase === 'enter' ? 'reload-curtain-drop' : lifting ? 'reload-curtain-lift' : ''

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-[70] flex flex-col ${motion}`}
      style={{ height: 'calc(100vh + 88px)' }}
      onAnimationEnd={(e) => {
        if (e.animationName === 'reload-curtain-lift') onDone?.()
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-wash-sky px-6 text-center">
        <div className={phase === 'enter' ? 'reload-curtain-bear' : 'reload-curtain-bear-grin'}>
          <StickerBear
            size={128}
            eyeState={eyeState}
            mood={phase === 'exit' ? 'grin' : 'smile'}
            tilt={0}
          />
        </div>
        <p className="font-fun text-xl font-semibold text-ink-sky md:text-2xl">
          {phase === 'enter' ? (
            <>
              {t('updateCurtainFetching')}
              <span className="ml-1 inline-flex gap-1 align-middle" aria-hidden="true">
                <i className="reload-curtain-dot h-1.5 w-1.5 rounded-full bg-current" />
                <i className="reload-curtain-dot h-1.5 w-1.5 rounded-full bg-current" />
                <i className="reload-curtain-dot h-1.5 w-1.5 rounded-full bg-current" />
              </span>
            </>
          ) : (
            t('updateCurtainReady')
          )}
        </p>
      </div>
      <div className="-scale-y-100" aria-hidden="true">
        <Wave variant="scallop" fillClassName="fill-wash-sky" />
      </div>
    </div>
  )
}
