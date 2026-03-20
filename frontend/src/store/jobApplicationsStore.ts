import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface JobApplicationsState {
  page: number
  search: string
  statusFilter: string
  postingFilter: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setStatusFilter: (status: string) => void
  setPostingFilter: (postingId: string) => void
  reset: () => void
}

const initialState = {
  page: 1,
  search: '',
  statusFilter: '',
  postingFilter: '',
}

export const useJobApplicationsStore = create<JobApplicationsState>()(
  devtools(
    (set) => ({
      ...initialState,
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
      setPostingFilter: (postingFilter) => set({ postingFilter, page: 1 }),
      reset: () => set(initialState),
    }),
    { name: 'job-applications-store' }
  )
)
