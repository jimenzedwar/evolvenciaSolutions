import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

if (typeof supabaseUrl === 'string' && typeof supabaseAnonKey === 'string' && supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey)
} else if (typeof window === 'undefined') {
  // Tests and build environments might not provide Supabase credentials.
  // eslint-disable-next-line no-console
  console.warn('Supabase client is not configured. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable data fetching.')
}

export const supabase = client
export type { SupabaseClient }
