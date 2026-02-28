import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface FeesState {
  page: number
  search: string
  statusFilter: string
  monthFilter: string
  classFilter: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setStatusFilter: (status: string) => void
  setMonthFilter: (month: string) => void
  setClassFilter: (cls: string) => void
}

const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

export const useFeesStore = create<FeesState>()(
  devtools(
    (set) => ({
      page: 1,
      search: '',
      statusFilter: '',
      monthFilter: currentMonth,
      classFilter: '',
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
      setMonthFilter: (monthFilter) => set({ monthFilter, page: 1 }),
      setClassFilter: (classFilter) => set({ classFilter, page: 1 }),
    }),
    { name: 'fees-store' }
  )
)
