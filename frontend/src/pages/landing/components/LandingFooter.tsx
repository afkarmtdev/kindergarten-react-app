import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { BearLogo } from '@/components/landing/bear/BaseBearMascot'
import { SecretArcade } from '@/components/landing/SecretArcade'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useT } from '@/hooks/useT'
import { formatOperatingHours } from '@/lib/formatOperatingHours'
import { StarField } from './StarField'

export function LandingFooter() {
  const t = useT()
  const { schoolName, address, phone, email, operatingHours, facebookUrl, instagramUrl } =
    useSchoolInfo({ public: true })
  const hasContact = address || phone || email
  const hasSocial = facebookUrl || instagramUrl

  return (
    <footer className="relative overflow-hidden bg-gray-900 py-12 sm:py-16 pb-32 sm:pb-16 lg:pb-16 font-display">
      <StarField className="" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Column 1 — Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <BearLogo size={32} />
              <span className="font-extrabold text-white text-lg">{schoolName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{t('heroSubtitle')}</p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              {t('footerQuickLinks')}
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '#about', label: t('about') },
                { href: '#programs', label: t('ourPrograms') },
                { href: '#gallery', label: t('galleryTitle') },
                { href: '#notices', label: t('noticesTitle') },
                { href: '#contact', label: t('contact') },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/portal/login"
                  className="text-gray-400 text-sm hover:text-white transition-colors"
                >
                  {t('portalLogin')}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 — Contact */}
          {hasContact && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                {t('footerContactUs')}
              </h4>
              <div className="space-y-2.5">
                {address && (
                  <div className="flex items-start gap-2 text-gray-400 text-sm">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-kinder-orange" />
                    <span>{address}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Phone size={14} className="flex-shrink-0 text-kinder-orange" />
                    <a href={`tel:${phone}`} className="hover:text-white transition-colors">
                      {phone}
                    </a>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Mail size={14} className="flex-shrink-0 text-kinder-orange" />
                    <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                      {email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Column 4 — Hours + Social */}
          <div>
            {operatingHours && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                  {t('footerHours')}
                </h4>
                <div className="space-y-1.5">
                  {formatOperatingHours(operatingHours).map(({ label, time, isClosed }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <Clock size={12} className="flex-shrink-0 text-kinder-orange" />
                      <span className={isClosed ? 'text-gray-600' : 'text-gray-400'}>
                        <span className="font-medium text-gray-300 w-14 inline-block text-xs">
                          {label}
                        </span>
                        <span className="text-xs">{time}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasSocial && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  {t('footerFollowUs')}
                </h4>
                <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {schoolName}. {t('footerTagline')}
          </p>
          <SecretArcade />
        </div>
      </div>
    </footer>
  )
}
