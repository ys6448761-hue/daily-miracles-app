// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - Authentication Routes
// ═══════════════════════════════════════════════════════════
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// DB 연결 (선택적 로딩)
let db = null;
try {
    db = require('../database/db');
} catch (error) {
    console.error('⚠️ DB 모듈 로드 실패 (authRoutes):', error.message);
}

// JWT 비밀키 (환경변수에서 가져오거나 기본값 사용)
const JWT_SECRET = process.env.JWT_SECRET || 'daily-miracles-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ───────────────────────────────────────────────────────────
// POST /api/auth/signup - 회원가입
// ───────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // 입력 검증
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'missing_fields',
                message: '이메일과 비밀번호는 필수입니다'
            });
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'invalid_email',
                message: '올바른 이메일 형식이 아닙니다'
            });
        }

        // 비밀번호 길이 검증
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'weak_password',
                message: '비밀번호는 최소 6자 이상이어야 합니다'
            });
        }

        // DB 연결 확인
        if (!db) {
            return res.status(500).json({
                success: false,
                error: 'db_unavailable',
                message: '데이터베이스 연결을 사용할 수 없습니다'
            });
        }

        // 이메일 중복 확인
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'email_exists',
                message: '이미 가입된 이메일입니다'
            });
        }

        // 비밀번호 해싱
        const passwordHash = await bcrypt.hash(password, 10);

        // 사용자 생성
        const result = await db.query(
            `INSERT INTO users (email, password_hash, name, user_agent, last_ip_address)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, name, created_at`,
            [
                email.toLowerCase(),
                passwordHash,
                name || null,
                req.headers['user-agent'] || null,
                req.ip || null
            ]
        );

        const user = result.rows[0];

        // JWT 토큰 생성
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log(`✅ 회원가입 성공: ${user.email}`);

        return res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('💥 회원가입 오류:', error);
        return res.status(500).json({
            success: false,
            error: 'signup_failed',
            message: '회원가입 처리 중 오류가 발생했습니다'
        });
    }
});

// ───────────────────────────────────────────────────────────
// POST /api/auth/login - 로그인
// ───────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 입력 검증
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'missing_credentials',
                message: '이메일과 비밀번호를 입력해주세요'
            });
        }

        // DB 연결 확인
        if (!db) {
            return res.status(500).json({
                success: false,
                error: 'db_unavailable',
                message: '데이터베이스 연결을 사용할 수 없습니다'
            });
        }

        // 사용자 조회
        const result = await db.query(
            `SELECT id, email, password_hash, name, is_active, is_email_verified
             FROM users
             WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'invalid_credentials',
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            });
        }

        const user = result.rows[0];

        // 계정 활성화 확인
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: 'account_disabled',
                message: '비활성화된 계정입니다. 관리자에게 문의하세요'
            });
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'invalid_credentials',
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            });
        }

        // 마지막 로그인 시간 업데이트
        await db.query(
            `UPDATE users
             SET last_login_at = CURRENT_TIMESTAMP,
                 last_ip_address = $1,
                 user_agent = $2
             WHERE id = $3`,
            [req.ip || null, req.headers['user-agent'] || null, user.id]
        );

        // JWT 토큰 생성
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log(`✅ 로그인 성공: ${user.email}`);

        return res.status(200).json({
            success: true,
            message: '로그인 성공',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isEmailVerified: user.is_email_verified
            }
        });

    } catch (error) {
        console.error('💥 로그인 오류:', error);
        return res.status(500).json({
            success: false,
            error: 'login_failed',
            message: '로그인 처리 중 오류가 발생했습니다'
        });
    }
});

// ───────────────────────────────────────────────────────────
// POST /api/auth/forgot-password - 비밀번호 재설정 요청
// ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'missing_email',
                message: '이메일을 입력해주세요'
            });
        }

        // DB 연결 확인
        if (!db) {
            return res.status(500).json({
                success: false,
                error: 'db_unavailable',
                message: '데이터베이스 연결을 사용할 수 없습니다'
            });
        }

        // 사용자 조회
        const result = await db.query(
            'SELECT id, email FROM users WHERE email = $1 AND is_active = true',
            [email.toLowerCase()]
        );

        // 보안을 위해 사용자가 없어도 성공 메시지 반환
        if (result.rows.length === 0) {
            console.log(`⚠️ 비밀번호 재설정 요청: 존재하지 않는 이메일 ${email}`);
            return res.status(200).json({
                success: true,
                message: '비밀번호 재설정 링크가 이메일로 전송되었습니다'
            });
        }

        const user = result.rows[0];

        // 재설정 토큰 생성 (UUID)
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 3600000); // 1시간 후 만료

        // 토큰 저장
        await db.query(
            `UPDATE users
             SET reset_token = $1,
                 reset_token_expires_at = $2
             WHERE id = $3`,
            [resetToken, expiresAt, user.id]
        );

        console.log(`✅ 비밀번호 재설정 토큰 생성: ${user.email}`);

        // TODO: 실제로는 이메일 전송 서비스 연동 필요
        // 개발 단계에서는 토큰을 로그로 출력
        console.log(`🔑 Reset Token: ${resetToken}`);
        console.log(`🔗 Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password.html?token=${resetToken}`);

        return res.status(200).json({
            success: true,
            message: '비밀번호 재설정 링크가 이메일로 전송되었습니다',
            // 개발 환경에서만 토큰 반환
            ...(process.env.NODE_ENV === 'development' && { resetToken })
        });

    } catch (error) {
        console.error('💥 비밀번호 재설정 요청 오류:', error);
        return res.status(500).json({
            success: false,
            error: 'forgot_password_failed',
            message: '비밀번호 재설정 요청 처리 중 오류가 발생했습니다'
        });
    }
});

// ───────────────────────────────────────────────────────────
// POST /api/auth/reset-password - 비밀번호 재설정 실행
// ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'missing_fields',
                message: '토큰과 새 비밀번호를 입력해주세요'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'weak_password',
                message: '비밀번호는 최소 6자 이상이어야 합니다'
            });
        }

        // DB 연결 확인
        if (!db) {
            return res.status(500).json({
                success: false,
                error: 'db_unavailable',
                message: '데이터베이스 연결을 사용할 수 없습니다'
            });
        }

        // 토큰으로 사용자 조회
        const result = await db.query(
            `SELECT id, email
             FROM users
             WHERE reset_token = $1
               AND reset_token_expires_at > CURRENT_TIMESTAMP
               AND is_active = true`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'invalid_token',
                message: '유효하지 않거나 만료된 토큰입니다'
            });
        }

        const user = result.rows[0];

        // 새 비밀번호 해싱
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // 비밀번호 업데이트 및 토큰 제거
        await db.query(
            `UPDATE users
             SET password_hash = $1,
                 reset_token = NULL,
                 reset_token_expires_at = NULL
             WHERE id = $2`,
            [passwordHash, user.id]
        );

        console.log(`✅ 비밀번호 재설정 완료: ${user.email}`);

        return res.status(200).json({
            success: true,
            message: '비밀번호가 성공적으로 재설정되었습니다'
        });

    } catch (error) {
        console.error('💥 비밀번호 재설정 오류:', error);
        return res.status(500).json({
            success: false,
            error: 'reset_password_failed',
            message: '비밀번호 재설정 처리 중 오류가 발생했습니다'
        });
    }
});

// ───────────────────────────────────────────────────────────
// GET /api/auth/verify - 토큰 검증 (미들웨어용)
// ───────────────────────────────────────────────────────────
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'no_token',
                message: '토큰이 제공되지 않았습니다'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // DB에서 사용자 정보 조회
        if (db) {
            const result = await db.query(
                'SELECT id, email, name, is_active FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (result.rows.length === 0 || !result.rows[0].is_active) {
                return res.status(401).json({
                    success: false,
                    error: 'invalid_user',
                    message: '유효하지 않은 사용자입니다'
                });
            }

            return res.status(200).json({
                success: true,
                user: {
                    id: result.rows[0].id,
                    email: result.rows[0].email,
                    name: result.rows[0].name
                }
            });
        }

        return res.status(200).json({
            success: true,
            user: { userId: decoded.userId, email: decoded.email }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'token_expired',
                message: '토큰이 만료되었습니다'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'invalid_token',
            message: '유효하지 않은 토큰입니다'
        });
    }
});

module.exports = router;
