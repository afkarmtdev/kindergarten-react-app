import { useEffect } from 'react'
import { APP_NAME } from '@/lib/version'

/**
 * Sets document.title to "<page> — <APP_NAME>" while the component is mounted.
 * Pass no argument (or undefined) to show just the brand name (e.g. landing page).
 */
export function usePageTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} — ${APP_NAME}` : APP_NAME
    return () => {
      document.title = APP_NAME
    }
  }, [page])
}
