import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Home,
  CalendarDays,
  Wallet,
  Megaphone,
  ClipboardList,
  BookOpen,
  LogOut,
} from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { useT } from '../../hooks/useT'
import { APP_NAME } from '../../lib/version'

const navItems = [
  { to: '/portal', icon: Home, labelKey: 'dashboard' as const, end: true },
  { to: '/portal/attendance', icon: CalendarDays, labelKey: 'attendance' as const, end: false },
  { to: '/portal/fees', icon: Wallet, labelKey: 'fees' as const, end: false },
  { to: '/portal/announcements', icon: Megaphone, labelKey: 'announcements' as const, end: false },
  {
    to: '/portal/daily-reports',
    icon: ClipboardList,
    labelKey: 'dailyReports' as const,
    end: false,
  },
  { to: '/portal/portfolio', icon: BookOpen, labelKey: 'portfolio' as const, end: false },
]

export default function PortalLayout() {
  const { student, logout } = useParentAuth()
  const navigate = useNavigate()
  const t = useT()

  async function handleLogout() {
    await logout()
    navigate('/portal/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {student?.photo_url ? (
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="w-9 h-9 rounded-full object-cover border-2 border-kinder-orange"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-kinder-orange flex items-center justify-center text-white font-bold text-sm">
              {student?.full_name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {student?.full_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{student?.class_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
            {APP_NAME}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">{t('portalLogout')}</span>
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex z-20">
        {navItems.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-kinder-orange'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
