import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { StickerBear } from '@/components/ui/StickerBear'
import { SecretArcade } from '@/components/landing/SecretArcade'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useT } from '@/hooks/useT'
import { formatOperatingHours } from '@/lib/formatOperatingHours'
import { VENDOR } from '@/lib/version'
import { StarField } from './StarField'

export function LandingFooter() {
  const t = useT()
  const { schoolName, address, phone, email, operatingHours, facebookUrl, instagramUrl, logoUrl } =
    useSchoolInfo({ public: true })
  const hasContact = address || phone || email

  // Vendor credit: mark + name. Blooms on hover via .group on the parent line.
  const vendorCredit = (
    <>
      <img
        src={VENDOR.mark}
        alt=""
        width={20}
        height={19}
        loading="lazy"
        decoding="async"
        className="vendor-mark h-[18px] w-auto"
      />
      <span className="font-semibold">{VENDOR.name}</span>
    </>
  )
  const hasSocial = facebookUrl || instagramUrl

  return (
    <footer className="relative overflow-hidden bg-gray-900 dark:bg-gray-950 py-12 sm:py-16 pb-32 sm:pb-16 lg:pb-16 font-display">
      <StarField className="" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Column 1 — Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 flex-shrink-0"
                />
              ) : (
                <StickerBear size={32} />
              )}
              <span className="font-fun font-bold text-white text-lg">{schoolName}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{t('heroSubtitle')}</p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {t('footerQuickLinks')}
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '#about', label: t('about') },
                { href: '#programs', label: t('ourPrograms') },
                { href: '#notices', label: t('noticesTitle') },
                { href: '#gallery', label: t('galleryTitle') },
                { href: '#contact', label: t('contact') },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-300 text-sm hover:text-kinder-yellow transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/portal/login"
                  className="text-gray-300 text-sm hover:text-kinder-yellow transition-colors"
                >
                  {t('portalLogin')}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 — Contact */}
          {hasContact && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                {t('footerContactUs')}
              </h4>
              <div className="space-y-2.5">
                {address && (
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-gray-300 text-sm hover:text-kinder-yellow transition-colors"
                  >
                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-kinder-orange" />
                    <span>{address}</span>
                  </a>
                )}
                {phone && (
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Phone size={14} className="flex-shrink-0 text-kinder-orange" />
                    <a href={`tel:${phone}`} className="hover:text-kinder-yellow transition-colors">
                      {phone}
                    </a>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Mail size={14} className="flex-shrink-0 text-kinder-orange" />
                    <a
                      href={`mailto:${email}`}
                      className="hover:text-kinder-yellow transition-colors"
                    >
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
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  {t('footerHours')}
                </h4>
                <div className="space-y-1.5">
                  {formatOperatingHours(operatingHours).map(({ label, time, isClosed }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <Clock size={12} className="flex-shrink-0 text-kinder-orange" />
                      <span className={isClosed ? 'text-gray-500' : 'text-gray-300'}>
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
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  {t('footerFollowUs')}
                </h4>
                <div className="flex items-center gap-2">
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 hover:text-kinder-yellow transition-all"
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
                      className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 hover:text-kinder-yellow transition-all"
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
          <div className="flex flex-col items-center sm:items-start gap-1">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {schoolName}. {t('footerTagline')}
            </p>
            <p className="group flex items-center gap-1.5 text-gray-500 text-xs">
              <span>Powered by</span>
              {VENDOR.url ? (
                <a
                  href={VENDOR.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
                >
                  {vendorCredit}
                </a>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-300">{vendorCredit}</span>
              )}
            </p>
          </div>
          <SecretArcade />
        </div>
      </div>
    </footer>
  )
}
