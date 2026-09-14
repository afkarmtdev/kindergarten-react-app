/**
 * Application version — bump this when shipping a new release.
 * Must be kept in sync with frontend/public/version.json manually.
 * Displayed on the login page and in the admin sidebar so admins
 * always know which build they are running.
 */
export const APP_VERSION = '1.14.2-alpha1'

/**
 * Brand name — single source of truth.
 * Change this once to rebrand the entire application.
 */
export const APP_NAME = 'KinderCare'

/**
 * Vendor credit shown in the landing footer ("Powered by").
 * `url` is optional; when null the credit renders as plain text.
 */
export const VENDOR = {
  name: 'Bunga Raya Code Sdn Bhd',
  url: null as string | null,
  mark: '/images/brc-mark.png',
}
