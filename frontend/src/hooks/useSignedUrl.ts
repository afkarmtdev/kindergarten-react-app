import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

/**
 * Generates a signed URL for a private Supabase Storage file.
 * Returns the signed URL (expires in 1 hour) or null while loading/on error.
 */
export function useSignedUrl(bucket: string, path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }

    // If it's already a full URL (legacy data or public bucket), use as-is
    if (path.startsWith('http')) {
      setUrl(path)
      return
    }

    let cancelled = false
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600) // 1 hour expiry
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.signedUrl) {
          setUrl(data.signedUrl)
        }
      })

    return () => {
      cancelled = true
    }
  }, [bucket, path])

  return url
}
