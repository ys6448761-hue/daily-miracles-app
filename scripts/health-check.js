#!/usr/bin/env node

/**
 * Post-Deploy Health Check Script
 * Verifies that the Render deployment is successful
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.RENDER_EXTERNAL_URL || process.argv[2];
const TIMEOUT = 30000; // 30 seconds

if (!BASE_URL) {
  console.error('❌ Error: RENDER_EXTERNAL_URL not set or URL not provided');
  console.error('Usage: node health-check.js <url>');
  process.exit(1);
}

console.log('🔍 Starting health check...');
console.log(`📡 Target URL: ${BASE_URL}`);
console.log('');

const client = BASE_URL.startsWith('https') ? https : http;

/**
 * Test a specific endpoint
 */
function testEndpoint(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`Testing: ${url}`);

    const req = client.get(url, { timeout: TIMEOUT }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const success = res.statusCode === expectedStatus;

        if (success) {
          console.log(`✅ ${path} - Status: ${res.statusCode}`);
          try {
            const json = JSON.parse(data);
            console.log(`   Response:`, JSON.stringify(json, null, 2));
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}...`);
          }
        } else {
          console.log(`❌ ${path} - Expected ${expectedStatus}, got ${res.statusCode}`);
        }
        console.log('');

        resolve({ path, success, status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${path} - Error: ${err.message}`);
      console.log('');
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      const err = new Error('Request timeout');
      console.log(`❌ ${path} - Timeout after ${TIMEOUT}ms`);
      console.log('');
      reject(err);
    });
  });
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  const tests = [
    { path: '/api/health', expectedStatus: 200 },
    { path: '/', expectedStatus: 200 }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await testEndpoint(test.path, test.expectedStatus);
      results.push(result);
    } catch (err) {
      results.push({ path: test.path, success: false, error: err.message });
    }
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Health Check Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (failed > 0) {
    console.error('❌ Health check failed!');
    process.exit(1);
  } else {
    console.log('✅ All health checks passed!');
    process.exit(0);
  }
}

// Run health checks
runHealthChecks().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
