import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

function renderContent(key: string) {
  if (key === 'school-info') return <SchoolInfoSection />
  if (key === 'receipt') return <DocumentNumberingSection documentType="receipt" />
  if (key === 'theme') return <AppearanceSection />
  return null
}

export function SettingsPage() {
  usePageTitle('Settings')
  const t = useT()
  const [activeKey, setActiveKey] = useState<string>('school-info')
  const [mobileSection, setMobileSection] = useState<string | null>(null)

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8">
        {t('settingsPage')}
      </h1>

      {/* Mobile: drill-down hub */}
      <div className="lg:hidden">
        {mobileSection === null ? (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            {NAV_SECTIONS.map((section, sectionIdx) => (
              <div
                key={section.labelKey}
                className={sectionIdx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}
              >
                <div className="px-4 pt-3 pb-2 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {t(section.labelKey)}
                  </p>
                </div>
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMobileSection(item.key)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-t border-gray-100 dark:border-gray-800"
                  >
                    {t(item.labelKey)}
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setMobileSection(null)}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-kinder-orange dark:hover:text-kinder-orange transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('settingsPage')}
            </button>
            {renderContent(mobileSection)}
          </div>
        )}
      </div>

      {/* Desktop: sidebar + panel */}
      <div className="hidden lg:flex gap-6">
        <nav className="w-52 flex-shrink-0">
          <div className="flex flex-col gap-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.labelKey}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-1">
                  {t(section.labelKey)}
                </p>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveKey(item.key)}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
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

        <div className="flex-1 min-w-0">{renderContent(activeKey)}</div>
      </div>
    </div>
  )
}
