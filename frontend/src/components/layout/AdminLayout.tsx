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
  Quote,
  Inbox,
  Search,
  Palette,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { AdminBearLogo } from '@/components/admin/AdminBearLogo'
import { AdminBearIcon } from '@/components/admin/AdminBearIcon'
import { useSettingsStore } from '@/store/settingsStore'
import { useT } from '@/hooks/useT'
import { APP_VERSION, APP_NAME } from '@/lib/version'
import { useVersionCheck } from '@/hooks/useVersionCheck'
import { UpdateBanner } from '@/components/ui/UpdateBanner'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const { darkMode, toggleDark, lang, setLang } = useSettingsStore()
  const t = useT()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { updateAvailable } = useVersionCheck()

  const closePalette = useCallback(() => setPaletteOpen(false), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/admin/students', icon: Users, label: t('students') },
    { to: '/admin/attendance', icon: CalendarCheck, label: t('attendance') },
    { to: '/admin/classes', icon: School, label: t('classes') },
    { to: '/admin/gallery', icon: Images, label: t('gallery') },
    { to: '/admin/art-wall', icon: Palette, label: t('artWall') },
    { to: '/admin/announcements', icon: Megaphone, label: t('announcements') },
    { to: '/admin/testimonials', icon: Quote, label: t('testimonials') },
    { to: '/admin/fees', icon: Wallet, label: t('fees') },
    { to: '/admin/inquiries', icon: Inbox, label: t('inquiries') },
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
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <AdminBearLogo />
          <div>
            <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{APP_NAME}</h1>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('adminPortal')}</p>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search shortcut */}
      <div className="px-4 pt-4 pb-1">
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <Search size={14} />
          <span className="flex-1 text-left text-xs">{t('searchPlaceholder')}</span>
          <kbd className="hidden lg:inline text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            Ctrl K
          </kbd>
        </button>
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
      <div className="border-t border-gray-200 dark:border-gray-800">
        {/* Settings panel */}
        {settingsOpen && (
          <div className="px-4 pt-4 pb-3 space-y-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
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
                className={`hidden lg:block p-1.5 rounded-lg transition-colors ${
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
      <UpdateBanner visible={updateAvailable} />
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col shadow-sm transition-colors duration-200">
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
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-9 h-9 bg-kinder-orange rounded-xl flex items-center justify-center">
              <AdminBearIcon size={22} />
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{APP_NAME}</span>
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  )
}
