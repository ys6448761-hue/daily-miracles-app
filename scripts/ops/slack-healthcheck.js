/**
 * slack-healthcheck.js
 * Slack 알림 파이프라인 헬스체크 v1.0
 *
 * 실행: node scripts/ops/slack-healthcheck.js
 * 테스트 메시지 전송: node scripts/ops/slack-healthcheck.js --test
 */

const https = require('https');
const http = require('http');

// ═══════════════════════════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || process.env.OPS_SLACK_WEBHOOK,
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
  SLACK_CHANNEL: process.env.SLACK_CHANNEL || '#ops-alerts',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5002',
  EMAIL_FALLBACK: process.env.FALLBACK_EMAIL || null
};

const CHECKS = {
  slack_webhook: { status: 'pending', message: '' },
  slack_bot: { status: 'pending', message: '' },
  env_vars: { status: 'pending', message: '' },
  server_health: { status: 'pending', message: '' },
  test_message: { status: 'pending', message: '' }
};

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 1: Slack Webhook URL 유효성
// ═══════════════════════════════════════════════════════════════════════════

async function checkSlackWebhook() {
  console.log('\n[CHECK 1] Slack Webhook URL 검증...');

  if (!CONFIG.SLACK_WEBHOOK_URL) {
    CHECKS.slack_webhook = {
      status: 'fail',
      message: 'SLACK_WEBHOOK_URL / OPS_SLACK_WEBHOOK 미설정'
    };
    console.log('  ❌ Webhook URL 미설정');
    return false;
  }

  // URL 형식 검증
  const webhookPattern = /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+$/;
  if (!webhookPattern.test(CONFIG.SLACK_WEBHOOK_URL)) {
    CHECKS.slack_webhook = {
      status: 'warn',
      message: 'Webhook URL 형식이 표준과 다름 (커스텀 프록시일 수 있음)'
    };
    console.log('  ⚠️  Webhook URL 형식 비표준 (동작 가능)');
  } else {
    CHECKS.slack_webhook = {
      status: 'pass',
      message: 'Webhook URL 형식 정상'
    };
    console.log('  ✅ Webhook URL 형식 정상');
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 2: Slack Bot Token 검증
// ═══════════════════════════════════════════════════════════════════════════

async function checkSlackBot() {
  console.log('\n[CHECK 2] Slack Bot Token 검증...');

  if (!CONFIG.SLACK_BOT_TOKEN) {
    CHECKS.slack_bot = {
      status: 'warn',
      message: 'SLACK_BOT_TOKEN 미설정 (Webhook만 사용 가능)'
    };
    console.log('  ⚠️  Bot Token 미설정 (Webhook 방식만 사용)');
    return true;
  }

  // Bot Token 형식 검증
  if (!CONFIG.SLACK_BOT_TOKEN.startsWith('xoxb-')) {
    CHECKS.slack_bot = {
      status: 'fail',
      message: 'Bot Token 형식 오류 (xoxb-로 시작해야 함)'
    };
    console.log('  ❌ Bot Token 형식 오류');
    return false;
  }

  // API 호출로 토큰 유효성 확인
  try {
    const result = await slackApiCall('auth.test');
    if (result.ok) {
      CHECKS.slack_bot = {
        status: 'pass',
        message: `Bot 인증 성공: ${result.user} (${result.team})`
      };
      console.log(`  ✅ Bot 인증 성공: ${result.user} @ ${result.team}`);
      return true;
    } else {
      CHECKS.slack_bot = {
        status: 'fail',
        message: `Bot 인증 실패: ${result.error}`
      };
      console.log(`  ❌ Bot 인증 실패: ${result.error}`);
      return false;
    }
  } catch (error) {
    CHECKS.slack_bot = {
      status: 'fail',
      message: `API 호출 실패: ${error.message}`
    };
    console.log(`  ❌ API 호출 실패: ${error.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 3: 환경변수 확인
// ═══════════════════════════════════════════════════════════════════════════

async function checkEnvVars() {
  console.log('\n[CHECK 3] 환경변수 확인...');

  const required = ['SLACK_WEBHOOK_URL', 'OPS_SLACK_WEBHOOK'];
  const optional = ['SLACK_BOT_TOKEN', 'SLACK_CHANNEL', 'FALLBACK_EMAIL'];

  const missingRequired = required.filter(key => !process.env[key]);
  const missingOptional = optional.filter(key => !process.env[key]);

  console.log('  필수 환경변수:');
  if (missingRequired.length === required.length) {
    console.log('    ❌ SLACK_WEBHOOK_URL 또는 OPS_SLACK_WEBHOOK 중 하나 필요');
  } else {
    console.log('    ✅ Webhook URL 설정됨');
  }

  console.log('  선택 환경변수:');
  optional.forEach(key => {
    const status = process.env[key] ? '✅' : '⚠️';
    console.log(`    ${status} ${key}: ${process.env[key] ? '설정됨' : '미설정'}`);
  });

  if (missingRequired.length === required.length) {
    CHECKS.env_vars = {
      status: 'fail',
      message: 'Webhook URL 미설정'
    };
    return false;
  }

  CHECKS.env_vars = {
    status: 'pass',
    message: `필수: OK, 선택: ${optional.length - missingOptional.length}/${optional.length}`
  };
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 4: 서버 헬스 체크
// ═══════════════════════════════════════════════════════════════════════════

async function checkServerHealth() {
  console.log('\n[CHECK 4] 서버 헬스 체크...');

  try {
    const url = new URL('/api/ops-center/health', CONFIG.SERVER_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const result = await new Promise((resolve, reject) => {
      const req = protocol.get(url.href, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data: null });
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Timeout')));
    });

    if (result.status === 200 && result.data?.success) {
      CHECKS.server_health = {
        status: 'pass',
        message: `서버 정상 (${result.data.service} ${result.data.version})`
      };
      console.log(`  ✅ 서버 정상: ${result.data.service} ${result.data.version}`);
      return true;
    } else {
      CHECKS.server_health = {
        status: 'fail',
        message: `서버 응답 이상: ${result.status}`
      };
      console.log(`  ❌ 서버 응답 이상: ${result.status}`);
      return false;
    }
  } catch (error) {
    CHECKS.server_health = {
      status: 'fail',
      message: `서버 연결 실패: ${error.message}`
    };
    console.log(`  ❌ 서버 연결 실패: ${error.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 5: 테스트 메시지 전송
// ═══════════════════════════════════════════════════════════════════════════

async function sendTestMessage() {
  console.log('\n[CHECK 5] 테스트 메시지 전송...');

  if (!CONFIG.SLACK_WEBHOOK_URL) {
    CHECKS.test_message = {
      status: 'skip',
      message: 'Webhook URL 미설정으로 스킵'
    };
    console.log('  ⏭️  Webhook URL 미설정으로 스킵');
    return false;
  }

  const message = {
    text: '🏥 *Slack 알림 헬스체크*',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🏥 *Slack 알림 파이프라인 헬스체크*\n\n✅ 알림 정상 작동 중\n📅 ${new Date().toISOString()}\n🖥️ ${require('os').hostname()}`
        }
      }
    ]
  };

  try {
    const result = await sendSlackWebhook(message);
    if (result.success) {
      CHECKS.test_message = {
        status: 'pass',
        message: '테스트 메시지 전송 성공'
      };
      console.log('  ✅ 테스트 메시지 전송 성공');
      return true;
    } else {
      CHECKS.test_message = {
        status: 'fail',
        message: `전송 실패: ${result.error}`
      };
      console.log(`  ❌ 전송 실패: ${result.error}`);
      return false;
    }
  } catch (error) {
    CHECKS.test_message = {
      status: 'fail',
      message: `전송 오류: ${error.message}`
    };
    console.log(`  ❌ 전송 오류: ${error.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼 함수
// ═══════════════════════════════════════════════════════════════════════════

async function slackApiCall(method, params = {}) {
  return new Promise((resolve, reject) => {
    const url = `https://slack.com/api/${method}`;
    const postData = JSON.stringify(params);

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SLACK_BOT_TOKEN}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function sendSlackWebhook(message) {
  return new Promise((resolve) => {
    const url = new URL(CONFIG.SLACK_WEBHOOK_URL);
    const postData = JSON.stringify(message);

    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 리포트 생성
// ═══════════════════════════════════════════════════════════════════════════

function generateReport() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           Slack 알림 파이프라인 헬스체크 결과');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('───────────────────────────────────────────────────────────');

  const statusIcon = {
    pass: '✅',
    fail: '❌',
    warn: '⚠️',
    skip: '⏭️',
    pending: '⏳'
  };

  const checkNames = {
    slack_webhook: 'Slack Webhook URL',
    slack_bot: 'Slack Bot Token',
    env_vars: '환경변수',
    server_health: '서버 헬스',
    test_message: '테스트 메시지'
  };

  let passCount = 0;
  let failCount = 0;

  for (const [key, check] of Object.entries(CHECKS)) {
    const icon = statusIcon[check.status] || '❓';
    console.log(`${icon} ${checkNames[key]}: ${check.message}`);

    if (check.status === 'pass') passCount++;
    if (check.status === 'fail') failCount++;
  }

  console.log('───────────────────────────────────────────────────────────');

  if (failCount === 0) {
    console.log('🎉 결과: 모든 검사 통과!');
  } else {
    console.log(`⚠️  결과: ${failCount}개 실패, ${passCount}개 통과`);
  }

  console.log('═══════════════════════════════════════════════════════════');

  return { passCount, failCount, checks: CHECKS };
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        Slack 알림 파이프라인 헬스체크 v1.0');
  console.log('═══════════════════════════════════════════════════════════');

  const runTest = process.argv.includes('--test');

  await checkSlackWebhook();
  await checkSlackBot();
  await checkEnvVars();
  await checkServerHealth();

  if (runTest) {
    await sendTestMessage();
  } else {
    CHECKS.test_message = {
      status: 'skip',
      message: '--test 플래그로 실행 시 테스트 메시지 전송'
    };
    console.log('\n[CHECK 5] 테스트 메시지 전송...');
    console.log('  ⏭️  --test 플래그 없음 (스킵)');
  }

  const report = generateReport();

  // JSON 출력 (CI/CD 연동용)
  if (process.argv.includes('--json')) {
    console.log('\n[JSON Output]');
    console.log(JSON.stringify(report, null, 2));
  }

  process.exit(report.failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ 헬스체크 실패:', error.message);
  process.exit(1);
});
