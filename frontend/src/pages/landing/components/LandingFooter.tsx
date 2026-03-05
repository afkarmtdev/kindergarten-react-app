import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { BearLogo } from '@/components/landing/bear/BaseBearMascot'
import { SecretArcade } from '@/components/landing/SecretArcade'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useT } from '@/hooks/useT'
import { formatOperatingHours } from '@/lib/formatOperatingHours'

export function LandingFooter() {
  const t = useT()
  const { schoolName, address, phone, email, operatingHours, facebookUrl, instagramUrl } =
    useSchoolInfo({ public: true })
  const hasContact = address || phone || email
  const hasSocial = facebookUrl || instagramUrl

  return (
    <footer className="bg-gray-900 py-10 text-center font-display">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Logo + Name */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <BearLogo size={32} />
          <span className="font-extrabold text-white text-lg">{schoolName}</span>
        </div>

        {/* Contact + Hours grid */}
        {(hasContact || operatingHours) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8 text-left max-w-2xl mx-auto">
            {hasContact && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  {t('footerContactUs')}
                </h4>
                <div className="space-y-2">
                  {address && (
                    <div className="flex items-start gap-2 text-gray-400 text-sm">
                      <MapPin size={13} className="mt-0.5 flex-shrink-0 text-kinder-orange" />
                      <span>{address}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Phone size={13} className="flex-shrink-0 text-kinder-orange" />
                      <a href={`tel:${phone}`} className="hover:text-white transition-colors">
                        {phone}
                      </a>
                    </div>
                  )}
                  {email && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Mail size={13} className="flex-shrink-0 text-kinder-orange" />
                      <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                        {email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            {operatingHours && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  {t('footerHours')}
                </h4>
                <div className="space-y-1.5">
                  {formatOperatingHours(operatingHours).map(({ label, time, isClosed }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <Clock size={13} className="flex-shrink-0 text-kinder-orange" />
                      <span className={isClosed ? 'text-gray-600' : 'text-gray-400'}>
                        <span className="font-medium text-gray-300 w-16 inline-block">{label}</span>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social links */}
        {hasSocial && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {t('footerFollowUs')}
            </span>
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Copyright */}
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} {schoolName}. {t('footerTagline')}
        </p>
        <SecretArcade />
      </div>
    </footer>
  )
}
