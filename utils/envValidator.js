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
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Export Pipeline 관련 환경변수
  // ═══════════════════════════════════════════════════════════════════════

  // GitHub Token: ghp_ 또는 github_pat_ 로 시작
  GITHUB_TOKEN: {
    pattern: /^(ghp_|github_pat_)[a-zA-Z0-9_]+$/,
    example: 'ghp_xxxxxxxxxxxxxxxxxxxx',
    description: 'GitHub Personal Access Token (ghp_... 또는 github_pat_...)'
  },

  // Google Drive Folder ID: 문자+숫자+언더스코어/하이픈
  DRIVE_FOLDER_ID: {
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    example: '1abc123XYZ_defGHI456',
    description: 'Google Drive 폴더 ID (20자 이상)'
  },

  // Google Sheets ID: 문자+숫자+언더스코어/하이픈
  GOOGLE_SHEET_ID: {
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    example: '1abc123XYZ_defGHI456jkl',
    description: 'Google Sheets ID (20자 이상)'
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

  // 6. Export Pipeline 환경변수 검증
  validateExportEnvVars(result);

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

/**
 * Export Pipeline 환경변수 검증
 * @param {ValidationResult} result - 검증 결과 객체
 */
function validateExportEnvVars(result) {
  // GitHub Token
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    if (!ENV_RULES.GITHUB_TOKEN.pattern.test(githubToken)) {
      result.addError('GITHUB_TOKEN', githubToken, ENV_RULES.GITHUB_TOKEN);
    } else {
      result.addPassed('GITHUB_TOKEN');
    }
  } else {
    result.addWarning('GITHUB_TOKEN', '미설정 - GitHub Export 비활성화');
  }

  // Google Service Account JSON (존재 여부만 체크)
  const googleServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (googleServiceAccount) {
    try {
      const parsed = JSON.parse(googleServiceAccount);
      if (parsed.client_email && parsed.private_key) {
        result.addPassed('GOOGLE_SERVICE_ACCOUNT_JSON');
      } else {
        result.addError('GOOGLE_SERVICE_ACCOUNT_JSON', '(invalid)', {
          description: 'client_email과 private_key 필드 필요',
          example: '{"type":"service_account","client_email":"...","private_key":"..."}'
        });
      }
    } catch (e) {
      result.addError('GOOGLE_SERVICE_ACCOUNT_JSON', '(parse error)', {
        description: '유효한 JSON 형식이어야 함',
        example: '{"type":"service_account",...}'
      });
    }
  } else {
    result.addWarning('GOOGLE_SERVICE_ACCOUNT_JSON', '미설정 - Drive Export 비활성화');
  }

  // DECISION_EXPORT_READY_FOLDER_ID
  const readyFolderId = process.env.DECISION_EXPORT_READY_FOLDER_ID;
  if (readyFolderId) {
    if (!ENV_RULES.DRIVE_FOLDER_ID.pattern.test(readyFolderId)) {
      result.addError('DECISION_EXPORT_READY_FOLDER_ID', readyFolderId, ENV_RULES.DRIVE_FOLDER_ID);
    } else {
      result.addPassed('DECISION_EXPORT_READY_FOLDER_ID');
    }
  } else {
    result.addWarning('DECISION_EXPORT_READY_FOLDER_ID', '미설정 - Export READY 폴더 미지정');
  }

  // EXPORT_REGISTRY_TABLE (Airtable 테이블명 - 형식 자유)
  const registryTable = process.env.EXPORT_REGISTRY_TABLE;
  if (registryTable) {
    result.addPassed('EXPORT_REGISTRY_TABLE');
  }

  // Slack Alert 채널 (Export용)
  const alertChannel = process.env.SLACK_CHANNEL_ALERTS || process.env.SLACK_CHANNEL_AURORA5_ALERTS;
  if (alertChannel) {
    if (!ENV_RULES.SLACK_CHANNEL.pattern.test(alertChannel)) {
      result.addError('SLACK_CHANNEL_ALERTS', alertChannel, ENV_RULES.SLACK_CHANNEL);
    } else {
      result.addPassed('SLACK_CHANNEL_ALERTS');
    }
  }
}

/**
 * Export Pipeline 설정 상태 출력 (값 미노출)
 */
function printExportStatus() {
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│           Export Pipeline 설정 상태                          │');
  console.log('├─────────────────────────────────────────────────────────────┤');

  const exportEnvs = [
    { key: 'GITHUB_TOKEN', label: 'GitHub Token' },
    { key: 'GITHUB_OWNER', label: 'GitHub Owner' },
    { key: 'GITHUB_REPO', label: 'GitHub Repo' },
    { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', label: 'Google SA' },
    { key: 'DECISION_EXPORT_READY_FOLDER_ID', label: 'READY Folder' },
    { key: 'AIRTABLE_API_KEY', label: 'Registry (Airtable)' },
    { key: 'SLACK_CHANNEL_ALERTS', label: 'Slack Alerts', alt: 'SLACK_CHANNEL_AURORA5_ALERTS' },
    { key: 'SLACK_CHANNEL_RAW_DIGEST', label: 'Slack Digest' }
  ];

  let allConfigured = true;
  let criticalMissing = [];

  for (const env of exportEnvs) {
    const value = process.env[env.key] || (env.alt ? process.env[env.alt] : null);
    const status = value ? '✅' : '❌';
    const padding = ' '.repeat(Math.max(0, 20 - env.label.length));
    console.log(`│  ${env.label}${padding}: ${status}                                    │`);

    if (!value) {
      allConfigured = false;
      if (['GITHUB_TOKEN', 'GOOGLE_SERVICE_ACCOUNT_JSON', 'DECISION_EXPORT_READY_FOLDER_ID'].includes(env.key)) {
        criticalMissing.push(env.key);
      }
    }
  }

  console.log('├─────────────────────────────────────────────────────────────┤');

  if (allConfigured) {
    console.log('│  Export Pipeline: ✅ READY                                  │');
  } else if (criticalMissing.length > 0) {
    console.log('│  Export Pipeline: ❌ DISABLED (필수 환경변수 미설정)         │');
  } else {
    console.log('│  Export Pipeline: ⚠️  PARTIAL (일부 기능 제한)               │');
  }

  console.log('└─────────────────────────────────────────────────────────────┘\n');

  return {
    ready: allConfigured,
    partial: !allConfigured && criticalMissing.length === 0,
    disabled: criticalMissing.length > 0,
    criticalMissing
  };
}

module.exports = {
  validateEnv,
  printEnvGuide,
  printExportStatus,
  validateExportEnvVars,
  ENV_RULES
};
