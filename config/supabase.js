const { createClient } = require('@supabase/supabase-js');

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in your local .env first.');
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('SUPABASE_URL must be a valid HTTPS project URL.');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('SUPABASE_URL must be an HTTPS project URL without credentials, query, or fragment.');
  }
  return { url: parsed.href.replace(/\/$/, ''), key };
}

function getSupabase(token) {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      fetch: (url, options = {}) => fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(10000) }),
    },
  });
}

module.exports = { getSupabase, getSupabaseConfig };
