'use strict';

/**
 * flowAdminRoutes.js — FLOW admin inventory management
 *
 * All routes require X-Admin-Token (requireAdmin — no dev bypass).
 *
 * POST /api/admin/flow/inventory        — create allocation for a date
 * GET  /api/admin/flow/inventory        — list inventory records
 * PATCH /api/admin/flow/inventory/:id  — update allocation / status / cutoff
 */

const router = require('express').Router();
const db     = require('../database/db');
const { requireAdmin } = require('../middleware/adminGuard');

router.use(requireAdmin);

// ─── POST /inventory ─────────────────────────────────────────────────────────
router.post('/inventory', async (req, res) => {
  const { accommodation_id, stay_date, allocated_count, cutoff_date, status } = req.body;

  if (!accommodation_id || !stay_date || allocated_count === undefined) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code:  'MISSING_PARAMS',
      required: ['accommodation_id', 'stay_date', 'allocated_count']
    });
  }

  if (typeof allocated_count !== 'number' || allocated_count < 0) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code:  'INVALID_ALLOCATED_COUNT'
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO dt_flow_inventory
         (accommodation_id, stay_date, allocated_count, cutoff_date, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (accommodation_id, stay_date)
       DO UPDATE SET
         allocated_count = EXCLUDED.allocated_count,
         cutoff_date     = COALESCE(EXCLUDED.cutoff_date, dt_flow_inventory.cutoff_date),
         status          = COALESCE(EXCLUDED.status, dt_flow_inventory.status),
         updated_at      = NOW()
       RETURNING *`,
      [
        accommodation_id,
        stay_date,
        allocated_count,
        cutoff_date || null,
        status || 'open'
      ]
    );

    return res.status(201).json({ inventory: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ error: 'NOT_FOUND', code: 'ACCOMMODATION_NOT_FOUND' });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ─── GET /inventory ──────────────────────────────────────────────────────────
router.get('/inventory', async (req, res) => {
  const { accommodation_id, date_from, date_to } = req.query;

  let whereClause = '';
  const params = [];

  if (accommodation_id) {
    params.push(accommodation_id);
    whereClause += ` AND fi.accommodation_id = $${params.length}`;
  }
  if (date_from) {
    params.push(date_from);
    whereClause += ` AND fi.stay_date >= $${params.length}`;
  }
  if (date_to) {
    params.push(date_to);
    whereClause += ` AND fi.stay_date <= $${params.length}`;
  }

  try {
    const result = await db.query(
      `SELECT
         fi.*,
         COALESCE(h.active_held, 0)::integer       AS active_held,
         COALESCE(b.confirmed_booked, 0)::integer  AS confirmed_booked,
         (fi.allocated_count
           - COALESCE(h.active_held, 0)
           - COALESCE(b.confirmed_booked, 0))::integer AS available
       FROM dt_flow_inventory fi
       LEFT JOIN (
         SELECT inventory_id, SUM(quantity) AS active_held
         FROM dt_flow_holds
         WHERE status = 'active' AND expires_at > NOW()
         GROUP BY inventory_id
       ) h ON h.inventory_id = fi.id
       LEFT JOIN (
         SELECT inventory_id, SUM(quantity) AS confirmed_booked
         FROM dt_flow_bookings
         WHERE status = 'confirmed'
         GROUP BY inventory_id
       ) b ON b.inventory_id = fi.id
       WHERE 1=1 ${whereClause}
       ORDER BY fi.stay_date ASC`,
      params
    );

    return res.json({ inventory: result.rows, total: result.rows.length });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ─── PATCH /inventory/:id ────────────────────────────────────────────────────
router.patch('/inventory/:id', async (req, res) => {
  const { allocated_count, cutoff_date, status } = req.body;

  if (allocated_count === undefined && !cutoff_date && !status) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code:  'NO_UPDATABLE_FIELDS',
      updatable: ['allocated_count', 'cutoff_date', 'status']
    });
  }

  if (allocated_count !== undefined && (typeof allocated_count !== 'number' || allocated_count < 0)) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code:  'INVALID_ALLOCATED_COUNT'
    });
  }

  if (status && !['open', 'closed', 'sold_out'].includes(status)) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code:  'INVALID_STATUS'
    });
  }

  const sets = [];
  const params = [req.params.id];

  if (allocated_count !== undefined) {
    params.push(allocated_count);
    sets.push(`allocated_count = $${params.length}`);
  }
  if (cutoff_date !== undefined) {
    params.push(cutoff_date);
    sets.push(`cutoff_date = $${params.length}`);
  }
  if (status) {
    params.push(status);
    sets.push(`status = $${params.length}`);
  }
  sets.push('updated_at = NOW()');

  try {
    const result = await db.query(
      `UPDATE dt_flow_inventory SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING *`,
      params
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'NOT_FOUND', code: 'INVENTORY_NOT_FOUND' });
    }

    return res.json({ inventory: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
