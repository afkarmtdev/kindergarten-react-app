// Fake Supabase client for integration tests.
//
// Supabase JS uses a chainable query builder:
//   supabase.from('students').select('*').eq('id', 1).single()
//
// Each method returns `this` so you can keep chaining.
// When you `await` the chain, it resolves to { data, error, count }.
// When you call `.single()`, it resolves to { data, error } (one row).
//
// This mock replicates that chain and lets tests configure
// per-table responses via setMockResponse().

type MockResponse = {
  data: unknown
  error: { message: string } | null
  count?: number
}

const responses: Record<string, MockResponse> = {}
const rpcResponses: Record<string, MockResponse> = {}

// ── Auth mock state ──────────────────────────────────────────────────────────
// supabase.auth.getUser(), signInWithPassword(), signOut()

type AuthUserResponse = {
  data: { user: unknown }
  error: { message: string } | null
}

type AuthLoginResponse = {
  data: { user: unknown; session: unknown }
  error: { message: string } | null
}

let authGetUserResponse: AuthUserResponse = {
  data: { user: null },
  error: { message: 'Invalid token' },
}

let authLoginResponse: AuthLoginResponse = {
  data: { user: null, session: null },
  error: { message: 'Invalid credentials' },
}

let authSignOutError: { message: string } | null = null

/** Set what `supabase.auth.getUser()` returns. */
export function setAuthGetUser(response: AuthUserResponse) {
  authGetUserResponse = response
}

/** Set what `supabase.auth.signInWithPassword()` returns. */
export function setAuthLogin(response: AuthLoginResponse) {
  authLoginResponse = response
}

/** Set what `supabase.auth.signOut()` returns. */
export function setAuthSignOutError(error: { message: string } | null) {
  authSignOutError = error
}

/** Set what a `supabase.from(table)` query will return. */
export function setMockResponse(table: string, response: MockResponse) {
  responses[table] = response
}

/** Set what a `supabase.rpc(name)` call will return. */
export function setRpcMockResponse(name: string, response: MockResponse) {
  rpcResponses[name] = response
}

/** Clear all mock responses between tests. */
export function clearMockResponses() {
  for (const key of Object.keys(responses)) {
    delete responses[key]
  }
  for (const key of Object.keys(rpcResponses)) {
    delete rpcResponses[key]
  }
  // Reset auth mocks to default (rejected)
  authGetUserResponse = {
    data: { user: null },
    error: { message: 'Invalid token' },
  }
  authLoginResponse = {
    data: { user: null, session: null },
    error: { message: 'Invalid credentials' },
  }
  authSignOutError = null
}

function createMockChain(response: MockResponse) {
  const chain: Record<string, unknown> = {}

  // Every chainable method just returns the same chain
  const chainable = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'in',
    'or',
    'order',
    'range',
    'ilike',
    'limit',
    'gte',
    'lte',
    'lt',
    'gt',
    'is',
    'match',
    'not',
    'filter',
  ]
  for (const method of chainable) {
    chain[method] = () => chain
  }

  // .single() ends the chain and resolves to { data, error }
  chain.single = () => Promise.resolve({ data: response.data, error: response.error })

  // Makes the chain awaitable — resolves to { data, error, count }
  chain.then = (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) =>
    Promise.resolve({
      data: response.data,
      error: response.error,
      count: response.count,
    }).then(resolve, reject)

  return chain
}

/** The fake supabase client. Wire this up via mock.module(). */
export const mockSupabase = {
  from: (table: string) => createMockChain(responses[table] ?? { data: null, error: null }),
  rpc: (name: string, _params?: Record<string, unknown>) => {
    const response = rpcResponses[name] ?? { data: null, error: null }
    return Promise.resolve({ data: response.data, error: response.error })
  },
  auth: {
    getUser: () => Promise.resolve(authGetUserResponse),
    signInWithPassword: () => Promise.resolve(authLoginResponse),
    signOut: () => Promise.resolve({ error: authSignOutError }),
  },
}
