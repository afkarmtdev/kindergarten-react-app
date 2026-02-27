import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface AnnouncementsState {
  page: number
  search: string
  categoryFilter: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setCategoryFilter: (category: string) => void
}

export const useAnnouncementsStore = create<AnnouncementsState>()(
  devtools(
    (set) => ({
      page: 1,
      search: '',
      categoryFilter: '',
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter, page: 1 }),
    }),
    { name: 'announcements-store' }
  )
)
