import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type Lang = 'en' | 'ms'

interface SettingsState {
  darkMode: boolean
  lang: Lang
  toggleDark: () => void
  setLang: (lang: Lang) => void
}

function applyDark(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#1f2937' : '#FF6B35')
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        darkMode: false,
        lang: 'en',

        toggleDark: () => {
          const next = !get().darkMode
          applyDark(next)
          set({ darkMode: next })
        },

        setLang: (lang) => set({ lang }),
      }),
      {
        name: 'kinder-settings',
        // After hydration from localStorage, re-apply dark class
        onRehydrateStorage: () => (state) => {
          if (state?.darkMode) applyDark(true)
        },
      }
    ),
    { name: 'settings-store' }
  )
)
