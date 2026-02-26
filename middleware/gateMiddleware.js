/**
 * Gate Middleware — 오픈 직전 사고 방지용 릴리즈 차단 게이트
 *
 * APP_DISABLED=true  → 503 점검 페이지
 */
module.exports = function gateMiddleware(req, res, next) {
  if (process.env.APP_DISABLED === 'true') {
    // 헬스 체크는 항상 통과 (Render 무한 재시작 방지)
    if (req.path === '/api/health') return next();
    return res.status(503).json({
      success: false,
      error: 'maintenance',
      message: '서비스 점검 중입니다.'
    });
  }
  next();
};
