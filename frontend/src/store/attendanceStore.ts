import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { format } from 'date-fns'

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

interface PendingChange {
  status: AttendanceStatus
  notes?: string
}

interface AttendanceState {
  selectedDate: string
  page: number
  statusFilter: string
  classFilter: string
  pendingChanges: Record<string, PendingChange>
  // Actions
  setDate: (date: string) => void
  setPage: (page: number) => void
  setStatusFilter: (status: string) => void
  setClassFilter: (v: string) => void
  setPending: (studentId: string, status: AttendanceStatus, notes?: string) => void
  clearPending: () => void
}

export const useAttendanceStore = create<AttendanceState>()(
  devtools(
    (set) => ({
      selectedDate: format(new Date(), 'yyyy-MM-dd'),
      page: 1,
      statusFilter: '',
      classFilter: '',
      pendingChanges: {},
      setDate: (selectedDate) => set({ selectedDate, page: 1, pendingChanges: {} }),
      setPage: (page) => set({ page }),
      setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
      setClassFilter: (classFilter) => set({ classFilter, page: 1 }),
      setPending: (studentId, status, notes) =>
        set((state) => ({
          pendingChanges: { ...state.pendingChanges, [studentId]: { status, notes } },
        })),
      clearPending: () => set({ pendingChanges: {} }),
    }),
    { name: 'attendance-store' }
  )
)
