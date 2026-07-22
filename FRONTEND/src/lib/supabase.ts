import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — only initialized on first use so static builds
// succeed even when the env vars are not yet set.
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url === 'your-supabase-url' || !key || key === 'your-supabase-anon-key') {
    // Cache the placeholder client too to avoid creating multiple client instances
    _supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
    return _supabase;
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// Proxy that forwards every property access to the lazy instance.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
