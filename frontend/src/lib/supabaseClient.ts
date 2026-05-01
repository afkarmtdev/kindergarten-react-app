import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

// Browser-side Supabase client — used for Storage uploads only.
// All database operations go through the backend API (api.ts).
export const supabase = createClient(supabaseUrl, supabasePublishableKey)
