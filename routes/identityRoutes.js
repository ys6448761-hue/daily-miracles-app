'use strict';

/**
 * identityRoutes.js — Generic Anonymous SOWON Identity Bootstrap
 *
 * POST /api/dt/identity/bootstrap
 *
 * Issues a server-signed GUEST credential for any anonymous-first DreamTown
 * experience that requires requireAuthenticatedPrincipal before the user
 * has a USER account.
 *
 * Invariants:
 *   - Client body is IGNORED entirely — caller cannot control any identity field
 *   - creation_source = 'anonymous_bootstrap' (domain-neutral)
 *   - No domain events emitted
 *   - Every call creates a NEW anonymous SOWON_ID (no idempotency)
 */

const router = require('express').Router();
const db = require('../database/db');
const SowonIdentityService = require('../services/sowonIdentityService');
const guestCredentialService = require('../services/guestCredentialService');

router.post('/bootstrap', async (req, res) => {
  // Client body is intentionally ignored — no fields from req.body are used
  try {
    const identityService = new SowonIdentityService(db);
    const sowon = await identityService.createAnonymousSowon('anonymous_bootstrap');
    const credential = await guestCredentialService.issueGuestCredential(sowon.sowon_id);

    return res.status(201).json({
      sowon_id: credential.sowon_id,
      guest_token: credential.token,
      guest_principal_id: credential.guest_principal_id,
      expires_in: credential.expires_in
    });
  } catch (err) {
    console.error('[identity/bootstrap] error:', err.message);
    return res.status(500).json({ error: 'INTERNAL_ERROR', code: 'BOOTSTRAP_FAILED' });
  }
});

module.exports = router;
