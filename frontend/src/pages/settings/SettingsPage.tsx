import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/translations'
import { SchoolInfoSection } from './components/SchoolInfoSection'
import { DocumentNumberingSection } from './components/DocumentNumberingSection'
import { AppearanceSection } from './components/AppearanceSection'

type NavSection = {
  labelKey: TranslationKey
  items: { key: string; labelKey: TranslationKey }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: 'settingsSchoolInfo',
    items: [{ key: 'school-info', labelKey: 'settingsNavSchoolInfo' }],
  },
  {
    labelKey: 'settingsDocumentNumbering',
    items: [{ key: 'receipt', labelKey: 'settingsNavReceipt' }],
  },
  {
    labelKey: 'settingsAppearance',
    items: [{ key: 'theme', labelKey: 'settingsNavTheme' }],
  },
]

export function SettingsPage() {
  usePageTitle('Settings')
  const t = useT()
  const [activeKey, setActiveKey] = useState<string>('school-info')

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8">
        {t('settingsPage')}
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mini-nav */}
        <nav className="lg:w-52 flex-shrink-0">
          <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
            {NAV_SECTIONS.map((section) => (
              <div key={section.labelKey} className="flex-shrink-0 lg:flex-shrink">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-1 whitespace-nowrap">
                  {t(section.labelKey)}
                </p>
                <div className="flex lg:flex-col gap-1">
                  {section.items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveKey(item.key)}
                      className={`flex-shrink-0 text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                        activeKey === item.key
                          ? 'bg-kinder-orange text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-kinder-orange'
                      }`}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {activeKey === 'school-info' && <SchoolInfoSection />}
          {activeKey === 'receipt' && <DocumentNumberingSection documentType="receipt" />}
          {activeKey === 'theme' && <AppearanceSection />}
        </div>
      </div>
    </div>
  )
}
