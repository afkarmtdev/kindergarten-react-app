import { useState, useEffect } from 'react'
import { useT } from '@/hooks/useT'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'

interface MobileCTABarProps {
  /** The school has a registration QR up: lead with Register Now, keep the tour beside it. */
  showRegister?: boolean
}

export function MobileCTABar({ showRegister = false }: MobileCTABarProps) {
  const t = useT()
  const { email: schoolEmail } = useSchoolInfo({ public: true })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const primary = showRegister
    ? { href: '#register', label: t('registerNow') }
    : { href: '#contact', label: t('bookTour') }
  const secondary = showRegister
    ? { href: '#contact', label: t('bookTour') }
    : { href: schoolEmail ? `mailto:${schoolEmail}` : '#contact', label: t('scheduleVisit') }

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 px-4 py-3 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex gap-3 max-w-lg mx-auto">
        <a
          href={primary.href}
          className="flex-1 bg-kinder-orange text-white text-center py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          {primary.label}
        </a>
        <a
          href={secondary.href}
          className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-center py-2.5 rounded-xl font-bold text-sm hover:border-kinder-orange hover:text-kinder-orange transition-colors"
        >
          {secondary.label}
        </a>
      </div>
    </div>
  )
}
