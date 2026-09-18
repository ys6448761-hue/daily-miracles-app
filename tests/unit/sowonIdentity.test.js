/**
 * SOWON Identity Service Tests
 * Comprehensive test suite for identity resolution, binding, and conflict detection
 */

const SowonIdentityService = require('../../services/sowonIdentityService');
const { v4: uuidv4 } = require('uuid');

describe('SowonIdentityService', () => {
  let service;
  let mockDb;

  // Mock database for testing
  beforeEach(() => {
    mockDb = {
      data: {
        sowon_identity_map: [],
        sowon_identity_bindings: []
      },
      query: async (sql, params) => {
        return handleMockQuery(sql, params, mockDb.data);
      }
    };
    service = new SowonIdentityService(mockDb);
  });

  // ── Test 1 ──────────────────────────────────────────────────
  test('createAnonymousSowon creates unique anonymous SOWON_IDs', async () => {
    const result1 = await service.createAnonymousSowon('qr_entry');
    const result2 = await service.createAnonymousSowon('qr_entry');

    expect(result1.status).toBe('CREATED');
    expect(result1.is_anonymous).toBe(true);
    expect(result1.sowon_id).toBeTruthy();

    expect(result2.status).toBe('CREATED');
    expect(result2.sowon_id).toBeTruthy();

    // Verify uniqueness
    expect(result1.sowon_id).not.toBe(result2.sowon_id);
  });

  // ── Test 2 ──────────────────────────────────────────────────
  test('resolveSowonId finds existing session_key binding', async () => {
    const sowon = await service.createAnonymousSowon('qr_entry');
    await service.linkUserExplicitIdentifier(sowon.sowon_id, {
      type: 'session_key',
      value: 'SESSION_ABC_123',
      context: 'qr_entry_test'
    });

    const found = await service.resolveSowonId({
      type: 'session_key',
      value: 'SESSION_ABC_123'
    });

    expect(found.status).toBe('FOUND');
    expect(found.sowon_id).toBe(sowon.sowon_id);
    expect(found.binding_status).toBe('USER_EXPLICIT');
  });

  // ── Test 3 ──────────────────────────────────────────────────
  test('resolveSowonId returns NOT_FOUND for unknown identifier', async () => {
    const result = await service.resolveSowonId({
      type: 'phone',
      value: '999-9999-9999'
    });

    expect(result.status).toBe('NOT_FOUND');
    expect(result.sowon_id).toBeNull();
  });

  // ── Test 4 ──────────────────────────────────────────────────
  test('linkVerifiedIdentifier succeeds with SMS proof', async () => {
    const sowon = await service.createAnonymousSowon('phone_auth');
    const result = await service.linkVerifiedIdentifier(sowon.sowon_id, {
      type: 'phone',
      value: '010-1234-5678',
      verification_method: 'SMS',
      verification_proof: 'sms_token_12345'
    });

    expect(result.status).toBe('VERIFIED');
    expect(result.binding_status).toBe('VERIFIED');
    expect(result.sowon_id).toBe(sowon.sowon_id);
    expect(result.linked_identifier).toMatch(/010-\*\*\*\*-/);
  });

  // ── Test 5 ──────────────────────────────────────────────────
  test('linkVerifiedIdentifier is idempotent on same sowon_id', async () => {
    const sowon = await service.createAnonymousSowon('test');
    const phone = '010-5555-5555';

    const result1 = await service.linkVerifiedIdentifier(sowon.sowon_id, {
      type: 'phone',
      value: phone,
      verification_method: 'SMS',
      verification_proof: 'token_1'
    });

    const result2 = await service.linkVerifiedIdentifier(sowon.sowon_id, {
      type: 'phone',
      value: phone,
      verification_method: 'SMS',
      verification_proof: 'token_2'
    });

    expect(result1.status).toBe('VERIFIED');
    expect(result2.status).toBe('ALREADY_LINKED');
    expect(result2.sowon_id).toBe(sowon.sowon_id);
  });

  // ── Test 6 (CRITICAL) ───────────────────────────────────────
  test('linkVerifiedIdentifier REJECTS if VERIFIED identifier belongs to different sowon_id', async () => {
    const sowon1 = await service.createAnonymousSowon('test1');
    const sowon2 = await service.createAnonymousSowon('test2');
    const phone = '010-7777-7777';

    // Link phone to sowon1 with VERIFIED
    const link1 = await service.linkVerifiedIdentifier(sowon1.sowon_id, {
      type: 'phone',
      value: phone,
      verification_method: 'SMS',
      verification_proof: 'token'
    });
    expect(link1.status).toBe('VERIFIED');

    // Try to link same phone to sowon2 → CONFLICT
    const link2 = await service.linkVerifiedIdentifier(sowon2.sowon_id, {
      type: 'phone',
      value: phone,
      verification_method: 'SMS',
      verification_proof: 'token'
    });

    expect(link2.error).toBe('IDENTITY_CONFLICT');
    expect(link2.conflict_sowon_id).toBe(sowon1.sowon_id);

    // Verify sowon2 does NOT have phone linked
    const sowon2_bindings = await service.getLinkedIdentifiers(sowon2.sowon_id);
    const phone_found = sowon2_bindings.identifiers.find(b => b.type === 'phone');
    expect(phone_found).toBeUndefined();
  });

  // ── Test 7 ──────────────────────────────────────────────────
  test('linkUserExplicitIdentifier marks as USER_EXPLICIT', async () => {
    const sowon = await service.createAnonymousSowon('test');
    const result = await service.linkUserExplicitIdentifier(sowon.sowon_id, {
      type: 'phone',
      value: '010-9876-5432',
      context: 'user_said_in_chat'
    });

    expect(result.binding_status).toBe('USER_EXPLICIT');
    expect(result.requires_verification).toBe(true);
    expect(result.status).toBe('CLAIMED');
  });

  // ── Test 8 ──────────────────────────────────────────────────
  test('linkUserExplicitIdentifier detects CONFLICT with VERIFIED in different sowon_id', async () => {
    const sowon1 = await service.createAnonymousSowon('test1');
    const sowon2 = await service.createAnonymousSowon('test2');
    const phone = '010-8888-8888';

    // Link to sowon1 with VERIFIED
    await service.linkVerifiedIdentifier(sowon1.sowon_id, {
      type: 'phone',
      value: phone,
      verification_method: 'SMS',
      verification_proof: 'token'
    });

    // Try USER_EXPLICIT link to sowon2 → CONFLICT
    const result = await service.linkUserExplicitIdentifier(sowon2.sowon_id, {
      type: 'phone',
      value: phone,
      context: 'form_input'
    });

    expect(result.merge_candidate_status).toBe('CONFLICT_DETECTED');
    expect(result.conflict_sowon_id).toBe(sowon1.sowon_id);
    expect(result.conflict_binding_status).toBe('VERIFIED');
    expect(result.action).toBe('REQUIRE_USER_CONFIRMATION');
  });

  // ── Test 9 ──────────────────────────────────────────────────
  test('isIdentifierAvailable detects VERIFIED conflict', async () => {
    const sowon = await service.createAnonymousSowon('test');
    const phone = '010-3333-3333';

    await service.linkVerifiedIdentifier(sowon.sowon_id, {
      type: 'phone',
      value: phone,
      verification_method: 'SMS',
      verification_proof: 'token'
    });

    const result = await service.isIdentifierAvailable({
      type: 'phone',
      value: phone
    });

    expect(result.available).toBe(false);
    expect(result.conflict_sowon_id).toBe(sowon.sowon_id);
    expect(result.conflict_binding_status).toBe('VERIFIED');
  });

  // ── Test 10 ─────────────────────────────────────────────────
  test('getLinkedIdentifiers masks sensitive values', async () => {
    const sowon = await service.createAnonymousSowon('test');
    const phone = '010-1111-1111';
    const email = 'user@example.com';

    await service.linkVerifiedIdentifier(sowon.sowon_id, {
      type: 'phone',
      value: phone,
      verification_method: 'SMS',
      verification_proof: 'token'
    });

    await service.linkUserExplicitIdentifier(sowon.sowon_id, {
      type: 'email',
      value: email,
      context: 'test'
    });

    const bindings = await service.getLinkedIdentifiers(sowon.sowon_id);

    expect(bindings.sowon_id).toBe(sowon.sowon_id);
    expect(bindings.identifiers.length).toBe(2);

    // Verify masking
    const phone_binding = bindings.identifiers.find(b => b.type === 'phone');
    const email_binding = bindings.identifiers.find(b => b.type === 'email');

    expect(phone_binding.value_masked).not.toBe(phone);
    expect(phone_binding.value_masked).toMatch(/010-\*\*\*\*-\d{4}/);

    expect(email_binding.value_masked).not.toBe(email);
    expect(email_binding.value_masked).toMatch(/u\*\*\*@example\.com/);
  });

  // ── Test 11 ─────────────────────────────────────────────────
  test('different anonymous sessions remain separate', async () => {
    const session1 = await service.createAnonymousSowon('session1');
    const session2 = await service.createAnonymousSowon('session2');

    await service.linkUserExplicitIdentifier(session1.sowon_id, {
      type: 'session_key',
      value: 'KEY_SESSION_A',
      context: 'test'
    });

    await service.linkUserExplicitIdentifier(session2.sowon_id, {
      type: 'session_key',
      value: 'KEY_SESSION_B',
      context: 'test'
    });

    const resolved1 = await service.resolveSowonId({
      type: 'session_key',
      value: 'KEY_SESSION_A'
    });

    const resolved2 = await service.resolveSowonId({
      type: 'session_key',
      value: 'KEY_SESSION_B'
    });

    expect(resolved1.sowon_id).toBe(session1.sowon_id);
    expect(resolved2.sowon_id).toBe(session2.sowon_id);
    expect(resolved1.sowon_id).not.toBe(resolved2.sowon_id);
  });

  // ── Test 12 ─────────────────────────────────────────────────
  test('service has no linkUnverifiedIdentifier method (security invariant)', () => {
    expect(typeof service.linkUnverifiedIdentifier).toBe('undefined');
  });

  // ── Test 13 ─────────────────────────────────────────────────
  test('resolveMergeCandidate records conflict resolution decision', async () => {
    const sowon1 = await service.createAnonymousSowon('test1');
    const sowon2 = await service.createAnonymousSowon('test2');
    const phone = '010-6666-6666';

    // Link to sowon1 VERIFIED
    await service.linkVerifiedIdentifier(sowon1.sowon_id, {
      type: 'phone',
      value: phone,
      verification_method: 'SMS',
      verification_proof: 'token'
    });

    // Link to sowon2 USER_EXPLICIT (creates merge candidate)
    await service.linkUserExplicitIdentifier(sowon2.sowon_id, {
      type: 'phone',
      value: phone,
      context: 'test'
    });

    // Record resolution
    const resolution = await service.resolveMergeCandidate({
      sowon_id_current: sowon2.sowon_id,
      sowon_id_candidate: sowon1.sowon_id,
      identifier: { type: 'phone', value: phone },
      resolution: 'ACCEPT'
    });

    expect(resolution.result).toBe('RECORDED');
    expect(resolution.merge_candidate_resolution).toBe('ACCEPT');
  });

  // ── Test 14 ─────────────────────────────────────────────────
  test('zero authorization: sowon_id existence does not grant permission', () => {
    // This test verifies that the service contract does NOT include authorization methods
    expect(typeof service.grantPermission).toBe('undefined');
    expect(typeof service.isAdmin).toBe('undefined');
    expect(typeof service.canAccess).toBe('undefined');
  });
});

// ═════════════════════════════════════════════════════════════
// Mock Query Handler
// ═════════════════════════════════════════════════════════════

function handleMockQuery(sql, params, data) {
  const sqlLower = sql.toLowerCase();

  // CREATE TABLE sowon_identity_map
  if (sqlLower.includes('create table') && sqlLower.includes('sowon_identity_map')) {
    return { rows: [], rowCount: 0 };
  }

  // CREATE TABLE sowon_identity_bindings
  if (sqlLower.includes('create table') && sqlLower.includes('sowon_identity_bindings')) {
    return { rows: [], rowCount: 0 };
  }

  // CREATE INDEX
  if (sqlLower.includes('create index')) {
    return { rows: [], rowCount: 0 };
  }

  // INSERT into sowon_identity_map
  if (sqlLower.includes('insert into sowon_identity_map')) {
    const sowon_id = params[0];
    const creation_source = params[1];
    const is_anonymous = params[2];
    const created_at = params[3];

    data.sowon_identity_map.push({
      sowon_id,
      creation_source,
      is_anonymous,
      created_at,
      first_verified_at: null,
      last_activity_at: null
    });

    return { rows: [{ sowon_id }], rowCount: 1 };
  }

  // INSERT into sowon_identity_bindings
  if (sqlLower.includes('insert into sowon_identity_bindings')) {
    const id = params[0];
    const sowon_id = params[1];
    const identifier_type = params[2];
    const identifier_value = params[3];
    const binding_status = params[4];
    const verification_method = params[5] || null;
    const verification_proof = params[6] || null;
    const linked_at = params[7];
    const first_verified_at = params[8] || null;

    data.sowon_identity_bindings.push({
      id,
      sowon_id,
      identifier_type,
      identifier_value,
      binding_status,
      verification_method,
      verification_proof,
      linked_at,
      first_verified_at,
      merge_candidate_resolution: null,
      merge_decision_at: null
    });

    return { rows: [{ id }], rowCount: 1 };
  }

  // SELECT from sowon_identity_map
  if (sqlLower.includes('select') && sqlLower.includes('sowon_identity_map')) {
    if (sql.includes('WHERE sowon_id')) {
      const sowon_id = params[0];
      const matching = data.sowon_identity_map.filter(s => s.sowon_id === sowon_id);
      return { rows: matching, rowCount: matching.length };
    }
  }

  // SELECT from sowon_identity_bindings (lookup by type/value)
  if (sqlLower.includes('select') && sqlLower.includes('sowon_identity_bindings')) {
    if (sql.includes('WHERE identifier_type') && sql.includes('identifier_value')) {
      const type = params[0];
      const value = params[1];
      const matching = data.sowon_identity_bindings.filter(
        b => b.identifier_type === type && b.identifier_value === value
      );
      return { rows: matching, rowCount: matching.length };
    }
    // lookup by sowon_id
    if (sql.includes('WHERE sowon_id')) {
      const sowon_id = params[0];
      const matching = data.sowon_identity_bindings.filter(b => b.sowon_id === sowon_id);
      return { rows: matching.sort((a, b) => new Date(a.linked_at) - new Date(b.linked_at)), rowCount: matching.length };
    }
  }

  // UPDATE sowon_identity_map
  if (sqlLower.includes('update sowon_identity_map')) {
    const sowon_id = params[0];
    const item = data.sowon_identity_map.find(s => s.sowon_id === sowon_id);
    if (item) {
      item.first_verified_at = params[1];
      item.is_anonymous = false;
    }
    return { rows: [], rowCount: 1 };
  }

  // UPDATE sowon_identity_bindings (merge_candidate_resolution)
  if (sqlLower.includes('update sowon_identity_bindings')) {
    const resolution = params[0];
    const merge_decision_at = params[1];
    const sowon_id = params[2];
    const type = params[3];
    const value = params[4];

    const item = data.sowon_identity_bindings.find(
      b => b.sowon_id === sowon_id && b.identifier_type === type && b.identifier_value === value
    );
    if (item) {
      item.merge_candidate_resolution = resolution;
      item.merge_decision_at = merge_decision_at;
    }

    return { rows: [{ merge_candidate_resolution: resolution, merge_decision_at }], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}
