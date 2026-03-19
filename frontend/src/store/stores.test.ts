import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { useStudentsStore } from './studentsStore'
import { useClassesStore } from './classesStore'
import { useGalleryStore } from './galleryStore'
import { useAnnouncementsStore } from './announcementsStore'
import { useFeesStore } from './feesStore'
import { useFeePlansStore } from './feePlansStore'
import { useTestimonialsStore } from './testimonialsStore'
import { useAttendanceStore } from './attendanceStore'
import { useInquiriesStore } from './inquiriesStore'
import { useIncidentsStore } from './incidentsStore'

// ═════════════════════════════════════════════════════════════════════════════
// studentsStore — page, search, 2 filters, modal
// ═════════════════════════════════════════════════════════════════════════════

describe('studentsStore', () => {
  beforeEach(() => useStudentsStore.getState().reset())

  test('defaults: page 1, empty search/filters, statusFilter active, modal closed', () => {
    const s = useStudentsStore.getState()
    expect(s.page).toBe(1)
    expect(s.search).toBe('')
    expect(s.classFilter).toBe('')
    expect(s.genderFilter).toBe('')
    expect(s.statusFilter).toBe('active')
    expect(s.isModalOpen).toBe(false)
    expect(s.editingId).toBeNull()
  })

  test('setSearch resets page to 1', () => {
    useStudentsStore.getState().setPage(5)
    useStudentsStore.getState().setSearch('Ali')
    const s = useStudentsStore.getState()
    expect(s.search).toBe('Ali')
    expect(s.page).toBe(1)
  })

  test('setClassFilter resets page to 1', () => {
    useStudentsStore.getState().setPage(3)
    useStudentsStore.getState().setClassFilter('Rose')
    const s = useStudentsStore.getState()
    expect(s.classFilter).toBe('Rose')
    expect(s.page).toBe(1)
  })

  test('setGenderFilter resets page to 1', () => {
    useStudentsStore.getState().setPage(3)
    useStudentsStore.getState().setGenderFilter('male')
    const s = useStudentsStore.getState()
    expect(s.genderFilter).toBe('male')
    expect(s.page).toBe(1)
  })

  test('setStatusFilter resets page to 1', () => {
    useStudentsStore.getState().setPage(3)
    useStudentsStore.getState().setStatusFilter('graduated')
    const s = useStudentsStore.getState()
    expect(s.statusFilter).toBe('graduated')
    expect(s.page).toBe(1)
  })

  test('statusFilter defaults to active', () => {
    useStudentsStore.getState().setStatusFilter('graduated')
    useStudentsStore.getState().reset()
    expect(useStudentsStore.getState().statusFilter).toBe('active')
  })

  test('setPage preserves search and filters', () => {
    useStudentsStore.getState().setSearch('test')
    useStudentsStore.getState().setClassFilter('Rose')
    useStudentsStore.getState().setPage(4)
    const s = useStudentsStore.getState()
    expect(s.page).toBe(4)
    expect(s.search).toBe('test')
    expect(s.classFilter).toBe('Rose')
  })

  test('openModal without id — add mode', () => {
    useStudentsStore.getState().openModal()
    const s = useStudentsStore.getState()
    expect(s.isModalOpen).toBe(true)
    expect(s.editingId).toBeNull()
  })

  test('openModal with id — edit mode', () => {
    useStudentsStore.getState().openModal('abc-123')
    const s = useStudentsStore.getState()
    expect(s.isModalOpen).toBe(true)
    expect(s.editingId).toBe('abc-123')
  })

  test('closeModal clears editingId', () => {
    useStudentsStore.getState().openModal('abc-123')
    useStudentsStore.getState().closeModal()
    const s = useStudentsStore.getState()
    expect(s.isModalOpen).toBe(false)
    expect(s.editingId).toBeNull()
  })

  test('reset returns to initial state', () => {
    useStudentsStore.getState().setPage(5)
    useStudentsStore.getState().setSearch('test')
    useStudentsStore.getState().setClassFilter('Rose')
    useStudentsStore.getState().openModal('xyz')
    useStudentsStore.getState().reset()
    const s = useStudentsStore.getState()
    expect(s.page).toBe(1)
    expect(s.search).toBe('')
    expect(s.classFilter).toBe('')
    expect(s.isModalOpen).toBe(false)
    expect(s.editingId).toBeNull()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// classesStore — page, search, modal
// ═════════════════════════════════════════════════════════════════════════════

describe('classesStore', () => {
  beforeEach(() => useClassesStore.getState().reset())

  test('defaults: page 1, empty search, statusFilter active, modal closed', () => {
    const s = useClassesStore.getState()
    expect(s.page).toBe(1)
    expect(s.search).toBe('')
    expect(s.statusFilter).toBe('active')
    expect(s.isModalOpen).toBe(false)
    expect(s.editingId).toBeNull()
  })

  test('setStatusFilter resets page to 1', () => {
    useClassesStore.getState().setPage(3)
    useClassesStore.getState().setStatusFilter('graduated')
    const s = useClassesStore.getState()
    expect(s.statusFilter).toBe('graduated')
    expect(s.page).toBe(1)
  })

  test('statusFilter defaults to active on reset', () => {
    useClassesStore.getState().setStatusFilter('graduated')
    useClassesStore.getState().reset()
    expect(useClassesStore.getState().statusFilter).toBe('active')
  })

  test('setSearch resets page to 1', () => {
    useClassesStore.getState().setPage(3)
    useClassesStore.getState().setSearch('Rose')
    expect(useClassesStore.getState().page).toBe(1)
  })

  test('openModal with id, closeModal clears', () => {
    useClassesStore.getState().openModal('c-1')
    expect(useClassesStore.getState().editingId).toBe('c-1')
    useClassesStore.getState().closeModal()
    expect(useClassesStore.getState().isModalOpen).toBe(false)
    expect(useClassesStore.getState().editingId).toBeNull()
  })

  test('reset returns to initial state', () => {
    useClassesStore.getState().setPage(2)
    useClassesStore.getState().openModal('c-1')
    useClassesStore.getState().reset()
    const s = useClassesStore.getState()
    expect(s.page).toBe(1)
    expect(s.isModalOpen).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// announcementsStore — page, search, categoryFilter
// ═════════════════════════════════════════════════════════════════════════════

describe('announcementsStore', () => {
  beforeEach(() => {
    useAnnouncementsStore.setState({ page: 1, search: '', categoryFilter: '' })
  })

  test('defaults: page 1, empty search and filter', () => {
    const s = useAnnouncementsStore.getState()
    expect(s.page).toBe(1)
    expect(s.search).toBe('')
    expect(s.categoryFilter).toBe('')
  })

  test('setSearch resets page to 1', () => {
    useAnnouncementsStore.getState().setPage(4)
    useAnnouncementsStore.getState().setSearch('holiday')
    expect(useAnnouncementsStore.getState().page).toBe(1)
  })

  test('setCategoryFilter resets page to 1', () => {
    useAnnouncementsStore.getState().setPage(3)
    useAnnouncementsStore.getState().setCategoryFilter('event')
    const s = useAnnouncementsStore.getState()
    expect(s.categoryFilter).toBe('event')
    expect(s.page).toBe(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// feesStore — page, search, 3 filters
// ═════════════════════════════════════════════════════════════════════════════

describe('feesStore', () => {
  beforeEach(() => {
    useFeesStore.setState({
      page: 1,
      search: '',
      statusFilter: '',
      monthFilter: '',
      classFilter: '',
    })
  })

  test('setSearch resets page to 1', () => {
    useFeesStore.getState().setPage(5)
    useFeesStore.getState().setSearch('Ali')
    expect(useFeesStore.getState().page).toBe(1)
  })

  test('setStatusFilter resets page to 1', () => {
    useFeesStore.getState().setPage(3)
    useFeesStore.getState().setStatusFilter('unpaid')
    const s = useFeesStore.getState()
    expect(s.statusFilter).toBe('unpaid')
    expect(s.page).toBe(1)
  })

  test('setMonthFilter resets page to 1', () => {
    useFeesStore.getState().setPage(2)
    useFeesStore.getState().setMonthFilter('2025-06')
    const s = useFeesStore.getState()
    expect(s.monthFilter).toBe('2025-06')
    expect(s.page).toBe(1)
  })

  test('setClassFilter resets page to 1', () => {
    useFeesStore.getState().setPage(4)
    useFeesStore.getState().setClassFilter('Rose')
    const s = useFeesStore.getState()
    expect(s.classFilter).toBe('Rose')
    expect(s.page).toBe(1)
  })

  test('setPage preserves all filters', () => {
    useFeesStore.getState().setSearch('Ali')
    useFeesStore.getState().setStatusFilter('paid')
    useFeesStore.getState().setMonthFilter('2025-03')
    useFeesStore.getState().setClassFilter('Rose')
    useFeesStore.getState().setPage(3)
    const s = useFeesStore.getState()
    expect(s.page).toBe(3)
    expect(s.search).toBe('Ali')
    expect(s.statusFilter).toBe('paid')
    expect(s.monthFilter).toBe('2025-03')
    expect(s.classFilter).toBe('Rose')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Simple stores — page + search only (gallery, feePlans, testimonials)
// ═════════════════════════════════════════════════════════════════════════════

describe('galleryStore', () => {
  beforeEach(() => useGalleryStore.getState().reset())

  test('setSearch resets page to 1', () => {
    useGalleryStore.getState().setPage(3)
    useGalleryStore.getState().setSearch('event')
    const s = useGalleryStore.getState()
    expect(s.search).toBe('event')
    expect(s.page).toBe(1)
  })

  test('reset returns to initial state', () => {
    useGalleryStore.getState().setPage(5)
    useGalleryStore.getState().setSearch('photo')
    useGalleryStore.getState().reset()
    const s = useGalleryStore.getState()
    expect(s.page).toBe(1)
    expect(s.search).toBe('')
  })
})

describe('feePlansStore', () => {
  beforeEach(() => useFeePlansStore.setState({ page: 1, search: '' }))

  test('setSearch resets page to 1', () => {
    useFeePlansStore.getState().setPage(2)
    useFeePlansStore.getState().setSearch('tuition')
    expect(useFeePlansStore.getState().page).toBe(1)
    expect(useFeePlansStore.getState().search).toBe('tuition')
  })
})

describe('testimonialsStore', () => {
  beforeEach(() => useTestimonialsStore.setState({ page: 1, search: '' }))

  test('setSearch resets page to 1', () => {
    useTestimonialsStore.getState().setPage(2)
    useTestimonialsStore.getState().setSearch('Siti')
    expect(useTestimonialsStore.getState().page).toBe(1)
    expect(useTestimonialsStore.getState().search).toBe('Siti')
  })
})

describe('inquiriesStore', () => {
  beforeEach(() => useInquiriesStore.getState().clearFilters())

  test('defaults: page 1, empty search/filters', () => {
    const s = useInquiriesStore.getState()
    expect(s.page).toBe(1)
    expect(s.search).toBe('')
    expect(s.statusFilter).toBe('')
    expect(s.dateFrom).toBe('')
    expect(s.dateTo).toBe('')
  })

  test('setSearch resets page to 1', () => {
    useInquiriesStore.getState().setPage(3)
    useInquiriesStore.getState().setSearch('Ahmad')
    const s = useInquiriesStore.getState()
    expect(s.search).toBe('Ahmad')
    expect(s.page).toBe(1)
  })

  test('setStatusFilter resets page to 1', () => {
    useInquiriesStore.getState().setPage(3)
    useInquiriesStore.getState().setStatusFilter('contacted')
    const s = useInquiriesStore.getState()
    expect(s.statusFilter).toBe('contacted')
    expect(s.page).toBe(1)
  })

  test('setDateFrom resets page to 1', () => {
    useInquiriesStore.getState().setPage(2)
    useInquiriesStore.getState().setDateFrom('2026-01-01')
    const s = useInquiriesStore.getState()
    expect(s.dateFrom).toBe('2026-01-01')
    expect(s.page).toBe(1)
  })

  test('setDateTo resets page to 1', () => {
    useInquiriesStore.getState().setPage(2)
    useInquiriesStore.getState().setDateTo('2026-12-31')
    const s = useInquiriesStore.getState()
    expect(s.dateTo).toBe('2026-12-31')
    expect(s.page).toBe(1)
  })

  test('setPage preserves all filters', () => {
    useInquiriesStore.getState().setSearch('Siti')
    useInquiriesStore.getState().setStatusFilter('enrolled')
    useInquiriesStore.getState().setDateFrom('2026-01-01')
    useInquiriesStore.getState().setDateTo('2026-06-30')
    useInquiriesStore.getState().setPage(4)
    const s = useInquiriesStore.getState()
    expect(s.page).toBe(4)
    expect(s.search).toBe('Siti')
    expect(s.statusFilter).toBe('enrolled')
    expect(s.dateFrom).toBe('2026-01-01')
    expect(s.dateTo).toBe('2026-06-30')
  })

  test('clearFilters resets everything', () => {
    useInquiriesStore.getState().setSearch('test')
    useInquiriesStore.getState().setStatusFilter('closed')
    useInquiriesStore.getState().setDateFrom('2026-01-01')
    useInquiriesStore.getState().setDateTo('2026-12-31')
    useInquiriesStore.getState().setPage(5)
    useInquiriesStore.getState().clearFilters()
    const s = useInquiriesStore.getState()
    expect(s.page).toBe(1)
    expect(s.search).toBe('')
    expect(s.statusFilter).toBe('')
    expect(s.dateFrom).toBe('')
    expect(s.dateTo).toBe('')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// incidentsStore — page, search, 3 filters
// ═════════════════════════════════════════════════════════════════════════════

describe('incidentsStore', () => {
  beforeEach(() => useIncidentsStore.getState().reset())

  test('defaults: page 1, empty search/filters', () => {
    const s = useIncidentsStore.getState()
    expect(s.page).toBe(1)
    expect(s.search).toBe('')
    expect(s.typeFilter).toBe('')
    expect(s.severityFilter).toBe('')
    expect(s.statusFilter).toBe('')
  })

  test('setSearch resets page to 1', () => {
    useIncidentsStore.getState().setPage(5)
    useIncidentsStore.getState().setSearch('fall')
    const s = useIncidentsStore.getState()
    expect(s.search).toBe('fall')
    expect(s.page).toBe(1)
  })

  test('setTypeFilter resets page to 1', () => {
    useIncidentsStore.getState().setPage(3)
    useIncidentsStore.getState().setTypeFilter('injury')
    const s = useIncidentsStore.getState()
    expect(s.typeFilter).toBe('injury')
    expect(s.page).toBe(1)
  })

  test('setSeverityFilter resets page to 1', () => {
    useIncidentsStore.getState().setPage(2)
    useIncidentsStore.getState().setSeverityFilter('serious')
    const s = useIncidentsStore.getState()
    expect(s.severityFilter).toBe('serious')
    expect(s.page).toBe(1)
  })

  test('setStatusFilter resets page to 1', () => {
    useIncidentsStore.getState().setPage(4)
    useIncidentsStore.getState().setStatusFilter('resolved')
    const s = useIncidentsStore.getState()
    expect(s.statusFilter).toBe('resolved')
    expect(s.page).toBe(1)
  })

  test('setPage preserves all filters', () => {
    useIncidentsStore.getState().setSearch('test')
    useIncidentsStore.getState().setTypeFilter('injury')
    useIncidentsStore.getState().setSeverityFilter('moderate')
    useIncidentsStore.getState().setStatusFilter('open')
    useIncidentsStore.getState().setPage(3)
    const s = useIncidentsStore.getState()
    expect(s.page).toBe(3)
    expect(s.search).toBe('test')
    expect(s.typeFilter).toBe('injury')
    expect(s.severityFilter).toBe('moderate')
    expect(s.statusFilter).toBe('open')
  })

  test('reset returns to initial state', () => {
    useIncidentsStore.getState().setSearch('test')
    useIncidentsStore.getState().setTypeFilter('injury')
    useIncidentsStore.getState().setSeverityFilter('serious')
    useIncidentsStore.getState().setStatusFilter('resolved')
    useIncidentsStore.getState().setPage(5)
    useIncidentsStore.getState().reset()
    const s = useIncidentsStore.getState()
    expect(s.page).toBe(1)
    expect(s.search).toBe('')
    expect(s.typeFilter).toBe('')
    expect(s.severityFilter).toBe('')
    expect(s.statusFilter).toBe('')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// attendanceStore — date, statusFilter, pendingChanges
// ═════════════════════════════════════════════════════════════════════════════

describe('attendanceStore', () => {
  beforeEach(() => {
    useAttendanceStore.setState({
      page: 1,
      statusFilter: '',
      pendingChanges: {},
    })
  })

  test('setDate resets page and clears pending changes', () => {
    useAttendanceStore.getState().setPage(3)
    useAttendanceStore.getState().setPending('s1', 'present')
    useAttendanceStore.getState().setDate('2025-06-15')
    const s = useAttendanceStore.getState()
    expect(s.selectedDate).toBe('2025-06-15')
    expect(s.page).toBe(1)
    expect(s.pendingChanges).toEqual({})
  })

  test('setStatusFilter resets page to 1', () => {
    useAttendanceStore.getState().setPage(2)
    useAttendanceStore.getState().setStatusFilter('absent')
    const s = useAttendanceStore.getState()
    expect(s.statusFilter).toBe('absent')
    expect(s.page).toBe(1)
  })

  test('setPending merges into existing changes', () => {
    useAttendanceStore.getState().setPending('s1', 'present')
    useAttendanceStore.getState().setPending('s2', 'absent')
    useAttendanceStore.getState().setPending('s3', 'late')
    const s = useAttendanceStore.getState()
    expect(s.pendingChanges).toEqual({
      s1: { status: 'present', notes: undefined },
      s2: { status: 'absent', notes: undefined },
      s3: { status: 'late', notes: undefined },
    })
  })

  test('setPending overwrites same student', () => {
    useAttendanceStore.getState().setPending('s1', 'present')
    useAttendanceStore.getState().setPending('s1', 'late')
    expect(useAttendanceStore.getState().pendingChanges.s1).toEqual({
      status: 'late',
      notes: undefined,
    })
  })

  test('clearPending removes all changes', () => {
    useAttendanceStore.getState().setPending('s1', 'present')
    useAttendanceStore.getState().setPending('s2', 'absent')
    useAttendanceStore.getState().clearPending()
    expect(useAttendanceStore.getState().pendingChanges).toEqual({})
  })

  test('classFilter defaults to empty string', () => {
    expect(useAttendanceStore.getState().classFilter).toBe('')
  })

  test('setClassFilter resets page to 1', () => {
    useAttendanceStore.getState().setPage(3)
    useAttendanceStore.getState().setClassFilter('class-uuid-1')
    const s = useAttendanceStore.getState()
    expect(s.classFilter).toBe('class-uuid-1')
    expect(s.page).toBe(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// settingsStore — darkMode, lang (persist + DOM side effects)
// ═════════════════════════════════════════════════════════════════════════════

describe('settingsStore', () => {
  // Mock DOM APIs that toggleDark() uses
  const mockAdd = vi.fn()
  const mockRemove = vi.fn()
  const mockSetAttribute = vi.fn()

  beforeEach(async () => {
    mockAdd.mockClear()
    mockRemove.mockClear()
    mockSetAttribute.mockClear()

    vi.stubGlobal('document', {
      documentElement: { classList: { add: mockAdd, remove: mockRemove } },
      querySelector: () => ({ setAttribute: mockSetAttribute }),
    })

    // Dynamic import to avoid issues with top-level document access
    const { useSettingsStore } = await import('./settingsStore')
    useSettingsStore.setState({ darkMode: false, lang: 'en' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('toggleDark flips darkMode state', async () => {
    const { useSettingsStore } = await import('./settingsStore')
    expect(useSettingsStore.getState().darkMode).toBe(false)
    useSettingsStore.getState().toggleDark()
    expect(useSettingsStore.getState().darkMode).toBe(true)
    useSettingsStore.getState().toggleDark()
    expect(useSettingsStore.getState().darkMode).toBe(false)
  })

  test('toggleDark applies dark class to document', async () => {
    const { useSettingsStore } = await import('./settingsStore')
    useSettingsStore.getState().toggleDark()
    expect(mockAdd).toHaveBeenCalledWith('dark')

    useSettingsStore.getState().toggleDark()
    expect(mockRemove).toHaveBeenCalledWith('dark')
  })

  test('setLang updates language', async () => {
    const { useSettingsStore } = await import('./settingsStore')
    useSettingsStore.getState().setLang('ms')
    expect(useSettingsStore.getState().lang).toBe('ms')
    useSettingsStore.getState().setLang('en')
    expect(useSettingsStore.getState().lang).toBe('en')
  })
})
