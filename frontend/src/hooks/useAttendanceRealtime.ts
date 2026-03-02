import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

/**
 * Subscribes to Supabase Realtime changes on the attendance table
 * for the given date. Invalidates the React Query cache on changes
 * so data refetches automatically.
 */
export function useAttendanceRealtime(selectedDate: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`attendance-${selectedDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `date=eq.${selectedDate}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['attendance', selectedDate] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedDate, queryClient])
}
