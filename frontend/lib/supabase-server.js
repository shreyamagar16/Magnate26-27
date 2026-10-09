/**
 * SERVER-ONLY Supabase client.
 * Never import this file into a Client Component or any file that runs in the browser.
 * Uses the service-role key so it bypasses RLS — keep it strictly server-side.
 *
 * The client is created lazily on first use so that validation-only paths
 * (e.g. returning 400 before touching the DB) work correctly even without
 * .env.local set locally.
 */

import { createClient } from '@supabase/supabase-js';

let _client = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (local) ' +
      'or in the Vercel project settings (production). ' +
      'Never prefix these with NEXT_PUBLIC_.'
    );
  }
  _client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return _client;
}

/**
 * Lazy Supabase client proxy.
 * Usage: identical to the original — supabase.rpc(...), supabase.from(...).
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = new Proxy(
  {},
  { get(_t, prop) { return getClient()[prop]; } }
);