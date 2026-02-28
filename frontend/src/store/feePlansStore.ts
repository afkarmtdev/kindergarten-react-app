import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface FeePlansState {
  page: number
  search: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
}

export const useFeePlansStore = create<FeePlansState>()(
  devtools(
    (set) => ({
      page: 1,
      search: '',
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
    }),
    { name: 'fee-plans-store' }
  )
)
