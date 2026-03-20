import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface IncidentsState {
  page: number
  search: string
  typeFilter: string
  severityFilter: string
  statusFilter: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setTypeFilter: (type: string) => void
  setSeverityFilter: (severity: string) => void
  setStatusFilter: (status: string) => void
  reset: () => void
}

const initialState = {
  page: 1,
  search: '',
  typeFilter: '',
  severityFilter: '',
  statusFilter: '',
}

export const useIncidentsStore = create<IncidentsState>()(
  devtools(
    (set) => ({
      ...initialState,
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      setTypeFilter: (typeFilter) => set({ typeFilter, page: 1 }),
      setSeverityFilter: (severityFilter) => set({ severityFilter, page: 1 }),
      setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
      reset: () => set(initialState),
    }),
    { name: 'incidents-store' }
  )
)
