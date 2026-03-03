import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface TestimonialsState {
  page: number
  search: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
}

export const useTestimonialsStore = create<TestimonialsState>()(
  devtools(
    (set) => ({
      page: 1,
      search: '',
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
    }),
    { name: 'testimonials-store' }
  )
)
