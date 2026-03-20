import axios from 'axios'

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface StudentFilters {
  page?: number
  limit?: number
  search?: string
  class_id?: string
  gender?: string
  birthday_today?: boolean
  status?: string
}

export interface ClassFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export interface AttendanceFilters {
  page?: number
  limit?: number
  status?: string
  search?: string
}

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const hasToken = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token')
    if (err.response?.status === 401 && hasToken) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      sessionStorage.setItem('auth_expired', '1')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export const studentsApi = {
  getAll: (filters: StudentFilters = {}) =>
    api
      .get('/students', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').Student>),
  getCount: () => api.get('/students/count').then((r) => r.data as { count: number }),
  getById: (id: string) => api.get(`/students/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/students', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/students/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/students/${id}`).then((r) => r.data),
  bulkImport: (students: Record<string, string>[]) =>
    api
      .post<{
        imported: number
        failed: { row: number; reason: string }[]
      }>('/students/bulk', { students })
      .then((r) => r.data),
  // Portal access management
  generateAccessCode: (id: string) =>
    api.post(`/students/${id}/access-code`).then((r) => r.data as { access_code: string }),
  setPortalPin: (id: string, pin: string) =>
    api.put(`/students/${id}/portal-pin`, { pin }).then((r) => r.data),
  revokePortalAccess: (id: string) =>
    api.delete(`/students/${id}/portal-access`).then((r) => r.data),
  getTimeline: (id: string, params?: { limit?: number; before?: string }) =>
    api.get(`/students/${id}/timeline`, { params }).then(
      (r) =>
        r.data as {
          events: import('@/types').TimelineEvent[]
          has_more: boolean
          next_cursor?: string
        }
    ),
}

export const attendanceApi = {
  getByDate: (date: string, filters: AttendanceFilters = {}) =>
    api.get(`/attendance/date/${date}`, { params: filters }).then((r) => r.data),
  getByStudent: (
    id: string,
    params?: { from?: string; to?: string; page?: number; limit?: number }
  ) => api.get(`/attendance/student/${id}`, { params }).then((r) => r.data),
  mark: (data: unknown) => api.post('/attendance', data).then((r) => r.data),
  bulkMark: (records: unknown[]) => api.post('/attendance/bulk', records).then((r) => r.data),
  getSummary: (month?: number, year?: number) =>
    api.get('/attendance/stats/summary', { params: { month, year } }).then((r) => r.data),
  getTrend: (months?: number) =>
    api
      .get('/attendance/stats/trend', { params: { months } })
      .then((r) => r.data as import('@/types').AttendanceTrendPoint[]),
}

export const classesApi = {
  getAll: (filters: ClassFilters = {}) =>
    api
      .get('/classes', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').ClassRoom>),
  getCount: () => api.get('/classes/count').then((r) => r.data as { count: number }),
  getById: (id: string) => api.get(`/classes/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/classes', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/classes/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/classes/${id}`).then((r) => r.data),
  graduate: (
    id: string,
    data: { student_ids: string[]; reassign_class_id?: string; reassign_student_ids?: string[] }
  ) => api.post(`/classes/${id}/graduate`, data).then((r) => r.data),
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

// Public Axios instance — no auth interceptors (used by LandingPage)
const publicApi = axios.create({ baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api` })

export const galleryApi = {
  getVisible: () =>
    publicApi
      .get('/public/gallery')
      .then((r) => r.data as { data: import('@/types').GalleryItem[] }),
  getAll: (filters: { page?: number; limit?: number; search?: string } = {}) =>
    api
      .get('/gallery', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').GalleryItem>),
  create: (data: unknown) => api.post('/gallery', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/gallery/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/gallery/${id}`).then((r) => r.data),
}

export const feePlansApi = {
  getAll: (filters: { page?: number; limit?: number; search?: string } = {}) =>
    api
      .get('/fee-plans', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').FeePlan>),
  create: (data: unknown) => api.post('/fee-plans', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/fee-plans/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/fee-plans/${id}`).then((r) => r.data),
}

export const feesApi = {
  getAll: (
    filters: {
      page?: number
      limit?: number
      search?: string
      status?: string
      month?: string
      class_id?: string
    } = {}
  ) =>
    api
      .get('/fees', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').FeeRecord>),
  create: (data: unknown) => api.post('/fees', data).then((r) => r.data),
  generate: (data: unknown) => api.post('/fees/generate', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/fees/${id}`, data).then((r) => r.data),
  recordPayment: (id: string, data: { amount: number; payment_proof_url?: string | null }) =>
    api
      .put(`/fees/${id}/payment`, data)
      .then((r) => r.data as import('@/types').FeePaymentResponse),
  getProofUrl: (id: string) =>
    api.get(`/fees/${id}/proof-url`).then((r) => r.data as { url: string }),
  delete: (id: string) => api.delete(`/fees/${id}`).then((r) => r.data),
  getStatement: (studentId: string, year: number) =>
    api.get(`/fees/statement/${studentId}`, { params: { year } }).then((r) => r.data),
  exportCsv: (month: string) =>
    api
      .get('/fees/export', { params: { month }, responseType: 'blob' })
      .then((r) => r.data as Blob),
  getSummary: (month: string) =>
    api
      .get('/fees/summary', { params: { month } })
      .then((r) => r.data as import('@/types').FeesSummary),
  classSheet: (params: { class_id: string; month: string }) =>
    api
      .get('/fees/class-sheet', { params })
      .then((r) => r.data as import('@/types').ClassSheetResponse),
  monthlyReport: (params: { month: string }) =>
    api
      .get('/fees/monthly-report', { params })
      .then((r) => r.data as import('@/types').MonthlyReportResponse),
  annualReport: (year: number) =>
    api
      .get('/fees/annual-report', { params: { year } })
      .then((r) => r.data as import('@/types').AnnualReportResponse),
  getTrend: (months?: number) =>
    api
      .get('/fees/trend', { params: { months } })
      .then((r) => r.data as import('@/types').FeeCollectionTrendPoint[]),
}

export const documentNumberingApi = {
  get: (type: string) =>
    api
      .get(`/document-numbering/${type}`)
      .then((r) => r.data as { data: import('@/types').DocumentNumberingConfig | null }),
  update: (type: string, data: unknown) =>
    api.put(`/document-numbering/${type}`, data).then((r) => r.data),
}

export const schoolInfoApi = {
  get: () =>
    api.get('/school-info').then((r) => r.data as { data: import('@/types').SchoolInfo | null }),
  update: (data: unknown) => api.put('/school-info', data).then((r) => r.data),
  getPublic: () =>
    publicApi
      .get('/public/school-info')
      .then((r) => r.data as { data: import('@/types').SchoolInfo | null }),
}

export const inquiriesApi = {
  submit: (data: {
    parent_name: string
    child_name: string
    child_age: number
    phone: string
    message?: string
  }) => publicApi.post('/public/inquiries', data).then((r) => r.data),
  getAll: (
    filters: {
      page?: number
      limit?: number
      search?: string
      status?: string
      from?: string
      to?: string
    } = {}
  ) =>
    api
      .get('/inquiries', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').Inquiry>),
  updateStatus: (id: string, status: string) =>
    api.put(`/inquiries/${id}/status`, { status }).then((r) => r.data),
}

export const testimonialsApi = {
  getAll: (filters: { page?: number; limit?: number; search?: string } = {}) =>
    api
      .get('/testimonials', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').Testimonial>),
  create: (data: unknown) => api.post('/testimonials', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/testimonials/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/testimonials/${id}`).then((r) => r.data),
  getPublic: () =>
    publicApi
      .get('/public/testimonials')
      .then((r) => r.data as { data: import('@/types').Testimonial[] }),
}

export const dailyReportsApi = {
  getByDate: (params: { date: string; class_id?: string; page?: number; limit?: number }) =>
    api.get('/daily-reports', { params }).then((r) => r.data),
  upsert: (studentId: string, date: string, data: Record<string, unknown>) =>
    api
      .put(`/daily-reports/${studentId}/${date}`, data)
      .then((r) => r.data as import('@/types').DailyReport),
  delete: (id: string) => api.delete(`/daily-reports/${id}`).then((r) => r.data),
}

export const portfolioEntriesApi = {
  getAll: (params: { student_id: string; term?: string; page?: number; limit?: number }) =>
    api.get('/portfolio-entries', { params }).then((r) => r.data),
  getReport: (studentId: string, term: string) =>
    api.get(`/portfolio-entries/${studentId}/report/${encodeURIComponent(term)}`).then(
      (r) =>
        r.data as {
          entries: import('@/types').PortfolioEntry[]
          report: import('@/types').PortfolioReport | null
          term: string
        }
    ),
  create: (data: Record<string, unknown>) =>
    api.post('/portfolio-entries', data).then((r) => r.data as import('@/types').PortfolioEntry),
  update: (id: string, data: Record<string, unknown>) =>
    api
      .put(`/portfolio-entries/${id}`, data)
      .then((r) => r.data as import('@/types').PortfolioEntry),
  delete: (id: string) => api.delete(`/portfolio-entries/${id}`).then((r) => r.data),
}

export const portfolioReportsApi = {
  upsert: (
    studentId: string,
    term: string,
    data: { teacher_comment?: string | null; principal_comment?: string | null }
  ) =>
    api
      .put(`/portfolio-reports/${studentId}/${encodeURIComponent(term)}`, data)
      .then((r) => r.data as import('@/types').PortfolioReport),
}

// ── Parent Portal API ─────────────────────────────────────────────────────────

// Separate axios instance for parent portal — reads portal_token from localStorage
export const portalApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/portal`,
  headers: { 'Content-Type': 'application/json' },
})

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('portal_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('portal_device_id', id)
  }
  return id
}

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token') ?? sessionStorage.getItem('portal_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Device-Id'] = getOrCreateDeviceId()
  return config
})

portalApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      (localStorage.getItem('portal_token') || sessionStorage.getItem('portal_token'))
    ) {
      localStorage.removeItem('portal_token')
      localStorage.removeItem('portal_parent')
      localStorage.removeItem('portal_selected_child')
      sessionStorage.removeItem('portal_token')
      sessionStorage.removeItem('portal_parent')
      sessionStorage.removeItem('portal_selected_child')
      window.location.href = '/portal/login'
    }
    return Promise.reject(err)
  }
)

export const portalAuthApi = {
  login: (access_code: string, pin: string) =>
    portalApi.post('/login', { access_code, pin }).then(
      (r) =>
        r.data as {
          token: string
          parent: import('@/types').PortalParent
        }
    ),
  logout: () => portalApi.post('/logout').then((r) => r.data),
  me: () => portalApi.get('/me').then((r) => r.data as { data: import('@/types').PortalParent }),
}

export const portalDataApi = {
  getAttendance: (params: { page?: number; limit?: number; student_id?: string } = {}) =>
    portalApi
      .get('/attendance', { params })
      .then((r) => r.data as PaginatedResponse<import('@/types').AttendanceRecord>),
  getFees: (params: { page?: number; limit?: number; student_id?: string } = {}) =>
    portalApi.get('/fees', { params }).then((r) => r.data),
  getFeeProofUrl: (id: string) =>
    portalApi.get(`/fees/${id}/proof-url`).then((r) => r.data as { url: string }),
  getAnnouncements: () =>
    portalApi
      .get('/announcements')
      .then((r) => r.data as { data: import('@/types').Announcement[] }),
  getDailyReports: (params: { limit?: number; student_id?: string } = {}) =>
    portalApi
      .get('/daily-reports', { params })
      .then((r) => r.data as { data: import('@/types').DailyReport[] }),
  getPortfolio: (term?: string, student_id?: string) =>
    portalApi
      .get('/portfolio', {
        params: {
          ...(term ? { term } : {}),
          ...(student_id ? { student_id } : {}),
        },
      })
      .then(
        (r) =>
          r.data as {
            entries: import('@/types').PortfolioEntry[]
            report: import('@/types').PortfolioReport | null
            terms: string[]
          }
      ),
  getDevices: () =>
    portalApi
      .get('/devices')
      .then((r) => r.data as { data: import('@/types').DeviceSession[]; max_devices: number }),
  removeDevice: (sessionId: string) =>
    portalApi.delete(`/devices/${sessionId}`).then((r) => r.data),
  getMedical: (student_id?: string) =>
    portalApi
      .get('/medical', { params: student_id ? { student_id } : {} })
      .then((r) => r.data as { data: import('@/types').StudentMedical | null }),
  getIncidents: (params: { page?: number; limit?: number; student_id?: string } = {}) =>
    portalApi
      .get('/incidents', { params })
      .then((r) => r.data as PaginatedResponse<import('@/types').Incident>),
}

export const artWallApi = {
  getAll: (params: Record<string, unknown> = {}) =>
    api.get('/art-wall', { params }).then((r) => r.data),
  getByStudent: (studentId: string, params: Record<string, unknown> = {}) =>
    api.get(`/art-wall/by-student/${studentId}`, { params }).then((r) => r.data),
  get: (id: string) => api.get(`/art-wall/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post('/art-wall', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/art-wall/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/art-wall/${id}`).then((r) => r.data),
  getPublic: (params: { page?: number; limit?: number } = {}) =>
    publicApi.get('/public/art-wall', { params }).then((r) => r.data),
}

export const parentsApi = {
  getAll: (filters: { page?: number; limit?: number; search?: string } = {}) =>
    api
      .get('/parents', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').Parent>),
  getById: (id: string) => api.get(`/parents/${id}`).then((r) => r.data),
  getByStudent: (studentId: string) =>
    api.get(`/parents/by-student/${studentId}`).then((r) => r.data),
  create: (data: unknown) => api.post('/parents', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/parents/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/parents/${id}`).then((r) => r.data),
  generateAccessCode: (id: string) =>
    api.post(`/parents/${id}/access-code`).then((r) => r.data as { access_code: string }),
  setPortalPin: (id: string, pin: string) =>
    api.put(`/parents/${id}/portal-pin`, { pin }).then((r) => r.data),
  revokePortalAccess: (id: string) =>
    api.delete(`/parents/${id}/portal-access`).then((r) => r.data),
  linkStudent: (parentId: string, studentId: string, relationship?: string) =>
    api
      .post(`/parents/${parentId}/link-student`, { student_id: studentId, relationship })
      .then((r) => r.data),
  unlinkStudent: (parentId: string, studentId: string) =>
    api.delete(`/parents/${parentId}/unlink-student/${studentId}`).then((r) => r.data),
  getSessions: (parentId: string) =>
    api.get(`/parents/${parentId}/sessions`).then(
      (r) =>
        r.data as {
          data: Array<{
            id: string
            device_label: string
            created_at: string
            expires_at: string
          }>
        }
    ),
  revokeSession: (parentId: string, sessionId: string) =>
    api.delete(`/parents/${parentId}/sessions/${sessionId}`).then((r) => r.data),
}

export const announcementsApi = {
  getAll: (filters: { page?: number; limit?: number; search?: string; category?: string } = {}) =>
    api
      .get('/announcements', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').Announcement>),
  getById: (id: string) =>
    api.get(`/announcements/${id}`).then((r) => r.data as import('@/types').Announcement),
  create: (data: unknown) => api.post('/announcements', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/announcements/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/announcements/${id}`).then((r) => r.data),
  getPublic: () =>
    publicApi
      .get('/public/announcements')
      .then((r) => r.data as { data: import('@/types').Announcement[] }),
}

export const careersApi = {
  // Public (no auth)
  getPublicPostings: () =>
    publicApi
      .get('/public/careers/postings')
      .then((r) => r.data as { data: import('@/types').JobPosting[] }),
  submitApplication: (data: {
    posting_id: string
    applicant_name: string
    email: string
    phone: string
    resume_url?: string
    cover_message?: string
  }) => publicApi.post('/public/careers', data).then((r) => r.data),

  // Admin — Postings
  getPostings: (params: { page?: number; limit?: number; search?: string; status?: string } = {}) =>
    api
      .get('/careers/postings', { params })
      .then((r) => r.data as PaginatedResponse<import('@/types').JobPosting>),
  createPosting: (data: unknown) => api.post('/careers/postings', data).then((r) => r.data),
  updatePosting: (id: string, data: unknown) =>
    api.put(`/careers/postings/${id}`, data).then((r) => r.data),
  deletePosting: (id: string) => api.delete(`/careers/postings/${id}`).then((r) => r.data),

  // Admin — Applications
  getApplications: (
    params: {
      page?: number
      limit?: number
      search?: string
      status?: string
      posting_id?: string
    } = {}
  ) =>
    api
      .get('/careers/applications', { params })
      .then((r) => r.data as PaginatedResponse<import('@/types').JobApplication>),
  getApplication: (id: string) =>
    api.get(`/careers/applications/${id}`).then((r) => r.data as import('@/types').JobApplication),
  updateApplicationStatus: (id: string, status: string) =>
    api.put(`/careers/applications/${id}/status`, { status }).then((r) => r.data),
  deleteApplication: (id: string) => api.delete(`/careers/applications/${id}`).then((r) => r.data),
}

export const medicalProfilesApi = {
  get: (studentId: string) =>
    api
      .get(`/medical-profiles/${studentId}`)
      .then((r) => r.data as { data: import('@/types').StudentMedical | null }),
  upsert: (studentId: string, data: Record<string, unknown>) =>
    api.put(`/medical-profiles/${studentId}`, data).then((r) => r.data),
  delete: (studentId: string) => api.delete(`/medical-profiles/${studentId}`).then((r) => r.data),
}

export const incidentsApi = {
  getAll: (
    filters: {
      page?: number
      limit?: number
      search?: string
      student_id?: string
      type?: string
      severity?: string
      status?: string
      from_date?: string
      to_date?: string
    } = {}
  ) =>
    api
      .get('/incidents', { params: filters })
      .then((r) => r.data as PaginatedResponse<import('@/types').Incident>),
  getById: (id: string) =>
    api.get(`/incidents/${id}`).then((r) => r.data as import('@/types').Incident),
  getByStudent: (studentId: string, params: { page?: number; limit?: number } = {}) =>
    api
      .get(`/incidents/by-student/${studentId}`, { params })
      .then((r) => r.data as PaginatedResponse<import('@/types').Incident>),
  create: (data: Record<string, unknown>) => api.post('/incidents', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/incidents/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/incidents/${id}`).then((r) => r.data),
}
