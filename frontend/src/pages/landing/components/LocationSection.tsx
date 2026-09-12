import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { formatOperatingHours } from '@/lib/formatOperatingHours'
import { Wave } from './Wave'

export function LocationSection() {
  const t = useT()
  const { address, phone, email, operatingHours } = useSchoolInfo({
    public: true,
  })
  const { ref, isVisible } = useFadeIn()

  const hasContent = address || phone || email || operatingHours
  if (!hasContent) return null

  return (
    <section
      id="location"
      className="relative overflow-hidden bg-wash-sky pt-20 transition-colors duration-200"
    >
      <div
        ref={ref}
        className={`relative max-w-7xl mx-auto px-4 sm:px-6 ${isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        <div className="text-center mb-12">
          <h2 className="font-fun text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('locationTitle')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">
            {t('locationSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden p-6 sm:p-8">
            <h3 className="font-fun font-bold text-gray-900 dark:text-white text-lg mb-4">
              {t('footerContactUs')}
            </h3>
            <div className="space-y-3">
              {address && (
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors group"
                >
                  <MapPin size={16} className="text-ink-sky mt-1 flex-shrink-0" />
                  <span className="text-sm leading-relaxed underline decoration-gray-300 dark:decoration-gray-700 group-hover:decoration-current">
                    {address}
                  </span>
                </a>
              )}
              {phone && (
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <Phone size={16} className="text-ink-sky flex-shrink-0" />
                  <a
                    href={`tel:${phone}`}
                    className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {phone}
                  </a>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <Mail size={16} className="text-ink-sky flex-shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {operatingHours && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden p-6 sm:p-8">
              <h3 className="font-fun font-bold text-gray-900 dark:text-white text-lg mb-4">
                {t('footerHours')}
              </h3>
              <div className="space-y-2">
                {formatOperatingHours(operatingHours).map(({ label, time, isClosed }) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-ink-sky flex-shrink-0" />
                    <span
                      className={
                        isClosed
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }
                    >
                      <span className="font-semibold text-gray-900 dark:text-white w-20 inline-block">
                        {label}
                      </span>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16">
        <Wave variant="scallop" fillClassName="fill-gray-900 dark:fill-gray-950" />
      </div>
    </section>
  )
}
