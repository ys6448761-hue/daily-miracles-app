#!/usr/bin/env node
/**
 * check-day3-inactive.js
 *
 * 3일째 비활성 사용자 체크 스크립트
 * - trial_start 이벤트 중 3일 경과 + 활동 없는 사용자 탐지
 * - day3_inactive 이벤트 로깅
 *
 * Usage:
 *   node scripts/ops/check-day3-inactive.js [--dry-run]
 *
 * 권장 실행 주기: 매일 1회 (Cron 또는 GitHub Actions)
 */

const fs = require('fs');
const path = require('path');
const { logEvent, readEvents, EVENT_TYPES } = require('../../services/eventLogger');

// ============ 설정 ============
const INACTIVE_THRESHOLD_DAYS = 3;
const ROOT_DIR = path.resolve(__dirname, '../../');
const WISHES_DIR = path.join(ROOT_DIR, 'data', 'wishes');

// ============ CLI 인자 파싱 ============
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help') || args.includes('-h')
  };
}

// ============ 유틸리티 ============

/**
 * 날짜 차이 계산 (일 단위)
 */
function daysDiff(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * 활성 사용자 목록 가져오기 (최근 N일간 활동)
 * - 소원 데이터에서 마지막 활동 시간 확인
 */
async function getActiveUsers(sinceDays) {
  const activeUsers = new Set();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - sinceDays);

  try {
    if (!fs.existsSync(WISHES_DIR)) {
      return activeUsers;
    }

    const files = fs.readdirSync(WISHES_DIR);

    for (const file of files) {
      if (!file.endsWith('.json') || file.startsWith('daily_')) continue;

      try {
        const filepath = path.join(WISHES_DIR, file);
        const content = fs.readFileSync(filepath, 'utf-8');
        const wish = JSON.parse(content);

        // 최근 활동 확인 (created_at 또는 updated_at)
        const activityDate = new Date(wish.updated_at || wish.created_at);
        if (activityDate >= cutoffDate && wish.phone) {
          // 전화번호 마스킹하여 저장 (개인정보 보호)
          const maskedPhone = wish.phone.substring(0, 3) + '****' + wish.phone.slice(-4);
          activeUsers.add(maskedPhone);
        }
      } catch (err) {
        // 파일 읽기 실패 무시
      }
    }
  } catch (err) {
    console.error('활성 사용자 조회 실패:', err.message);
  }

  return activeUsers;
}

/**
 * trial_start 이벤트 중 3일 경과한 사용자 찾기
 */
async function findInactiveTrialUsers() {
  const today = new Date();
  const targetDate = new Date();
  targetDate.setDate(today.getDate() - INACTIVE_THRESHOLD_DAYS);
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  // 3일 전 trial_start 이벤트 조회 (async - DB 우선)
  const trialEvents = await readEvents({
    event: EVENT_TYPES.TRIAL_START,
    date: targetDateStr
  });

  console.log(`📅 ${targetDateStr} trial_start 이벤트: ${trialEvents.length}건`);

  if (trialEvents.length === 0) {
    return [];
  }

  // 최근 3일간 활성 사용자
  const activeUsers = await getActiveUsers(INACTIVE_THRESHOLD_DAYS);
  console.log(`👥 최근 ${INACTIVE_THRESHOLD_DAYS}일간 활성 사용자: ${activeUsers.size}명`);

  // 이미 day3_inactive 로깅된 사용자 제외
  const alreadyLogged = new Set();
  const day3Events = await readEvents({ event: EVENT_TYPES.DAY3_INACTIVE });
  for (const e of day3Events) {
    if (e.phone) alreadyLogged.add(e.phone);
    if (e.wish_id) alreadyLogged.add(e.wish_id);
  }

  // 비활성 사용자 필터링
  const inactiveUsers = trialEvents.filter(e => {
    // 이미 로깅됨
    if (alreadyLogged.has(e.phone) || alreadyLogged.has(e.wish_id)) {
      return false;
    }
    // 최근 활동 있음
    if (activeUsers.has(e.phone)) {
      return false;
    }
    return true;
  });

  return inactiveUsers;
}

// ============ 메인 ============

async function main() {
  const options = parseArgs();

  if (options.help) {
    console.log(`
3일째 비활성 사용자 체크 스크립트

Usage:
  node scripts/ops/check-day3-inactive.js [--dry-run]

Options:
  --dry-run   실제 로깅 없이 시뮬레이션만
  --help      도움말

설명:
  - 3일 전 trial_start한 사용자 중 최근 활동 없는 사용자 탐지
  - day3_inactive 이벤트로 로깅
  - 매일 1회 실행 권장
`);
    process.exit(0);
  }

  console.log('═'.repeat(60));
  console.log('⏰ 3일째 비활성 사용자 체크');
  console.log('═'.repeat(60));
  console.log(`실행 시각: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`Dry-run: ${options.dryRun}`);
  console.log('');

  const inactiveUsers = await findInactiveTrialUsers();

  console.log('');
  console.log(`🔍 비활성 사용자 발견: ${inactiveUsers.length}명`);

  if (inactiveUsers.length === 0) {
    console.log('✅ 처리할 비활성 사용자가 없습니다.');
    process.exit(0);
  }

  // 이벤트 로깅
  let logged = 0;
  for (const user of inactiveUsers) {
    console.log(`  - ${user.user_name || 'Unknown'} (${user.phone || 'N/A'})`);

    if (!options.dryRun) {
      try {
        await logEvent(EVENT_TYPES.DAY3_INACTIVE, {
          wish_id: user.wish_id,
          user_name: user.user_name,
          phone: user.phone,
          gem: user.gem,
          trial_start_date: user.date,
          last_active: 'unknown'
        }, { source: 'check-day3-inactive' });
        logged++;
      } catch (err) {
        console.error(`    ❌ 로깅 실패: ${err.message}`);
      }
    }
  }

  console.log('');
  if (options.dryRun) {
    console.log(`📝 [DRY-RUN] ${inactiveUsers.length}명 로깅 예정`);
  } else {
    console.log(`✅ ${logged}명 day3_inactive 이벤트 로깅 완료`);
  }
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
