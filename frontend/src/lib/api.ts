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
  class_name?: string
  gender?: string
}

export interface ClassFilters {
  page?: number
  limit?: number
  search?: string
}

export interface AttendanceFilters {
  page?: number
  limit?: number
  status?: string
  search?: string
}

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export const studentsApi = {
  getAll: (filters: StudentFilters = {}) =>
    api.get('/students', { params: filters }).then((r) => r.data as PaginatedResponse<import('@/types').Student>),
  getById: (id: string) => api.get(`/students/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/students', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/students/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/students/${id}`).then((r) => r.data),
  bulkImport: (students: Record<string, string>[]) =>
    api.post<{ imported: number; failed: { row: number; reason: string }[] }>('/students/bulk', { students }).then((r) => r.data),
}

export const attendanceApi = {
  getByDate: (date: string, filters: AttendanceFilters = {}) =>
    api.get(`/attendance/date/${date}`, { params: filters }).then((r) => r.data),
  getByStudent: (id: string, params?: { from?: string; to?: string; page?: number; limit?: number }) =>
    api.get(`/attendance/student/${id}`, { params }).then((r) => r.data),
  mark: (data: unknown) => api.post('/attendance', data).then((r) => r.data),
  bulkMark: (records: unknown[]) => api.post('/attendance/bulk', records).then((r) => r.data),
  getSummary: (month?: number, year?: number) =>
    api.get('/attendance/stats/summary', { params: { month, year } }).then((r) => r.data),
}

export const classesApi = {
  getAll: (filters: ClassFilters = {}) =>
    api.get('/classes', { params: filters }).then((r) => r.data as PaginatedResponse<import('@/types').ClassRoom>),
  getById: (id: string) => api.get(`/classes/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/classes', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/classes/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/classes/${id}`).then((r) => r.data),
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

// Public Axios instance — no auth interceptors (used by LandingPage)
const publicApi = axios.create({ baseURL: '/api' })

export const galleryApi = {
  getVisible: () =>
    publicApi.get('/public/gallery').then((r) => r.data as { data: import('@/types').GalleryItem[] }),
  getAll: (filters: { page?: number; limit?: number; search?: string } = {}) =>
    api.get('/gallery', { params: filters }).then((r) => r.data as PaginatedResponse<import('@/types').GalleryItem>),
  create: (data: unknown) => api.post('/gallery', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/gallery/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/gallery/${id}`).then((r) => r.data),
}
