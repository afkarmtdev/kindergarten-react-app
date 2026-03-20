// Integration tests for the portal data routes.
//
// These routes are normally protected by parentMiddleware which sets
// parentId and parentChildIds. We simulate this by manually setting
// those values via Hono middleware before the portal routes.

import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Hono } from 'hono'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import portal from './portal'

const PARENT_ID = '00000000-0000-0000-0000-000000000099'
const CHILD_1 = '00000000-0000-0000-0000-000000000001'
const CHILD_2 = '00000000-0000-0000-0000-000000000002'
const UNLINKED_CHILD = '00000000-0000-0000-0000-000000000999'

// Wrap portal routes with fake middleware that sets parentId and parentChildIds
function createApp(childIds: string[] = [CHILD_1, CHILD_2]) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    c.set('parentId', PARENT_ID)
    c.set('parentChildIds', childIds)
    await next()
  })
  app.route('/', portal)
  return app
}

const app = createApp()

beforeEach(() => {
  clearMockResponses()
})

// ─── GET /me — Parent profile ────────────────────────────────────────────────

describe('GET /me — parent profile', () => {
  test('returns parent with children array', async () => {
    setMockResponse('parents', {
      data: { id: PARENT_ID, full_name: 'Ali Hassan', email: 'ali@test.com', phone: '012-345' },
      error: null,
    })
    setMockResponse('parent_students', {
      data: [
        {
          relationship: 'parent',
          students: {
            id: CHILD_1,
            full_name: 'Ahmad',
            date_of_birth: '2020-01-01',
            gender: 'male',
            photo_url: null,
            classrooms: { name: 'Rose' },
          },
        },
      ],
      error: null,
    })

    const res = await app.request('/me')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.id).toBe(PARENT_ID)
    expect(json.data.full_name).toBe('Ali Hassan')
    expect(json.data.children).toBeArray()
    expect(json.data.children.length).toBe(1)
    expect(json.data.children[0].id).toBe(CHILD_1)
    expect(json.data.children[0].class_name).toBe('Rose')
    expect(json.data.children[0].relationship).toBe('parent')
  })

  test('returns 404 when parent not found', async () => {
    setMockResponse('parents', { data: null, error: { message: 'not found' } })

    const res = await app.request('/me')
    expect(res.status).toBe(404)
  })

  test('returns empty children when no links', async () => {
    setMockResponse('parents', {
      data: { id: PARENT_ID, full_name: 'Ali', email: null, phone: '012' },
      error: null,
    })
    setMockResponse('parent_students', { data: [], error: null })

    const res = await app.request('/me')
    const json = await res.json()
    expect(json.data.children).toEqual([])
  })

  test('child with no classroom returns class_name null', async () => {
    setMockResponse('parents', {
      data: { id: PARENT_ID, full_name: 'Ali', email: null, phone: '012' },
      error: null,
    })
    setMockResponse('parent_students', {
      data: [
        {
          relationship: 'parent',
          students: {
            id: CHILD_1,
            full_name: 'Ahmad',
            date_of_birth: '2020-01-01',
            gender: 'male',
            photo_url: null,
            classrooms: null,
          },
        },
      ],
      error: null,
    })

    const res = await app.request('/me')
    const json = await res.json()
    expect(json.data.children[0].class_name).toBeNull()
  })
})

// ─── resolveStudentId behavior ───────────────────────────────────────────────

describe('resolveStudentId — student_id param resolution', () => {
  test('defaults to first child when no student_id param', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 0 })

    const res = await app.request('/attendance')
    expect(res.status).toBe(200)
    // Route used CHILD_1 (first in the list) — we can't assert which child was
    // queried with the mock, but a 200 means resolveStudentId returned a valid ID
  })

  test('allows selecting a linked child via student_id param', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 0 })

    const res = await app.request(`/attendance?student_id=${CHILD_2}`)
    expect(res.status).toBe(200)
  })

  test('returns 403 when requesting an unlinked child', async () => {
    const res = await app.request(`/attendance?student_id=${UNLINKED_CHILD}`)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Access denied')
  })

  test('returns 403 when parent has no children', async () => {
    const emptyApp = createApp([])
    const res = await emptyApp.request('/attendance')
    expect(res.status).toBe(403)
  })
})

// ─── GET /attendance — Paginated attendance ──────────────────────────────────

describe('GET /attendance', () => {
  test('returns paginated attendance records', async () => {
    setMockResponse('attendance', {
      data: [
        { id: 'a1', date: '2026-03-08', status: 'present', notes: null, created_at: '2026-03-08' },
      ],
      error: null,
      count: 1,
    })

    const res = await app.request(`/attendance?student_id=${CHILD_1}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
    expect(json.meta.page).toBe(1)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('attendance', { data: null, error: { message: 'DB error' } })

    const res = await app.request(`/attendance?student_id=${CHILD_1}`)
    expect(res.status).toBe(500)
  })

  test('returns empty data when no records', async () => {
    setMockResponse('attendance', { data: [], error: null, count: 0 })

    const res = await app.request(`/attendance?student_id=${CHILD_1}`)
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })
})

// ─── GET /fees — Paginated fees ──────────────────────────────────────────────

describe('GET /fees', () => {
  test('returns paginated fee records', async () => {
    setMockResponse('fee_records', {
      data: [
        {
          id: 'f1',
          type: 'tuition',
          description: 'Jan tuition',
          amount_owed: 500,
          amount_paid: 0,
          discount_amount: 0,
          status: 'unpaid',
          due_date: '2026-01-31',
          paid_at: null,
          created_at: '2026-01-01',
        },
      ],
      error: null,
      count: 1,
    })

    const res = await app.request(`/fees?student_id=${CHILD_1}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].type).toBe('tuition')
  })

  test('returns 403 for unlinked child', async () => {
    const res = await app.request(`/fees?student_id=${UNLINKED_CHILD}`)
    expect(res.status).toBe(403)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('fee_records', { data: null, error: { message: 'DB error' } })

    const res = await app.request(`/fees?student_id=${CHILD_1}`)
    expect(res.status).toBe(500)
  })
})

// ─── GET /announcements — School-wide ────────────────────────────────────────

describe('GET /announcements', () => {
  test('returns announcements (no student scoping)', async () => {
    setMockResponse('announcements', {
      data: [
        {
          id: 'ann1',
          title: 'Holiday',
          body: 'School closed',
          category: 'holiday',
          image_url: null,
          is_pinned: true,
          expires_at: null,
          created_at: '2026-03-01',
        },
      ],
      error: null,
    })

    const res = await app.request('/announcements')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].title).toBe('Holiday')
  })

  test('returns empty array when no announcements', async () => {
    setMockResponse('announcements', { data: [], error: null })

    const res = await app.request('/announcements')
    const json = await res.json()
    expect(json.data).toEqual([])
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('announcements', { data: null, error: { message: 'DB error' } })

    const res = await app.request('/announcements')
    expect(res.status).toBe(500)
  })
})

// ─── GET /daily-reports — Recent daily reports ───────────────────────────────

describe('GET /daily-reports', () => {
  test('returns daily reports for selected child', async () => {
    setMockResponse('daily_reports', {
      data: [
        {
          id: 'dr1',
          report_date: '2026-03-08',
          meals_eaten: 'all',
          nap_minutes: 60,
          toilet_count: 3,
          mood: 'happy',
          activity_note: 'Played blocks',
          photo_url: null,
          created_at: '2026-03-08',
        },
      ],
      error: null,
    })

    const res = await app.request(`/daily-reports?student_id=${CHILD_1}&limit=14`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].mood).toBe('happy')
  })

  test('returns 403 for unlinked child', async () => {
    const res = await app.request(`/daily-reports?student_id=${UNLINKED_CHILD}`)
    expect(res.status).toBe(403)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('daily_reports', { data: null, error: { message: 'DB error' } })

    const res = await app.request(`/daily-reports?student_id=${CHILD_1}`)
    expect(res.status).toBe(500)
  })
})

// ─── GET /devices — Active portal sessions ───────────────────────────────────

describe('GET /devices', () => {
  test('returns session list with max_devices', async () => {
    setMockResponse('parent_sessions', {
      data: [
        {
          id: 'sess-1',
          token_hash: 'some-other-hash',
          device_label: 'Chrome on Windows',
          created_at: '2026-03-01T00:00:00Z',
          expires_at: '2026-04-01T00:00:00Z',
        },
        {
          id: 'sess-2',
          token_hash: 'another-hash',
          device_label: 'Safari on iOS',
          created_at: '2026-03-02T00:00:00Z',
          expires_at: '2026-04-02T00:00:00Z',
        },
      ],
      error: null,
    })

    const res = await app.request('/devices')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeArray()
    expect(json.data.length).toBe(2)
    expect(json.max_devices).toBe(3)
    expect(json.data[0].device_label).toBe('Chrome on Windows')
    expect(json.data[0].id).toBe('sess-1')
    expect(typeof json.data[0].is_current).toBe('boolean')
  })

  test('returns empty array when no active sessions', async () => {
    setMockResponse('parent_sessions', { data: [], error: null })

    const res = await app.request('/devices')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.max_devices).toBe(3)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('parent_sessions', { data: null, error: { message: 'DB error' } })

    const res = await app.request('/devices')
    expect(res.status).toBe(500)
  })

  test('uses "Unknown device" for sessions with null device_label', async () => {
    setMockResponse('parent_sessions', {
      data: [
        {
          id: 'sess-3',
          token_hash: 'hash-abc',
          device_label: null,
          created_at: '2026-03-01T00:00:00Z',
          expires_at: '2026-04-01T00:00:00Z',
        },
      ],
      error: null,
    })

    const res = await app.request('/devices')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data[0].device_label).toBe('Unknown device')
  })
})

// ─── DELETE /devices/:sessionId — Revoke a session ───────────────────────────

describe('DELETE /devices/:sessionId', () => {
  test('revokes session successfully', async () => {
    const SESSION_ID = '00000000-0000-0000-0000-000000000aaa'
    // First query: select to verify ownership; second: delete
    setMockResponse('parent_sessions', {
      data: { id: SESSION_ID, parent_id: PARENT_ID },
      error: null,
    })

    const res = await app.request(`/devices/${SESSION_ID}`, { method: 'DELETE' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  test('returns 404 when session not found or belongs to different parent', async () => {
    setMockResponse('parent_sessions', { data: null, error: null })

    const res = await app.request('/devices/nonexistent-session', { method: 'DELETE' })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Session not found')
  })
})

// ─── GET /portfolio — Portfolio entries + report ─────────────────────────────

describe('GET /portfolio', () => {
  test('returns entries grouped by term with report', async () => {
    setMockResponse('portfolio_entries', {
      data: [
        {
          id: 'pe1',
          domain: 'physical',
          observation: 'Runs well',
          photo_url: null,
          term: 'Term 1 2026',
          entry_date: '2026-02-15',
          created_at: '2026-02-15',
        },
      ],
      error: null,
    })
    setMockResponse('portfolio_reports', {
      data: {
        term: 'Term 1 2026',
        teacher_comment: 'Good progress',
        principal_comment: null,
        generated_at: '2026-03-01',
      },
      error: null,
    })

    const res = await app.request(`/portfolio?student_id=${CHILD_1}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.entries).toHaveLength(1)
    expect(json.entries[0].domain).toBe('physical')
    expect(json.terms).toContain('Term 1 2026')
    expect(json.report.teacher_comment).toBe('Good progress')
  })

  test('returns empty entries when none exist', async () => {
    setMockResponse('portfolio_entries', { data: [], error: null })

    const res = await app.request(`/portfolio?student_id=${CHILD_1}`)
    const json = await res.json()
    expect(json.entries).toEqual([])
    expect(json.terms).toEqual([])
    expect(json.report).toBeNull()
  })

  test('returns 403 for unlinked child', async () => {
    const res = await app.request(`/portfolio?student_id=${UNLINKED_CHILD}`)
    expect(res.status).toBe(403)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('portfolio_entries', { data: null, error: { message: 'DB error' } })

    const res = await app.request(`/portfolio?student_id=${CHILD_1}`)
    expect(res.status).toBe(500)
  })

  test('filters by term when term param provided', async () => {
    setMockResponse('portfolio_entries', {
      data: [
        {
          id: 'pe1',
          domain: 'cognitive',
          observation: 'Counts to 10',
          photo_url: null,
          term: 'Term 1 2026',
          entry_date: '2026-02-15',
          created_at: '2026-02-15',
        },
        {
          id: 'pe2',
          domain: 'language',
          observation: 'Speaks clearly',
          photo_url: null,
          term: 'Term 2 2026',
          entry_date: '2026-06-15',
          created_at: '2026-06-15',
        },
      ],
      error: null,
    })
    setMockResponse('portfolio_reports', { data: null, error: null })

    const res = await app.request(`/portfolio?student_id=${CHILD_1}&term=Term%201%202026`)
    const json = await res.json()
    expect(json.entries).toHaveLength(1)
    expect(json.entries[0].domain).toBe('cognitive')
    expect(json.terms).toHaveLength(2)
  })
})

// ─── GET /medical — Medical profile ──────────────────────────────────────────

describe('GET /medical', () => {
  test('returns medical profile for selected child', async () => {
    setMockResponse('student_medical', {
      data: {
        id: 'mp1',
        student_id: CHILD_1,
        blood_type: 'O+',
        allergies: ['peanuts', 'shellfish'],
        medications: ['inhaler'],
        vaccination_records: [{ name: 'MMR', date: '2022-06-01' }],
        emergency_contacts: [{ name: 'Siti', phone: '012-999', relationship: 'mother' }],
        doctor_name: 'Dr. Ahmad',
        doctor_phone: '03-1234567',
        medical_notes: 'Asthma — carries inhaler',
      },
      error: null,
    })

    const res = await app.request(`/medical?student_id=${CHILD_1}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.blood_type).toBe('O+')
    expect(json.data.allergies).toEqual(['peanuts', 'shellfish'])
    expect(json.data.emergency_contacts).toHaveLength(1)
    expect(json.data.doctor_name).toBe('Dr. Ahmad')
  })

  test('returns null data when no profile exists', async () => {
    setMockResponse('student_medical', { data: null, error: null })

    const res = await app.request(`/medical?student_id=${CHILD_1}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeNull()
  })

  test('returns 403 for unlinked child', async () => {
    const res = await app.request(`/medical?student_id=${UNLINKED_CHILD}`)
    expect(res.status).toBe(403)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('student_medical', {
      data: null,
      error: { code: 'XXYYY', message: 'DB error' },
    })

    const res = await app.request(`/medical?student_id=${CHILD_1}`)
    expect(res.status).toBe(500)
  })
})

// ─── GET /incidents — Incident reports ───────────────────────────────────────

describe('GET /incidents', () => {
  test('returns paginated incidents for selected child', async () => {
    setMockResponse('incidents', {
      data: [
        {
          id: 'inc1',
          student_id: CHILD_1,
          incident_date: '2026-03-15',
          incident_type: 'injury',
          severity: 'minor',
          description: 'Scraped knee on playground',
          action_taken: 'Cleaned and applied bandage',
          witnesses: 'Teacher Aminah',
          photo_url: null,
          follow_up_notes: null,
          status: 'resolved',
          created_at: '2026-03-15',
        },
      ],
      error: null,
      count: 1,
    })

    const res = await app.request(`/incidents?student_id=${CHILD_1}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].incident_type).toBe('injury')
    expect(json.data[0].severity).toBe('minor')
    expect(json.data[0].status).toBe('resolved')
    expect(json.meta.total).toBe(1)
    expect(json.meta.page).toBe(1)
  })

  test('returns empty data when no incidents', async () => {
    setMockResponse('incidents', { data: [], error: null, count: 0 })

    const res = await app.request(`/incidents?student_id=${CHILD_1}`)
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })

  test('returns 403 for unlinked child', async () => {
    const res = await app.request(`/incidents?student_id=${UNLINKED_CHILD}`)
    expect(res.status).toBe(403)
  })

  test('returns 500 on DB error', async () => {
    setMockResponse('incidents', { data: null, error: { message: 'DB error' } })

    const res = await app.request(`/incidents?student_id=${CHILD_1}`)
    expect(res.status).toBe(500)
  })

  test('respects pagination params', async () => {
    setMockResponse('incidents', {
      data: [{ id: 'inc2', incident_date: '2026-03-10', description: 'test' }],
      error: null,
      count: 15,
    })

    const res = await app.request(`/incidents?student_id=${CHILD_1}&page=2&limit=5`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.meta.page).toBe(2)
    expect(json.meta.limit).toBe(5)
    expect(json.meta.totalPages).toBe(3)
  })
})
