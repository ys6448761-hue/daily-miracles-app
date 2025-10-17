/**
 * ✨ Daily Miracles - Email Service (SendGrid)
 *
 * 7일간 매일 2회 이메일 발송:
 * - 아침 08:00: 동기부여 메시지
 * - 저녁 20:00: 하루 되돌아보기 메시지
 */

const sgMail = require('@sendgrid/mail');

// SendGrid API 키 설정
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// 발신자 이메일
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dailymiracles.kr';
const FROM_NAME = '하루하루의 기적';

/**
 * 아침 메시지 템플릿 (08:00)
 */
function getMorningEmailTemplate(userName, day) {
  return {
    subject: `☀️ ${userName}님, ${day}일차 아침입니다!`,
    html: `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>아침 메시지</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">✨ 하루하루의 기적</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Day ${day} - 아침 메시지</p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">☀️ ${userName}님, 좋은 아침입니다!</h2>

              <p style="color: #666; line-height: 1.8; font-size: 16px; margin-bottom: 20px;">
                오늘은 ${day}일차 여정의 시작입니다.<br>
                작은 실천이 큰 변화를 만든다는 것을 기억하세요.
              </p>

              <div style="background: linear-gradient(135deg, #f8f9ff 0%, #fff5f7 100%); padding: 25px; border-radius: 15px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #667eea; font-size: 18px;">🎯 오늘의 미션</h3>
                <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                  <li>아침 루틴 실천하기 (10분)</li>
                  <li>오늘의 감사 3가지 적기</li>
                  <li>작은 목표 하나 달성하기</li>
                </ul>
              </div>

              <p style="color: #666; line-height: 1.8; font-size: 16px;">
                <strong>💡 오늘의 한마디:</strong><br>
                "매일 아침은 새로운 시작이에요. 어제의 나보다 조금 더 나은 오늘을 만들어보세요."
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://dailymiracles.kr/daily-miracles"
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                  오늘의 분석 확인하기
                </a>
              </div>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; color: #999; font-size: 14px;">
                ${day}/7일차 진행 중 | 하루하루의 기적
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                문의: 1899-6117 | <a href="https://dailymiracles.kr" style="color: #667eea; text-decoration: none;">dailymiracles.kr</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `${userName}님, 좋은 아침입니다! Day ${day} - 오늘도 작은 실천으로 큰 변화를 만들어보세요.`
  };
}

/**
 * 저녁 메시지 템플릿 (20:00)
 */
function getEveningEmailTemplate(userName, day) {
  return {
    subject: `🌙 ${userName}님, ${day}일차 하루를 마무리하세요`,
    html: `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>저녁 메시지</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">✨ 하루하루의 기적</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Day ${day} - 저녁 메시지</p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">🌙 ${userName}님, 오늘 하루 수고하셨어요!</h2>

              <p style="color: #666; line-height: 1.8; font-size: 16px; margin-bottom: 20px;">
                ${day}일차 하루를 돌아보는 시간입니다.<br>
                오늘 이룬 작은 성취들을 기억하세요.
              </p>

              <div style="background: linear-gradient(135deg, #fff5f7 0%, #f8f9ff 100%); padding: 25px; border-radius: 15px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #764ba2; font-size: 18px;">📝 오늘의 되돌아보기</h3>
                <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                  <li>오늘 가장 좋았던 순간은?</li>
                  <li>내가 이룬 작은 성취는?</li>
                  <li>내일을 위한 다짐 한 가지</li>
                </ul>
              </div>

              <p style="color: #666; line-height: 1.8; font-size: 16px;">
                <strong>💭 오늘의 명언:</strong><br>
                "완벽하지 않아도 괜찮아요. 꾸준히 나아가는 것이 중요합니다."
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://dailymiracles.kr/feedback"
                   style="display: inline-block; background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                  오늘의 소감 남기기
                </a>
              </div>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; color: #999; font-size: 14px;">
                ${day}/7일차 진행 중 | 편안한 밤 되세요 💜
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                문의: 1899-6117 | <a href="https://dailymiracles.kr" style="color: #667eea; text-decoration: none;">dailymiracles.kr</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `${userName}님, 오늘 하루 수고하셨어요! Day ${day} - 오늘 이룬 작은 성취들을 기억하세요.`
  };
}

/**
 * 이메일 발송 함수
 */
async function sendEmail(to, subject, html, text) {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️  SENDGRID_API_KEY가 설정되지 않았습니다. 이메일 발송을 건너뜁니다.');
    return { success: false, error: 'SENDGRID_API_KEY not configured' };
  }

  const msg = {
    to: to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: subject,
    text: text,
    html: html
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ 이메일 발송 성공: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error.message);
    if (error.response) {
      console.error('SendGrid 에러:', error.response.body);
    }
    return { success: false, error: error.message };
  }
}

/**
 * 아침 메시지 발송
 */
async function sendMorningEmail(userEmail, userName, day) {
  const template = getMorningEmailTemplate(userName, day);
  return await sendEmail(userEmail, template.subject, template.html, template.text);
}

/**
 * 저녁 메시지 발송
 */
async function sendEveningEmail(userEmail, userName, day) {
  const template = getEveningEmailTemplate(userName, day);
  return await sendEmail(userEmail, template.subject, template.html, template.text);
}

/**
 * 베타 신청 환영 이메일
 */
async function sendWelcomeEmail(userEmail, userName) {
  const subject = `🎉 ${userName}님, 베타 테스터로 선정되셨습니다!`;
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 600;">🎊 환영합니다!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">${userName}님, 베타 테스터로 선정되셨습니다!</h2>
              <p style="color: #666; line-height: 1.8; font-size: 16px;">
                "하루하루의 기적" 베타 테스트에 참여해주셔서 감사합니다.<br>
                앞으로 7일간 매일 아침/저녁으로 동기부여 메시지를 보내드립니다.
              </p>
              <div style="background: #f8f9ff; padding: 25px; border-radius: 15px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #667eea;">🎁 베타 테스터 혜택</h3>
                <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                  <li>7일간 무료 프리미엄 분석</li>
                  <li>정식 출시 시 평생 50% 할인</li>
                  <li>우선 신기능 체험 기회</li>
                  <li>피드백 제공 시 추가 혜택</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://dailymiracles.kr/daily-miracles"
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                  지금 분석 시작하기
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                문의: 1899-6117 | <a href="https://dailymiracles.kr" style="color: #667eea; text-decoration: none;">dailymiracles.kr</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  const text = `${userName}님, 베타 테스터로 선정되셨습니다! 7일간 함께 하루하루의 기적을 경험해보세요.`;

  return await sendEmail(userEmail, subject, html, text);
}

module.exports = {
  sendMorningEmail,
  sendEveningEmail,
  sendWelcomeEmail,
  sendEmail
};
