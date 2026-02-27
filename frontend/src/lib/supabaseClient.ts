import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Browser-side Supabase client — used for Storage uploads only.
// All database operations go through the backend API (api.ts).
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
