import { useSettingsStore } from '@/store/settingsStore'
import { translations, TranslationKey } from '@/lib/translations'

/**
 * Returns a translation function bound to the current language.
 *
 * Usage:
 *   const t = useT()
 *   t('addStudent')               // "Add Student" | "Tambah Pelajar"
 *   t('ofStudents', { n: 30 })   // "of 30 students" | "daripada 30 pelajar"
 */
export function useT() {
  const lang = useSettingsStore((s) => s.lang)
  const map = translations[lang]

  return function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let str: string = map[key] as string
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }
}
