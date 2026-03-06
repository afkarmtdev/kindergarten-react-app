import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { formatOperatingHours } from '@/lib/formatOperatingHours'

export function LocationSection() {
  const t = useT()
  const { address, phone, email, operatingHours, googleMapsEmbedUrl } = useSchoolInfo({
    public: true,
  })
  const { ref, isVisible } = useFadeIn()

  const hasContent = address || phone || email || operatingHours || googleMapsEmbedUrl
  if (!hasContent) return null

  return (
    <section id="location" className="bg-gray-900 py-20">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-4 sm:px-6 ${isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t('locationTitle')}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">{t('locationSubtitle')}</p>
        </div>

        {googleMapsEmbedUrl && (
          <div className="mb-10 rounded-2xl overflow-hidden">
            <iframe
              src={googleMapsEmbedUrl}
              width="100%"
              height="400"
              style={{ border: 0 }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="School location map"
              className="w-full h-72 md:h-96"
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-white text-lg mb-4">{t('footerContactUs')}</h3>
            <div className="space-y-3">
              {address && (
                <div className="flex items-start gap-3 text-gray-300">
                  <MapPin size={16} className="text-kinder-orange mt-1 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{address}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Phone size={16} className="text-kinder-orange flex-shrink-0" />
                  <a href={`tel:${phone}`} className="text-sm hover:text-white transition-colors">
                    {phone}
                  </a>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail size={16} className="text-kinder-orange flex-shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {operatingHours && (
            <div>
              <h3 className="font-bold text-white text-lg mb-4">{t('footerHours')}</h3>
              <div className="space-y-2">
                {formatOperatingHours(operatingHours).map(({ label, time, isClosed }) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-kinder-orange flex-shrink-0" />
                    <span className={isClosed ? 'text-gray-600' : 'text-gray-300'}>
                      <span className="font-medium text-white w-20 inline-block">{label}</span>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
