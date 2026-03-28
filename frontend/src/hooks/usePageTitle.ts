import { useEffect } from 'react'
import { APP_NAME } from '@/lib/version'

/**
 * Sets document.title to "<page> — <brand>" while the component is mounted.
 * Pass no argument (or undefined) to show just the brand name.
 * Pass `brandOverride` to replace APP_NAME (e.g. school name from settings).
 */
export function usePageTitle(page?: string, brandOverride?: string) {
  const brand = brandOverride || APP_NAME
  useEffect(() => {
    document.title = page ? `${page} - ${brand}` : brand
    return () => {
      document.title = APP_NAME
    }
  }, [page, brand])
}
