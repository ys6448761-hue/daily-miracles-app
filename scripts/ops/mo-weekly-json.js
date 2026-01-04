#!/usr/bin/env node
/**
 * mo-weekly-json.js
 *
 * MO(Marketing Orchestrator) 주간 입력 JSON 생성기
 * - 이벤트 로그, DB 등에서 데이터를 수집하여 MO 입력 스키마로 변환
 * - 매주 월요일 아침 실행 권장
 *
 * Usage:
 *   node scripts/ops/mo-weekly-json.js [options]
 *
 * Options:
 *   --week <YYYY-Www>     특정 주차 (예: 2026-W01, 기본: 이번 주)
 *   --out <path>          출력 파일 경로 (기본: stdout)
 *   --pretty              들여쓰기 출력 (기본: true)
 *   --help                도움말
 */

const fs = require('fs');
const path = require('path');

// eventLogger 모듈 로드
const eventLogger = require('../../services/eventLogger');

// ============ 설정 ============
const ROOT_DIR = path.resolve(__dirname, '../../');

// ============ 유틸리티 ============

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    week: null,
    out: null,
    pretty: true
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--week':
        options.week = args[++i];
        break;
      case '--out':
        options.out = args[++i];
        break;
      case '--pretty':
        options.pretty = true;
        break;
      case '--compact':
        options.pretty = false;
        break;
      case '--help':
      case '-h':
        console.log(`
MO(Marketing Orchestrator) 주간 입력 JSON 생성기

Usage:
  node scripts/ops/mo-weekly-json.js [options]

Options:
  --week <YYYY-Www>     특정 주차 (예: 2026-W01, 기본: 이번 주)
  --out <path>          출력 파일 경로 (기본: stdout)
  --pretty              들여쓰기 출력 (기본)
  --compact             한 줄 출력
  --help                도움말

Examples:
  node scripts/ops/mo-weekly-json.js
  node scripts/ops/mo-weekly-json.js --week 2026-W01
  node scripts/ops/mo-weekly-json.js --out artifacts/mo-input-2026-W01.json

JSON 스키마:
  MO 프롬프트 v1.0 입력 스키마에 맞춰 출력합니다.
  - period, previous_period (날짜 범위)
  - kpis (visits, signups, day1, day3, season_complete, trial, paid 등)
  - content_slots (blank, choice, testimony, delivery, mining)
  - experiments, winning_atoms, mentor_engine, risk
`);
        process.exit(0);
    }
  }

  return options;
}

/**
 * ISO 주차에서 날짜 범위 계산
 * @param {string} weekStr - "YYYY-Www" 형식 (예: "2026-W01")
 * @returns {{start: string, end: string}}
 */
function getWeekRange(weekStr) {
  if (weekStr) {
    // YYYY-Www 파싱
    const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const week = parseInt(match[2], 10);

      // ISO 주차 → 날짜 변환 (월요일 시작)
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay() || 7;
      const firstMonday = new Date(jan4);
      firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);

      const start = new Date(firstMonday);
      start.setDate(firstMonday.getDate() + (week - 1) * 7);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
      };
    }
  }

  // 기본: 이번 주 (월~일)
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10)
  };
}

/**
 * 이전 주 날짜 범위 계산
 */
function getPreviousWeekRange(currentRange) {
  const startDate = new Date(currentRange.start);
  startDate.setDate(startDate.getDate() - 7);

  const endDate = new Date(currentRange.end);
  endDate.setDate(endDate.getDate() - 7);

  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10)
  };
}

/**
 * 이벤트 로그에서 KPI 집계
 */
function collectKPIsFromEvents(period, prevPeriod) {
  // 이번 주 이벤트
  const thisWeekEvents = eventLogger.readEvents({
    dateFrom: period.start,
    dateTo: period.end
  });

  // 전주 이벤트
  const prevWeekEvents = eventLogger.readEvents({
    dateFrom: prevPeriod.start,
    dateTo: prevPeriod.end
  });

  // 이벤트 카운트
  const countEvents = (events, type) => events.filter(e => e.event === type).length;

  return {
    visits: {
      this: 0, // TODO: 방문 로그에서 집계
      prev: 0
    },
    signups_or_starts: {
      this: countEvents(thisWeekEvents, 'trial_start'),
      prev: countEvents(prevWeekEvents, 'trial_start')
    },
    participation_responses: {
      this: 0, // TODO: 참여 슬롯 응답에서 집계
      prev: 0
    },
    day1_active: {
      this: 0, // TODO: D1 활성에서 집계
      prev: 0
    },
    day3_retained: {
      this: thisWeekEvents.filter(e => e.event === 'day3_inactive').length === 0 ? 0 : 0,
      prev: 0
    },
    season_complete: {
      this: 0, // TODO: 시즌 완주에서 집계
      prev: 0
    },
    trial_start: {
      this: countEvents(thisWeekEvents, 'trial_start'),
      prev: countEvents(prevWeekEvents, 'trial_start')
    },
    paid_converted: {
      this: 0, // TODO: 결제 완료에서 집계
      prev: 0
    }
  };
}

/**
 * 콘텐츠 슬롯 데이터 (현재는 플레이스홀더)
 */
function collectContentSlots() {
  return [
    { type: 'blank', posts: 0, responses: 0 },
    { type: 'choice', posts: 0, responses: 0 },
    { type: 'testimony', posts: 0, responses: 0 },
    { type: 'delivery', posts: 0, responses: 0 },
    { type: 'mining', posts: 0, responses: 0 }
  ];
}

/**
 * 실험 데이터 템플릿
 */
function collectExperiments() {
  return [
    {
      name: '',
      hypothesis: '',
      change: '',
      metric_result: '',
      verdict: 'LEARN',
      next_action: ''
    }
  ];
}

/**
 * Winning Atoms 템플릿
 */
function collectWinningAtoms() {
  return [
    { hook: '', insight: '', cta: '' }
  ];
}

/**
 * 멘토 엔진 데이터 (현재는 플레이스홀더)
 */
function collectMentorEngine() {
  return {
    self_reports: { this: 0, prev: 0 },
    hold: { this: 0, prev: 0 },
    pass: { this: 0, prev: 0 },
    reject: { this: 0, prev: 0 },
    avg_review_lead_time_hours: { this: 0, prev: 0 },
    mentors: []
  };
}

/**
 * 리스크 데이터 (현재는 플레이스홀더)
 */
function collectRisk() {
  return {
    hold_sensitive: { this: 0, prev: 0 },
    fail_policy: { this: 0, prev: 0 },
    spam_abuse_suspects: { this: 0, prev: 0 },
    mentor_quality_issues: { this: 0, prev: 0 },
    top_case_summary: ''
  };
}

// ============ 메인 ============

async function main() {
  const options = parseArgs();

  // 날짜 범위 계산
  const period = getWeekRange(options.week);
  const previousPeriod = getPreviousWeekRange(period);

  console.error(`📊 MO Weekly JSON 생성`);
  console.error(`   이번 주: ${period.start} ~ ${period.end}`);
  console.error(`   전주: ${previousPeriod.start} ~ ${previousPeriod.end}`);
  console.error('');

  // MO 입력 JSON 생성
  const moInput = {
    _meta: {
      generator: 'mo-weekly-json.js',
      generated_at: new Date().toISOString(),
      version: '1.0'
    },
    period: {
      start: period.start,
      end: period.end
    },
    previous_period: {
      start: previousPeriod.start,
      end: previousPeriod.end
    },
    kpis: collectKPIsFromEvents(period, previousPeriod),
    content_slots: collectContentSlots(),
    experiments: collectExperiments(),
    winning_atoms: collectWinningAtoms(),
    mentor_engine: collectMentorEngine(),
    risk: collectRisk()
  };

  // 출력
  const jsonStr = options.pretty
    ? JSON.stringify(moInput, null, 2)
    : JSON.stringify(moInput);

  if (options.out) {
    const outputPath = path.resolve(options.out);
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, jsonStr, 'utf-8');
    console.error(`✅ 저장됨: ${outputPath}`);
  } else {
    console.log(jsonStr);
  }

  // TBD 항목 안내
  console.error('');
  console.error('📝 TBD 항목 (데이터 소스 연동 필요):');
  console.error('   - visits: 방문 로그 연동');
  console.error('   - participation_responses: 참여 슬롯 응답 연동');
  console.error('   - day1_active, day3_retained: 활성 추적 연동');
  console.error('   - season_complete: 시즌 완주 이벤트 연동');
  console.error('   - paid_converted: 결제 완료 이벤트 연동');
  console.error('   - content_slots: 콘텐츠 게시/응답 연동');
  console.error('   - mentor_engine: 멘토 시스템 연동');
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
