import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ClassesState {
  page: number
  search: string
  isModalOpen: boolean
  editingId: string | null
  setPage: (page: number) => void
  setSearch: (search: string) => void
  openModal: (id?: string) => void
  closeModal: () => void
  reset: () => void
}

const initialState = {
  page: 1,
  search: '',
  isModalOpen: false,
  editingId: null,
}

export const useClassesStore = create<ClassesState>()(
  devtools(
    (set) => ({
      ...initialState,
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      openModal: (id) => set({ isModalOpen: true, editingId: id ?? null }),
      closeModal: () => set({ isModalOpen: false, editingId: null }),
      reset: () => set(initialState),
    }),
    { name: 'classes-store' }
  )
)
