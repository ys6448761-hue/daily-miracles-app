#!/usr/bin/env node
/**
 * test-supabase-storage.js
 * C7A Diagnostic: Supabase Storage smoke test
 *
 * Purpose:
 * - Test trivial path (diagnostics/test-[timestamp].jpg) to identify SDK/URL config issues
 * - Test actual journey path (journeys/[id]/location/real_[slot].jpg) to identify path-specific issues
 * - Capture full error details for debugging
 *
 * Run:
 * node scripts/test-supabase-storage.js
 *
 * Output:
 * - Render logs: [C7A_SMOKE_TEST_*] JSON diagnostics
 * - Cleanup: Delete test files created during smoke test
 */

require('dotenv').config();

const createStorageAdapter = require('../services/storybook/storageAdapter');

async function runSmokeTest() {
  console.log('[C7A_STORAGE_TEST_BEGIN]', JSON.stringify({
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    supabaseUrlDomain: process.env.SUPABASE_URL ?
      new URL(process.env.SUPABASE_URL).hostname : 'unset'
  }));

  try {
    const adapter = createStorageAdapter;

    // Verify adapter is SupabaseStorageAdapter
    if (!adapter.smokeTest) {
      throw new Error('adapter.smokeTest() not available - check adapter type');
    }

    console.log('[C7A_ADAPTER_CHECK]', JSON.stringify({
      adapterType: adapter.constructor.name,
      hasSmokeTeset: typeof adapter.smokeTest === 'function'
    }));

    // Run smoke test
    console.log('[C7A_RUNNING_SMOKE_TEST]', JSON.stringify({ stage: 'INIT' }));
    const result = await adapter.smokeTest();

    console.log('[C7A_STORAGE_TEST_COMPLETE]', JSON.stringify({
      timestamp: new Date().toISOString(),
      result: result,
      interpretation: result ?
        'Trivial path succeeded - SDK/URL config OK, investigate journey path construction' :
        'Trivial path failed - SDK/URL config issue'
    }));

    process.exit(result ? 0 : 1);
  } catch (error) {
    console.error('[C7A_STORAGE_TEST_FATAL]', JSON.stringify({
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack ? error.stack.split('\n')[0] : 'no stack'
    }));

    process.exit(1);
  }
}

runSmokeTest();
