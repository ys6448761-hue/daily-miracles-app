/**
 * ✨ Daily Miracles - Email Scheduler
 *
 * 7일간 매일 2회 자동 발송:
 * - 매일 08:00 (KST): 아침 메시지
 * - 매일 20:00 (KST): 저녁 메시지
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { sendMorningEmail, sendEveningEmail } = require('./emailService');

// 베타 신청자 데이터 파일 경로
const BETA_APPLICATIONS_PATH = path.join(__dirname, '..', 'beta-applications.json');

// 발송 이력 저장 파일
const EMAIL_LOG_PATH = path.join(__dirname, '..', 'email-sent-log.json');

/**
 * 베타 신청자 목록 가져오기
 */
function getBetaApplicants() {
  try {
    if (!fs.existsSync(BETA_APPLICATIONS_PATH)) {
      return [];
    }
    const data = fs.readFileSync(BETA_APPLICATIONS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 베타 신청자 목록 로드 실패:', error.message);
    return [];
  }
}

/**
 * 이메일 발송 이력 가져오기
 */
function getEmailLog() {
  try {
    if (!fs.existsSync(EMAIL_LOG_PATH)) {
      return {};
    }
    const data = fs.readFileSync(EMAIL_LOG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 이메일 로그 로드 실패:', error.message);
    return {};
  }
}

/**
 * 이메일 발송 이력 저장
 */
function saveEmailLog(log) {
  try {
    fs.writeFileSync(EMAIL_LOG_PATH, JSON.stringify(log, null, 2));
  } catch (error) {
    console.error('❌ 이메일 로그 저장 실패:', error.message);
  }
}

/**
 * 사용자의 현재 Day 계산 (신청일 기준)
 */
function calculateDay(submittedAt) {
  const submittedDate = new Date(submittedAt);
  const today = new Date();

  // 날짜만 비교 (시간 제외)
  const daysDiff = Math.floor((today - submittedDate) / (1000 * 60 * 60 * 24));

  return daysDiff + 1; // 1일차부터 시작
}

/**
 * 아침 메시지 발송 작업
 */
async function sendMorningEmails() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('☀️  아침 메시지 발송 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const applicants = getBetaApplicants();
  const emailLog = getEmailLog();

  let successCount = 0;
  let skipCount = 0;

  for (const applicant of applicants) {
    const { email, name, submittedAt } = applicant;
    const day = calculateDay(submittedAt);

    // 7일차를 넘으면 발송 중지
    if (day > 7) {
      skipCount++;
      console.log(`   ⏭️  ${name} (${email}): 7일 프로그램 완료`);
      continue;
    }

    // 오늘 아침 메시지 이미 발송했는지 확인
    const today = new Date().toISOString().split('T')[0];
    const logKey = `${email}_${today}_morning`;

    if (emailLog[logKey]) {
      skipCount++;
      console.log(`   ⏭️  ${name} (${email}): 이미 발송됨`);
      continue;
    }

    // 이메일 발송
    const result = await sendMorningEmail(email, name, day);

    if (result.success) {
      successCount++;
      emailLog[logKey] = {
        sentAt: new Date().toISOString(),
        day: day,
        type: 'morning'
      };
      console.log(`   ✅ ${name} (${email}): Day ${day} 아침 메시지 발송`);
    } else {
      console.log(`   ❌ ${name} (${email}): 발송 실패`);
    }

    // API 제한 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  saveEmailLog(emailLog);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 발송 완료: ${successCount}건 성공, ${skipCount}건 스킵`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

/**
 * 저녁 메시지 발송 작업
 */
async function sendEveningEmails() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌙 저녁 메시지 발송 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const applicants = getBetaApplicants();
  const emailLog = getEmailLog();

  let successCount = 0;
  let skipCount = 0;

  for (const applicant of applicants) {
    const { email, name, submittedAt } = applicant;
    const day = calculateDay(submittedAt);

    // 7일차를 넘으면 발송 중지
    if (day > 7) {
      skipCount++;
      console.log(`   ⏭️  ${name} (${email}): 7일 프로그램 완료`);
      continue;
    }

    // 오늘 저녁 메시지 이미 발송했는지 확인
    const today = new Date().toISOString().split('T')[0];
    const logKey = `${email}_${today}_evening`;

    if (emailLog[logKey]) {
      skipCount++;
      console.log(`   ⏭️  ${name} (${email}): 이미 발송됨`);
      continue;
    }

    // 이메일 발송
    const result = await sendEveningEmail(email, name, day);

    if (result.success) {
      successCount++;
      emailLog[logKey] = {
        sentAt: new Date().toISOString(),
        day: day,
        type: 'evening'
      };
      console.log(`   ✅ ${name} (${email}): Day ${day} 저녁 메시지 발송`);
    } else {
      console.log(`   ❌ ${name} (${email}): 발송 실패`);
    }

    // API 제한 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  saveEmailLog(emailLog);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 발송 완료: ${successCount}건 성공, ${skipCount}건 스킵`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

/**
 * 스케줄러 시작
 */
function startScheduler() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📅 이메일 스케줄러 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   ☀️  아침 메시지: 매일 08:00 (KST)');
  console.log('   🌙 저녁 메시지: 매일 20:00 (KST)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // 아침 메시지: 매일 08:00 (KST)
  cron.schedule('0 8 * * *', async () => {
    await sendMorningEmails();
  }, {
    timezone: 'Asia/Seoul'
  });

  // 저녁 메시지: 매일 20:00 (KST)
  cron.schedule('0 20 * * *', async () => {
    await sendEveningEmails();
  }, {
    timezone: 'Asia/Seoul'
  });

  // 테스트용: 매 분마다 실행 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development' && process.env.EMAIL_TEST_MODE === 'true') {
    console.log('🔧 테스트 모드: 1분마다 발송 테스트');
    cron.schedule('* * * * *', async () => {
      console.log('📧 테스트 발송...');
      await sendMorningEmails();
    });
  }
}

/**
 * 수동 발송 (테스트용)
 */
async function sendTestEmails() {
  console.log('🧪 테스트 이메일 발송 시작...');
  await sendMorningEmails();
  console.log('');
  console.log('🧪 테스트 저녁 메시지도 발송...');
  await sendEveningEmails();
}

module.exports = {
  startScheduler,
  sendMorningEmails,
  sendEveningEmails,
  sendTestEmails
};
