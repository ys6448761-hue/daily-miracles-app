'use strict';

/**
 * sessionUpdateEntryPoint.test.js — sessionService.updateEntryPoint (7 tests)
 *
 * T-UEP01: valid session, valid partner_code → { updated: true }
 * T-UEP02: SQL uses JSONB || merge (not full context overwrite)
 * T-UEP03: empty string entry_point → INVALID_ENTRY_POINT (no DB call)
 * T-UEP04: lowercase / free-text entry_point → INVALID_ENTRY_POINT (no DB call)
 * T-UEP05: session not found → NOT_FOUND
 * T-UEP06: session found but expired → EXPIRED
 * T-UEP07: existing sessionService methods still present (regression)
 */

jest.mock('../../database/db', () => ({
  query: jest.fn()
}));

const db = require('../../database/db');
const sessionService = require('../../services/sessionService');

// ── Helpers ──────────────────────────────────────────────────────────────────
const FUTURE = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h from now
const PAST   = new Date(Date.now() - 60 * 1000).toISOString();       // 1 min ago

function dbRows(rows) {
  return { rows, rowCount: rows.length };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('sessionService.updateEntryPoint — SODAM context write-back primitive', () => {

  afterEach(() => {
    db.query.mockReset();
  });

  // ── T-UEP01: valid session + valid partner_code ───────────────────────────
  test('T-UEP01: valid session and valid partner_code → { updated: true }', async () => {
    // Call 1: check validity → session exists, not expired
    db.query.mockResolvedValueOnce(dbRows([{ expires_at: FUTURE }]));
    // Call 2: JSONB merge UPDATE → 1 row returned
    db.query.mockResolvedValueOnce(dbRows([{ session_id: 'test-session-uuid' }]));

    const result = await sessionService.updateEntryPoint('test-session-uuid', 'RAMADA');

    expect(result).toEqual({ updated: true });
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  // ── T-UEP02: SQL uses JSONB || merge operator ─────────────────────────────
  test('T-UEP02: UPDATE uses JSONB || merge, not full context overwrite', async () => {
    db.query.mockResolvedValueOnce(dbRows([{ expires_at: FUTURE }]));
    db.query.mockResolvedValueOnce(dbRows([{ session_id: 'test-session-uuid' }]));

    await sessionService.updateEntryPoint('test-session-uuid', 'KENNY');

    // Second call must be the UPDATE
    const updateCall = db.query.mock.calls[1];
    const sql = updateCall[0];
    const params = updateCall[1];

    // SQL must contain the JSONB merge operator
    expect(sql).toMatch(/context\s*\|\|\s*\$1::jsonb/);
    // entry_point value is in params as JSON, not embedded in SQL
    expect(params[0]).toBe(JSON.stringify({ entry_point: 'KENNY' }));
    // SQL must NOT replace the entire context column with a full object
    expect(sql).not.toMatch(/context\s*=\s*'\{/);
    // session_id is the WHERE filter
    expect(params[1]).toBe('test-session-uuid');
  });

  // ── T-UEP03: empty string entry_point ────────────────────────────────────
  test('T-UEP03: empty string entry_point → INVALID_ENTRY_POINT, no DB call', async () => {
    const result = await sessionService.updateEntryPoint('test-session-uuid', '');

    expect(result).toEqual({ updated: false, reason: 'INVALID_ENTRY_POINT' });
    expect(db.query).not.toHaveBeenCalled();
  });

  // ── T-UEP04: lowercase / free-text entry_point ───────────────────────────
  test('T-UEP04: lowercase and free-text entry_point variants rejected', async () => {
    const invalidValues = [
      'ramada',             // lowercase
      'Ramada',             // mixed case
      'ramada hotel',       // spaces
      'RAMADA; DROP TABLE', // SQL injection attempt
      'RAMADA\nHOTEL',      // newline
      'A'.repeat(31),       // too long (31 chars)
      '1RAMADA',            // starts with digit
      '_RAMADA',            // starts with underscore
    ];

    for (const val of invalidValues) {
      db.query.mockReset();
      const result = await sessionService.updateEntryPoint('test-session-uuid', val);
      expect(result).toEqual({ updated: false, reason: 'INVALID_ENTRY_POINT' });
      expect(db.query).not.toHaveBeenCalled();
    }
  });

  // ── T-UEP05: session not found ────────────────────────────────────────────
  test('T-UEP05: session not found in DB → NOT_FOUND', async () => {
    db.query.mockResolvedValueOnce(dbRows([])); // 0 rows

    const result = await sessionService.updateEntryPoint('nonexistent-uuid', 'RAMADA');

    expect(result).toEqual({ updated: false, reason: 'NOT_FOUND' });
    expect(db.query).toHaveBeenCalledTimes(1); // check query only, no UPDATE
  });

  // ── T-UEP06: session expired ──────────────────────────────────────────────
  test('T-UEP06: session found but expired → EXPIRED', async () => {
    db.query.mockResolvedValueOnce(dbRows([{ expires_at: PAST }])); // expired

    const result = await sessionService.updateEntryPoint('expired-session-uuid', 'RAMADA');

    expect(result).toEqual({ updated: false, reason: 'EXPIRED' });
    expect(db.query).toHaveBeenCalledTimes(1); // check query only, no UPDATE
  });

  // ── T-UEP07: existing sessionService methods regression ──────────────────
  test('T-UEP07: existing sessionService methods still present and callable', () => {
    expect(typeof sessionService.createSession).toBe('function');
    expect(typeof sessionService.getSession).toBe('function');
    expect(typeof sessionService.touchSession).toBe('function');
    expect(typeof sessionService.isSessionValid).toBe('function');
    expect(typeof sessionService.getSessionInfo).toBe('function');
    expect(typeof sessionService.generateRestoreToken).toBe('function');
    expect(typeof sessionService.hashRestoreToken).toBe('function');
    expect(typeof sessionService.validateRestoreToken).toBe('function');
    expect(typeof sessionService.updateEntryPoint).toBe('function');
  });

});
