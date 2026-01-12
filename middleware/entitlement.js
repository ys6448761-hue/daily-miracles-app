/**
 * ═══════════════════════════════════════════════════════════
 * Entitlement Middleware - P0 확장 버전
 * ═══════════════════════════════════════════════════════════
 *
 * 지원하는 권한:
 * - trial: 7일 무료 체험
 * - wish_30: 소원실현 30일 프로그램
 * - solve_30: 문제해결 30일 프로그램
 * - dual_30: 듀얼 30일 프로그램
 *
 * 지원하는 인증 방식:
 * - JWT (Authorization: Bearer xxx) - 회원
 * - trial_token (query: ?token=xxx) - 트라이얼
 * - guest_access_token (query: ?token=xxx) - 비회원 결제
 */

const jwt = require('jsonwebtoken');

// JWT 비밀키
const JWT_SECRET = process.env.JWT_SECRET || 'daily-miracles-secret-key-change-in-production';

// 유효 권한 키 목록
const VALID_ENTITLEMENTS = ['trial', 'wish_30', 'solve_30', 'dual_30'];

// DB 모듈 (선택적 로딩 - 실패 시 deny)
let db = null;
try {
  db = require("../database/db");
} catch (error) {
  console.error("⚠️ [Entitlement] DB 모듈 로드 실패:", error.message);
}

/**
 * 복수 권한 중 하나라도 있으면 통과
 * @param {string[]} allowedEntitlements - 허용할 권한 키 목록
 */
function requireAnyEntitlement(allowedEntitlements = VALID_ENTITLEMENTS) {
  return async (req, res, next) => {
    try {
      // DB 모듈 로딩 실패 시 deny
      if (!db) {
        console.warn("❌ [Entitlement] DB 없음 - 접근 거부");
        return res.status(403).json({
          success: false,
          error: "access_denied",
          message: "서비스 이용 권한이 없습니다",
          redirect: "/program"
        });
      }

      // 토큰 추출 (헤더 > 쿼리 > 쿠키)
      let token = extractToken(req);

      // 토큰 없음 - 403 + redirect
      if (!token) {
        console.log("❌ [Entitlement] 토큰 없음 - 접근 거부");
        return res.status(403).json({
          success: false,
          error: "no_token",
          message: "로그인이 필요합니다",
          redirect: "/program"
        });
      }

      // 권한 확인
      const entitlementResult = await checkEntitlement(token, allowedEntitlements);

      if (!entitlementResult.hasAccess) {
        console.log(`❌ [Entitlement] 권한 없음 - token: ${token.substring(0, 20)}...`);
        return res.status(403).json({
          success: false,
          error: "insufficient_entitlement",
          message: "이용 권한이 없습니다. 프로그램을 구매해주세요.",
          redirect: "/program"
        });
      }

      // 권한 확인 완료 - 사용자 정보를 req에 첨부
      req.user = entitlementResult.user;
      req.entitlements = entitlementResult.entitlements;

      console.log(`✅ [Entitlement] 권한 확인 완료 - ${entitlementResult.authType}: ${entitlementResult.identifier}, 권한: ${entitlementResult.entitlements.join(', ')}`);
      next();

    } catch (error) {
      console.error("💥 [Entitlement] 오류:", error);
      return res.status(403).json({
        success: false,
        error: "auth_error",
        message: "권한 확인 중 오류가 발생했습니다",
        redirect: "/program"
      });
    }
  };
}

/**
 * 단일 권한 요구 (기존 호환성)
 */
function requireEntitlement(requiredEntitlement = 'trial') {
  // trial 요청 시 모든 유효 권한 허용 (trial 또는 paid)
  if (requiredEntitlement === 'trial') {
    return requireAnyEntitlement(VALID_ENTITLEMENTS);
  }
  return requireAnyEntitlement([requiredEntitlement]);
}

/**
 * 토큰 추출 헬퍼
 */
function extractToken(req) {
  // 1) Authorization 헤더
  const authHeader = req.headers.authorization;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return authHeader;
  }

  // 2) Query parameter
  if (req.query.token) {
    return req.query.token;
  }

  // 3) Cookie
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }

  return null;
}

/**
 * 권한 확인 (통합)
 */
async function checkEntitlement(token, allowedEntitlements) {
  const result = {
    hasAccess: false,
    authType: null,
    identifier: null,
    user: null,
    entitlements: []
  };

  // 1) JWT 토큰 검증 시도 (회원)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.userId) {
      const userResult = await db.query(
        `SELECT id, email, is_active FROM users WHERE id = $1 AND is_active = true`,
        [decoded.userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        result.authType = 'user';
        result.identifier = user.email;
        result.user = { id: user.id, email: user.email };

        // entitlements 테이블에서 권한 조회
        const entResult = await db.query(
          `SELECT entitlement_key FROM entitlements
           WHERE subject_type = 'user' AND subject_id = $1
           AND is_active = true AND end_at > CURRENT_TIMESTAMP`,
          [user.id]
        );

        result.entitlements = entResult.rows.map(r => r.entitlement_key);

        // 회원은 기본 trial 권한 부여 (임시)
        if (!result.entitlements.includes('trial')) {
          result.entitlements.push('trial');
        }

        // 허용된 권한 중 하나라도 있으면 통과
        result.hasAccess = result.entitlements.some(e => allowedEntitlements.includes(e));
        return result;
      }
    }
  } catch (jwtError) {
    // JWT 아님 - 다른 방식 시도
  }

  // 2) Trial 토큰 검증 (trial subject)
  const trialResult = await db.query(
    `SELECT entitlement_key FROM entitlements
     WHERE subject_type = 'trial' AND subject_id = $1
     AND is_active = true AND end_at > CURRENT_TIMESTAMP`,
    [token]
  );

  if (trialResult.rows.length > 0) {
    result.authType = 'trial';
    result.identifier = token.substring(0, 16) + '...';
    result.user = { token, type: 'trial' };
    result.entitlements = trialResult.rows.map(r => r.entitlement_key);
    result.hasAccess = result.entitlements.some(e => allowedEntitlements.includes(e));

    if (result.hasAccess) return result;
  }

  // 3) Guest Access 토큰 검증 (guest subject)
  const guestResult = await db.query(
    `SELECT entitlement_key FROM entitlements
     WHERE subject_type = 'guest' AND subject_id = $1
     AND is_active = true AND end_at > CURRENT_TIMESTAMP`,
    [token]
  );

  if (guestResult.rows.length > 0) {
    result.authType = 'guest';
    result.identifier = token.substring(0, 16) + '...';
    result.user = { token, type: 'guest' };
    result.entitlements = guestResult.rows.map(r => r.entitlement_key);
    result.hasAccess = result.entitlements.some(e => allowedEntitlements.includes(e));

    if (result.hasAccess) return result;
  }

  // 4) 64자 hex 토큰이면 임시 trial로 처리 (하위 호환)
  if (token.length === 64 && /^[0-9a-f]+$/i.test(token)) {
    result.authType = 'legacy_trial';
    result.identifier = token.substring(0, 16) + '...';
    result.user = { token, type: 'trial' };
    result.entitlements = ['trial'];
    result.hasAccess = allowedEntitlements.includes('trial');
    return result;
  }

  return result;
}

/**
 * 간편 토큰 체크 (DB 조회 없음)
 */
function requireToken() {
  return (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
      return res.status(403).json({
        success: false,
        error: "no_token",
        message: "로그인이 필요합니다",
        redirect: "/program"
      });
    }

    req.token = token;
    next();
  };
}

module.exports = {
  requireEntitlement,
  requireAnyEntitlement,
  requireToken,
  VALID_ENTITLEMENTS
};
