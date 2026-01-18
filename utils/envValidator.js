/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Environment Variable Validator
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 서버 부팅 시 환경변수 형식을 검증하여 잘못된 설정으로 인한 장애를 방지
 *
 * 검증 규칙:
 * - SLACK_CHANNEL_*: /^(C|G)[A-Z0-9]+$/ (채널 ID 형식)
 * - AIRTABLE_BASE_ID: /^app[a-zA-Z0-9]+$/ (Base ID 형식)
 * - AIRTABLE_TABLE_*: 테이블 이름 (tbl... 형식이 아닌 문자열)
 *
 * 작성일: 2026-01-18
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ENV_RULES = {
  // Slack 채널 ID 형식: C0XXXXXXX 또는 G0XXXXXXX (비공개)
  SLACK_CHANNEL: {
    pattern: /^(C|G)[A-Z0-9]{8,}$/i,
    example: 'C0A8CRLJW6B 또는 G01ABCDEFGH',
    description: 'Slack 채널 ID (C... 또는 G...)'
  },

  // Airtable Base ID: appXXXXXXXXXXXXXX
  AIRTABLE_BASE_ID: {
    pattern: /^app[a-zA-Z0-9]{10,}$/,
    example: 'appJ0PsYVgwCfBcYy',
    description: 'Airtable Base ID (app...)'
  },

  // Airtable API Key: pat 또는 key로 시작
  AIRTABLE_API_KEY: {
    pattern: /^(pat|key)[a-zA-Z0-9.]+$/,
    example: 'patXXXXXXXXXXXXXXXX',
    description: 'Airtable API Key (pat... 또는 key...)'
  },

  // Slack Bot Token: xoxb-로 시작
  SLACK_BOT_TOKEN: {
    pattern: /^xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+$/,
    example: 'xoxb-XXXX-XXXX-XXXXXXXXXXXX',
    description: 'Slack Bot Token (xoxb-...)'
  }
};

/**
 * 환경변수 검증 결과
 */
class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  addError(key, value, rule) {
    this.errors.push({
      key,
      value: this.maskValue(value),
      expected: rule.description,
      example: rule.example
    });
  }

  addWarning(key, message) {
    this.warnings.push({ key, message });
  }

  addPassed(key) {
    this.passed.push(key);
  }

  maskValue(value) {
    if (!value) return '(empty)';
    if (value.length <= 8) return '***';
    return value.substring(0, 4) + '...' + value.substring(value.length - 4);
  }

  get isValid() {
    return this.errors.length === 0;
  }

  get hasCriticalErrors() {
    // Slack/Airtable 핵심 키가 잘못되면 CRITICAL
    const criticalKeys = ['AIRTABLE_BASE_ID', 'AIRTABLE_API_KEY', 'SLACK_BOT_TOKEN'];
    return this.errors.some(e => criticalKeys.some(k => e.key.includes(k)));
  }
}

/**
 * 환경변수 검증 실행
 * @param {Object} options - 옵션
 * @param {boolean} options.failFast - 검증 실패 시 프로세스 종료 여부
 * @returns {ValidationResult} 검증 결과
 */
function validateEnv(options = { failFast: false }) {
  const result = new ValidationResult();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           환경변수 검증 (Environment Validator)            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 1. Slack 채널 ID 검증
  const slackChannelVars = [
    'SLACK_CHANNEL_UPGRADES',
    'SLACK_CHANNEL_REPORT',
    'SLACK_CHANNEL_REVIEW',
    'SLACK_CHANNEL_INTAKE'
  ];

  for (const key of slackChannelVars) {
    const value = process.env[key];
    if (value) {
      if (!ENV_RULES.SLACK_CHANNEL.pattern.test(value)) {
        result.addError(key, value, ENV_RULES.SLACK_CHANNEL);
      } else {
        result.addPassed(key);
      }
    }
  }

  // 2. Airtable Base ID 검증
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;
  if (airtableBaseId) {
    if (!ENV_RULES.AIRTABLE_BASE_ID.pattern.test(airtableBaseId)) {
      result.addError('AIRTABLE_BASE_ID', airtableBaseId, ENV_RULES.AIRTABLE_BASE_ID);
    } else {
      result.addPassed('AIRTABLE_BASE_ID');
    }
  } else {
    result.addWarning('AIRTABLE_BASE_ID', '미설정 - Airtable 기능 비활성화');
  }

  // 3. Airtable API Key 검증
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  if (airtableApiKey) {
    if (!ENV_RULES.AIRTABLE_API_KEY.pattern.test(airtableApiKey)) {
      result.addError('AIRTABLE_API_KEY', airtableApiKey, ENV_RULES.AIRTABLE_API_KEY);
    } else {
      result.addPassed('AIRTABLE_API_KEY');
    }
  } else {
    result.addWarning('AIRTABLE_API_KEY', '미설정 - Airtable 기능 비활성화');
  }

  // 4. Slack Bot Token 검증
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  if (slackBotToken) {
    if (!ENV_RULES.SLACK_BOT_TOKEN.pattern.test(slackBotToken)) {
      result.addError('SLACK_BOT_TOKEN', slackBotToken, ENV_RULES.SLACK_BOT_TOKEN);
    } else {
      result.addPassed('SLACK_BOT_TOKEN');
    }
  } else {
    result.addWarning('SLACK_BOT_TOKEN', '미설정 - Slack 기능 비활성화');
  }

  // 5. 흔한 실수 감지: Airtable ID가 Slack 변수에 들어간 경우
  for (const key of slackChannelVars) {
    const value = process.env[key];
    if (value && (value.includes('app') || value.includes('tbl'))) {
      result.addError(key, value, {
        description: 'Slack 채널 ID (C... 또는 G...) - Airtable ID가 잘못 입력됨!',
        example: 'C0A8CRLJW6B'
      });
    }
  }

  // 결과 출력
  if (result.passed.length > 0) {
    console.log('✅ 검증 통과:');
    result.passed.forEach(key => console.log(`   • ${key}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  경고:');
    result.warnings.forEach(w => console.log(`   • ${w.key}: ${w.message}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ 검증 실패:');
    result.errors.forEach(e => {
      console.log(`   • ${e.key}`);
      console.log(`     현재값: ${e.value}`);
      console.log(`     기대값: ${e.expected}`);
      console.log(`     예시:   ${e.example}`);
    });
    console.log('');

    if (options.failFast && result.hasCriticalErrors) {
      console.error('🚨 CRITICAL: 핵심 환경변수 오류로 서버를 시작할 수 없습니다.');
      console.error('   Render Dashboard에서 환경변수를 수정한 후 다시 배포하세요.\n');
      process.exit(1);
    }
  }

  const status = result.isValid ? '✅ 모든 검증 통과' : `❌ ${result.errors.length}개 오류 발견`;
  console.log(`══════════════════════════════════════════════════════════════`);
  console.log(`   검증 결과: ${status}`);
  console.log(`══════════════════════════════════════════════════════════════\n`);

  return result;
}

/**
 * 환경변수 설정 가이드 출력
 */
function printEnvGuide() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                     환경변수 설정 가이드 (Render)                          ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  [Slack 채널 ID]                                                           ║
║  • SLACK_CHANNEL_UPGRADES = C0XXXXXXX   # #ops-upgrades                    ║
║  • SLACK_CHANNEL_REPORT   = C0XXXXXXX   # #소원이-리포트                   ║
║  • SLACK_CHANNEL_REVIEW   = C0XXXXXXX   # #소원이-검수                     ║
║  • SLACK_CHANNEL_INTAKE   = C0XXXXXXX   # #소원이-인입                     ║
║                                                                            ║
║  [Airtable]                                                                ║
║  • AIRTABLE_BASE_ID       = appXXXXXXXXXXXXXX                              ║
║  • AIRTABLE_API_KEY       = patXXXXXXXXXXXXXX...                           ║
║                                                                            ║
║  [Slack Bot]                                                               ║
║  • SLACK_BOT_TOKEN        = xoxb-XXXX-XXXX-XXXX                            ║
║  • SLACK_SIGNING_SECRET   = XXXXXXXXXXXXXXXX                               ║
║                                                                            ║
║  ⚠️  주의: Slack 채널 ID는 Airtable ID (app.../tbl...)와 다릅니다!         ║
║           채널 상세 → 하단에서 C0... 형태 ID를 복사하세요.                 ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`);
}

module.exports = {
  validateEnv,
  printEnvGuide,
  ENV_RULES
};
