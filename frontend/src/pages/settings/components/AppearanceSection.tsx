import { Moon, Sun, Globe } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useSettingsStore } from '@/store/settingsStore'

export function AppearanceSection() {
  const t = useT()
  const { darkMode, toggleDark, lang, setLang } = useSettingsStore()

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-1">
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
          {t('settingsNavTheme')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t('settingsAppearanceDesc')}
        </p>
      </div>

      {/* Dark mode row */}
      <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-gray-500 dark:text-gray-400">
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('darkMode')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('settingsDarkModeDesc')}
            </p>
          </div>
        </div>
        <button
          onClick={toggleDark}
          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
            darkMode ? 'bg-kinder-orange' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          aria-label="Toggle dark mode"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
              darkMode ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Language row */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-gray-500 dark:text-gray-400">
            <Globe size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('language')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('settingsLanguageDesc')}
            </p>
          </div>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-bold flex-shrink-0">
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 transition-colors ${
              lang === 'en'
                ? 'bg-kinder-orange text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang('ms')}
            className={`px-3 py-1.5 transition-colors border-l border-gray-200 dark:border-gray-700 ${
              lang === 'ms'
                ? 'bg-kinder-orange text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            BM
          </button>
        </div>
      </div>
    </div>
  )
}
