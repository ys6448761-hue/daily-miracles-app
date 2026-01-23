/**
 * shortLinkRoutes.js
 *
 * 단축 링크 라우트 (/r/{token})
 * - 카카오톡 인앱브라우저 호환
 * - 404 방지를 위한 안전한 리다이렉트
 *
 * @version 1.0 - 2026.01.05
 */

const express = require('express');
const router = express.Router();

// DB 연결 (결과 조회용)
let db = null;
try {
    db = require('../database/db');
} catch (e) {
    console.warn('[ShortLink] DB 모듈 로드 실패');
}

// 이벤트 로거
let eventLogger = null;
try {
    eventLogger = require('../services/eventLogger');
} catch (e) {
    console.warn('[ShortLink] eventLogger 로드 실패');
}

/**
 * GET /r/:token
 * 결과 페이지로 리다이렉트
 *
 * token = conversation.id 또는 wish_id
 */
router.get('/:token', async (req, res) => {
    const { token } = req.params;
    const userAgent = req.headers['user-agent'] || '';

    // 카카오톡 인앱브라우저 감지
    const isKakaoInApp = userAgent.includes('KAKAOTALK');

    console.log(`[ShortLink] 접근: /r/${token}`, {
        token,
        isKakaoInApp,
        userAgent: userAgent.substring(0, 100)
    });

    // 이벤트 로깅
    if (eventLogger) {
        try {
            await eventLogger.logEvent('link_click', {
                token,
                source: isKakaoInApp ? 'kakao_inapp' : 'browser',
                user_agent: userAgent.substring(0, 200)
            }, { source: 'shortLink', env: process.env.NODE_ENV === 'production' ? 'prod' : 'test' });
        } catch (e) {
            // 로깅 실패해도 리다이렉트는 계속
        }
    }

    // 토큰 검증 (선택적 - DB 조회)
    let resultExists = true;
    if (db && token) {
        try {
            // conversations 테이블에서 확인
            const result = await db.query(
                'SELECT id FROM conversations WHERE id = $1 LIMIT 1',
                [token]
            );
            resultExists = result.rows.length > 0;

            if (!resultExists) {
                // wishes 테이블에서도 확인
                const wishResult = await db.query(
                    'SELECT id FROM wishes WHERE id = $1 LIMIT 1',
                    [token]
                );
                resultExists = wishResult.rows.length > 0;
            }
        } catch (err) {
            console.warn('[ShortLink] DB 조회 실패:', err.message);
            // DB 오류 시에도 리다이렉트 시도
            resultExists = true;
        }
    }

    // 결과가 없으면 메인 페이지로
    if (!resultExists) {
        console.log(`[ShortLink] 결과 없음 → 메인으로 리다이렉트: ${token}`);
        return res.redirect('/');
    }

    // 결과 페이지로 리다이렉트
    // /result/{token} 또는 /daily-miracles-result.html?id={token}
    const targetUrl = `/result/${token}`;

    console.log(`[ShortLink] 리다이렉트: ${targetUrl}`);

    // 카카오톡 인앱브라우저는 302 리다이렉트
    // 일반 브라우저는 301 (캐싱 가능)
    const statusCode = isKakaoInApp ? 302 : 301;
    res.redirect(statusCode, targetUrl);
});

/**
 * GET /r/:token/preview
 * 미리보기 (메타태그용)
 */
router.get('/:token/preview', async (req, res) => {
    const { token } = req.params;

    // OG 메타태그용 HTML 반환
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>기적 분석 결과 - 하루하루의 기적</title>
    <meta property="og:title" content="기적 분석 결과가 도착했어요! ✨" />
    <meta property="og:description" content="나만의 30일 로드맵이 준비되었습니다. 지금 확인해보세요!" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${process.env.APP_BASE_URL || 'https://app.dailymiracles.kr'}/r/${token}" />
    <meta http-equiv="refresh" content="0;url=/result/${token}" />
</head>
<body>
    <p>잠시만 기다려주세요... <a href="/result/${token}">여기를 클릭</a></p>
</body>
</html>
    `);
});

module.exports = router;
