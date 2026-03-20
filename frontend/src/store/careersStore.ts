import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CareersState {
  page: number
  search: string
  statusFilter: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setStatusFilter: (status: string) => void
  reset: () => void
}

const initialState = {
  page: 1,
  search: '',
  statusFilter: '',
}

export const useCareersStore = create<CareersState>()(
  devtools(
    (set) => ({
      ...initialState,
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
      reset: () => set(initialState),
    }),
    { name: 'careers-store' }
  )
)
