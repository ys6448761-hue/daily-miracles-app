/**
 * SOWON Identity Service v0.1
 *
 * Purpose: Relationship continuity identity (WHO are we connected with)
 * Scope: Identity resolution only — no authentication, no authorization, no merge logic
 *
 * Critical Invariant:
 * - Binding ≠ Merge (VERIFIED phone conflict = conflict, not auto-merge)
 * - Zero privilege from SOWON_ID
 * - USER_EXPLICIT never auto-promoted to VERIFIED
 */

const { v4: uuidv4 } = require('uuid');

class SowonIdentityService {
  constructor(db) {
    this.db = db;
  }

  /**
   * 1. createAnonymousSowon
   * Create new anonymous SOWON_ID with no identifiers linked yet
   * @param {string} creationSource - 'qr_entry', 'phone_auth', 'migration', etc
   * @returns {Promise<{sowon_id, status, is_anonymous, created_at}>}
   */
  async createAnonymousSowon(creationSource) {
    const sowon_id = uuidv4();
    const now = new Date();

    try {
      await this.db.query(
        `INSERT INTO sowon_identity_map (sowon_id, creation_source, is_anonymous, created_at)
         VALUES ($1, $2, $3, $4)`,
        [sowon_id, creationSource || 'unknown', true, now]
      );

      return {
        sowon_id,
        status: 'CREATED',
        is_anonymous: true,
        created_at: now
      };
    } catch (error) {
      console.error('[SowonIdentity] createAnonymousSowon error:', error.message);
      throw error;
    }
  }

  /**
   * 2. resolveSowonId
   * Lookup existing SOWON_ID from identifier (lookup only, never creates)
   * @param {Object} identifier - {type, value}
   * @returns {Promise<{sowon_id, status, binding_status} | {sowon_id: null, status}>}
   */
  async resolveSowonId(identifier) {
    const { type, value } = identifier;

    if (!type || !value) {
      return { sowon_id: null, status: 'INVALID_IDENTIFIER' };
    }

    try {
      const result = await this.db.query(
        `SELECT sowon_id, binding_status, linked_at, first_verified_at
         FROM sowon_identity_bindings
         WHERE identifier_type = $1 AND identifier_value = $2
         LIMIT 1`,
        [type, value]
      );

      if (result.rows.length === 0) {
        return { sowon_id: null, status: 'NOT_FOUND' };
      }

      const binding = result.rows[0];
      return {
        sowon_id: binding.sowon_id,
        status: 'FOUND',
        binding_status: binding.binding_status,
        linked_at: binding.linked_at,
        first_verified_at: binding.first_verified_at
      };
    } catch (error) {
      console.error('[SowonIdentity] resolveSowonId error:', error.message);
      throw error;
    }
  }

  /**
   * 3. linkVerifiedIdentifier
   * Link VERIFIED identifier (requires proof, conflicts with different SOWON_ID = error, not merge)
   * @param {string} sowon_id
   * @param {Object} identifier - {type, value, verification_method, verification_proof}
   * @returns {Promise<{sowon_id, linked_identifier, status} | {error, conflict_sowon_id}>}
   */
  async linkVerifiedIdentifier(sowon_id, identifier) {
    const { type, value, verification_method, verification_proof } = identifier;
    const now = new Date();

    try {
      // Check sowon_id exists
      const sowon_check = await this.db.query(
        'SELECT sowon_id FROM sowon_identity_map WHERE sowon_id = $1',
        [sowon_id]
      );
      if (sowon_check.rows.length === 0) {
        return { error: 'SOWON_ID_NOT_FOUND' };
      }

      // Check if this identifier is already bound to this sowon_id
      const existing = await this.db.query(
        `SELECT sowon_id, binding_status FROM sowon_identity_bindings
         WHERE identifier_type = $1 AND identifier_value = $2`,
        [type, value]
      );

      if (existing.rows.length > 0) {
        const binding = existing.rows[0];
        if (binding.sowon_id === sowon_id) {
          // Already linked to same SOWON_ID → idempotent
          return {
            sowon_id,
            linked_identifier: this._maskIdentifier(type, value),
            status: 'ALREADY_LINKED',
            binding_status: binding.binding_status
          };
        } else {
          // Conflict: VERIFIED identifier belongs to different SOWON_ID
          if (binding.binding_status === 'VERIFIED') {
            return {
              error: 'IDENTITY_CONFLICT',
              conflict_sowon_id: binding.sowon_id,
              conflict_binding_status: 'VERIFIED'
            };
          }
        }
      }

      // Insert new VERIFIED binding
      const id = uuidv4();
      await this.db.query(
        `INSERT INTO sowon_identity_bindings
         (id, sowon_id, identifier_type, identifier_value, binding_status, verification_method, verification_proof, linked_at, first_verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, sowon_id, type, value, 'VERIFIED', verification_method, verification_proof, now, now]
      );

      // Update SOWON_ID first_verified_at if this is first verified binding
      await this.db.query(
        `UPDATE sowon_identity_map
         SET first_verified_at = COALESCE(first_verified_at, $2), is_anonymous = false
         WHERE sowon_id = $1 AND first_verified_at IS NULL`,
        [sowon_id, now]
      );

      return {
        sowon_id,
        linked_identifier: this._maskIdentifier(type, value),
        binding_status: 'VERIFIED',
        status: 'VERIFIED',
        first_verified_at: now
      };
    } catch (error) {
      console.error('[SowonIdentity] linkVerifiedIdentifier error:', error.message);
      throw error;
    }
  }

  /**
   * 4. linkUserExplicitIdentifier
   * Link USER_EXPLICIT identifier (user's claim, not authentication proof)
   * @param {string} sowon_id
   * @param {Object} identifier - {type, value, context}
   * @returns {Promise<{sowon_id, linked_identifier, binding_status, requires_verification} | {merge_candidate_status, conflict_sowon_id}>}
   */
  async linkUserExplicitIdentifier(sowon_id, identifier) {
    const { type, value, context } = identifier;
    const now = new Date();

    try {
      // Check sowon_id exists
      const sowon_check = await this.db.query(
        'SELECT sowon_id FROM sowon_identity_map WHERE sowon_id = $1',
        [sowon_id]
      );
      if (sowon_check.rows.length === 0) {
        return { error: 'SOWON_ID_NOT_FOUND' };
      }

      // Check if identifier already exists
      const existing = await this.db.query(
        `SELECT sowon_id, binding_status FROM sowon_identity_bindings
         WHERE identifier_type = $1 AND identifier_value = $2`,
        [type, value]
      );

      if (existing.rows.length > 0) {
        const binding = existing.rows[0];
        if (binding.sowon_id === sowon_id) {
          // Already linked to same SOWON_ID
          return {
            sowon_id,
            linked_identifier: this._maskIdentifier(type, value),
            binding_status: 'USER_EXPLICIT',
            requires_verification: true,
            status: 'ALREADY_LINKED'
          };
        } else if (binding.binding_status === 'VERIFIED') {
          // Conflict: VERIFIED identifier in different SOWON_ID → merge candidate
          const id = uuidv4();
          await this.db.query(
            `INSERT INTO sowon_identity_bindings
             (id, sowon_id, identifier_type, identifier_value, binding_status, linked_at, merge_candidate_resolution, merge_decision_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, sowon_id, type, value, 'USER_EXPLICIT', now, 'PENDING_USER_CONFIRMATION', null]
          );

          return {
            merge_candidate_status: 'CONFLICT_DETECTED',
            conflict_sowon_id: binding.sowon_id,
            conflict_binding_status: 'VERIFIED',
            action: 'REQUIRE_USER_CONFIRMATION'
          };
        }
      }

      // Insert new USER_EXPLICIT binding
      const id = uuidv4();
      await this.db.query(
        `INSERT INTO sowon_identity_bindings
         (id, sowon_id, identifier_type, identifier_value, binding_status, linked_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, sowon_id, type, value, 'USER_EXPLICIT', now]
      );

      return {
        sowon_id,
        linked_identifier: this._maskIdentifier(type, value),
        binding_status: 'USER_EXPLICIT',
        requires_verification: true,
        status: 'CLAIMED'
      };
    } catch (error) {
      console.error('[SowonIdentity] linkUserExplicitIdentifier error:', error.message);
      throw error;
    }
  }

  /**
   * 5. isIdentifierAvailable
   * Check if identifier is available for linking (no conflicts)
   * @param {Object} identifier - {type, value}
   * @returns {Promise<{available: boolean} | {available: false, conflict_sowon_id, conflict_binding_status}>}
   */
  async isIdentifierAvailable(identifier) {
    const { type, value } = identifier;

    try {
      const result = await this.db.query(
        `SELECT sowon_id, binding_status FROM sowon_identity_bindings
         WHERE identifier_type = $1 AND identifier_value = $2
         LIMIT 1`,
        [type, value]
      );

      if (result.rows.length === 0) {
        return { available: true };
      }

      const binding = result.rows[0];
      return {
        available: false,
        conflict_sowon_id: binding.sowon_id,
        conflict_binding_status: binding.binding_status
      };
    } catch (error) {
      console.error('[SowonIdentity] isIdentifierAvailable error:', error.message);
      throw error;
    }
  }

  /**
   * 6. getLinkedIdentifiers
   * Get all identifiers linked to a SOWON_ID (with PII masking)
   * @param {string} sowon_id
   * @returns {Promise<{sowon_id, is_anonymous, identifiers: Array, created_at, first_verified_at}>}
   */
  async getLinkedIdentifiers(sowon_id) {
    try {
      // Fetch SOWON_ID metadata
      const sowon_result = await this.db.query(
        'SELECT sowon_id, is_anonymous, created_at, first_verified_at FROM sowon_identity_map WHERE sowon_id = $1',
        [sowon_id]
      );

      if (sowon_result.rows.length === 0) {
        return { error: 'SOWON_ID_NOT_FOUND' };
      }

      const sowon = sowon_result.rows[0];

      // Fetch all bindings
      const bindings_result = await this.db.query(
        `SELECT identifier_type, identifier_value, binding_status, verification_method, linked_at, first_verified_at
         FROM sowon_identity_bindings
         WHERE sowon_id = $1
         ORDER BY linked_at ASC`,
        [sowon_id]
      );

      const identifiers = bindings_result.rows.map(b => ({
        type: b.identifier_type,
        value_masked: this._maskIdentifier(b.identifier_type, b.identifier_value),
        binding_status: b.binding_status,
        verification_method: b.verification_method,
        linked_at: b.linked_at,
        first_verified_at: b.first_verified_at
      }));

      return {
        sowon_id,
        is_anonymous: sowon.is_anonymous,
        identifiers,
        created_at: sowon.created_at,
        first_verified_at: sowon.first_verified_at
      };
    } catch (error) {
      console.error('[SowonIdentity] getLinkedIdentifiers error:', error.message);
      throw error;
    }
  }

  /**
   * 7. resolveMergeCandidate
   * Record conflict resolution decision (does NOT perform merge yet)
   * @param {Object} decision - {sowon_id_current, sowon_id_candidate, identifier, resolution}
   * @returns {Promise<{result, merge_candidate_resolution}>}
   */
  async resolveMergeCandidate(decision) {
    const { sowon_id_current, sowon_id_candidate, identifier, resolution } = decision;
    const now = new Date();

    if (!['ACCEPT', 'REJECT', 'PENDING_USER_CONFIRMATION'].includes(resolution)) {
      return { error: 'INVALID_RESOLUTION' };
    }

    try {
      // Find the binding to update
      const result = await this.db.query(
        `UPDATE sowon_identity_bindings
         SET merge_candidate_resolution = $1, merge_decision_at = $2
         WHERE sowon_id = $3 AND identifier_type = $4 AND identifier_value = $5
         RETURNING merge_candidate_resolution, merge_decision_at`,
        [resolution, now, sowon_id_current, identifier.type, identifier.value]
      );

      if (result.rows.length === 0) {
        return { error: 'BINDING_NOT_FOUND' };
      }

      return {
        result: 'RECORDED',
        merge_candidate_resolution: result.rows[0].merge_candidate_resolution,
        merge_decision_at: result.rows[0].merge_decision_at
      };
    } catch (error) {
      console.error('[SowonIdentity] resolveMergeCandidate error:', error.message);
      throw error;
    }
  }

  /**
   * Private: Mask sensitive identifier values
   * @private
   */
  _maskIdentifier(type, value) {
    if (!value) return value;

    if (type === 'phone' && value.length >= 4) {
      // e.g., "010-1234-5678" → "010-****-5678"
      return value.replace(/(.{3})-(.*)(.{4})/, '$1-****-$3');
    }

    if (type === 'email' && value.includes('@')) {
      // e.g., "user@example.com" → "u***@example.com"
      const [local, domain] = value.split('@');
      if (local.length > 1) {
        return local[0] + '***@' + domain;
      }
    }

    // Default: minimal masking
    if (value.length > 4) {
      return value.substring(0, 1) + '***' + value.substring(value.length - 1);
    }

    return value;
  }
}

module.exports = SowonIdentityService;
