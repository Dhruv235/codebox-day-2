require('dotenv').config({ quiet: true });
const { getSupabaseConfig, getSupabase } = require('../config/supabase');

async function main() {
  const { url, key } = getSupabaseConfig();
  let response;
  try {
    response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key }, signal: AbortSignal.timeout(10000), redirect: 'error',
    });
  } catch {
    throw new Error('Could not reach Supabase. Check the project URL and network.');
  }
  if (!response.ok) throw new Error(`Supabase rejected the configuration (HTTP ${response.status}). Check the URL and publishable key.`);
  console.log('Supabase project and publishable key verified.');
  const { error } = await getSupabase().from('watchlist').select('id').limit(1);
  if (error?.code === '42501') {
    console.log('Watchlist table reached; anonymous access correctly denied. Sign in to verify CRUD.');
  } else if (error) {
    throw new Error(error.code === 'PGRST205' ? 'Watchlist table missing. Apply supabase/migrations/20260930_watchlist.sql.' : 'Could not verify the watchlist table. Check database and API settings.');
  } else {
    throw new Error('Anonymous table access was allowed. Verify the migration grants and row-level security.');
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
