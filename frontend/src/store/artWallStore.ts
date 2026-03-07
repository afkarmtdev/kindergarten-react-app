import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ArtWallState {
  page: number
  search: string
  setPage: (page: number) => void
  setSearch: (search: string) => void
  reset: () => void
}

const initialState = {
  page: 1,
  search: '',
}

export const useArtWallStore = create<ArtWallState>()(
  devtools(
    (set) => ({
      ...initialState,
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      reset: () => set(initialState),
    }),
    { name: 'art-wall-store' }
  )
)
