import { useState, useEffect } from 'react'
import { useT } from '@/hooks/useT'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'

export function MobileCTABar() {
  const t = useT()
  const { email: schoolEmail } = useSchoolInfo({ public: true })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 px-4 py-3 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex gap-3 max-w-lg mx-auto">
        <a
          href="#contact"
          className="flex-1 bg-kinder-orange text-white text-center py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          {t('bookTour')}
        </a>
        <a
          href={schoolEmail ? `mailto:${schoolEmail}` : '#contact'}
          className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-center py-2.5 rounded-xl font-bold text-sm hover:border-kinder-orange hover:text-kinder-orange transition-colors"
        >
          {t('scheduleVisit')}
        </a>
      </div>
    </div>
  )
}
