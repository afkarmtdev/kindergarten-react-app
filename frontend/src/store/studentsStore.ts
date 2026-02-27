import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface StudentsState {
  page: number
  search: string
  classFilter: string
  genderFilter: string
  isModalOpen: boolean
  editingId: string | null
  // Actions
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setClassFilter: (v: string) => void
  setGenderFilter: (v: string) => void
  openModal: (id?: string) => void
  closeModal: () => void
  reset: () => void
}

const initialState = {
  page: 1,
  search: '',
  classFilter: '',
  genderFilter: '',
  isModalOpen: false,
  editingId: null,
}

export const useStudentsStore = create<StudentsState>()(
  devtools(
    (set) => ({
      ...initialState,
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      setClassFilter: (classFilter) => set({ classFilter, page: 1 }),
      setGenderFilter: (genderFilter) => set({ genderFilter, page: 1 }),
      openModal: (id) => set({ isModalOpen: true, editingId: id ?? null }),
      closeModal: () => set({ isModalOpen: false, editingId: null }),
      reset: () => set(initialState),
    }),
    { name: 'students-store' }
  )
)
