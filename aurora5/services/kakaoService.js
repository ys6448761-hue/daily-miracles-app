/**
 * Aurora5 - Kakao Service (Solapi)
 * 알림톡/SMS 발송 서비스
 *
 * @version 1.0
 *
 * Solapi 설정 필요:
 * - SOLAPI_API_KEY
 * - SOLAPI_API_SECRET
 * - SOLAPI_PFID (카카오 채널 ID)
 * - SOLAPI_SENDER (발신번호)
 */

const crypto = require('crypto');
const db = require('../../database/db');

// Solapi API 설정
const SOLAPI_API_URL = 'https://api.solapi.com';

// 템플릿 코드
const TEMPLATES = {
  T_RESULT: 'T_RESULT',      // 분석 결과 발송
  T_DAY_REMIND: 'T_DAY_REMIND', // Day N 미션 알림
  T_REF: 'T_REF',            // 추천 감사 메시지
  T_COMPLETE: 'T_COMPLETE'   // 7일 완주 축하
};

/**
 * Solapi 인증 헤더 생성
 */
function getSolapiAuthHeader() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Solapi credentials not configured');
  }

  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex');

  return {
    'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    'Content-Type': 'application/json'
  };
}

/**
 * 알림톡 발송
 * @param {Object} params
 * @param {string} params.to - 수신번호
 * @param {string} params.templateCode - 템플릿 코드
 * @param {Object} params.variables - 템플릿 변수
 * @param {number} params.trialId - Trial ID (로깅용)
 * @param {number} params.day - Day 번호 (로깅용)
 */
async function sendKakaoAlimtalk({ to, templateCode, variables, trialId, day }) {
  const pfId = process.env.SOLAPI_PFID;

  if (!pfId) {
    console.warn('⚠️ Solapi PFID not configured, falling back to SMS');
    return sendSMS({ to, message: variables.message || '메시지', trialId, day, templateCode });
  }

  try {
    const response = await fetch(`${SOLAPI_API_URL}/messages/v4/send`, {
      method: 'POST',
      headers: getSolapiAuthHeader(),
      body: JSON.stringify({
        message: {
          to,
          from: process.env.SOLAPI_SENDER,
          kakaoOptions: {
            pfId,
            templateId: templateCode,
            variables
          }
        }
      })
    });

    const result = await response.json();

    // 발송 로그 저장
    await logSend({
      trialId,
      day,
      templateCode,
      to,
      status: result.groupInfo?.successCount > 0 ? 'SENT' : 'FAILED',
      provider: 'solapi_kakao',
      providerMsgId: result.groupInfo?.groupId,
      error: result.groupInfo?.successCount === 0 ? JSON.stringify(result) : null
    });

    console.log(`📱 Kakao sent to ${to}: ${templateCode}`);
    return result;

  } catch (error) {
    console.error('❌ Kakao send failed:', error);

    // 실패 시 SMS 폴백
    return sendSMS({ to, message: variables.message || '메시지', trialId, day, templateCode });
  }
}

/**
 * SMS 발송 (폴백)
 */
async function sendSMS({ to, message, trialId, day, templateCode }) {
  const sender = process.env.SOLAPI_SENDER;

  if (!sender) {
    console.error('❌ Solapi sender not configured');
    await logSend({
      trialId,
      day,
      templateCode,
      to,
      status: 'FAILED',
      provider: 'solapi_sms',
      error: 'Sender not configured'
    });
    return { success: false, error: 'Sender not configured' };
  }

  try {
    const response = await fetch(`${SOLAPI_API_URL}/messages/v4/send`, {
      method: 'POST',
      headers: getSolapiAuthHeader(),
      body: JSON.stringify({
        message: {
          to,
          from: sender,
          text: message
        }
      })
    });

    const result = await response.json();

    await logSend({
      trialId,
      day,
      templateCode,
      to,
      status: result.groupInfo?.successCount > 0 ? 'SENT' : 'FAILED',
      provider: 'solapi_sms',
      providerMsgId: result.groupInfo?.groupId,
      error: result.groupInfo?.successCount === 0 ? JSON.stringify(result) : null
    });

    console.log(`📲 SMS sent to ${to}`);
    return result;

  } catch (error) {
    console.error('❌ SMS send failed:', error);

    await logSend({
      trialId,
      day,
      templateCode,
      to,
      status: 'FAILED',
      provider: 'solapi_sms',
      error: error.message
    });

    return { success: false, error: error.message };
  }
}

/**
 * 발송 로그 저장
 */
async function logSend({ trialId, day, templateCode, to, status, provider, providerMsgId, error }) {
  try {
    await db.query(`
      INSERT INTO send_log (trial_id, day, template_code, to_address, status, provider, provider_msg_id, error)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [trialId, day, templateCode, to, status, provider, providerMsgId, error]);
  } catch (dbError) {
    console.error('❌ Failed to log send:', dbError);
  }
}

/**
 * 결과 발송 메시지 생성
 */
function buildResultMessage(nickname, analysis, magicUrl) {
  return {
    templateCode: TEMPLATES.T_RESULT,
    variables: {
      nickname,
      promise: analysis.promise?.substring(0, 100) || '나를 위한 약속',
      todayAction: analysis.todayAction?.substring(0, 100) || '첫걸음',
      magicUrl,
      message: `🌟 ${nickname}님의 7일 여정이 시작되었습니다!\n\n` +
        `📝 약속: ${analysis.promise?.substring(0, 50) || '나를 위한 약속'}...\n\n` +
        `🔗 내 페이지: ${magicUrl}\n\n` +
        `내일 오전 9시, Day 1 미션이 도착합니다!`
    }
  };
}

/**
 * Day N 미션 메시지 생성
 */
function buildDayMessage(nickname, day, mission, magicUrl) {
  return {
    templateCode: TEMPLATES.T_DAY_REMIND,
    variables: {
      nickname,
      day,
      missionTitle: mission.title,
      missionTask: mission.task,
      minutes: mission.minutes,
      checkinPrompt: mission.checkinPrompt,
      magicUrl,
      message: `🌅 좋은 아침이에요, ${nickname}님!\n\n` +
        `📌 Day ${day}: ${mission.title}\n\n` +
        `✅ 오늘 미션 (${mission.minutes}분)\n${mission.task}\n\n` +
        `💬 완료 후 체크인: ${mission.checkinPrompt}\n\n` +
        `🔗 ${magicUrl}`
    }
  };
}

/**
 * 7일 완주 메시지 생성
 */
function buildCompleteMessage(nickname, refCode, magicUrl) {
  return {
    templateCode: TEMPLATES.T_COMPLETE,
    variables: {
      nickname,
      refCode,
      magicUrl,
      message: `🎉 축하해요, ${nickname}님!\n\n` +
        `7일 여정을 완주하셨습니다!\n\n` +
        `🎁 친구에게 추천하기\n` +
        `추천 코드: ${refCode}\n\n` +
        `친구가 가입하면 둘 다 특별한 선물을 받아요!\n\n` +
        `🔗 ${magicUrl}`
    }
  };
}

/**
 * 잔액 조회
 */
async function getBalance() {
  try {
    const response = await fetch(`${SOLAPI_API_URL}/cash/v1/balance`, {
      method: 'GET',
      headers: getSolapiAuthHeader()
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Balance check failed:', error);
    return { error: error.message };
  }
}

/**
 * 발송 통계 조회
 */
async function getSendStats(days = 7) {
  const result = await db.query(`
    SELECT
      DATE(created_at) as send_date,
      day,
      template_code,
      status,
      COUNT(*) as count
    FROM send_log
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at), day, template_code, status
    ORDER BY send_date DESC, day
  `);

  return result.rows;
}

module.exports = {
  TEMPLATES,
  sendKakaoAlimtalk,
  sendSMS,
  logSend,
  buildResultMessage,
  buildDayMessage,
  buildCompleteMessage,
  getBalance,
  getSendStats
};
