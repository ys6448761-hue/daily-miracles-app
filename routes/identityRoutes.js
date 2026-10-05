'use strict';

/**
 * identityRoutes.js — Anonymous Guest Identity Bootstrap
 *
 * POST /api/dt/identity/bootstrap
 *   Issues a signed GUEST JWT + anonymous sowon_id.
 *   No DB write. No body parameters trusted.
 *   Consumed by: dreamtown-frontend/src/api/guestCredentialUtil.js
 *   Verified by: middleware/authenticatedPrincipal.js
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { GUEST_JWT_SECRET } = require('../middleware/authenticatedPrincipal');

const router = express.Router();

const GUEST_TOKEN_TTL_DAYS = parseInt(process.env.GUEST_TOKEN_TTL_DAYS || '30', 10);
const EXPIRES_IN_SECONDS = GUEST_TOKEN_TTL_DAYS * 24 * 60 * 60;

router.post('/bootstrap', (req, res) => {
  try {
    const sowon_id = uuidv4();
    const guest_principal_id = uuidv4();

    const guest_token = jwt.sign(
      {
        principal_type: 'GUEST',
        sowon_id,
        creation_source: 'anonymous_bootstrap',
      },
      GUEST_JWT_SECRET,
      { subject: guest_principal_id, expiresIn: EXPIRES_IN_SECONDS }
    );

    return res.status(201).json({
      sowon_id,
      guest_token,
      guest_principal_id,
      expires_in: EXPIRES_IN_SECONDS,
    });
  } catch (err) {
    console.error('[IDENTITY_BOOTSTRAP_ERROR]', err.message);
    return res.status(500).json({ error: 'BOOTSTRAP_FAILED' });
  }
});

module.exports = router;
