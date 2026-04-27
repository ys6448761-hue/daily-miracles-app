'use strict';
/**
 * locationAdminAuthRoutes.js — 장소 관리자 로그인
 * prefix: /api/admin
 *
 * POST /login  — username + password → session token (JWT)
 */

const router = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database/db');

const JWT_SECRET  = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'daily-miracles-admin-secret';
const JWT_EXPIRES = '24h';

// ── POST /login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'username, password 필수' });
    }

    // 1. 관리자 조회
    let row;
    try {
      const { rows } = await db.query(
        `SELECT id, username, location, password AS pw_hash, is_active
         FROM location_admins WHERE username = $1`,
        [username.trim()]
      );
      row = rows[0];
    } catch (dbErr) {
      if (dbErr.code === '42P01') {
        return res.status(503).json({ success: false, error: 'location_admins 테이블 초기화 중. 잠시 후 재시도', migration: '147' });
      }
      throw dbErr;
    }

    if (!row) {
      return res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    if (!row.is_active) {
      return res.status(403).json({ success: false, error: '비활성화된 계정입니다.' });
    }

    // 2. bcrypt 검증
    const isValid = await bcrypt.compare(password, row.pw_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 3. JWT 발급
    const token = jwt.sign(
      { adminId: row.id, username: row.username, location: row.location },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    console.log(`[admin/login] 성공 | username:${row.username} | location:${row.location}`);

    return res.json({
      success:  true,
      token,
      username: row.username,
      location: row.location,
    });
  } catch (err) {
    console.error('[admin/login] 오류:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
