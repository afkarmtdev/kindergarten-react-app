import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  School,
  Images,
  LogOut,
  Moon,
  Sun,
  Globe,
  ChevronUp,
  Menu,
  X,
  Megaphone,
  Wallet,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

// Admin bear — blue tie + full white shirt collar = school administrator
// viewBox 24×26: ears+head (0-18) | shirt+tie (18-26)
export function AdminBearIcon({ size = 34 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 26"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      shapeRendering="crispEdges"
    >
      {/* ── Ears ── (flush with head edges for tighter spread) */}
      <rect x="2" y="0" width="4" height="5" fill="#4A2A0E" />
      <rect x="18" y="0" width="4" height="5" fill="#4A2A0E" />
      <rect x="3" y="0" width="2" height="3" fill="#FFB3C6" />
      <rect x="19" y="0" width="2" height="3" fill="#FFB3C6" />

      {/* ── Head ── */}
      <rect x="2" y="3" width="20" height="15" fill="#7B5230" />

      {/* ── Muzzle ── */}
      <rect x="5" y="8" width="14" height="8" fill="#C8956B" />

      {/* ── Eyes ── */}
      <rect x="5" y="8" width="3" height="3" fill="#1A1A1A" />
      <rect x="16" y="8" width="3" height="3" fill="#1A1A1A" />

      {/* ── Nose ── */}
      <rect x="9" y="12" width="6" height="2" fill="#1A1A1A" />

      {/* ── Cheeks ── */}
      <rect x="5" y="14" width="3" height="2" fill="#FFB3C6" opacity="0.7" />
      <rect x="16" y="14" width="3" height="2" fill="#FFB3C6" opacity="0.7" />

      {/* ── Fuller white shirt collar (full width base) ── */}
      <rect x="0" y="18" width="24" height="8" fill="white" />

      {/* ── BLAZER START — delete this block to revert to shirt-only ── */}
      {/* Left jacket panel */}
      <rect x="0" y="18" width="8" height="8" fill="#1E2B4A" />
      {/* Right jacket panel */}
      <rect x="16" y="18" width="8" height="8" fill="#1E2B4A" />
      {/* Left lapel — white fold stepping toward tie */}
      <rect x="5" y="18" width="3" height="1" fill="white" />
      <rect x="6" y="19" width="2" height="1" fill="white" />
      <rect x="7" y="20" width="1" height="1" fill="white" />
      {/* Right lapel — mirrored */}
      <rect x="16" y="18" width="3" height="1" fill="white" />
      <rect x="16" y="19" width="2" height="1" fill="white" />
      <rect x="16" y="20" width="1" height="1" fill="white" />
      {/* ── BLAZER END ── */}

      {/* ── Blue tie ── */}
      {/* Knot */}
      <rect x="9" y="18" width="6" height="3" fill="#4D96FF" />
      {/* Body */}
      <rect x="10" y="21" width="4" height="4" fill="#4D96FF" />
      {/* Point */}
      <rect x="11" y="25" width="2" height="1" fill="#4D96FF" />
      {/* Classic diagonal stripes (upper-right → lower-left) */}
      <rect x="14" y="18" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="13" y="19" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="12" y="20" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="11" y="21" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="13" y="21" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="12" y="22" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="11" y="23" width="1" height="1" fill="white" opacity="0.4" />
      <rect x="10" y="24" width="1" height="1" fill="white" opacity="0.4" />
    </svg>
  )
}
import { useSettingsStore } from '@/store/settingsStore'
import { useT } from '@/hooks/useT'
import { APP_VERSION, APP_NAME } from '@/lib/version'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const { darkMode, toggleDark, lang, setLang } = useSettingsStore()
  const t = useT()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/admin/students', icon: Users, label: t('students') },
    { to: '/admin/attendance', icon: CalendarCheck, label: t('attendance') },
    { to: '/admin/classes', icon: School, label: t('classes') },
    { to: '/admin/gallery', icon: Images, label: t('gallery') },
    { to: '/admin/announcements', icon: Megaphone, label: t('announcements') },
    { to: '/admin/fees', icon: Wallet, label: t('fees') },
    { to: '/admin/settings', icon: Settings, label: t('settingsPage') },
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-kinder-orange text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-gray-800 hover:text-kinder-orange dark:hover:text-kinder-orange'
    }`

  const SidebarInner = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-kinder-orange rounded-2xl flex items-center justify-center">
            <AdminBearIcon size={34} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{APP_NAME}</h1>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('adminPortal')}</p>
              <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={navLinkClass} onClick={onNavClick}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-100 dark:border-gray-800">
        {/* Settings panel */}
        {settingsOpen && (
          <div className="px-4 pt-4 pb-3 space-y-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
              {t('settings')}
            </p>

            {/* Dark mode toggle */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                {darkMode ? <Moon size={15} /> : <Sun size={15} />}
                {t('darkMode')}
              </div>
              <button
                onClick={toggleDark}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                  darkMode ? 'bg-kinder-orange' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Language toggle */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                <Globe size={15} />
                {t('language')}
              </div>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-bold">
                <button
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 transition-colors ${
                    lang === 'en'
                      ? 'bg-kinder-orange text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('ms')}
                  className={`px-2.5 py-1 transition-colors border-l border-gray-200 dark:border-gray-700 ${
                    lang === 'ms'
                      ? 'bg-kinder-orange text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  BM
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User bar */}
        <div className="p-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-kinder-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('administrator')}</p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                className={`p-1.5 rounded-lg transition-colors ${
                  settingsOpen
                    ? 'bg-kinder-orange/10 text-kinder-orange'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
                title={t('settings')}
              >
                <ChevronUp
                  size={14}
                  className={`transition-transform duration-200 ${settingsOpen ? '' : 'rotate-180'}`}
                />
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                title={t('logout')}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-display transition-colors duration-200">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col shadow-sm transition-colors duration-200">
        <SidebarInner />
      </aside>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          {/* Drawer panel */}
          <aside className="absolute inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 flex flex-col shadow-xl transition-colors duration-200">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarInner onNavClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Right side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex lg:hidden items-center gap-3 px-4 h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm flex-shrink-0 transition-colors duration-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-kinder-orange rounded-xl flex items-center justify-center">
              <AdminBearIcon size={22} />
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{APP_NAME}</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
