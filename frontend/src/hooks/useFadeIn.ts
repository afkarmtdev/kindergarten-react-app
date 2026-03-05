import { useRef, useState, useCallback } from 'react'

export function useFadeIn(options?: { threshold?: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        { threshold: options?.threshold ?? 0.15 }
      )
      observer.observe(el)
      observerRef.current = observer
    },

    [options?.threshold]
  )

  return { ref, isVisible }
}
