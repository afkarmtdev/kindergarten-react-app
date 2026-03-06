import { Link, useLocation } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { AdminBearIcon } from '@/components/admin/AdminBearIcon'

export function NotFoundPage() {
  usePageTitle('Page Not Found')
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="text-center max-w-md">
        {/* Bear with question marks */}
        <div className="relative inline-block mb-6">
          <div className="animate-bounce" style={{ animationDuration: '2s' }}>
            <AdminBearIcon size={80} eyeState="half" />
          </div>
          <span
            className="absolute -top-2 -right-4 text-2xl font-extrabold text-kinder-orange"
            style={{ animation: 'notfound-float 2s ease-in-out infinite' }}
          >
            ?
          </span>
          <span
            className="absolute -top-4 -left-3 text-lg font-extrabold text-kinder-purple"
            style={{ animation: 'notfound-float 2s ease-in-out infinite 0.5s' }}
          >
            ?
          </span>
          <span
            className="absolute top-0 right-[-28px] text-sm font-extrabold text-kinder-blue"
            style={{ animation: 'notfound-float 2s ease-in-out infinite 1s' }}
          >
            ?
          </span>
        </div>

        <h1 className="text-6xl font-extrabold text-gray-200 dark:text-gray-800 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          This page wandered off during recess
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Looks like this page decided to play hide and seek. Let&apos;s get you back somewhere
          safe.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={isAdmin ? '/admin' : '/'}
            className="inline-flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <Home size={16} />
            {isAdmin ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes notfound-float {
                0%, 100% { transform: translateY(0); opacity: 1; }
                50% { transform: translateY(-8px); opacity: 0.6; }
              }
            `,
          }}
        />
      </div>
    </div>
  )
}
