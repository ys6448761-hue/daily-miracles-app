const express = require('express');
const router = express.Router();
const { problemQuestions, detectCategory } = require('../problem_questions');

// POST /api/problem/detect-category
// 사용자 입력에서 카테고리 자동 감지
router.post('/detect-category', (req, res) => {
  try {
    const { userInput } = req.body;

    if (!userInput) {
      return res.status(400).json({
        success: false,
        error: '사용자 입력이 필요합니다.'
      });
    }

    const detectedCategory = detectCategory(userInput);
    const categoryData = problemQuestions[detectedCategory];

    res.json({
      success: true,
      data: {
        category: detectedCategory,
        fullCategoryName: categoryData.category,
        questions: categoryData
      }
    });

  } catch (error) {
    console.error('카테고리 감지 오류:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 감지 중 오류가 발생했습니다.'
    });
  }
});

// POST /api/problem/get-question
// 특정 레벨의 질문 가져오기
router.post('/get-question', (req, res) => {
  try {
    const { category, level, previousAnswer } = req.body;

    if (!category || !level) {
      return res.status(400).json({
        success: false,
        error: '카테고리와 레벨이 필요합니다.'
      });
    }

    const categoryData = problemQuestions[category];
    if (!categoryData) {
      return res.status(404).json({
        success: false,
        error: '존재하지 않는 카테고리입니다.'
      });
    }

    const questionLevel = categoryData[`level${level}`];
    if (!questionLevel) {
      return res.status(404).json({
        success: false,
        error: '존재하지 않는 레벨입니다.'
      });
    }

    res.json({
      success: true,
      data: {
        level,
        question: questionLevel.question,
        options: questionLevel.options || null,
        isLastLevel: level === 5
      }
    });

  } catch (error) {
    console.error('질문 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '질문 조회 중 오류가 발생했습니다.'
    });
  }
});

// POST /api/problem/analyze
// 전체 대화 기록을 분석하여 결과 생성
router.post('/analyze', async (req, res) => {
  try {
    const { category, conversation } = req.body;

    if (!category || !conversation || !Array.isArray(conversation)) {
      return res.status(400).json({
        success: false,
        error: '카테고리와 대화 내역이 필요합니다.'
      });
    }

    // 대화 내역 요약
    const problemSummary = {
      category,
      level1: conversation.find(c => c.level === 1)?.answer || '',
      level2: conversation.find(c => c.level === 2)?.answer || '',
      level3: conversation.find(c => c.level === 3)?.answer || '',
      level4: conversation.find(c => c.level === 4)?.answer || '',
      level5: conversation.find(c => c.level === 5)?.answer || ''
    };

    // TODO: Claude API 연동하여 깊이 있는 분석 생성
    // 지금은 임시 응답
    const analysis = {
      problemType: category,
      coreIssue: problemSummary.level3,
      emotionalPattern: problemSummary.level4,
      desiredOutcome: problemSummary.level5,
      insight: `${category} 문제에 대한 분석이 완료되었습니다.`,
      nextSteps: [
        '문제의 근본 원인 파악',
        '감정 패턴 인식',
        '해결 방안 모색'
      ]
    };

    res.json({
      success: true,
      data: {
        summary: problemSummary,
        analysis,
        shouldConvertToWish: true // 문제→소원 전환 제안
      }
    });

  } catch (error) {
    console.error('문제 분석 오류:', error);
    res.status(500).json({
      success: false,
      error: '문제 분석 중 오류가 발생했습니다.'
    });
  }
});

// GET /api/problem/categories
// 전체 카테고리 목록 조회
router.get('/categories', (req, res) => {
  try {
    const categories = Object.keys(problemQuestions).map(key => ({
      key,
      name: problemQuestions[key].category
    }));

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// ============================================================
// 온라인 Wix 폼 전용 통합 API
// ============================================================

const { buildConversationFromWish, generateReportId } = require('../utils/wishConverter');
const { analyzeWithClaude } = require('../services/claudeAnalysisService');

/**
 * POST /api/problem/online-wish
 * Wix 폼에서 한 번에 고민을 보내고 리포트를 받는 통합 API
 *
 * Request Body:
 * {
 *   "nickname": "달빛고래",
 *   "wishSummary": "상사가 회의에서 제 의견을 무시하는 게 너무 힘들어요.",
 *   "situation": "스타트업에서 PM으로 일하고 있고...",
 *   "tries": "한 번은 개인적으로 이야기를 해보려고 했는데...",
 *   "constraints": "퇴사는 최대한 피하고 싶어요. 가족 시간은 지키고 싶어요.",
 *   "focus": "지금 당장 제가 어떤 행동을 해보면 좋을지 알고 싶어요.",
 *   "email": "user@example.com" (선택),
 *   "wixUserId": "wix_12345" (선택)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "nickname": "달빛고래",
 *     "detectedCategory": "직장",
 *     "categoryName": "직장/업무",
 *     "analysis": {
 *       "summary": "...",
 *       "coreIssue": "...",
 *       "insights": [...],
 *       "options": [...],
 *       "nextActions": [...]
 *     },
 *     "reportId": "report_1702345678_abc123",
 *     "timestamp": "2025-12-12T...",
 *     "processingTime": 1234
 *   }
 * }
 */
router.post('/online-wish', async (req, res) => {
  const startTime = Date.now();

  try {
    // 1. 입력 검증
    const { nickname, wishSummary, situation, tries, constraints, focus, email, wixUserId } = req.body;

    if (!nickname || !wishSummary) {
      return res.status(400).json({
        success: false,
        error: 'nickname과 wishSummary는 필수 입력입니다.',
        hint: '최소한 닉네임과 고민 요약을 입력해주세요.'
      });
    }

    console.log(`📝 온라인 고민 접수: ${nickname} - ${wishSummary.substring(0, 30)}...`);

    // 2. Conversation 구조 생성
    const { category, categoryName, conversation } = buildConversationFromWish({
      wishSummary,
      situation,
      tries,
      constraints,
      focus
    });

    console.log(`🎯 카테고리 감지: ${categoryName} (${category})`);
    console.log(`📋 Conversation 생성 완료 (${conversation.length}개 레벨)`);

    // 3. Claude API로 분석
    console.log('🤖 Claude 분석 시작...');
    const analysis = await analyzeWithClaude({
      category,
      categoryName,
      conversation,
      nickname
    });
    console.log('✅ Claude 분석 완료');

    // 4. 리포트 ID 생성
    const reportId = generateReportId();
    const processingTime = Date.now() - startTime;

    // 5. 응답 반환
    const response = {
      success: true,
      data: {
        // 기본 정보
        nickname,
        detectedCategory: category,
        categoryName,

        // 분석 결과
        analysis,

        // 메타데이터
        reportId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    };

    console.log(`✅ 리포트 생성 완료: ${reportId} (${processingTime}ms)`);

    // 6. (선택) DB 저장 or 이메일 전송
    // TODO: 나중에 구현
    if (email) {
      console.log(`📧 이메일 전송 예정: ${email}`);
      // await sendReportEmail(email, response.data);
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 온라인 고민 처리 오류:', error);

    return res.status(500).json({
      success: false,
      error: '분석 처리 중 오류가 발생했습니다.',
      message: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

module.exports = router;