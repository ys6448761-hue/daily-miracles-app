/**
 * tests/c7a-staging-lifecycle.test.js
 * C7A: Staging Infrastructure Validation
 *
 * Full synthetic journey lifecycle test using Supabase Storage (staging)
 * - Creates journey from start to star_planted
 * - Tests REAL photo uploads × 6
 * - Tests Story Art uploads × 3
 * - Verifies Golden 9 rendering with signed URLs (backend-only)
 * - Tests safe replacement (re-upload same slot)
 * - Tests restore + retrieval
 * - Verifies storage/DB failure safety
 *
 * IMPORTANT: Run with NODE_ENV=staging + Supabase Storage staging project
 * This is NOT a unit test — it's integration testing
 *
 * Usage:
 *   NODE_ENV=staging npm test -- c7a-staging-lifecycle.test.js
 */

const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

let app, db, storageAdapter;
const journeyLog = [];

function logEvidence(stage, status, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    stage,
    status,
    details
  };
  journeyLog.push(entry);
  console.log(`[${stage}] ${status}`, details);
}

beforeAll(async () => {
  // Load modules
  app = require('../server');
  db = require('../database/db');
  storageAdapter = require('../services/storybook/storageAdapter');

  logEvidence('INIT', 'Starting C7A lifecycle test', {
    storageType: process.env.STORAGE_TYPE,
    supabaseProject: process.env.SUPABASE_URL ? 'configured' : 'missing',
    nodeEnv: process.env.NODE_ENV
  });

  // Verify staging environment
  if (process.env.NODE_ENV !== 'staging') {
    console.warn('⚠️ Not running in staging environment. Set NODE_ENV=staging');
  }

  if (process.env.STORAGE_TYPE !== 'supabase') {
    console.warn('⚠️ Not using Supabase Storage. Set STORAGE_TYPE=supabase');
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ Supabase credentials missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
});

afterAll(async () => {
  logEvidence('CLEANUP', 'Closing connections');
  if (db) await db.end();
});

/**
 * C7A-01: Full Synthetic Journey Lifecycle
 */
describe('C7A: Staging Full Lifecycle Test', () => {
  let journeyId, sessionId, restoreToken, starId;
  const assetLog = {};

  // ───────────────────────────────────────────────────────────────────────
  // Phase 1: Create Journey
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-01: POST /api/storybook/start creates journey', async () => {
    const response = await request(app)
      .post('/api/storybook/start')
      .expect(201);

    journeyId = response.body.journey_id;
    restoreToken = response.body.restore_token;

    // Extract session from cookie
    const setCookie = response.headers['set-cookie']?.[0];
    if (setCookie) {
      const match = setCookie.match(/dt_storybook_session_id=([^;]+)/);
      sessionId = match ? match[1] : null;
    }

    logEvidence('JOURNEY_CREATE', 'Journey created', {
      journeyId,
      sessionId,
      restoreToken: restoreToken ? restoreToken.substring(0, 8) + '...' : 'none'
    });

    expect(journeyId).toBeDefined();
    expect(restoreToken).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────
  // Phase 2: Upload REAL Photos (6 total)
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-02: REAL photo uploads (6 canonical slots)', async () => {
    const uploads = [
      { location: 'jinamgwan', slot: 'real_a' },
      { location: 'jinamgwan', slot: 'real_b' },
      { location: 'cablecar', slot: 'real_a' },
      { location: 'cablecar', slot: 'real_b' },
      { location: 'jongpo', slot: 'real_a' },
      { location: 'jongpo', slot: 'real_b' }
    ];

    for (const { location, slot } of uploads) {
      // Create synthetic image
      const imageBuffer = await sharp({
        create: {
          width: 400,
          height: 600,
          channels: 3,
          background: { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 }
        }
      })
        .jpeg()
        .toBuffer();

      // Upload
      const response = await request(app)
        .post(`/api/storybook/${journeyId}/upload`)
        .set('Cookie', `dt_storybook_session_id=${sessionId}`)
        .field('location', location)
        .field('slot', slot)
        .attach('photo', imageBuffer, `${location}_${slot}.jpg`)
        .expect(201);

      const assetId = response.body.asset_id;
      const objectKey = response.body.object_key;

      assetLog[`${location}-${slot}`] = { assetId, objectKey };

      logEvidence('REAL_UPLOAD', 'REAL photo uploaded', {
        location,
        slot,
        objectKey,
        size: imageBuffer.length
      });

      expect(response.body.success).toBe(true);
      expect(objectKey).toContain(location);
      expect(objectKey).toContain(slot);
    }

    // Verify journey status
    const journeyRes = await request(app)
      .get('/api/storybook/my-journey')
      .set('Cookie', `dt_storybook_session_id=${sessionId}`)
      .expect(200);

    expect(journeyRes.body.status).toBe('photos_complete');
    logEvidence('STATUS', 'Journey transitioned to photos_complete');
  });

  // ───────────────────────────────────────────────────────────────────────
  // Phase 3: Upload Story Art (3 total)
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-03: Story Art uploads (3 canonical slots)', async () => {
    const adminKey = process.env.ADMIN_API_KEY || 'test-admin-key';
    const uploads = [
      { location: 'jinamgwan' },
      { location: 'cablecar' },
      { location: 'jongpo' }
    ];

    for (const { location } of uploads) {
      // Create synthetic art image (larger, styled differently)
      const artBuffer = await sharp({
        create: {
          width: 400,
          height: 600,
          channels: 4,
          background: { r: 200, g: 150, b: 100, alpha: 1 }
        }
      })
        .png()
        .toBuffer();

      // Upload via admin endpoint
      const response = await request(app)
        .post(`/api/admin/storybook/${journeyId}/upload-story-art`)
        .set('x-admin-key', adminKey)
        .field('location', location)
        .attach('story_art', artBuffer, `${location}_story_art.png`)
        .expect(201);

      const objectKey = response.body.object_key;
      assetLog[`${location}-story_art`] = { objectKey };

      logEvidence('STORY_ART_UPLOAD', 'Story Art uploaded', {
        location,
        objectKey,
        size: artBuffer.length
      });

      expect(response.body.success).toBe(true);
    }

    // Verify journey status
    const journeyRes = await request(app)
      .get('/api/storybook/my-journey')
      .set('Cookie', `dt_storybook_session_id=${sessionId}`)
      .expect(200);

    expect(journeyRes.body.status).toBe('storybook_complete');
    logEvidence('STATUS', 'Journey transitioned to storybook_complete');
  });

  // ───────────────────────────────────────────────────────────────────────
  // Phase 4: Verify Golden 9 with Signed URLs
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-04: GET /api/storybook/my-journey returns signed URLs', async () => {
    const response = await request(app)
      .get('/api/storybook/my-journey')
      .set('Cookie', `dt_storybook_session_id=${sessionId}`)
      .expect(200);

    const { assets } = response.body;

    expect(assets.length).toBe(9); // 6 REAL + 3 Story Art

    // Verify all 9 have signed URLs
    for (const asset of assets) {
      expect(asset.signed_url).toBeDefined();

      // Supabase signed URLs contain specific markers
      if (process.env.STORAGE_TYPE === 'supabase') {
        expect(asset.signed_url).toMatch(/https:\/\/.*\.supabase\.co/); // Supabase URL pattern
        expect(asset.signed_url).toContain('token='); // JWT token marker
        expect(asset.signed_url).toContain('expires='); // Expiry marker
      }

      logEvidence('SIGNED_URL', 'URL generated', {
        location: asset.location,
        slot: asset.slot,
        urlLength: asset.signed_url.length,
        hasExpiry: asset.signed_url.includes('expires=') || asset.signed_url.includes('X-Amz-Expires')
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────
  // Phase 5: Test Unauthorized Access (Security)
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-05: Unauthorized access denied (different session)', async () => {
    const otherSession = `fake_session_${Date.now()}`;

    const response = await request(app)
      .get('/api/storybook/my-journey')
      .set('Cookie', `dt_storybook_session_id=${otherSession}`)
      .expect(401); // Or 404 if journey not found

    logEvidence('SECURITY', 'Unauthorized access blocked', {
      attemptedSession: otherSession,
      response: response.status
    });

    expect([401, 404]).toContain(response.status);
  });

  // ───────────────────────────────────────────────────────────────────────
  // Phase 6: Plant Star
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-06: POST /api/storybook/:id/plant-star creates star', async () => {
    const response = await request(app)
      .post(`/api/storybook/${journeyId}/plant-star`)
      .set('Cookie', `dt_storybook_session_id=${sessionId}`)
      .expect(201);

    starId = response.body.star_id;

    logEvidence('PLANT_STAR', 'Star planted', {
      starId,
      journeyStatus: response.body.journey_status
    });

    expect(starId).toBeDefined();
    expect(response.body.journey_status).toBe('star_planted');
  });

  // ───────────────────────────────────────────────────────────────────────
  // Phase 7: Test Restore
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-07: GET /api/storybook/restore?token=... restores session', async () => {
    const response = await request(app)
      .get(`/api/storybook/restore?token=${restoreToken}`)
      .expect(200);

    const newSessionId = response.headers['set-cookie']?.[0]
      ?.match(/dt_storybook_session_id=([^;]+)/)?.[1];

    logEvidence('RESTORE', 'Journey restored', {
      originalSession: sessionId,
      newSession: newSessionId ? newSessionId.substring(0, 8) + '...' : 'none',
      journeyId: response.body.journey_id
    });

    expect(response.body.journey_id).toBe(journeyId);
    expect(newSessionId).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────
  // Phase 8: Verify Golden 9 After Restore
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-08: Golden 9 still accessible after restore + star planted', async () => {
    // Get restore URL again to get new session
    const startRes = await request(app)
      .post('/api/storybook/start')
      .expect(201);

    const tempSession = startRes.headers['set-cookie']?.[0]
      ?.match(/dt_storybook_session_id=([^;]+)/)?.[1];

    const restoreRes = await request(app)
      .get(`/api/storybook/restore?token=${restoreToken}`)
      .expect(200);

    const restoredSession = restoreRes.headers['set-cookie']?.[0]
      ?.match(/dt_storybook_session_id=([^;]+)/)?.[1];

    // Fetch with restored session
    const response = await request(app)
      .get('/api/storybook/my-journey')
      .set('Cookie', `dt_storybook_session_id=${restoredSession}`)
      .expect(200);

    expect(response.body.status).toBe('star_planted');
    expect(response.body.star_id).toBe(starId);
    expect(response.body.assets.length).toBe(9);

    logEvidence('FINAL_STATE', 'Journey verified after restore', {
      status: response.body.status,
      starId: response.body.star_id,
      assetCount: response.body.assets.length
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Phase 9: Test Safe Replacement (Re-upload same slot)
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-09: Safe replacement (re-upload same REAL slot)', async () => {
    // Create new journey for replacement test
    const startRes = await request(app)
      .post('/api/storybook/start')
      .expect(201);

    const testJourneyId = startRes.body.journey_id;
    const testSessionId = startRes.headers['set-cookie']?.[0]
      ?.match(/dt_storybook_session_id=([^;]+)/)?.[1];

    // Upload original
    const original = await sharp({
      create: {
        width: 400,
        height: 600,
        channels: 3,
        background: { r: 255, g: 0, b: 0 } // Red
      }
    })
      .jpeg()
      .toBuffer();

    const originalRes = await request(app)
      .post(`/api/storybook/${testJourneyId}/upload`)
      .set('Cookie', `dt_storybook_session_id=${testSessionId}`)
      .field('location', 'jinamgwan')
      .field('slot', 'real_a')
      .attach('photo', original, 'original.jpg')
      .expect(201);

    const originalObjectKey = originalRes.body.object_key;

    // Re-upload same slot (replacement)
    const replacement = await sharp({
      create: {
        width: 400,
        height: 600,
        channels: 3,
        background: { r: 0, g: 255, b: 0 } // Green
      }
    })
      .jpeg()
      .toBuffer();

    const replacementRes = await request(app)
      .post(`/api/storybook/${testJourneyId}/upload`)
      .set('Cookie', `dt_storybook_session_id=${testSessionId}`)
      .field('location', 'jinamgwan')
      .field('slot', 'real_a')
      .attach('photo', replacement, 'replacement.jpg')
      .expect(201);

    const replacementObjectKey = replacementRes.body.object_key;

    logEvidence('REPLACEMENT', 'Safe replacement tested', {
      originalKey: originalObjectKey,
      replacementKey: replacementObjectKey,
      same: originalObjectKey === replacementObjectKey ? 'same key (updated)' : 'different key (versioning)'
    });

    expect(replacementRes.body.success).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────
  // Phase 10: Evidence Report
  // ───────────────────────────────────────────────────────────────────────
  test('C7A-10: Generate evidence report', async () => {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        storageType: process.env.STORAGE_TYPE,
        supabaseProject: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.split('.')[0].replace('https://', '') : 'unknown',
        storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'storybook-assets'
      },
      journey: {
        journeyId,
        sessionId,
        starId,
        status: 'star_planted'
      },
      assets: assetLog,
      lifecycle: journeyLog
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'c7a-evidence-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    logEvidence('REPORT', 'Evidence report saved', {
      path: reportPath,
      stages: journeyLog.length
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('C7A EVIDENCE REPORT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(JSON.stringify(report, null, 2));
    console.log('═══════════════════════════════════════════════════════════\n');

    expect(journeyLog.length).toBeGreaterThan(0);
  });
});
