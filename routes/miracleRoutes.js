const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 통합 점수 엔진 v2.0
const { calculateUnifiedScore, ENERGY_TYPES, VERSION: SCORE_VERSION } = require('../services/miracleScoreEngine');

// 메시지 프로바이더 (SENS 알림톡/SMS)
let messageProvider = null;
try {
    messageProvider = require('../services/messageProvider');
    console.log('[Miracle] messageProvider 로드 성공:', messageProvider.getConfig());
} catch (e) {
    console.warn('[Miracle] messageProvider 로드 실패:', e.message);
}

// In-memory storage (server.js와 공유하려면 별도 파일로 분리 권장)
const conversations = new Map();

// 기적지수 계산
router.post('/calculate', async (req, res) => {
  try {
    const { conversationId, nickname, birthdate, todayFeeling, recentEvent, hopeMessage, phone, sendResult = false } = req.body;

    // conversationId가 있으면 기존 conversation 사용, 없으면 새로 생성
    let conversation;
    if (conversationId) {
      conversation = conversations.get(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
    } else {
      // 새로운 conversation 생성
      const newConversationId = crypto.randomUUID();
      conversation = {
        id: newConversationId,
        mode: 'miracle',
        answers: [],
        createdAt: new Date()
      };

      // 답변 저장
      if (nickname) conversation.answers.push({ question: '닉네임', answer: nickname });
      if (birthdate) conversation.answers.push({ question: '생년월일', answer: birthdate });
      if (todayFeeling) conversation.answers.push({ question: '오늘의 기분', answer: todayFeeling });
      if (recentEvent) conversation.answers.push({ question: '최근 일', answer: recentEvent });
      if (hopeMessage) conversation.answers.push({ question: '희망 메시지', answer: hopeMessage });

      conversations.set(newConversationId, conversation);
    }

    // 통합 기적지수 계산 (v2.0)
    const contentFromAnswers = conversation.answers
        .map(a => `${a.question}: ${a.answer}`)
        .join(' ');

    const scoreResult = calculateUnifiedScore({
        content: contentFromAnswers,
        name: nickname || '소원이',
        phone: phone || '',
        responses: conversation.answers.reduce((acc, a) => {
            acc[a.question] = a.answer;
            return acc;
        }, {}),
        mode: 'problem'
    });

    const miracleIndex = scoreResult.success ? scoreResult.final_score : 70;

    // 5가지 예측 생성
    const predictions = generatePredictions(miracleIndex, conversation.answers);

    // 종합 분석 생성
    const analysis = generateAnalysis(conversation.answers);

    // 결과 페이지 URL 생성
    const baseUrl = process.env.BASE_URL || 'https://daily-miracles-app.onrender.com';
    const resultLink = `${baseUrl}/result/${conversation.id}`;

    // 기적 분석 결과 발송 (phone이 있고 sendResult가 true인 경우)
    let messageSent = false;
    let messageError = null;
    let messageChannel = null;

    if (phone && sendResult) {
      const userName = nickname || '소원이';
      const token = conversation.id; // 단축 링크용 토큰

      console.log('[기적 결과 발송 시작]', {
        phone: `${phone.substring(0, 3)}****${phone.slice(-4)}`,
        name: userName,
        score: miracleIndex,
        token,
        provider: messageProvider ? 'messageProvider' : 'none'
      });

      // 1. messageProvider 사용 (SENS 우선)
      if (messageProvider?.sendResultMessage) {
        try {
          const sendResponse = await messageProvider.sendResultMessage(phone, userName, miracleIndex, token);
          messageSent = sendResponse.success;
          messageChannel = sendResponse.channel || 'unknown';

          if (sendResponse.success) {
            console.log('[기적 결과 발송 완료]', {
              phone: `${phone.substring(0, 3)}****${phone.slice(-4)}`,
              channel: messageChannel,
              messageId: sendResponse.messageId
            });
          } else {
            messageError = sendResponse.reason || sendResponse.error || '알 수 없는 오류';
            console.error('[기적 결과 발송 실패]', messageError);
          }
        } catch (error) {
          messageError = error.message;
          console.error('[기적 결과 발송 에러]', error);
          // 발송 실패해도 분석 결과는 정상 반환
        }
      } else {
        console.warn('[기적 결과 발송] messageProvider 미설정 - 발송 건너뜀');
        messageError = 'messageProvider 미설정';
      }
    }

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        miracleIndex,
        analysis,
        predictions,
        resultLink,
        // 발송 결과 포함
        message: {
          sent: messageSent,
          error: messageError
        },
        // v2.0 통합 점수 엔진 응답
        score_engine: scoreResult.success ? {
          base_score: scoreResult.base_score,
          daily_delta: scoreResult.daily_delta,
          final_score: scoreResult.final_score,
          confidence: scoreResult.confidence,
          confidence_detail: scoreResult.confidence_detail,
          energy_type: scoreResult.energy_type,
          energy_name: scoreResult.energy_name,
          energy_meaning: scoreResult.energy_meaning,
          score_factors: scoreResult.score_factors,
          analysis_version: scoreResult.analysis_version,
          cached: scoreResult.cached || false
        } : null
      }
    });

  } catch (error) {
    console.error('[Miracle] 기적지수 계산 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '기적지수 계산 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 기적지수 계산 함수 (DEPRECATED - v2.0 통합 엔진으로 대체)
 * @deprecated Use calculateUnifiedScore from miracleScoreEngine.js
 */
// function calculateMiracleIndex(answers) {
//   let score = 50;
//   score += answers.length * 5;
//   const totalLength = answers.reduce((sum, a) => sum + (a.answer?.length || 0), 0);
//   score += Math.min(totalLength / 10, 20);
//   const positiveWords = ['좋', '행복', '기쁨', '감사', '희망', '사랑', '꿈', '성공'];
//   const hasPositive = answers.some(a =>
//     positiveWords.some(word => a.answer?.includes(word))
//   );
//   if (hasPositive) score += 15;
//   return Math.min(Math.max(Math.round(score), 0), 100);
// }

// 예측 생성 함수
function generatePredictions(miracleIndex, answers) {
  return [
    {
      timeframe: "1주일 내",
      probability: Math.min(miracleIndex + 5, 95),
      prediction: "작은 변화의 시작을 경험하게 될 것입니다. 일상에서 긍정적인 신호들이 나타날 것입니다.",
      action: "매일 아침 오늘의 목표를 하나씩 정하고 실천하세요."
    },
    {
      timeframe: "1개월 내",
      probability: Math.max(miracleIndex - 10, 60),
      prediction: "구체적인 진전을 볼 수 있습니다. 주변 사람들도 당신의 변화를 알아차릴 것입니다.",
      action: "주간 회고를 통해 성장을 기록하고 다음 단계를 계획하세요."
    },
    {
      timeframe: "3개월 내",
      probability: Math.max(miracleIndex - 20, 50),
      prediction: "중요한 전환점을 맞이하게 됩니다. 노력의 결실이 가시적으로 나타날 것입니다.",
      action: "멘토나 조언자를 찾아 방향성을 점검하세요."
    },
    {
      timeframe: "6개월 내",
      probability: Math.max(miracleIndex - 30, 40),
      prediction: "삶의 패턴이 완전히 바뀌는 것을 느끼게 될 것입니다. 새로운 기회들이 열릴 것입니다.",
      action: "장기 목표를 구체화하고 단계별 실행 계획을 세우세요."
    },
    {
      timeframe: "1년 내",
      probability: Math.max(miracleIndex - 35, 35),
      prediction: "당신이 꿈꾸던 모습에 상당히 가까워져 있을 것입니다. 지속적인 노력이 큰 성과로 이어질 것입니다.",
      action: "이루어낸 것들을 되돌아보며 다음 여정을 준비하세요."
    }
  ];
}

// 종합 분석 생성 함수
function generateAnalysis(answers) {
  const feelingAnswer = answers.find(a => a.question === '오늘의 기분');
  const eventAnswer = answers.find(a => a.question === '최근 일');
  const hopeAnswer = answers.find(a => a.question === '희망 메시지');

  return `
🌟 종합 분석

당신의 기적은 실현 가능성이 높습니다.

💭 현재 상태:
${feelingAnswer ? `• 오늘의 기분: ${feelingAnswer.answer.substring(0, 100)}` : ''}

📊 최근 상황:
${eventAnswer ? `• ${eventAnswer.answer.substring(0, 100)}` : ''}

🎯 희망 메시지:
${hopeAnswer ? `• ${hopeAnswer.answer.substring(0, 100)}` : ''}

💫 기적 실현을 위한 핵심 요소:
• 명확한 목표 설정
• 꾸준한 실천
• 긍정적인 마인드셋
• 주변의 지지와 도움

당신의 기적은 단계적으로 실현될 것입니다. 작은 성공들을 축하하며 나아가세요!
  `.trim();
}

module.exports = router;
