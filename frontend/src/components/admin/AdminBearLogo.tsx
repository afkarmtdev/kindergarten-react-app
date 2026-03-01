import { useState, useEffect, useRef, useCallback } from 'react'
import { AdminBearIcon } from '@/components/admin/AdminBearIcon'
import { AdminBearSpeechBubble } from '@/components/admin/AdminBearSpeechBubble'

const BEAR_LOGO_KEYFRAMES = `
  @keyframes admin-bear-sleepy {
    0%, 100% { transform: rotate(0deg)    translateY(0px); }
    25%       { transform: rotate(-2.5deg) translateY(1px); }
    50%       { transform: rotate(0deg)    translateY(2px); }
    75%       { transform: rotate(2.5deg)  translateY(1px); }
  }
  @keyframes admin-bear-asleep {
    0%, 100% { transform: rotate(0deg)  translateY(0px); }
    30%       { transform: rotate(-5deg) translateY(3px); }
    55%       { transform: rotate(-7deg) translateY(4px); }
    65%       { transform: rotate(-4deg) translateY(2px); }
    80%       { transform: rotate(-6deg) translateY(3px); }
  }
  @keyframes admin-bear-wake {
    0%, 100% { transform: rotate(0deg);  }
    10%       { transform: rotate(-8deg); }
    25%       { transform: rotate(8deg);  }
    40%       { transform: rotate(-6deg); }
    55%       { transform: rotate(6deg);  }
    70%       { transform: rotate(-3deg); }
    85%       { transform: rotate(3deg);  }
  }
  .admin-bear-sleepy { animation: admin-bear-sleepy 3s ease-in-out infinite; transform-origin: 50% 100%; }
  .admin-bear-asleep { animation: admin-bear-asleep 4s ease-in-out infinite; transform-origin: 50% 100%; }
  .admin-bear-waking { animation: admin-bear-wake   0.4s ease-out both;     transform-origin: 50% 100%; }
`

const SLEEPY_THRESHOLD = 90_000
const ASLEEP_THRESHOLD = 180_000
const WAKE_ANIM_DURATION = 400
const WAKE_MSG_DURATION = 2_000
const ACTIVITY_DEBOUNCE = 200

const WAKE_MESSAGES = [
  "I wasn't sleeping!",
  "Oh! You're back.",
  'Just resting my eyes...',
  'Back to work!',
]

const IDLE_EVENTS: (keyof DocumentEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'click',
  'scroll',
  'touchstart',
]

type IdlePhase = 'active' | 'sleepy' | 'asleep' | 'waking'

export function AdminBearLogo() {
  const [idlePhase, setIdlePhase] = useState<IdlePhase>('active')
  const [wakeMessageVisible, setWakeMessageVisible] = useState(false)

  // Refs to avoid stale closures in event handlers
  const idlePhaseRef = useRef<IdlePhase>('active')
  const wakeMessageRef = useRef<string>('')
  const lastActivityRef = useRef<number>(Date.now())
  const sleepyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const asleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wakeMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setPhase = useCallback((p: IdlePhase) => {
    idlePhaseRef.current = p
    setIdlePhase(p)
  }, [])

  // Effect 1: idle timers + document event listeners
  useEffect(() => {
    const resetTimers = () => {
      if (sleepyTimerRef.current) clearTimeout(sleepyTimerRef.current)
      if (asleepTimerRef.current) clearTimeout(asleepTimerRef.current)

      sleepyTimerRef.current = setTimeout(() => {
        setPhase('sleepy')
        asleepTimerRef.current = setTimeout(() => {
          setPhase('asleep')
        }, ASLEEP_THRESHOLD - SLEEPY_THRESHOLD)
      }, SLEEPY_THRESHOLD)
    }

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastActivityRef.current < ACTIVITY_DEBOUNCE) return
      lastActivityRef.current = now

      const current = idlePhaseRef.current

      // Ignore input mid-wake animation to avoid re-triggering
      if (current === 'waking') return

      if (current === 'asleep' || current === 'sleepy') {
        wakeMessageRef.current = WAKE_MESSAGES[Math.floor(Math.random() * WAKE_MESSAGES.length)]
        setPhase('waking')
        // Effect 2 handles the waking → active transition
      }

      resetTimers()
    }

    // Start the countdown immediately on mount
    resetTimers()

    IDLE_EVENTS.forEach((e) => document.addEventListener(e, handleActivity, { passive: true }))

    return () => {
      IDLE_EVENTS.forEach((e) => document.removeEventListener(e, handleActivity))
      if (sleepyTimerRef.current) clearTimeout(sleepyTimerRef.current)
      if (asleepTimerRef.current) clearTimeout(asleepTimerRef.current)
      if (wakeMsgTimerRef.current) clearTimeout(wakeMsgTimerRef.current)
    }
  }, [setPhase])

  // Effect 2: waking sequence — shake → return to active → fade out wake message
  useEffect(() => {
    if (idlePhase !== 'waking') return

    setWakeMessageVisible(true)

    const shakeTimer = setTimeout(() => {
      setPhase('active')

      if (wakeMsgTimerRef.current) clearTimeout(wakeMsgTimerRef.current)
      wakeMsgTimerRef.current = setTimeout(() => {
        setWakeMessageVisible(false)
      }, WAKE_MSG_DURATION - WAKE_ANIM_DURATION)
    }, WAKE_ANIM_DURATION)

    return () => {
      clearTimeout(shakeTimer)
      // wakeMsgTimerRef is NOT cleared here — it must outlive the 'waking' phase.
      // It is cleared on unmount in Effect 1's cleanup.
    }
  }, [idlePhase, setPhase])

  const bearClass =
    idlePhase === 'sleepy'
      ? 'admin-bear-sleepy'
      : idlePhase === 'asleep'
        ? 'admin-bear-asleep'
        : idlePhase === 'waking'
          ? 'admin-bear-waking'
          : ''

  // The two bubbles are mutually exclusive:
  // zzz shows only when asleep; wake message shows during/after waking
  const zzzVariant = idlePhase === 'asleep' ? 'sleeping' : 'hidden'
  const wakeVariant = wakeMessageVisible ? 'waking' : 'hidden'

  const eyeState = idlePhase === 'asleep' ? 'closed' : idlePhase === 'sleepy' ? 'half' : 'open'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BEAR_LOGO_KEYFRAMES }} />
      <div className="relative">
        <AdminBearSpeechBubble variant={zzzVariant} />
        <AdminBearSpeechBubble variant={wakeVariant} message={wakeMessageRef.current} />
        <div
          className={`w-12 h-12 bg-kinder-orange rounded-2xl flex items-center justify-center ${bearClass}`}
        >
          <AdminBearIcon size={34} eyeState={eyeState} />
        </div>
      </div>
    </>
  )
}
