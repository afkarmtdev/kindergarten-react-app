import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DailyReport } from '../types'

interface PendingChange {
  meals_eaten?: DailyReport['meals_eaten']
  nap_minutes?: number | null
  toilet_count?: number | null
  mood?: DailyReport['mood']
  activity_note?: string | null
  photo_url?: string | null
}

interface DailyReportsState {
  selectedDate: string
  classFilter: string
  page: number
  pendingChanges: Map<string, PendingChange>
  setSelectedDate: (date: string) => void
  setClassFilter: (cls: string) => void
  setPage: (page: number) => void
  setPendingChange: (studentId: string, change: PendingChange) => void
  clearPendingChanges: () => void
}

export const useDailyReportsStore = create<DailyReportsState>()(
  devtools(
    (set) => ({
      selectedDate: new Date().toISOString().split('T')[0],
      classFilter: '',
      page: 1,
      pendingChanges: new Map(),

      setSelectedDate: (date) => set({ selectedDate: date, page: 1, pendingChanges: new Map() }),
      setClassFilter: (cls) => set({ classFilter: cls, page: 1 }),
      setPage: (page) => set({ page }),

      setPendingChange: (studentId, change) =>
        set((state) => {
          const next = new Map(state.pendingChanges)
          const existing = next.get(studentId) ?? {}
          next.set(studentId, { ...existing, ...change })
          return { pendingChanges: next }
        }),

      clearPendingChanges: () => set({ pendingChanges: new Map() }),
    }),
    { name: 'daily-reports' }
  )
)
