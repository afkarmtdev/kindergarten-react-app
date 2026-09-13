import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, LogOut, Sun, Moon, Settings, WifiOff, ChevronDown } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { useT } from '../../hooks/useT'
import { useSettingsStore } from '../../store/settingsStore'
import { APP_NAME, APP_VERSION } from '../../lib/version'
import { PortalBearCub } from '../../components/portal/PortalBearCub'
import { StarField } from '../landing/components/StarField'
import { PortalFloatingIcons } from '../../components/portal/PortalFloatingIcons'
import { ChildSwitcherSheet } from '../../components/portal/ChildSwitcherSheet'

// ── Temporary toggle for comparing child-switcher UX ──
// 'header' = Option 1 (tap header name), 'pill' = Option 4 (floating pill)
const SWITCHER_MODE: 'header' | 'pill' = 'header'

function ChildAvatar({ photoUrl, name }: { photoUrl?: string | null; name?: string }) {
  const initial = name?.charAt(0).toUpperCase() ?? '?'
  return (
    <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-kinder-orange to-kinder-pink shrink-0">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name ?? ''}
          className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-kinder-orange font-bold text-sm">
          {initial}
        </div>
      )}
    </div>
  )
}

export default function PortalLayout() {
  const { children: childrenList, selectedChild, selectChild, logout } = useParentAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()
  const isHome = location.pathname === '/portal'
  const { darkMode, toggleDark, lang, setLang } = useSettingsStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [sheetOpen, setSheetOpen] = useState(false)
  const hasMultipleChildren = childrenList.length > 1

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

  const firstName = selectedChild?.full_name?.split(' ')[0]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col relative overflow-hidden">
      {/* Decorative overlays */}
      <StarField variant="a" className="hidden dark:block" />
      <PortalFloatingIcons />
      {isOffline && (
        <div className="bg-gray-700 text-white text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          You're offline — showing cached data
        </div>
      )}

      {/* Top bar — frosted glass */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-800/60 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => navigate('/portal')}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-kinder-orange hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Child avatar + name — tappable when multiple children */}
          {SWITCHER_MODE === 'header' && hasMultipleChildren ? (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-3 hover:opacity-80 active:scale-[0.98] transition-all"
            >
              <ChildAvatar photoUrl={selectedChild?.photo_url} name={selectedChild?.full_name} />
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">
                    {selectedChild?.full_name}
                  </p>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedChild?.class_name}
                </p>
              </div>
            </button>
          ) : (
            <>
              <ChildAvatar photoUrl={selectedChild?.photo_url} name={selectedChild?.full_name} />
              <div>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">
                  {selectedChild?.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedChild?.class_name}
                </p>
              </div>
            </>
          )}
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

      {/* Page content */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Option 4: Floating pill at bottom — only when pill mode + 2+ children */}
      {SWITCHER_MODE === 'pill' && hasMultipleChildren && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-full pl-1.5 pr-4 py-1.5 hover:shadow-xl active:scale-[0.97] transition-all"
          >
            <ChildAvatar photoUrl={selectedChild?.photo_url} name={selectedChild?.full_name} />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{firstName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      )}

      {/* Shared bottom sheet for both modes */}
      <ChildSwitcherSheet
        show={sheetOpen}
        children={childrenList}
        selectedChildId={selectedChild?.id}
        onSelect={selectChild}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
