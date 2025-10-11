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

module.exports = router;