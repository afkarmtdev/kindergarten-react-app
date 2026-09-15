import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, AlertCircle, ArrowLeft, Sun, Moon } from 'lucide-react'
import { AdminBearIcon } from '@/components/admin/AdminBearIcon'
import { useAuth } from '@/hooks/useAuth'
import { useSettingsStore } from '@/store/settingsStore'
import { APP_VERSION, APP_NAME } from '@/lib/version'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useLoginBear } from '@/hooks/useLoginBear'

export function LoginPage() {
  usePageTitle('Admin Login')
  const { login } = useAuth()
  const navigate = useNavigate()
  const { darkMode, toggleDark } = useSettingsStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const bear = useLoginBear({ typed: email, error })

  useEffect(() => {
    if (sessionStorage.getItem('auth_expired')) {
      sessionStorage.removeItem('auth_expired')
      setSessionExpired(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, rememberMe)
      navigate('/admin/dashboard')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-display flex items-center justify-center p-4 transition-colors duration-200 relative">
      <button
        onClick={toggleDark}
        aria-label="Toggle dark mode"
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-500 dark:text-gray-400 hover:text-kinder-orange dark:hover:text-kinder-orange border border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 sm:p-10 border-2 border-transparent dark:border-gray-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-kinder-orange rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
              <AdminBearIcon size={40} eyeState={bear.eyeState} gaze={bear.gaze} />
            </div>
            <h1 className="text-2xl font-fun font-bold text-gray-900 dark:text-gray-100">
              {APP_NAME} Admin
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to your portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {sessionExpired && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={16} className="shrink-0" />
                Your session has expired. Please sign in again.
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  {...bear.watchProps}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-kinder-orange focus:border-transparent transition-all text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="admin@kindercare.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  {...bear.hideProps}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-kinder-orange focus:border-transparent transition-all text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-kinder-orange text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/40 hover:-translate-y-0.5"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>

            <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${rememberMe ? 'bg-kinder-orange' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${rememberMe ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">Keep me signed in</span>
            </label>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          {APP_NAME} Management System · Secured by Supabase Auth
        </p>
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-1">v{APP_VERSION}</p>
        <div className="text-center mt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-kinder-orange dark:hover:text-kinder-orange transition-colors"
          >
            <ArrowLeft size={12} />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
