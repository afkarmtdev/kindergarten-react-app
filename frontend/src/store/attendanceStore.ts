import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { format } from 'date-fns'

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

interface AttendanceState {
  selectedDate: string
  page: number
  statusFilter: string
  pendingChanges: Record<string, AttendanceStatus>
  // Actions
  setDate: (date: string) => void
  setPage: (page: number) => void
  setStatusFilter: (status: string) => void
  setPending: (studentId: string, status: AttendanceStatus) => void
  clearPending: () => void
}

export const useAttendanceStore = create<AttendanceState>()(
  devtools(
    (set) => ({
      selectedDate: format(new Date(), 'yyyy-MM-dd'),
      page: 1,
      statusFilter: '',
      pendingChanges: {},
      setDate: (selectedDate) => set({ selectedDate, page: 1, pendingChanges: {} }),
      setPage: (page) => set({ page }),
      setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
      setPending: (studentId, status) =>
        set((state) => ({
          pendingChanges: { ...state.pendingChanges, [studentId]: status },
        })),
      clearPending: () => set({ pendingChanges: {} }),
    }),
    { name: 'attendance-store' }
  )
)
