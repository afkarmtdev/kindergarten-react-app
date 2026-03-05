import { MessageCircle } from 'lucide-react'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useT } from '@/hooks/useT'

export function WhatsAppButton() {
  const { whatsappNumber } = useSchoolInfo({ public: true })
  const t = useT()

  if (!whatsappNumber) return null

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      title={t('whatsAppChat')}
      className="fixed bottom-4 left-4 sm:bottom-8 sm:left-8 z-50 group"
    >
      <div className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
        <MessageCircle size={26} strokeWidth={2} />
      </div>
      <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
        {t('whatsAppChat')}
      </span>
    </a>
  )
}
