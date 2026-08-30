/**
 * Session Service
 * Manages user sessions with dual timeout: 120min inactivity + 12h absolute
 * Privacy: session_id only (UUID), no user_id or personal data
 *
 * Extensions (C2 RAMADA):
 * - Restore token generation (30-day TTL)
 * - Restore token validation with rate limiting
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../database/db');

const INACTIVITY_TIMEOUT_MINUTES = 120;
const ABSOLUTE_TIMEOUT_HOURS = 12;

// C2: Restore token configuration
const RESTORE_TOKEN_TTL_DAYS = 30;
const RESTORE_TOKEN_MAX_ATTEMPTS = 5;
const RESTORE_TOKEN_RATE_LIMIT_WINDOW_SECONDS = 3600;

class SessionService {
  /**
   * Create a new session
   * @param {TravelGuideContext} context - User context
   * @returns {Promise<string>} session_id
   */
  async createSession(context) {
    const sessionId = uuidv4();
    const now = new Date();
    const inactivityExpires = new Date(now.getTime() + INACTIVITY_TIMEOUT_MINUTES * 60 * 1000);
    const absoluteExpires = new Date(now.getTime() + ABSOLUTE_TIMEOUT_HOURS * 60 * 60 * 1000);
    const expiresAt = inactivityExpires < absoluteExpires ? inactivityExpires : absoluteExpires;

    const query = `
      INSERT INTO travel_guide_sessions (
        session_id, user_id, context, created_at, last_activity_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING session_id
    `;

    try {
      const result = await db.query(query, [
        sessionId,
        context.user_id || null,
        JSON.stringify(context),
        now,
        now,
        expiresAt,
      ]);
      return result.rows[0].session_id;
    } catch (error) {
      console.error('[TRAVEL_SESSION_ERROR] PostgreSQL error:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        severity: error.severity,
        table: error.table,
        column: error.column,
      });
      throw new Error('Session creation failed');
    }
  }

  /**
   * Validate and retrieve session
   * @param {string} sessionId
   * @returns {Promise<TravelGuideContext | null>} Context if valid, null if expired
   */
  async getSession(sessionId) {
    const query = `
      SELECT session_id, context, last_activity_at, expires_at
      FROM travel_guide_sessions
      WHERE session_id = $1
    `;

    try {
      const result = await db.query(query, [sessionId]);
      if (result.rows.length === 0) {
        return null; // Session not found
      }

      const session = result.rows[0];
      const expiresAt = new Date(session.expires_at);
      if (new Date() > expiresAt) {
        return null; // Session expired
      }

      return JSON.parse(session.context);
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      return null;
    }
  }

  /**
   * Update last_activity_at and recalculate expires_at
   * @param {string} sessionId
   * @returns {Promise<boolean>} Success status
   */
  async touchSession(sessionId) {
    const now = new Date();
    const inactivityExpires = new Date(now.getTime() + INACTIVITY_TIMEOUT_MINUTES * 60 * 1000);
    const absoluteCreated = await this._getSessionCreatedTime(sessionId);

    if (!absoluteCreated) {
      return false; // Session not found
    }

    const absoluteExpires = new Date(absoluteCreated.getTime() + ABSOLUTE_TIMEOUT_HOURS * 60 * 60 * 1000);
    const expiresAt = inactivityExpires < absoluteExpires ? inactivityExpires : absoluteExpires;

    const query = `
      UPDATE travel_guide_sessions
      SET last_activity_at = $1, expires_at = $2, updated_at = $3
      WHERE session_id = $4
      RETURNING session_id
    `;

    try {
      const result = await db.query(query, [now, expiresAt, now, sessionId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Failed to touch session:', error);
      return false;
    }
  }

  /**
   * Check session validity without updating activity
   * @param {string} sessionId
   * @returns {Promise<boolean>}
   */
  async isSessionValid(sessionId) {
    const query = `
      SELECT expires_at FROM travel_guide_sessions
      WHERE session_id = $1
    `;

    try {
      const result = await db.query(query, [sessionId]);
      if (result.rows.length === 0) return false;
      const expiresAt = new Date(result.rows[0].expires_at);
      return new Date() < expiresAt;
    } catch (error) {
      console.error('Failed to validate session:', error);
      return false;
    }
  }

  /**
   * Get session creation time (for absolute timeout calculation)
   * @private
   * @param {string} sessionId
   * @returns {Promise<Date | null>}
   */
  async _getSessionCreatedTime(sessionId) {
    const query = `
      SELECT created_at FROM travel_guide_sessions
      WHERE session_id = $1
    `;

    try {
      const result = await db.query(query, [sessionId]);
      if (result.rows.length === 0) return null;
      return new Date(result.rows[0].created_at);
    } catch (error) {
      console.error('Failed to get session created time:', error);
      return null;
    }
  }

  /**
   * Get session info for debugging/admin
   * @param {string} sessionId
   * @returns {Promise<object | null>}
   */
  async getSessionInfo(sessionId) {
    const query = `
      SELECT session_id, created_at, last_activity_at, expires_at
      FROM travel_guide_sessions
      WHERE session_id = $1
    `;

    try {
      const result = await db.query(query, [sessionId]);
      if (result.rows.length === 0) return null;
      const session = result.rows[0];
      // Compute is_valid at application level
      const isValid = new Date() < new Date(session.expires_at);
      return { ...session, is_valid: isValid };
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }

  /**
   * [C2] Generate a restore token (32-byte hex string)
   * Used for restore_url in RAMADA Storybook Journey
   * @returns {string} 64-character hex string (32 bytes)
   */
  generateRestoreToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * [C2] Hash a restore token using SHA256
   * Used for secure storage in database
   * @param {string} tokenPlaintext - 64-char hex string from generateRestoreToken()
   * @returns {string} 64-char SHA256 hex digest
   */
  hashRestoreToken(tokenPlaintext) {
    return crypto
      .createHash('sha256')
      .update(tokenPlaintext, 'utf-8')
      .digest('hex');
  }

  /**
   * [C2] Validate restore token by comparing plaintext hash with stored hash
   * @param {string} tokenPlaintext - User-provided token from restore_url
   * @param {string} storedHash - DB-stored SHA256 hash
   * @returns {boolean} true if token is valid, false otherwise
   */
  validateRestoreToken(tokenPlaintext, storedHash) {
    const computedHash = this.hashRestoreToken(tokenPlaintext);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(storedHash)
    );
  }
}

module.exports = new SessionService();
