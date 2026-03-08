import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import portfolioEntries from './portfolioEntries'

mock.module('../db/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({ range: () => Promise.resolve({ data: [], error: null, count: 0 }) }),
            single: () => Promise.resolve({ data: null, error: null }),
          }),
          order: () => ({ range: () => Promise.resolve({ data: [], error: null, count: 0 }) }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({ single: () => Promise.resolve({ data: { id: 'test' }, error: null }) }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({ single: () => Promise.resolve({ data: { id: 'test' }, error: null }) }),
        }),
      }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  },
}))

const app = new Hono()
app.use('*', async (c, next) => {
  c.set('user' as never, { email: 'test@example.com' })
  await next()
})
app.route('/api/portfolio-entries', portfolioEntries)

describe('GET /api/portfolio-entries', () => {
  test('requires student_id', async () => {
    const res = await app.request('/api/portfolio-entries')
    expect(res.status).toBe(400)
  })

  test('rejects invalid student_id uuid', async () => {
    const res = await app.request('/api/portfolio-entries?student_id=not-a-uuid')
    expect(res.status).toBe(400)
  })

  test('accepts valid student_id', async () => {
    const res = await app.request(
      '/api/portfolio-entries?student_id=00000000-0000-0000-0000-000000000001'
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
  })
})

describe('POST /api/portfolio-entries', () => {
  test('rejects invalid domain', async () => {
    const res = await app.request('/api/portfolio-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: '00000000-0000-0000-0000-000000000001',
        domain: 'unknown',
        observation: 'Test observation',
        term: '2024-T1',
        entry_date: '2024-03-01',
      }),
    })
    expect(res.status).toBe(400)
  })

  test('accepts valid entry', async () => {
    const res = await app.request('/api/portfolio-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: '00000000-0000-0000-0000-000000000001',
        domain: 'cognitive',
        observation: 'Can count to 20 without help',
        term: '2024-T1',
        entry_date: '2024-03-01',
      }),
    })
    expect(res.status).toBe(201)
  })

  test('rejects empty observation', async () => {
    const res = await app.request('/api/portfolio-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: '00000000-0000-0000-0000-000000000001',
        domain: 'language',
        observation: '',
        term: '2024-T1',
        entry_date: '2024-03-01',
      }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/portfolio-entries/:id', () => {
  test('returns success', async () => {
    const res = await app.request('/api/portfolio-entries/some-id', { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Entry deleted')
  })
})
