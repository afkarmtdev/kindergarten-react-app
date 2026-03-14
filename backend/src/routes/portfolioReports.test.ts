import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockSupabase, setMockResponse, clearMockResponses } from '../test-utils/mockSupabase'

mock.module('../db/supabase', () => ({ supabase: mockSupabase }))

import portfolioReports from './portfolioReports'

beforeEach(() => clearMockResponses())

// ── PUT /:studentId/:term — upsert report card comments ────────────────────

describe('PUT /:studentId/:term — upsert report card comments', () => {
  test('upserts and returns report', async () => {
    setMockResponse('portfolio_reports', {
      data: {
        id: '1',
        student_id: 'student-1',
        term: 'term1',
        teacher_comment: 'Great progress',
        principal_comment: null,
      },
      error: null,
    })

    const res = await portfolioReports.request('/student-1/term1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_comment: 'Great progress' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.student_id).toBe('student-1')
    expect(json.term).toBe('term1')
    expect(json.teacher_comment).toBe('Great progress')
  })

  test('accepts both teacher and principal comments', async () => {
    setMockResponse('portfolio_reports', {
      data: {
        id: '1',
        student_id: 'student-1',
        term: 'term2',
        teacher_comment: 'Good',
        principal_comment: 'Well done',
      },
      error: null,
    })

    const res = await portfolioReports.request('/student-1/term2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_comment: 'Good', principal_comment: 'Well done' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.teacher_comment).toBe('Good')
    expect(json.principal_comment).toBe('Well done')
  })

  test('accepts null comments', async () => {
    setMockResponse('portfolio_reports', {
      data: {
        id: '1',
        student_id: 'student-1',
        term: 'term1',
        teacher_comment: null,
        principal_comment: null,
      },
      error: null,
    })

    const res = await portfolioReports.request('/student-1/term1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_comment: null, principal_comment: null }),
    })

    expect(res.status).toBe(200)
  })

  test('accepts empty body (both fields optional)', async () => {
    setMockResponse('portfolio_reports', {
      data: { id: '1', student_id: 'student-1', term: 'term1' },
      error: null,
    })

    const res = await portfolioReports.request('/student-1/term1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(200)
  })

  test('returns 500 on database error', async () => {
    setMockResponse('portfolio_reports', {
      data: null,
      error: { message: 'upsert failed' },
    })

    const res = await portfolioReports.request('/student-1/term1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_comment: 'Test' }),
    })

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('upsert failed')
  })
})
