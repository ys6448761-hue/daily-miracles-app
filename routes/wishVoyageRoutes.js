const express = require('express');
const router = express.Router();
const { calculateWishVoyageIndex } = require('../utils/wishVoyageIndex');

/**
 * POST /score
 * 소원항해 지수를 계산하는 엔드포인트
 *
 * Request Body:
 * {
 *   execution: number,   // 실행력 (0~20)
 *   readiness: number,   // 준비도 (0~20)
 *   wish: number,        // 소원 명확도 (0~20)
 *   partner: number,     // 파트너 지원 (0~20)
 *   mood: number         // 기분/동기 (0~20)
 * }
 *
 * Response:
 * {
 *   score: number,       // 최종 점수 (50~100)
 *   level: string,       // 항해 등급 ("기적항해", "순항항해", "성장항해", "준비항해")
 *   factors: object      // 입력된 요인들
 * }
 */
router.post('/score', async (req, res) => {
  try {
    const { execution, readiness, wish, partner, mood } = req.body;

    // calculateWishVoyageIndex 호출
    const result = calculateWishVoyageIndex({
      execution,
      readiness,
      wish,
      partner,
      mood
    });

    // 응답에 factors도 포함
    res.json({
      score: result.score,
      level: result.level,
      factors: {
        execution,
        readiness,
        wish,
        partner,
        mood
      }
    });

  } catch (error) {
    console.error('소원항해 지수 계산 오류:', error);

    // 유효성 검사 오류인 경우 400 반환
    res.status(400).json({
      error: '각 요인은 0~20 사이의 숫자여야 합니다.'
    });
  }
});

module.exports = router;
