#!/usr/bin/env node
/**
 * funnel-daily-report.js
 *
 * 체크아웃 퍼널 + 가치 퍼널 일일 리포트
 * - DB 우선 조회 (PostgreSQL marketing_events)
 * - 목표치(Floor/Target) 대비 알람 표시
 * - unique 기준 집계 (checkout_id, story_id, share_token)
 *
 * Usage:
 *   node scripts/ops/funnel-daily-report.js [options]
 *
 * Options:
 *   --date <YYYY-MM-DD>   특정 날짜 (기본: 오늘)
 *   --range <N>           최근 N일 집계 (기본: 1)
 *   --out <path>          출력 파일 경로 (기본: artifacts/reports/daily-funnel.md)
 *   --json                JSON 형식 출력
 *   --help                도움말
 */

const fs = require('fs');
const path = require('path');

// DB 모듈 로드
let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ DB 모듈 로드 실패 - 파일 모드로 동작');
}

// ============ 목표치 정의 ============
const THRESHOLDS = {
  'Complete/Initiate': { floor: 5, target: 10, stretch: 15 },
  'Generated/Complete': { floor: 90, target: 97, stretch: 99 },
  'Viewed/Generated': { floor: 40, target: 60, stretch: 75 },
  'ShareCreated/Viewed': { floor: 5, target: 12, stretch: 20 },
  'ShareOpened/ShareCreated': { floor: 30, target: 50, stretch: 70 }
};

// 최소 표본 수 (이하면 일일 판단 금지)
const MIN_SAMPLE_SIZE = 30;

// ============ 유틸리티 ============

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    date: null,
    range: 1,
    out: path.resolve(__dirname, '../../artifacts/reports/daily-funnel.md'),
    json: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--date':
        options.date = args[++i];
        break;
      case '--range':
        options.range = parseInt(args[++i], 10) || 1;
        break;
      case '--out':
        options.out = args[++i];
        break;
      case '--json':
        options.json = true;
        break;
      case '--help':
      case '-h':
        console.log(`
체크아웃 퍼널 + 가치 퍼널 일일 리포트

Usage:
  node scripts/ops/funnel-daily-report.js [options]

Options:
  --date <YYYY-MM-DD>   특정 날짜 (기본: 오늘)
  --range <N>           최근 N일 집계 (기본: 1)
  --out <path>          출력 파일 경로 (기본: artifacts/reports/daily-funnel.md)
  --json                JSON 형식 콘솔 출력
  --help                도움말

Examples:
  node scripts/ops/funnel-daily-report.js                  # 오늘 리포트
  node scripts/ops/funnel-daily-report.js --range 7        # 최근 7일
  node scripts/ops/funnel-daily-report.js --date 2026-01-05
`);
        process.exit(0);
    }
  }

  return options;
}

function getDateRange(options) {
  if (options.date) {
    return { from: options.date, to: options.date };
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - options.range + 1);

  return {
    from: startDate.toISOString().slice(0, 10),
    to: endDate.toISOString().slice(0, 10)
  };
}

// ============ DB 쿼리 ============

/**
 * unique 기준 퍼널 데이터 조회 (DB)
 */
async function getFunnelDataFromDB(dateFrom, dateTo) {
  if (!db) return null;

  // checkout_initiate: unique checkout_id
  const initiateQuery = `
    SELECT COUNT(DISTINCT payload->>'checkout_id') as count
    FROM marketing_events
    WHERE event_type = 'checkout_initiate'
      AND event_date >= $1 AND event_date <= $2
      AND payload->>'checkout_id' IS NOT NULL
  `;

  // checkout_complete: unique checkout_id
  const completeQuery = `
    SELECT COUNT(DISTINCT payload->>'checkout_id') as count
    FROM marketing_events
    WHERE event_type = 'checkout_complete'
      AND event_date >= $1 AND event_date <= $2
      AND payload->>'checkout_id' IS NOT NULL
  `;

  // storybook_generated: unique story_id
  const generatedQuery = `
    SELECT COUNT(DISTINCT COALESCE(payload->>'story_id', wish_id)) as count
    FROM marketing_events
    WHERE event_type = 'storybook_generated'
      AND event_date >= $1 AND event_date <= $2
  `;

  // story_viewed: unique story_id
  const viewedQuery = `
    SELECT COUNT(DISTINCT COALESCE(payload->>'story_id', wish_id)) as count
    FROM marketing_events
    WHERE event_type = 'story_viewed'
      AND event_date >= $1 AND event_date <= $2
  `;

  // share_created: unique share_token
  const shareCreatedQuery = `
    SELECT COUNT(DISTINCT payload->>'share_token') as count
    FROM marketing_events
    WHERE event_type = 'share_created'
      AND event_date >= $1 AND event_date <= $2
      AND payload->>'share_token' IS NOT NULL
  `;

  // share_opened: unique share_token
  const shareOpenedQuery = `
    SELECT COUNT(DISTINCT payload->>'share_token') as count
    FROM marketing_events
    WHERE event_type = 'share_opened'
      AND event_date >= $1 AND event_date <= $2
      AND payload->>'share_token' IS NOT NULL
  `;

  // trial_start: 참고용
  const trialQuery = `
    SELECT COUNT(*) as count
    FROM marketing_events
    WHERE event_type = 'trial_start'
      AND event_date >= $1 AND event_date <= $2
  `;

  const [initiate, complete, generated, viewed, shareCreated, shareOpened, trial] = await Promise.all([
    db.query(initiateQuery, [dateFrom, dateTo]),
    db.query(completeQuery, [dateFrom, dateTo]),
    db.query(generatedQuery, [dateFrom, dateTo]),
    db.query(viewedQuery, [dateFrom, dateTo]),
    db.query(shareCreatedQuery, [dateFrom, dateTo]),
    db.query(shareOpenedQuery, [dateFrom, dateTo]),
    db.query(trialQuery, [dateFrom, dateTo])
  ]);

  return {
    trial_start: parseInt(trial.rows[0].count, 10),
    checkout_initiate: parseInt(initiate.rows[0].count, 10),
    checkout_complete: parseInt(complete.rows[0].count, 10),
    storybook_generated: parseInt(generated.rows[0].count, 10),
    story_viewed: parseInt(viewed.rows[0].count, 10),
    share_created: parseInt(shareCreated.rows[0].count, 10),
    share_opened: parseInt(shareOpened.rows[0].count, 10)
  };
}

// ============ 퍼널 계산 ============

/**
 * 퍼널 비율 및 상태 계산
 */
function calculateFunnel(data) {
  const funnel = [];

  // 결제 퍼널
  const completeInitiateRate = data.checkout_initiate > 0
    ? (data.checkout_complete / data.checkout_initiate * 100)
    : 0;

  funnel.push({
    name: 'Complete/Initiate',
    numerator: data.checkout_complete,
    denominator: data.checkout_initiate,
    rate: completeInitiateRate,
    ...getStatus('Complete/Initiate', completeInitiateRate, data.checkout_initiate)
  });

  // 가치 퍼널: Generated/Complete
  const generatedCompleteRate = data.checkout_complete > 0
    ? (data.storybook_generated / data.checkout_complete * 100)
    : 0;

  funnel.push({
    name: 'Generated/Complete',
    numerator: data.storybook_generated,
    denominator: data.checkout_complete,
    rate: generatedCompleteRate,
    ...getStatus('Generated/Complete', generatedCompleteRate, data.checkout_complete)
  });

  // 가치 퍼널: Viewed/Generated
  const viewedGeneratedRate = data.storybook_generated > 0
    ? (data.story_viewed / data.storybook_generated * 100)
    : 0;

  funnel.push({
    name: 'Viewed/Generated',
    numerator: data.story_viewed,
    denominator: data.storybook_generated,
    rate: viewedGeneratedRate,
    ...getStatus('Viewed/Generated', viewedGeneratedRate, data.storybook_generated)
  });

  // 가치 퍼널: ShareCreated/Viewed
  const shareCreatedViewedRate = data.story_viewed > 0
    ? (data.share_created / data.story_viewed * 100)
    : 0;

  funnel.push({
    name: 'ShareCreated/Viewed',
    numerator: data.share_created,
    denominator: data.story_viewed,
    rate: shareCreatedViewedRate,
    ...getStatus('ShareCreated/Viewed', shareCreatedViewedRate, data.story_viewed)
  });

  // 가치 퍼널: ShareOpened/ShareCreated
  const shareOpenedCreatedRate = data.share_created > 0
    ? (data.share_opened / data.share_created * 100)
    : 0;

  funnel.push({
    name: 'ShareOpened/ShareCreated',
    numerator: data.share_opened,
    denominator: data.share_created,
    rate: shareOpenedCreatedRate,
    ...getStatus('ShareOpened/ShareCreated', shareOpenedCreatedRate, data.share_created)
  });

  return funnel;
}

/**
 * 목표치 대비 상태 판단
 */
function getStatus(metricName, rate, sampleSize) {
  const threshold = THRESHOLDS[metricName];
  if (!threshold) {
    return { status: 'UNKNOWN', statusEmoji: '❓', alerts: [] };
  }

  const alerts = [];

  // 표본 부족 체크
  if (sampleSize < MIN_SAMPLE_SIZE) {
    return {
      status: 'LOW_SAMPLE',
      statusEmoji: '📊',
      alerts: [`표본 부족 (${sampleSize}/${MIN_SAMPLE_SIZE})`],
      threshold
    };
  }

  // 상태 판단
  let status, statusEmoji;

  if (rate >= threshold.stretch) {
    status = 'STRETCH';
    statusEmoji = '🚀';
  } else if (rate >= threshold.target) {
    status = 'TARGET';
    statusEmoji = '✅';
  } else if (rate >= threshold.floor) {
    status = 'OK';
    statusEmoji = '🟡';
  } else {
    status = 'ALERT';
    statusEmoji = '🚨';

    // 알람 메시지
    if (metricName === 'Generated/Complete' && rate < 90) {
      alerts.push('장애급: 가치 제공 실패');
    } else if (metricName === 'Viewed/Generated' && rate < 40) {
      alerts.push('카카오 링크/딥링크/UX 점검 필요');
    } else if (metricName === 'ShareOpened/ShareCreated' && rate < 30) {
      alerts.push('OG/공유 문구/랜딩 점검 필요');
    } else if (metricName === 'Complete/Initiate' && rate < 5) {
      alerts.push('결제/신뢰/오퍼 점검 필요');
    }
  }

  return { status, statusEmoji, alerts, threshold };
}

// ============ 출력 포맷 ============

/**
 * 1줄 요약 생성
 */
function formatOneLine(data, funnel) {
  const S = data.checkout_initiate;
  const C = data.checkout_complete;
  const G = data.storybook_generated;
  const V = data.story_viewed;
  const SC = data.share_created;
  const SO = data.share_opened;

  const funnelMap = {};
  funnel.forEach(f => { funnelMap[f.name] = f; });

  const CS = funnelMap['Complete/Initiate']?.rate.toFixed(1) || '0.0';
  const GC = funnelMap['Generated/Complete']?.rate.toFixed(1) || '0.0';
  const VG = funnelMap['Viewed/Generated']?.rate.toFixed(1) || '0.0';
  const SCV = funnelMap['ShareCreated/Viewed']?.rate.toFixed(1) || '0.0';
  const SOSC = funnelMap['ShareOpened/ShareCreated']?.rate.toFixed(1) || '0.0';

  const alerts = funnel
    .filter(f => f.status === 'ALERT')
    .map(f => f.name)
    .join(',') || 'none';

  return `S:${S} | C:${C} (${CS}%) | G:${G} (${GC}%) | V:${V} (${VG}%) | SC:${SC} (${SCV}%) | SO:${SO} (${SOSC}%) | ALARM:${alerts}`;
}

/**
 * 마크다운 포맷 생성
 */
function formatMarkdown(data, funnel, dateFrom, dateTo) {
  const lines = [
    `# 📊 퍼널 일일 리포트`,
    ``,
    `> 기간: ${dateFrom} ~ ${dateTo}`,
    `> 생성: ${new Date().toLocaleString('ko-KR')}`,
    `> 소스: DB (PostgreSQL marketing_events)`,
    ``,
    `## 1줄 요약`,
    ``,
    '```',
    formatOneLine(data, funnel),
    '```',
    ``,
    `## 원본 데이터`,
    ``,
    `| 이벤트 | Count | 설명 |`,
    `|--------|-------|------|`,
    `| trial_start | ${data.trial_start} | 무료 체험 시작 |`,
    `| checkout_initiate | ${data.checkout_initiate} | 체크아웃 시작 (unique checkout_id) |`,
    `| checkout_complete | ${data.checkout_complete} | 결제 완료 (unique checkout_id) |`,
    `| storybook_generated | ${data.storybook_generated} | 스토리북 생성 (unique story_id) |`,
    `| story_viewed | ${data.story_viewed} | 스토리 조회 (unique story_id) |`,
    `| share_created | ${data.share_created} | 공유 생성 (unique share_token) |`,
    `| share_opened | ${data.share_opened} | 공유 열람 (unique share_token) |`,
    ``,
    `## 퍼널 분석`,
    ``,
    `| 단계 | 수치 | 비율 | Floor | Target | Stretch | 상태 |`,
    `|------|------|------|-------|--------|---------|------|`
  ];

  for (const f of funnel) {
    const rateStr = f.rate.toFixed(1) + '%';
    const floorStr = f.threshold ? f.threshold.floor + '%' : '-';
    const targetStr = f.threshold ? f.threshold.target + '%' : '-';
    const stretchStr = f.threshold ? f.threshold.stretch + '%' : '-';
    const statusStr = `${f.statusEmoji} ${f.status}`;

    lines.push(`| ${f.name} | ${f.numerator}/${f.denominator} | ${rateStr} | ${floorStr} | ${targetStr} | ${stretchStr} | ${statusStr} |`);
  }

  lines.push(``);

  // 알람 섹션
  const alertItems = funnel.filter(f => f.alerts && f.alerts.length > 0);
  if (alertItems.length > 0) {
    lines.push(`## 🚨 알람`);
    lines.push(``);
    for (const f of alertItems) {
      for (const alert of f.alerts) {
        lines.push(`- **${f.name}**: ${alert}`);
      }
    }
    lines.push(``);
  }

  // 목표치 범례
  lines.push(`## 목표치 범례`);
  lines.push(``);
  lines.push(`| 지표 | Floor | Target | Stretch |`);
  lines.push(`|------|-------|--------|---------|`);
  for (const [name, th] of Object.entries(THRESHOLDS)) {
    lines.push(`| ${name} | ${th.floor}% | ${th.target}% | ${th.stretch}%+ |`);
  }
  lines.push(``);
  lines.push(`### 상태 기호`);
  lines.push(`- 🚀 STRETCH: 목표 초과 달성`);
  lines.push(`- ✅ TARGET: 목표 달성`);
  lines.push(`- 🟡 OK: Floor 이상 (개선 여지)`);
  lines.push(`- 🚨 ALERT: Floor 미달 (즉시 점검)`);
  lines.push(`- 📊 LOW_SAMPLE: 표본 부족 (${MIN_SAMPLE_SIZE}건 미만)`);
  lines.push(``);

  return lines.join('\n');
}

/**
 * 콘솔 포맷 출력
 */
function formatConsole(data, funnel, dateFrom, dateTo) {
  console.log('\n📊 퍼널 일일 리포트\n');
  console.log(`기간: ${dateFrom} ~ ${dateTo}`);
  console.log('─'.repeat(80));

  // 1줄 요약
  console.log('\n[1줄 요약]');
  console.log(formatOneLine(data, funnel));

  // 원본 데이터
  console.log('\n[원본 데이터]');
  console.log(`  trial_start:        ${data.trial_start}`);
  console.log(`  checkout_initiate:  ${data.checkout_initiate} (unique checkout_id)`);
  console.log(`  checkout_complete:  ${data.checkout_complete} (unique checkout_id)`);
  console.log(`  storybook_generated: ${data.storybook_generated} (unique story_id)`);
  console.log(`  story_viewed:       ${data.story_viewed} (unique story_id)`);
  console.log(`  share_created:      ${data.share_created} (unique share_token)`);
  console.log(`  share_opened:       ${data.share_opened} (unique share_token)`);

  // 퍼널 분석
  console.log('\n[퍼널 분석]');
  console.log('─'.repeat(80));
  console.log(
    '단계'.padEnd(25) +
    '수치'.padEnd(12) +
    '비율'.padEnd(10) +
    'Floor'.padEnd(8) +
    'Target'.padEnd(8) +
    '상태'
  );
  console.log('─'.repeat(80));

  for (const f of funnel) {
    const rateStr = f.rate.toFixed(1) + '%';
    const countStr = `${f.numerator}/${f.denominator}`;
    const floorStr = f.threshold ? f.threshold.floor + '%' : '-';
    const targetStr = f.threshold ? f.threshold.target + '%' : '-';
    const statusStr = `${f.statusEmoji} ${f.status}`;

    console.log(
      f.name.padEnd(25) +
      countStr.padEnd(12) +
      rateStr.padEnd(10) +
      floorStr.padEnd(8) +
      targetStr.padEnd(8) +
      statusStr
    );
  }

  console.log('─'.repeat(80));

  // 알람
  const alertItems = funnel.filter(f => f.alerts && f.alerts.length > 0);
  if (alertItems.length > 0) {
    console.log('\n[🚨 알람]');
    for (const f of alertItems) {
      for (const alert of f.alerts) {
        console.log(`  - ${f.name}: ${alert}`);
      }
    }
  }

  console.log('');
}

// ============ 메인 ============

async function main() {
  const options = parseArgs();
  const { from, to } = getDateRange(options);

  console.error(`📅 조회 기간: ${from} ~ ${to}`);

  // DB에서 데이터 조회
  let data;
  try {
    data = await getFunnelDataFromDB(from, to);
    if (!data) {
      console.error('❌ DB 연결 실패');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ DB 조회 실패:', err.message);
    process.exit(1);
  }

  // 퍼널 계산
  const funnel = calculateFunnel(data);

  // 출력
  if (options.json) {
    console.log(JSON.stringify({ dateFrom: from, dateTo: to, data, funnel }, null, 2));
  } else if (options.out) {
    // 디렉토리 확인
    const dir = path.dirname(options.out);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const markdown = formatMarkdown(data, funnel, from, to);
    fs.writeFileSync(options.out, markdown, 'utf-8');
    console.error(`✅ 리포트 저장: ${options.out}`);

    // 콘솔에도 1줄 요약 출력
    console.log('\n' + formatOneLine(data, funnel) + '\n');
  } else {
    formatConsole(data, funnel, from, to);
  }

  // DB 연결 종료
  if (db && db.pool) {
    await db.pool.end();
  }
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
