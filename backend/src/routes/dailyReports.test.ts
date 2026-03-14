import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import dailyReports from './dailyReports'

const app = new Hono()
app.use('*', async (c, next) => {
  c.set('user' as never, { id: 'user-1', email: 'test@example.com' })
  await next()
})
app.route('/api/daily-reports', dailyReports)

const STUDENT_ID = '00000000-0000-0000-0000-000000000001'
const CLASS_ID = '00000000-0000-0000-0000-000000000002'
const DATE = '2024-01-15'

const mockStudent = {
  id: STUDENT_ID,
  full_name: 'Ali Hassan',
  classrooms: { name: 'Rose' },
  photo_url: null,
}

const mockReport = {
  id: 'report-1',
  student_id: STUDENT_ID,
  report_date: DATE,
  meals_eaten: 'all',
  nap_minutes: 60,
  toilet_count: 2,
  mood: 'happy',
  activity_note: 'Great day!',
  photo_url: null,
  recorded_by: 'test@example.com',
  created_at: '2024-01-15T00:00:00Z',
}

function put(path: string, body: unknown) {
  return app.request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  clearMockResponses()
  // Default: students returns empty list, daily_reports returns empty list
  setMockResponse('students', { data: [], error: null, count: 0 })
  setMockResponse('daily_reports', { data: [], error: null })
})

// ─── GET /api/daily-reports ───────────────────────────────────────────────────

describe('GET /api/daily-reports — validation', () => {
  test('requires date query param', async () => {
    const res = await app.request('/api/daily-reports?page=1')
    expect(res.status).toBe(400)
  })

  test('rejects invalid date format (YYYY-M-D)', async () => {
    const res = await app.request('/api/daily-reports?date=2024-1-5')
    expect(res.status).toBe(400)
  })

  test('rejects non-date string', async () => {
    const res = await app.request('/api/daily-reports?date=today')
    expect(res.status).toBe(400)
  })

  test('rejects limit above max (100)', async () => {
    const res = await app.request(`/api/daily-reports?date=${DATE}&limit=101`)
    expect(res.status).toBe(400)
  })

  test('rejects invalid class_id', async () => {
    const res = await app.request(`/api/daily-reports?date=${DATE}&class_id=not-a-uuid`)
    expect(res.status).toBe(400)
  })

  test('accepts valid date', async () => {
    const res = await app.request(`/api/daily-reports?date=${DATE}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
  })

  test('accepts valid class_id filter', async () => {
    const res = await app.request(`/api/daily-reports?date=${DATE}&class_id=${CLASS_ID}`)
    expect(res.status).toBe(200)
  })
})

describe('GET /api/daily-reports — response shape', () => {
  test('returns empty array when no students', async () => {
    setMockResponse('students', { data: [], error: null, count: 0 })

    const res = await app.request(`/api/daily-reports?date=${DATE}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.meta.total).toBe(0)
  })

  test('returns student with null report when no report exists', async () => {
    setMockResponse('students', { data: [mockStudent], error: null, count: 1 })
    setMockResponse('daily_reports', { data: [], error: null })

    const res = await app.request(`/api/daily-reports?date=${DATE}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].student.id).toBe(STUDENT_ID)
    expect(body.data[0].report).toBeNull()
  })

  test('returns student paired with report when report exists', async () => {
    setMockResponse('students', { data: [mockStudent], error: null, count: 1 })
    setMockResponse('daily_reports', { data: [mockReport], error: null })

    const res = await app.request(`/api/daily-reports?date=${DATE}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].report.mood).toBe('happy')
    expect(body.data[0].report.meals_eaten).toBe('all')
  })

  test('flattens classrooms.name into student.class_name', async () => {
    setMockResponse('students', { data: [mockStudent], error: null, count: 1 })

    const res = await app.request(`/api/daily-reports?date=${DATE}`)
    const body = await res.json()
    expect(body.data[0].student.class_name).toBe('Rose')
    expect(body.data[0].student).not.toHaveProperty('classrooms')
  })

  test('student with no class has class_name: null', async () => {
    const unclassedStudent = { ...mockStudent, classrooms: null }
    setMockResponse('students', { data: [unclassedStudent], error: null, count: 1 })

    const res = await app.request(`/api/daily-reports?date=${DATE}`)
    const body = await res.json()
    expect(body.data[0].student.class_name).toBeNull()
  })

  test('returns correct meta pagination', async () => {
    setMockResponse('students', { data: [mockStudent], error: null, count: 45 })

    const res = await app.request(`/api/daily-reports?date=${DATE}&page=2&limit=20`)
    const body = await res.json()
    expect(body.meta.total).toBe(45)
    expect(body.meta.page).toBe(2)
    expect(body.meta.limit).toBe(20)
    expect(body.meta.totalPages).toBe(3)
  })
})

describe('GET /api/daily-reports — error handling', () => {
  test('returns 500 when student query fails', async () => {
    setMockResponse('students', { data: null, error: { message: 'DB down' } })

    const res = await app.request(`/api/daily-reports?date=${DATE}`)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB down')
  })

  test('returns 500 when daily_reports query fails', async () => {
    setMockResponse('students', { data: [mockStudent], error: null, count: 1 })
    setMockResponse('daily_reports', { data: null, error: { message: 'Report fetch failed' } })

    const res = await app.request(`/api/daily-reports?date=${DATE}`)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Report fetch failed')
  })
})

// ─── PUT /api/daily-reports/:studentId/:date ──────────────────────────────────

describe('PUT /api/daily-reports/:studentId/:date — validation', () => {
  test('rejects invalid mood', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, { mood: 'ecstatic' })
    expect(res.status).toBe(400)
  })

  test('rejects invalid meals_eaten', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, { meals_eaten: 'half' })
    expect(res.status).toBe(400)
  })

  test('rejects nap_minutes above 480', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, { nap_minutes: 481 })
    expect(res.status).toBe(400)
  })

  test('rejects nap_minutes below 0', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, { nap_minutes: -1 })
    expect(res.status).toBe(400)
  })

  test('rejects toilet_count above 30', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, { toilet_count: 31 })
    expect(res.status).toBe(400)
  })

  test('rejects activity_note over 1000 characters', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, {
      activity_note: 'x'.repeat(1001),
    })
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/daily-reports/:studentId/:date — success', () => {
  beforeEach(() => {
    setMockResponse('daily_reports', { data: mockReport, error: null })
  })

  test('accepts empty body (all fields optional)', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, {})
    expect(res.status).toBe(200)
  })

  test('accepts all valid fields', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, {
      mood: 'happy',
      meals_eaten: 'all',
      nap_minutes: 60,
      toilet_count: 2,
      activity_note: 'Great day!',
    })
    expect(res.status).toBe(200)
  })

  test('accepts all enum values for mood', async () => {
    for (const mood of ['happy', 'okay', 'tired', 'upset']) {
      const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, { mood })
      expect(res.status).toBe(200)
    }
  })

  test('accepts all enum values for meals_eaten', async () => {
    for (const meals_eaten of ['all', 'most', 'some', 'none']) {
      const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, { meals_eaten })
      expect(res.status).toBe(200)
    }
  })

  test('accepts null values for nullable fields', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, {
      mood: null,
      meals_eaten: null,
      nap_minutes: null,
      toilet_count: null,
      activity_note: null,
    })
    expect(res.status).toBe(200)
  })

  test('returns upserted report data', async () => {
    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, { mood: 'happy' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.mood).toBe('happy')
    expect(body.student_id).toBe(STUDENT_ID)
  })
})

describe('PUT /api/daily-reports/:studentId/:date — error handling', () => {
  test('returns 500 when upsert fails', async () => {
    setMockResponse('daily_reports', { data: null, error: { message: 'Upsert failed' } })

    const res = await put(`/api/daily-reports/${STUDENT_ID}/${DATE}`, { mood: 'happy' })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Upsert failed')
  })
})

// ─── DELETE /api/daily-reports/:id ───────────────────────────────────────────

describe('DELETE /api/daily-reports/:id', () => {
  test('returns success message', async () => {
    setMockResponse('daily_reports', { data: null, error: null })

    const res = await app.request('/api/daily-reports/some-id', { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Report deleted')
  })

  test('returns 500 when delete fails', async () => {
    setMockResponse('daily_reports', { data: null, error: { message: 'Delete failed' } })

    const res = await app.request('/api/daily-reports/some-id', { method: 'DELETE' })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Delete failed')
  })
})
