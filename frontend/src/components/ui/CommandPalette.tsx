import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  Search,
  LayoutDashboard,
  Users,
  CalendarCheck,
  School,
  Images,
  Megaphone,
  Quote,
  Wallet,
  Inbox,
  Settings,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { studentsApi, classesApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import type { Student, ClassRoom } from '@/types'

interface PaletteItem {
  id: string
  label: string
  subtitle?: string
  icon: React.ElementType
  to: string
  section: 'pages' | 'students' | 'classes'
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const t = useT()

  const debouncedQuery = useDebounce(query.trim(), 200)

  // Static page items
  const pageItems: PaletteItem[] = useMemo(
    () => [
      {
        id: 'p-dashboard',
        label: t('dashboard'),
        icon: LayoutDashboard,
        to: '/admin/dashboard',
        section: 'pages' as const,
      },
      {
        id: 'p-students',
        label: t('students'),
        icon: Users,
        to: '/admin/students',
        section: 'pages' as const,
      },
      {
        id: 'p-attendance',
        label: t('attendance'),
        icon: CalendarCheck,
        to: '/admin/attendance',
        section: 'pages' as const,
      },
      {
        id: 'p-classes',
        label: t('classes'),
        icon: School,
        to: '/admin/classes',
        section: 'pages' as const,
      },
      {
        id: 'p-gallery',
        label: t('gallery'),
        icon: Images,
        to: '/admin/gallery',
        section: 'pages' as const,
      },
      {
        id: 'p-announcements',
        label: t('announcements'),
        icon: Megaphone,
        to: '/admin/announcements',
        section: 'pages' as const,
      },
      {
        id: 'p-testimonials',
        label: t('testimonials'),
        icon: Quote,
        to: '/admin/testimonials',
        section: 'pages' as const,
      },
      {
        id: 'p-fees',
        label: t('fees'),
        icon: Wallet,
        to: '/admin/fees',
        section: 'pages' as const,
      },
      {
        id: 'p-inquiries',
        label: t('inquiries'),
        icon: Inbox,
        to: '/admin/inquiries',
        section: 'pages' as const,
      },
      {
        id: 'p-settings',
        label: t('settingsPage'),
        icon: Settings,
        to: '/admin/settings',
        section: 'pages' as const,
      },
    ],
    [t]
  )

  // Search students
  const { data: studentsData } = useQuery({
    queryKey: ['command-palette-students', debouncedQuery],
    queryFn: () => studentsApi.getAll({ search: debouncedQuery, page: 1, limit: 5 }),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 30_000,
  })

  // Search classes
  const { data: classesData } = useQuery({
    queryKey: ['command-palette-classes', debouncedQuery],
    queryFn: () => classesApi.getAll({ search: debouncedQuery, page: 1, limit: 5 }),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 30_000,
  })

  const allItems = useMemo(() => {
    const filtered = query
      ? pageItems.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
      : pageItems

    const students: PaletteItem[] = (studentsData?.data ?? []).map((s: Student) => ({
      id: `s-${s.id}`,
      label: s.full_name,
      subtitle: s.class_name ?? undefined,
      icon: Users,
      to: `/admin/students/${s.id}`,
      section: 'students' as const,
    }))

    const classes: PaletteItem[] = (classesData?.data ?? []).map((c: ClassRoom) => ({
      id: `c-${c.id}`,
      label: c.name,
      subtitle: c.teacher_name,
      icon: School,
      to: `/admin/classes`,
      section: 'classes' as const,
    }))

    return [...filtered, ...students, ...classes]
  }, [query, pageItems, studentsData, classesData])

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0)
  }, [allItems.length])

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('[data-active="true"]')
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      onClose()
      navigate(item.to)
    },
    [navigate, onClose]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % allItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + allItems.length) % allItems.length)
      } else if (e.key === 'Enter' && allItems[activeIndex]) {
        e.preventDefault()
        handleSelect(allItems[activeIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [allItems, activeIndex, handleSelect, onClose]
  )

  if (!open) return null

  const sectionDefs = [
    { key: 'pages', label: t('pages') },
    { key: 'students', label: t('students') },
    { key: 'classes', label: t('classes') },
  ]
  const sections = sectionDefs
    .map((s) => ({ ...s, items: allItems.filter((item) => item.section === s.key) }))
    .filter((s) => s.items.length > 0)

  let runningIndex = 0

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-800">
          <Search size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('searchPlaceholder')}
            className="w-full py-3.5 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              {t('noResultsFound')}
            </p>
          ) : (
            sections.map((section) => {
              const sectionEl = (
                <div key={section.key}>
                  <p className="px-4 pt-2 pb-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {section.label}
                  </p>
                  {section.items.map((item) => {
                    const itemIndex = runningIndex++
                    const isActive = itemIndex === activeIndex
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        data-active={isActive}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isActive
                            ? 'bg-kinder-orange/10 text-kinder-orange'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{item.label}</span>
                        {item.subtitle && (
                          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 truncate">
                            {item.subtitle}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
              return sectionEl
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-bold">
              &uarr;
            </kbd>
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-bold">
              &darr;
            </kbd>
            {t('navigate')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-bold">
              &crarr;
            </kbd>
            {t('select')}
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
