import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface InquiriesStore {
  page: number
  search: string
  statusFilter: string
  dateFrom: string
  dateTo: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setStatusFilter: (v: string) => void
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  clearFilters: () => void
}

const initialFilters = {
  page: 1,
  search: '',
  statusFilter: '',
  dateFrom: '',
  dateTo: '',
}

export const useInquiriesStore = create<InquiriesStore>()(
  devtools(
    (set) => ({
      ...initialFilters,
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
      setDateFrom: (dateFrom) => set({ dateFrom, page: 1 }),
      setDateTo: (dateTo) => set({ dateTo, page: 1 }),
      clearFilters: () => set(initialFilters),
    }),
    { name: 'inquiriesStore' }
  )
)
