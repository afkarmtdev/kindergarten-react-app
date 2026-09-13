import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { schoolInfoApi } from '@/lib/api'
import { mergeLandingContent } from '@/lib/landingContent'
import { useT } from '@/hooks/useT'
import type { LandingContent } from '@/types'

function responseStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } } | null)?.response?.status
}

/**
 * Local edit state for ONE section of landing_content (hero, about, stats,
 * features, team). Loads the stored value, tracks dirtiness, and saves only
 * that slice via PUT /api/school-info/landing so panels never clobber each
 * other.
 */
export function useLandingSection<K extends keyof LandingContent>(key: K) {
  const t = useT()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['school-info'],
    queryFn: () => schoolInfoApi.get(),
  })

  const stored = useMemo(() => mergeLandingContent(data?.data?.landing_content)[key], [data, key])

  const [value, setValue] = useState<LandingContent[K]>(stored)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    setValue(stored)
    setIsDirty(false)
  }, [stored])

  const mutation = useMutation({
    mutationFn: () => schoolInfoApi.updateLanding({ [key]: value } as Partial<LandingContent>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-info'] })
      toast.success(t('settingsWebsiteSaved'))
      setIsDirty(false)
    },
    onError: (err: unknown) => {
      if (responseStatus(err) === 409) toast.error(t('settingsWebsiteNeedsGeneral'))
      else toast.error('Failed to save website content. Please try again.')
    },
  })

  const update = (next: Partial<LandingContent[K]>) => {
    setValue((prev) => ({ ...prev, ...next }))
    setIsDirty(true)
  }

  return {
    value,
    update,
    isDirty,
    isLoading,
    hasSchoolInfo: Boolean(data?.data),
    schoolInfo: data?.data ?? null,
    save: () => mutation.mutate(),
    isSaving: mutation.isPending,
  }
}
