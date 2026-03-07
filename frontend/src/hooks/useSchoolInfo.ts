import { useQuery } from '@tanstack/react-query'
import { schoolInfoApi } from '@/lib/api'
import { APP_NAME } from '@/lib/version'
import type { OperatingHours, SchoolInfo } from '@/types'

function isOperatingHours(val: unknown): val is OperatingHours {
  if (typeof val !== 'object' || val === null || !('monday' in val)) return false
  const monday = (val as Record<string, unknown>).monday
  return typeof monday === 'object' && monday !== null && 'open' in monday && 'close' in monday
}

/**
 * Fetches school info from the backend. Returns the school name
 * (falling back to APP_NAME if not configured), plus address,
 * phone, email, logo URL, and new social/contact fields.
 *
 * Pass `{ public: true }` to use the public (no-auth) endpoint,
 * suitable for landing page components that render without a JWT.
 *
 * Use this in any print/export view that needs the school header.
 */
export function useSchoolInfo(options?: { public?: boolean }) {
  const isPublic = options?.public === true

  const { data } = useQuery({
    queryKey: isPublic ? ['school-info', 'public'] : ['school-info'],
    queryFn: isPublic ? () => schoolInfoApi.getPublic() : () => schoolInfoApi.get(),
    staleTime: 5 * 60 * 1000,
  })

  const info: SchoolInfo | null = data?.data ?? null

  return {
    schoolName: info?.school_name || APP_NAME,
    address: info?.address ?? '',
    phone: info?.phone ?? '',
    email: info?.email ?? '',
    logoUrl: info?.logo_url ?? null,
    whatsappNumber: info?.whatsapp_number ?? '',
    operatingHours: isOperatingHours(info?.operating_hours) ? info.operating_hours : null,
    googleMapsEmbedUrl: info?.google_maps_embed_url ?? '',
    facebookUrl: info?.facebook_url ?? '',
    instagramUrl: info?.instagram_url ?? '',
    principalName: info?.principal_name ?? '',
    registrationNumber: info?.registration_number ?? '',
  }
}
