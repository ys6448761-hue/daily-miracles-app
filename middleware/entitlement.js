/**
 * Entitlement Middleware - Trial 권한 검증
 *
 * P0 요구사항:
 * - /api/daily-messages, /api/roadmap 접근 제어
 * - 무토큰: 403 + redirect '/program'
 * - trial token: 200 OK
 * - DB 모듈 로딩 실패 시 deny
 */

const jwt = require('jsonwebtoken');

// JWT 비밀키
const JWT_SECRET = process.env.JWT_SECRET || 'daily-miracles-secret-key-change-in-production';

// DB 모듈 (선택적 로딩 - 실패 시 deny)
let db = null;
try {
  db = require("../database/db");
} catch (error) {
  console.error("⚠️ [Entitlement] DB 모듈 로드 실패:", error.message);
}

/**
 * Trial 토큰 검증 미들웨어
 * @param {string} requiredEntitlement - 필요한 권한 레벨 ('trial' 등)
 */
function requireEntitlement(requiredEntitlement = 'trial') {
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

      // Authorization 헤더에서 토큰 추출
      const authHeader = req.headers.authorization;
      let token = null;

      if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        } else {
          token = authHeader;
        }
      }

      // 쿼리 파라미터에서도 토큰 체크 (대체 방식)
      if (!token && req.query.token) {
        token = req.query.token;
      }

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

      // 토큰 검증 (JWT 우선, session_token 폴백)
      let user = null;

      // 1) JWT 토큰 검증 시도
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.userId) {
          const userResult = await db.query(
            `SELECT id, email, is_active, created_at
             FROM users
             WHERE id = $1 AND is_active = true`,
            [decoded.userId]
          );
          if (userResult.rows.length > 0) {
            user = userResult.rows[0];
            // 임시: 가입된 사용자는 모두 trial 권한 부여 (entitlement 컬럼 추가 전까지)
            user.entitlement = 'trial';
            console.log(`✅ [Entitlement] JWT 검증 성공 - user: ${user.email}`);
          }
        }
      } catch (jwtError) {
        // JWT 검증 실패 시 로그
        console.log(`ℹ️ [Entitlement] JWT 검증 실패: ${jwtError.message}`);
      }

      if (!user) {
        console.log("❌ [Entitlement] 유효하지 않은 토큰 - 접근 거부");
        return res.status(403).json({
          success: false,
          error: "invalid_token",
          message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          redirect: "/program"
        });
      }

      // Trial 권한 체크
      if (requiredEntitlement === 'trial') {
        const now = new Date();
        const trialEnd = user.trial_end ? new Date(user.trial_end) : null;

        // trial 권한이 있고 기간 내인지 확인
        const hasTrialEntitlement =
          user.entitlement === 'trial' ||
          user.entitlement === 'paid' ||
          user.entitlement === 'premium';

        const isWithinTrial = trialEnd ? now <= trialEnd : true;

        if (!hasTrialEntitlement || !isWithinTrial) {
          console.log(`❌ [Entitlement] 권한 부족 - user: ${user.email}, entitlement: ${user.entitlement}`);
          return res.status(403).json({
            success: false,
            error: "insufficient_entitlement",
            message: "체험 기간이 만료되었습니다. 프로그램을 구매해주세요.",
            redirect: "/program"
          });
        }
      }

      // 권한 확인 완료 - 사용자 정보를 req에 첨부
      req.user = {
        id: user.id,
        email: user.email,
        entitlement: user.entitlement
      };

      console.log(`✅ [Entitlement] 권한 확인 완료 - user: ${user.email}, entitlement: ${user.entitlement}`);
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
 * 간편 권한 체크 (토큰만 확인, DB 조회 없음)
 * 개발/테스트 환경용
 */
function requireToken() {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader || req.query.token;

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
  requireToken
};
