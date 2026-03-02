import { useQuery } from '@tanstack/react-query'
import { schoolInfoApi } from '@/lib/api'
import { APP_NAME } from '@/lib/version'
import type { SchoolInfo } from '@/types'

/**
 * Fetches school info from the backend. Returns the school name
 * (falling back to APP_NAME if not configured), plus address,
 * phone, email, and logo URL.
 *
 * Use this in any print/export view that needs the school header.
 */
export function useSchoolInfo() {
  const { data } = useQuery({
    queryKey: ['school-info'],
    queryFn: () => schoolInfoApi.get(),
    staleTime: 5 * 60 * 1000,
  })

  const info: SchoolInfo | null = data?.data ?? null

  return {
    schoolName: info?.school_name || APP_NAME,
    address: info?.address ?? '',
    phone: info?.phone ?? '',
    email: info?.email ?? '',
    logoUrl: info?.logo_url ?? null,
  }
}
