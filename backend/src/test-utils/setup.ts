// Test setup — runs before any test file is loaded.
// Sets dummy env vars so modules that read process.env at import time
// (like db/supabase.ts) don't throw.

process.env.SUPABASE_URL = 'http://localhost:0'
process.env.SUPABASE_SECRET_KEY = 'test-key-dummy'
process.env.PORTAL_JWT_SECRET = 'test-portal-jwt-secret-at-least-32-chars-long'
