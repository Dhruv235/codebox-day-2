require('dotenv').config({ quiet: true });

const { getSupabaseConfig } = require('../config/supabase');

async function main() {
  const { url, key } = getSupabaseConfig();
  let response;
  try {
    // The Data API schema endpoint checks access without needing a table.
    response = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Accept: 'application/openapi+json' },
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
  } catch {
    throw new Error('Could not reach Supabase. Check the project URL, network, and project status.');
  }
  if (!response.ok) {
    throw new Error(`Supabase Data API check failed (HTTP ${response.status}). Check your project URL, API key, and Data API settings.`);
  }
  let schema;
  try {
    schema = await response.json();
  } catch {
    throw new Error('Supabase did not return a valid Data API schema. Check SUPABASE_URL.');
  }
  if (!schema.swagger && !schema.openapi) {
    throw new Error('The response was not a Supabase Data API schema. Check SUPABASE_URL.');
  }
  console.log('Supabase Data API connection verified. User routes still use the in-memory sample data.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
