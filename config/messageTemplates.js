/**
 * MVP 접수 완료 메시지 템플릿
 * - 카카오톡/문자 발송용
 * - 태그별 맞춤 메시지
 *
 * @version 1.0 - 2025.12.13
 */

/**
 * 접수 완료 메시지 생성
 * @param {Object} inquiry - 접수 데이터
 * @returns {Object} { kakao, sms, email }
 */
function generateConfirmationMessage(inquiry) {
  const { inquiryId, tag, region, schedule, groupSize, contact } = inquiry;

  // 공통 정보
  const regionLabel = getRegionLabel(region);
  const scheduleLabel = getScheduleLabel(schedule);
  const groupLabel = getGroupLabel(groupSize);

  // 태그별 메시지
  const tagMessages = {
    PASS: {
      title: "투어패스 문의 접수 완료",
      emoji: "🎫",
      description: "여수의 다양한 매력을 한 번에 즐기실 수 있는 패키지를 준비해 드릴게요."
    },
    SINGLE: {
      title: "단품 예약 문의 접수 완료",
      emoji: "✨",
      description: "원하시는 체험이나 장소를 정확히 안내해 드릴게요."
    },
    RECOMMEND: {
      title: "맞춤 추천 요청 접수 완료",
      emoji: "🎯",
      description: "고객님께 딱 맞는 여수 여행을 찾아드릴게요."
    }
  };

  const tagInfo = tagMessages[tag] || tagMessages.RECOMMEND;

  // 카카오톡 메시지 (친구톡/알림톡)
  const kakaoMessage = `
${tagInfo.emoji} ${tagInfo.title}

안녕하세요! 여수 기적여행입니다.
문의가 정상적으로 접수되었습니다.

📋 접수번호: ${inquiryId}
📍 출발: ${regionLabel}
📅 일정: ${scheduleLabel}
👥 인원: ${groupLabel}

${tagInfo.description}

담당자가 곧 연락드리겠습니다.
(영업시간 기준 1시간 이내)

━━━━━━━━━━━━
여수 기적여행
문의: 1899-6117
━━━━━━━━━━━━
`.trim();

  // SMS 메시지 (90자 제한 고려)
  const smsMessage = `[여수기적여행] ${tagInfo.title}
접수번호: ${inquiryId}
담당자가 곧 연락드립니다.
문의: 1899-6117`.trim();

  // 이메일 메시지 (HTML)
  const emailMessage = {
    subject: `[여수 기적여행] ${tagInfo.title} - ${inquiryId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; }
    .info-box { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .info-label { color: #64748b; width: 80px; }
    .info-value { color: #1e293b; font-weight: 500; }
    .footer { background: #1e293b; color: #94a3b8; padding: 16px; text-align: center; font-size: 14px; border-radius: 0 0 8px 8px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${tagInfo.emoji} ${tagInfo.title}</h1>
    </div>
    <div class="content">
      <p>안녕하세요!<br>여수 기적여행입니다.</p>
      <p>문의가 정상적으로 접수되었습니다.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">접수번호</span>
          <span class="info-value">${inquiryId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">출발지역</span>
          <span class="info-value">${regionLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">희망일정</span>
          <span class="info-value">${scheduleLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">인원</span>
          <span class="info-value">${groupLabel}</span>
        </div>
      </div>

      <p>${tagInfo.description}</p>
      <p><strong>담당자가 영업시간 기준 1시간 이내에 연락드리겠습니다.</strong></p>
    </div>
    <div class="footer">
      <p style="margin: 0;">여수 기적여행 | 1899-6117</p>
      <p style="margin: 4px 0 0 0; font-size: 12px;">전라남도 여수시 박람회길 1</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  return {
    kakao: kakaoMessage,
    sms: smsMessage,
    email: emailMessage
  };
}

/**
 * 다음 단계 안내 메시지 (2차 수집용)
 * @param {string} inquiryId - 접수번호
 * @param {string} personalPageUrl - 개인페이지 URL (향후)
 */
function generateNextStepMessage(inquiryId, personalPageUrl = null) {
  if (personalPageUrl) {
    return `
📬 맞춤 여행 준비가 완료되었습니다!

아래 링크에서 상세 내용을 확인하고,
추가 정보(사진, 특별 요청)를 입력해 주세요.

👉 ${personalPageUrl}

접수번호: ${inquiryId}
`.trim();
  }

  // 개인페이지 없을 때 (MVP 초기)
  return `
📞 담당자 상담 예정 안내

접수번호: ${inquiryId}

곧 담당자가 연락드려 다음 내용을 확인합니다:
1. 세부 일정 조율
2. 포함 내역 안내
3. 추가 요청사항 확인

감사합니다!
`.trim();
}

// 헬퍼 함수들
function getRegionLabel(region) {
  const labels = {
    seoul: "서울",
    gyeonggi: "경기",
    chungcheong: "충청",
    gyeongsang: "경상",
    other: "기타"
  };
  return labels[region] || region;
}

function getScheduleLabel(schedule) {
  const labels = {
    this_month: "이번 달",
    next_month: "다음 달",
    undecided: "미정"
  };
  return labels[schedule] || schedule;
}

function getGroupLabel(groupSize) {
  const labels = {
    "1": "1명 (혼자)",
    "2": "2명",
    "3-4": "3~4명",
    "5+": "5명 이상"
  };
  return labels[groupSize] || groupSize;
}

module.exports = {
  generateConfirmationMessage,
  generateNextStepMessage,
  getRegionLabel,
  getScheduleLabel,
  getGroupLabel
};
