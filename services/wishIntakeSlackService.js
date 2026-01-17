/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Wish Intake Slack Service - 소원이 운영 콘솔 알림
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * P0-04: Slack 운영 콘솔
 *
 * 채널:
 * - #소원이-인입: 새 세션 시작 알림
 * - #소원이-검수: 🔴/🟡 리스크 검수 알림, 완료 알림
 *
 * 알림 3종:
 * 1. 세션 시작 알림 (NEW_SESSION)
 * 2. 🔴/🟡 검수 알림 (REVIEW_NEEDED)
 * 3. 완료 알림 (SESSION_COMPLETED)
 *
 * 작성일: 2026-01-17
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 환경 설정
// ═══════════════════════════════════════════════════════════════════════════

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// 채널 ID (환경변수 또는 기본값)
const CHANNELS = {
  INTAKE: process.env.SLACK_CHANNEL_INTAKE || 'C0A8CRLJW6B',     // #소원이-인입 (dev 채널 대체)
  REVIEW: process.env.SLACK_CHANNEL_REVIEW || 'C0A8CRP3K5M'      // #소원이-검수 (ops 채널 대체)
};

// ═══════════════════════════════════════════════════════════════════════════
// 메시지 템플릿
// ═══════════════════════════════════════════════════════════════════════════

const TEMPLATES = {
  /**
   * 세션 시작 알림
   */
  NEW_SESSION: (session) => ({
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📥 새 소원이 인입',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*세션 ID:*\n\`${session.session_id}\``
          },
          {
            type: 'mrkdwn',
            text: `*채널:*\n${session.channel || 'web'}`
          },
          {
            type: 'mrkdwn',
            text: `*사용자:*\n${session.user_name || '익명'}`
          },
          {
            type: 'mrkdwn',
            text: `*시작 시각:*\n${formatTime(session.created_at)}`
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `correlation_id: \`${session.correlation_id}\``
          }
        ]
      }
    ],
    text: `📥 새 소원이 인입: ${session.session_id}`
  }),

  /**
   * 🔴/🟡 검수 알림
   */
  REVIEW_NEEDED: (session, riskInfo) => {
    const emoji = riskInfo.level === 'RED' ? '🔴' : '🟡';
    const urgency = riskInfo.level === 'RED' ? '긴급 검토' : '검토 필요';

    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${urgency} - 리스크 감지`,
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*세션 ID:*\n\`${session.session_id}\``
            },
            {
              type: 'mrkdwn',
              text: `*리스크 레벨:*\n${emoji} ${riskInfo.level}`
            },
            {
              type: 'mrkdwn',
              text: `*현재 진행:*\nQ${session.current_question || '?'}/7`
            },
            {
              type: 'mrkdwn',
              text: `*상태:*\n${session.run_status}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*감지 사유:*\n\`\`\`${riskInfo.reasons?.join('\n') || riskInfo.flags || '상세 정보 없음'}\`\`\``
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: riskInfo.level === 'RED'
              ? '⚠️ *세션이 자동 중단되었습니다.* 코미 또는 푸르미르님의 확인이 필요합니다.'
              : '⚠️ 완료 후 검수가 필요합니다.'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `감지 시각: ${formatTime(new Date().toISOString())}`
            }
          ]
        }
      ],
      text: `${emoji} ${urgency}: ${session.session_id} - ${riskInfo.level}`
    };
  },

  /**
   * 완료 알림
   */
  SESSION_COMPLETED: (session, summary) => ({
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '✅ 소원이 7문항 완료',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*세션 ID:*\n\`${session.session_id}\``
          },
          {
            type: 'mrkdwn',
            text: `*답변 수:*\n${session.answered_count || 7}/7`
          },
          {
            type: 'mrkdwn',
            text: `*리스크:*\n${getRiskEmoji(session.risk_level)} ${session.risk_level || 'GREEN'}`
          },
          {
            type: 'mrkdwn',
            text: `*소요 시간:*\n${calculateDuration(session.created_at, session.completed_at)}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*소원 요약:*\n${summary?.wish_1liner || '(요약 생성 전)'}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `완료 시각: ${formatTime(session.completed_at || new Date().toISOString())}`
          }
        ]
      }
    ],
    text: `✅ 소원이 완료: ${session.session_id}`
  })
};

// ═══════════════════════════════════════════════════════════════════════════
// 유틸 함수
// ═══════════════════════════════════════════════════════════════════════════

function formatTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function getRiskEmoji(level) {
  switch (level) {
    case 'RED': return '🔴';
    case 'YELLOW': return '🟡';
    case 'GREEN': return '🟢';
    default: return '⚪';
  }
}

function calculateDuration(startIso, endIso) {
  if (!startIso || !endIso) return '-';
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = end - start;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '1분 미만';
  if (diffMins < 60) return `${diffMins}분`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}시간 ${mins}분`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack API 호출
// ═══════════════════════════════════════════════════════════════════════════

async function postSlackMessage(channel, message) {
  if (!SLACK_BOT_TOKEN) {
    console.warn('[WishIntakeSlack] SLACK_BOT_TOKEN 미설정 - 시뮬레이션');
    console.log(`[WishIntakeSlack] [시뮬레이션] 채널: ${channel}`);
    console.log(`[WishIntakeSlack] [시뮬레이션] 메시지: ${message.text}`);
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        blocks: message.blocks,
        text: message.text
      })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[WishIntakeSlack] Slack API 오류:', data.error);
      return { success: false, error: data.error };
    }

    console.log(`[WishIntakeSlack] 메시지 발송 완료: ${channel}`);
    return { success: true, ts: data.ts };

  } catch (error) {
    console.error('[WishIntakeSlack] 발송 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 알림 함수 (Public API)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 1. 세션 시작 알림
 * @param {Object} session - 세션 정보
 */
async function notifyNewSession(session) {
  const message = TEMPLATES.NEW_SESSION(session);
  return postSlackMessage(CHANNELS.INTAKE, message);
}

/**
 * 2. 🔴/🟡 검수 알림
 * @param {Object} session - 세션 정보
 * @param {Object} riskInfo - { level: 'RED'|'YELLOW', reasons: [], flags: '' }
 */
async function notifyReviewNeeded(session, riskInfo) {
  const message = TEMPLATES.REVIEW_NEEDED(session, riskInfo);
  return postSlackMessage(CHANNELS.REVIEW, message);
}

/**
 * 3. 완료 알림
 * @param {Object} session - 세션 정보
 * @param {Object} summary - 요약 정보 (optional)
 */
async function notifySessionCompleted(session, summary = null) {
  const message = TEMPLATES.SESSION_COMPLETED(session, summary);
  return postSlackMessage(CHANNELS.REVIEW, message);
}

/**
 * 리스크 레벨에 따른 자동 알림
 * @param {Object} session - 세션 정보
 * @param {string} riskLevel - 'RED' | 'YELLOW' | 'GREEN'
 * @param {string[]} reasons - 감지 사유
 */
async function notifyRiskDetected(session, riskLevel, reasons = []) {
  if (riskLevel === 'GREEN') {
    return { success: true, skipped: true, reason: 'GREEN level - no alert needed' };
  }

  return notifyReviewNeeded(session, {
    level: riskLevel,
    reasons,
    flags: session.risk_flags || ''
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // 채널 설정
  CHANNELS,

  // 알림 함수
  notifyNewSession,
  notifyReviewNeeded,
  notifySessionCompleted,
  notifyRiskDetected,

  // 유틸
  postSlackMessage,
  TEMPLATES
};
