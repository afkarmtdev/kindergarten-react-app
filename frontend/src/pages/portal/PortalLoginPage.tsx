import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, Lock, Sun, Moon } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { useT } from '../../hooks/useT'
import { useSettingsStore } from '../../store/settingsStore'
import { APP_NAME } from '../../lib/version'
import { usePageTitle } from '../../hooks/usePageTitle'
import { PortalBearFamily, PortalBearCub } from '../../components/portal/PortalBearFamily'

export default function PortalLoginPage() {
  usePageTitle('Parent Portal')
  const { login } = useParentAuth()
  const navigate = useNavigate()
  const t = useT()
  const { darkMode, toggleDark } = useSettingsStore()

  const [accessCode, setAccessCode] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(accessCode.trim().toUpperCase(), pin)
      navigate('/portal', { replace: true })
    } catch {
      setError(t('portalInvalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 relative">
      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        aria-label="Toggle dark mode"
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-500 dark:text-gray-400 hover:text-kinder-orange dark:hover:text-kinder-orange border border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-sm">
        {/* Header with bear family */}
        <div
          className={`text-center mb-8 transition-all duration-500 ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        >
          <div className="flex justify-center mb-4">
            <PortalBearFamily size={100} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{APP_NAME}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('portalLogin')}</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-800 border-t-4 border-t-kinder-orange space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('accessCode')}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="KC-2024-1234"
                required
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kinder-orange transition-colors font-mono tracking-wider"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('portalPin')}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                required
                autoComplete="current-password"
                inputMode="numeric"
                maxLength={6}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kinder-orange transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || accessCode.length < 3 || pin.length !== 6}
            className="w-full bg-kinder-orange text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('portalLoginBtn')}
              </span>
            ) : (
              t('portalLoginBtn')
            )}
          </button>
        </form>

        {/* Help text */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-4 px-2">
          {t('portalContactSchool')}
        </p>
        <div className="text-center mt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-kinder-orange dark:hover:text-kinder-orange transition-colors"
          >
            <ArrowLeft size={12} />
            Back to home
          </Link>
        </div>

        {/* Powered by footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-gray-400 dark:text-gray-500">
          <PortalBearCub size={16} />
          <span>Powered by {APP_NAME}</span>
        </div>
      </div>
    </div>
  )
}
