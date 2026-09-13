import { useEffect, useState, type RefObject } from 'react'

/**
 * Elements start animating this far outside the viewport so nothing pops in
 * mid-scroll, while everything further away is left fully static.
 */
const ROOT_MARGIN = '200px 0px'

let sharedObserver: IntersectionObserver | null = null
const listeners = new Map<Element, (inView: boolean) => void>()

function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) listeners.get(entry.target)?.(entry.isIntersecting)
      },
      { rootMargin: ROOT_MARGIN }
    )
  }
  return sharedObserver
}

/**
 * True while the referenced element is in (or just outside) the viewport.
 *
 * Decorative infinite CSS animations each hold their own GPU layer for as long
 * as they run, even when scrolled far off screen. iOS Safari evicts and reloads
 * the page once too many of those pile up, so callers use this flag to drop the
 * animation class on anything the visitor cannot see. One IntersectionObserver
 * is shared by every caller.
 */
export function useInViewport<T extends Element>(ref: RefObject<T | null>): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = getObserver()
    listeners.set(el, setInView)
    observer.observe(el)
    return () => {
      observer.unobserve(el)
      listeners.delete(el)
    }
  }, [ref])

  return inView
}
