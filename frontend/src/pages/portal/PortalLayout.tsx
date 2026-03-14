import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import {
  Home,
  CalendarDays,
  Wallet,
  Megaphone,
  ClipboardList,
  BookOpen,
  LogOut,
  Sun,
  Moon,
  Smartphone,
  Settings,
  WifiOff,
} from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { useT } from '../../hooks/useT'
import { useSettingsStore } from '../../store/settingsStore'
import { APP_NAME, APP_VERSION } from '../../lib/version'
import { PortalBearCub } from '../../components/portal/PortalBearFamily'
import { useVersionCheck } from '../../hooks/useVersionCheck'
import { UpdateBanner } from '../../components/ui/UpdateBanner'

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
  const { children: childrenList, selectedChild, selectChild, logout } = useParentAuth()
  const navigate = useNavigate()
  const t = useT()
  const { darkMode, toggleDark, lang, setLang } = useSettingsStore()
  const { updateAvailable } = useVersionCheck()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleLogout() {
    await logout()
    navigate('/portal/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <UpdateBanner visible={updateAvailable} />
      {isOffline && (
        <div className="bg-gray-700 text-white text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          You're offline — showing cached data
        </div>
      )}
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {selectedChild?.photo_url ? (
            <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-kinder-orange to-kinder-pink shrink-0">
              <img
                src={selectedChild.photo_url}
                alt={selectedChild.full_name}
                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-kinder-orange to-kinder-pink shrink-0">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-kinder-orange font-bold text-xs">
                {selectedChild?.full_name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {selectedChild?.full_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedChild?.class_name}</p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
              menuOpen
                ? 'bg-kinder-orange/10 text-kinder-orange'
                : 'text-gray-400 dark:text-gray-500 hover:text-kinder-orange hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 z-30">
              <button
                onClick={() => {
                  toggleDark()
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {t('darkMode')}
              </button>
              <button
                onClick={() => setLang(lang === 'en' ? 'ms' : 'en')}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span>{lang === 'en' ? 'Bahasa Melayu' : 'English'}</span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                  {lang === 'en' ? 'BM' : 'EN'}
                </span>
              </button>
              <button
                onClick={() => {
                  navigate('/portal/devices')
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                {t('myDevices')}
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
              <button
                onClick={() => {
                  handleLogout()
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('portalLogout')}
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
              <div className="flex items-center gap-1.5 px-4 py-2 text-[10px] text-gray-400 dark:text-gray-500">
                <PortalBearCub size={14} />
                <span>
                  {APP_NAME} v{APP_VERSION}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Child switcher — only shown when parent has 2+ children */}
      {childrenList.length > 1 && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 overflow-x-auto py-2 px-4">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold shrink-0">
              {t('switchChild')}:
            </span>
            {childrenList.map((child) => {
              const isSelected = selectedChild?.id === child.id
              const firstName = child.full_name.split(' ')[0]
              return (
                <button
                  key={child.id}
                  onClick={() => selectChild(child.id)}
                  className="shrink-0 flex flex-col items-center gap-1 transition-opacity hover:opacity-80 active:scale-95"
                >
                  {/* Avatar with selection ring */}
                  <div
                    className={`rounded-full p-[2px] transition-all ${
                      isSelected
                        ? 'bg-kinder-orange ring-2 ring-kinder-orange ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                        : 'bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600'
                    }`}
                  >
                    {child.photo_url ? (
                      <img
                        src={child.photo_url}
                        alt={firstName}
                        className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-gray-900"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 font-bold text-sm ${
                          isSelected
                            ? 'bg-orange-50 dark:bg-orange-900/30 text-kinder-orange'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {firstName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* First name + status badges */}
                  <span
                    className={`text-[11px] font-semibold leading-tight ${
                      isSelected ? 'text-kinder-orange' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {firstName}
                  </span>
                  {child.status === 'graduated' && (
                    <span className="text-[9px] text-purple-500 dark:text-purple-400 font-medium leading-none -mt-0.5">
                      Graduated
                    </span>
                  )}
                  {child.status === 'inactive' && (
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-none -mt-0.5">
                      Inactive
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] flex z-20 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] font-medium transition-all active:scale-95 ${
                isActive
                  ? 'text-kinder-orange bg-orange-50 dark:bg-orange-900/20 rounded-xl mx-0.5'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon style={{ width: 22, height: 22 }} className="shrink-0" />
                {isActive && <span className="w-1 h-1 rounded-full bg-kinder-orange shrink-0" />}
                <span className="truncate max-w-full">{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
