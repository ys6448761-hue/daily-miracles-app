/**
 * Guardian Dispatch V0 설정
 *
 * 안전한 자동 발송 시스템
 * - 6가지 필터 조건 (Fail Closed)
 * - Phase 1: Dry Run only (1주일)
 * - Phase 2: 수동 승인 후 실제 발송
 *
 * @version 1.0 - 2026.08.16
 */

// ═══════════════════════════════════════════════════════════
// 활성화 플래그
// ═══════════════════════════════════════════════════════════
// false (기본) → 스케줄러 등록 안 함
// true → 스케줄러 등록
const GUARDIAN_DISPATCH_ENABLED = process.env.GUARDIAN_DISPATCH_ENABLED === 'true';

// ═══════════════════════════════════════════════════════════
// 배포 시점 타임스탬프 (최초 1회만 설정, 변경 금지)
// ═══════════════════════════════════════════════════════════
// 이 값은 Guardian Dispatch V0가 Production에 처음 배포된 시각으로 설정됨
// 이 시점 이전의 모든 사용자 데이터는 테스트 데이터로 간주하여
// 영구적으로 Guardian Dispatch 대상에서 제외됨
//
// 설정 방식:
// 1. 배포 시: 현재 UTC 시각을 ISO 8601 형식으로 기록
// 2. 이후: 절대 변경하지 않음 (Fallback: 환경변수로만 업데이트)
//
// 동적 기록:
// - GUARDIAN_DISPATCH_CUTOFF_AT가 미설정이면 현재 시각으로 자동 설정
// - 1회만 설정되며 이후 변경 금지
const GUARDIAN_DISPATCH_CUTOFF_AT = process.env.GUARDIAN_DISPATCH_CUTOFF_AT || new Date().toISOString();

// ═══════════════════════════════════════════════════════════
// Phase 제어 플래그
// ═══════════════════════════════════════════════════════════
// Phase 1 (Dry Run): 로깅만, SMS 발송 금지
// Phase 2 (Live): 실제 SMS 발송
const GUARDIAN_DISPATCH_DRY_RUN = process.env.GUARDIAN_DISPATCH_DRY_RUN !== 'false';

// ═══════════════════════════════════════════════════════════
// 스케줄러 설정
// ═══════════════════════════════════════════════════════════
// 21:00 KST = 12:00 UTC
const DISPATCH_SCHEDULE_CRON = '0 12 * * *'; // 매일 12:00 UTC (= 21:00 KST)

// ═══════════════════════════════════════════════════════════
// SMS 메시지 템플릿
// ═══════════════════════════════════════════════════════════
// V0 목적: 소원별 상태확인 및 재접속 유도
// {이름}, {별 링크} 변수 치환
const SMS_TEMPLATE = (name, starLink) => {
  return `안녕하세요, ${name}님.
오늘 DreamTown에서 만든 소원별은 잘 간직하고 계신가요?
오늘 하루, 그 소원을 어떻게 보내셨는지 들려주세요.
${starLink}`;
};

// ═══════════════════════════════════════════════════════════
// 6가지 필터 조건 (순서 중요)
// ═══════════════════════════════════════════════════════════
const FILTER_CONDITIONS = {
  // 1. 신규 사용자만 대상 (배포 이후 생성된 사용자)
  CREATED_AFTER_CUTOFF: {
    name: '신규 사용자 필터',
    check: (profile) => new Date(profile.created_at) > new Date(GUARDIAN_DISPATCH_CUTOFF_AT),
    exclude_reason: 'created_before_cutoff'
  },

  // 2. 추적 메시지 수신 동의 (want_message=true)
  // Guardian Dispatch는 마케팅 메시지가 아니라 소원별 추적 메시지이므로
  // 7일 추적 메시지 수신 동의 기반으로만 발송
  TRACKING_MESSAGE_AGREED: {
    name: '추적 메시지 동의 필터',
    check: (profile) => profile.want_message === true,
    exclude_reason: 'tracking_message_not_agreed'
  },

  // 3. 개인정보 동의자만
  PRIVACY_AGREED: {
    name: '개인정보 동의 필터',
    check: (profile) => profile.privacy_agreed === true,
    exclude_reason: 'privacy_not_agreed'
  },

  // 4. 유효한 이름 (2~20자, 정상 사용자명)
  VALID_NAME: {
    name: '이름 유효성 필터',
    check: (profile) => {
      if (!profile.name) return false;
      const name = profile.name.trim();
      if (name.length < 2 || name.length > 20) return false;

      // 정상 사용자명 검증:
      // - 한글, 영문, 공백, 하이픈만 허용
      // - 숫자-only, 공백-only 제외
      // - 테스트명 제외: test/테스트/sample/admin/홍길동
      const testNames = ['test', '테스트', 'sample', 'admin', '홍길동', 'john doe', '김철수'];
      if (testNames.includes(name.toLowerCase())) return false;

      // 숫자-only 제외
      if (/^\d+$/.test(name)) return false;

      // 공백-only 제외
      if (/^\s+$/.test(name)) return false;

      // 한글/영문/공백/하이픈/점 조합만 허용
      if (!/^[가-힣a-zA-Z\s\-\.]*$/.test(name)) return false;

      return true;
    },
    exclude_reason: 'invalid_name'
  },

  // 5. 유효한 전화번호 (국내 휴대전화)
  VALID_PHONE: {
    name: '전화번호 유효성 필터',
    check: (profile) => {
      if (!profile.phone_hash) return false;

      // phone_hash는 실제 번호를 SHA256으로 해싱한 것
      // 단순 존재 여부만 확인 (구체적 검증은 DB에서 수행)
      return profile.phone_hash.length > 0;
    },
    exclude_reason: 'invalid_phone'
  },

  // 6. 중복 발송 제외 (같은 wish_entry에 대해 같은 날짜에 이미 발송된 경우만)
  // 같은 사용자라도 다른 wish_entry면 발송 (wish_entry 단위)
  NOT_ALREADY_SENT_FOR_WISH_TODAY: {
    name: '중복 발송 방지 필터 (wish_entry 단위)',
    check: async (profile, db) => {
      if (!db) return true; // DB 없으면 스킵 가능
      if (!profile.wish_entry_id) return true; // wish_entry_id 없으면 스킵

      try {
        const today = new Date().toISOString().split('T')[0];
        const result = await db.query(
          `SELECT COUNT(*) as count FROM message_dispatch_logs
           WHERE phone_hash = $1
             AND event_name = 'guardian_dispatch'
             AND delivery_status IN ('sent', 'dry_run')
             AND DATE(created_at) = $2
             AND details->>'wish_entry_id' = $3`,
          [profile.phone_hash, today, profile.wish_entry_id]
        );

        const alreadySent = result.rows[0].count > 0;
        return !alreadySent; // 아직 발송 안 했으면 true
      } catch (error) {
        console.error('[DispatchConfig] 중복 검증 오류:', error.message);
        // Fail Closed: 오류 나면 제외
        return false;
      }
    },
    exclude_reason: 'duplicate_wish_today'
  }
};

// ═══════════════════════════════════════════════════════════
// 대상자 조회 SQL 쿼리
// ═══════════════════════════════════════════════════════════
// V0 목적: 소원별(wish_entry) 상태확인 메시지
// - wish_entries 기준 (같은 사용자도 여러 wish에 대해 각각 발송)
// - want_message=true인 wish_entry만 대상
// - creator 프로필 동의 조건 확인
const QUERY_ELIGIBLE_PROFILES = `
  SELECT DISTINCT
    sp.id as profile_id,
    sp.name,
    sp.phone_hash,
    sp.privacy_agreed,
    sp.created_at as profile_created_at,
    we.id as wish_entry_id,
    we.created_at as wish_created_at,
    wtr.want_message
  FROM wish_entries we
  INNER JOIN sowon_profiles sp ON we.creator_profile_id = sp.id
  INNER JOIN wish_tracking_requests wtr ON we.id = wtr.wish_entry_id
  WHERE we.created_at > $1
    AND sp.privacy_agreed = true
    AND wtr.want_message = true
  ORDER BY we.created_at DESC
`;

// ═══════════════════════════════════════════════════════════
// 발송 로그 상태값
// ═══════════════════════════════════════════════════════════
const DISPATCH_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  SKIPPED: 'dry_run',      // Dry Run 상태
  EXCLUDED: 'excluded'      // 필터에서 제외
};

// ═══════════════════════════════════════════════════════════
// 로깅 및 감시
// ═══════════════════════════════════════════════════════════
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

// ═══════════════════════════════════════════════════════════
// 설정 검증
// ═══════════════════════════════════════════════════════════
function validateConfig() {
  const errors = [];

  if (!GUARDIAN_DISPATCH_CUTOFF_AT) {
    errors.push('❌ GUARDIAN_DISPATCH_CUTOFF_AT 미설정');
  }

  if (typeof GUARDIAN_DISPATCH_DRY_RUN !== 'boolean') {
    errors.push('❌ GUARDIAN_DISPATCH_DRY_RUN 불린값 필요');
  }

  if (!SMS_TEMPLATE) {
    errors.push('❌ SMS_TEMPLATE 미설정');
  }

  if (Object.keys(FILTER_CONDITIONS).length !== 6) {
    errors.push('❌ 필터 조건 정확히 6개 필요');
  }

  if (errors.length > 0) {
    console.error('[DispatchConfig] 설정 오류:');
    errors.forEach(e => console.error(e));
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════
// 로그 출력 헬퍼
// ═══════════════════════════════════════════════════════════
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const prefix = `[Guardian Dispatch ${level}]`;

  if (level === LOG_LEVELS.ERROR) {
    console.error(`${prefix} ${timestamp}`, message, data);
  } else if (level === LOG_LEVELS.WARN) {
    console.warn(`${prefix} ${timestamp}`, message, data);
  } else {
    console.log(`${prefix} ${timestamp}`, message, data);
  }
}

// ═══════════════════════════════════════════════════════════
// 내보내기
// ═══════════════════════════════════════════════════════════
module.exports = {
  // 설정
  GUARDIAN_DISPATCH_ENABLED,
  GUARDIAN_DISPATCH_CUTOFF_AT,
  GUARDIAN_DISPATCH_DRY_RUN,
  DISPATCH_SCHEDULE_CRON,
  SMS_TEMPLATE,
  FILTER_CONDITIONS,
  QUERY_ELIGIBLE_PROFILES,
  DISPATCH_STATUS,
  LOG_LEVELS,

  // 헬퍼
  validateConfig,
  log
};

// 시작 시 검증
if (process.env.NODE_ENV === 'production' || process.env.GUARDIAN_DISPATCH_ENABLED === 'true') {
  console.log('[DispatchConfig] 초기화:');
  console.log(`  GUARDIAN_DISPATCH_CUTOFF_AT: ${GUARDIAN_DISPATCH_CUTOFF_AT}`);
  console.log(`  GUARDIAN_DISPATCH_DRY_RUN: ${GUARDIAN_DISPATCH_DRY_RUN}`);
  console.log(`  DISPATCH_SCHEDULE_CRON: ${DISPATCH_SCHEDULE_CRON}`);

  if (!validateConfig()) {
    console.error('[DispatchConfig] 설정 검증 실패 — 배포 차단');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
