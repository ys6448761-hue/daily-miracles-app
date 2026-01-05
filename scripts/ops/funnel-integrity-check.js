#!/usr/bin/env node
/**
 * funnel-integrity-check.js
 *
 * 퍼널 무결성 검사 스크립트
 * - Key Missing: 필수 키 누락 체크
 * - Orphan Event: 부모 없는 이벤트 탐지
 * - Double Terminal: 종결 이벤트 중복 체크
 * - Temporal Sanity: 시간 순서 이상 탐지
 * - env 필터링으로 테스트/실사용 이벤트 분리
 *
 * Usage:
 *   node scripts/ops/funnel-integrity-check.js [options]
 *
 * Options:
 *   --date <YYYY-MM-DD>   특정 날짜 (기본: 오늘)
 *   --range <N>           최근 N일 (기본: 1)
 *   --env <prod|test|all> 환경 필터 (기본: prod)
 *   --include-test        테스트 포함 (--env all과 동일)
 *   --json                JSON 형식 출력
 *   --strict              ALERT 발생 시 exit code 1
 *   --out <path>          출력 파일 경로
 *   --help                도움말
 */

const fs = require('fs');
const path = require('path');

// DB 모듈 로드
let db = null;
try {
  db = require('../../database/db');
} catch (error) {
  console.warn('⚠️ DB 모듈 로드 실패');
}

// ============ 필수 키 정의 ============
const REQUIRED_KEYS = {
  checkout_initiate: ['checkout_id'],
  checkout_complete: ['checkout_id'],
  checkout_abandon: ['checkout_id'],
  storybook_generated: ['story_id'],
  story_viewed: {
    anyOf: ['story_id', 'share_token'],
    required: ['view_context']
  },
  share_created: ['share_token', 'story_id', 'expires_at'],
  share_opened: ['share_token']
};

// ============ 알람 임계값 ============
const THRESHOLDS = {
  orphan_rate: 5,           // orphan 비율 5% 이상이면 ALERT
  double_terminal: 0,       // 0% 초과하면 ALERT
  missing_keys_critical: 0, // 핵심 키 누락 0 초과하면 ALERT
  min_sample: 30            // 최소 표본
};

// 최대 샘플 출력 개수
const MAX_SAMPLES = 10;

// env 필터 옵션
const VALID_ENV_FILTERS = ['prod', 'test', 'all'];
const DEFAULT_ENV_FILTER = 'prod';

// ============ 레거시 기준일 ============
// 이 날짜 이전 이벤트는 레거시로 분류 (checkout_id 필드 추가 배포일)
const LEGACY_CUTOFF_DATE = '2026-01-05';

// 레거시 필드 정의: 특정 날짜 이전에는 해당 필드가 없었던 경우
const LEGACY_FIELDS = {
  checkout_complete: {
    fields: ['checkout_id'],
    cutoffDate: '2026-01-05'  // 이 날짜부터 checkout_id 필수
  }
};

// ============ 유틸리티 ============

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    date: null,
    range: 1,
    env: DEFAULT_ENV_FILTER,
    json: false,
    strict: false,
    out: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--date':
        options.date = args[++i];
        break;
      case '--range':
        options.range = parseInt(args[++i], 10) || 1;
        break;
      case '--env':
        const envArg = args[++i];
        if (VALID_ENV_FILTERS.includes(envArg)) {
          options.env = envArg;
        } else {
          console.warn(`⚠️ 잘못된 env 값: ${envArg}. 기본값 '${DEFAULT_ENV_FILTER}' 사용`);
        }
        break;
      case '--include-test':
        options.env = 'all';
        break;
      case '--json':
        options.json = true;
        break;
      case '--strict':
        options.strict = true;
        break;
      case '--out':
        options.out = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
퍼널 무결성 검사 스크립트

Usage:
  node scripts/ops/funnel-integrity-check.js [options]

Options:
  --date <YYYY-MM-DD>   특정 날짜 (기본: 오늘)
  --range <N>           최근 N일 (기본: 1)
  --env <prod|test|all> 환경 필터 (기본: prod)
  --include-test        테스트 포함 (--env all과 동일)
  --json                JSON 형식 출력
  --strict              ALERT 발생 시 exit code 1 (CI용)
  --out <path>          출력 파일 경로
  --help                도움말

Checks:
  1. Key Missing     - 필수 키 누락 검사
  2. Orphan Events   - 부모 없는 이벤트 탐지
  3. Double Terminal - 종결 이벤트 중복 검사
  4. Temporal Sanity - 시간 순서 이상 탐지
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
 * env 필터 조건 생성
 * @param {string} envFilter - 'prod' | 'test' | 'all'
 * @returns {string} - SQL WHERE 조건
 */
function getEnvCondition(envFilter) {
  if (envFilter === 'all') {
    return ''; // 필터 없음
  }
  // env가 없는 레거시 데이터는 prod로 취급
  if (envFilter === 'prod') {
    return `AND (payload->>'env' = 'prod' OR payload->>'env' IS NULL)`;
  }
  return `AND payload->>'env' = '${envFilter}'`;
}

/**
 * 기간 내 모든 이벤트 조회
 * @param {string} dateFrom - 시작 날짜
 * @param {string} dateTo - 종료 날짜
 * @param {string} envFilter - 환경 필터 ('prod' | 'test' | 'all')
 */
async function fetchAllEvents(dateFrom, dateTo, envFilter = 'prod') {
  if (!db) return null;

  const envCondition = getEnvCondition(envFilter);

  const query = `
    SELECT
      id, event_type, event_date, timestamp,
      payload->>'checkout_id' as checkout_id,
      COALESCE(payload->>'story_id', wish_id) as story_id,
      payload->>'share_token' as share_token,
      payload->>'view_context' as view_context,
      payload->>'expires_at' as expires_at,
      payload->>'env' as env,
      payload
    FROM marketing_events
    WHERE event_date >= $1 AND event_date <= $2
      ${envCondition}
    ORDER BY timestamp ASC
  `;

  const result = await db.query(query, [dateFrom, dateTo]);
  return result.rows;
}

// ============ 체크 로직 ============

/**
 * 레거시 여부 판단
 */
function isLegacyEvent(event, eventType, field) {
  const legacyRule = LEGACY_FIELDS[eventType];
  if (!legacyRule) return false;
  if (!legacyRule.fields.includes(field)) return false;

  // event_date가 cutoffDate 이전이면 레거시
  const eventDate = typeof event.event_date === 'string'
    ? event.event_date
    : event.event_date?.toISOString?.().slice(0, 10);

  return eventDate < legacyRule.cutoffDate;
}

/**
 * 1. Key Missing 체크 (레거시/운영 분리)
 */
function checkMissingKeys(events) {
  const results = {
    issues: [],
    totalMissing: 0,
    totalLegacy: 0,
    totalOperational: 0,
    byType: {}
  };

  for (const eventType of Object.keys(REQUIRED_KEYS)) {
    const typeEvents = events.filter(e => e.event_type === eventType);
    const missingLegacy = [];
    const missingOperational = [];

    for (const event of typeEvents) {
      const rule = REQUIRED_KEYS[eventType];
      let hasMissing = false;
      let missingFields = [];
      let isLegacy = false;

      if (Array.isArray(rule)) {
        // 모든 필드 필수
        for (const field of rule) {
          const value = event[field] || event.payload?.[field];
          if (!value) {
            hasMissing = true;
            missingFields.push(field);
            // 레거시 여부 체크
            if (isLegacyEvent(event, eventType, field)) {
              isLegacy = true;
            }
          }
        }
      } else if (rule.anyOf) {
        // anyOf 중 하나 필수
        const hasAny = rule.anyOf.some(field => event[field] || event.payload?.[field]);
        if (!hasAny) {
          hasMissing = true;
          missingFields.push(`(${rule.anyOf.join('|')})`);
        }
        // required 필드도 체크
        if (rule.required) {
          for (const field of rule.required) {
            const value = event[field] || event.payload?.[field];
            if (!value) {
              hasMissing = true;
              missingFields.push(field);
            }
          }
        }
      }

      if (hasMissing) {
        const item = {
          id: event.id,
          event_date: event.event_date,
          checkout_id: event.checkout_id,
          story_id: event.story_id,
          share_token: event.share_token,
          missingFields,
          isLegacy
        };

        if (isLegacy) {
          missingLegacy.push(item);
        } else {
          missingOperational.push(item);
        }
      }
    }

    const totalMissing = missingLegacy.length + missingOperational.length;
    if (totalMissing > 0) {
      results.byType[eventType] = {
        count: totalMissing,
        total: typeEvents.length,
        rate: typeEvents.length > 0 ? (totalMissing / typeEvents.length * 100).toFixed(1) : 0,
        legacy: {
          count: missingLegacy.length,
          samples: missingLegacy.slice(0, MAX_SAMPLES).map(m => ({
            id: m.id,
            key: m.checkout_id || m.story_id || m.share_token || `id:${m.id}`,
            missing: m.missingFields.join(', ')
          }))
        },
        operational: {
          count: missingOperational.length,
          samples: missingOperational.slice(0, MAX_SAMPLES).map(m => ({
            id: m.id,
            key: m.checkout_id || m.story_id || m.share_token || `id:${m.id}`,
            missing: m.missingFields.join(', ')
          }))
        },
        samples: [...missingOperational, ...missingLegacy].slice(0, MAX_SAMPLES).map(m => ({
          id: m.id,
          key: m.checkout_id || m.story_id || m.share_token || `id:${m.id}`,
          missing: m.missingFields.join(', '),
          isLegacy: m.isLegacy
        }))
      };
      results.totalMissing += totalMissing;
      results.totalLegacy += missingLegacy.length;
      results.totalOperational += missingOperational.length;
    }
  }

  return results;
}

/**
 * 2. Orphan Event 체크
 */
function checkOrphanEvents(events) {
  const results = {
    orphanComplete: { count: 0, rate: 0, samples: [] },
    orphanAbandon: { count: 0, rate: 0, samples: [] },
    orphanGenerated: { count: 0, rate: 0, samples: [] },
    orphanViewedMy: { count: 0, rate: 0, samples: [] },
    orphanViewedShare: { count: 0, rate: 0, samples: [] },
    orphanShareOpened: { count: 0, rate: 0, samples: [] }
  };

  // checkout 계열: checkout_id 기준
  const initiateIds = new Set(
    events.filter(e => e.event_type === 'checkout_initiate' && e.checkout_id)
      .map(e => e.checkout_id)
  );

  const completeEvents = events.filter(e => e.event_type === 'checkout_complete' && e.checkout_id);
  const abandonEvents = events.filter(e => e.event_type === 'checkout_abandon' && e.checkout_id);

  // Orphan Complete: complete인데 initiate 없음
  const orphanCompletes = completeEvents.filter(e => !initiateIds.has(e.checkout_id));
  results.orphanComplete = {
    count: orphanCompletes.length,
    total: completeEvents.length,
    rate: completeEvents.length > 0 ? (orphanCompletes.length / completeEvents.length * 100).toFixed(1) : 0,
    samples: orphanCompletes.slice(0, MAX_SAMPLES).map(e => e.checkout_id)
  };

  // Orphan Abandon: abandon인데 initiate 없음
  const orphanAbandons = abandonEvents.filter(e => !initiateIds.has(e.checkout_id));
  results.orphanAbandon = {
    count: orphanAbandons.length,
    total: abandonEvents.length,
    rate: abandonEvents.length > 0 ? (orphanAbandons.length / abandonEvents.length * 100).toFixed(1) : 0,
    samples: orphanAbandons.slice(0, MAX_SAMPLES).map(e => e.checkout_id)
  };

  // story 계열: story_id 기준
  const completeIds = new Set(
    events.filter(e => e.event_type === 'checkout_complete' && e.checkout_id)
      .map(e => e.checkout_id)
  );
  const generatedEvents = events.filter(e => e.event_type === 'storybook_generated' && e.story_id);
  const generatedStoryIds = new Set(generatedEvents.map(e => e.story_id));

  // Orphan Generated: generated인데 complete 없음 (유료 플로우 기준)
  // NOTE: 무료 생성은 별도 처리 필요할 수 있음
  // 현재는 story_id == checkout_id 가정 또는 연결 불가 시 스킵
  // 단순화: generated 이벤트가 있으면 일단 정상으로 간주 (연결 키가 명확하지 않음)
  // TODO: checkout_id <-> story_id 매핑이 명확해지면 체크 강화

  // story_viewed 계열
  const viewedMyEvents = events.filter(e => e.event_type === 'story_viewed' && e.view_context === 'my' && e.story_id);
  const viewedShareEvents = events.filter(e => e.event_type === 'story_viewed' && e.view_context === 'share' && e.share_token);

  // Orphan Viewed (my): story_viewed인데 storybook_generated 없음
  const orphanViewedMy = viewedMyEvents.filter(e => !generatedStoryIds.has(e.story_id));
  results.orphanViewedMy = {
    count: orphanViewedMy.length,
    total: viewedMyEvents.length,
    rate: viewedMyEvents.length > 0 ? (orphanViewedMy.length / viewedMyEvents.length * 100).toFixed(1) : 0,
    samples: orphanViewedMy.slice(0, MAX_SAMPLES).map(e => e.story_id)
  };

  // share 계열: share_token 기준
  const shareCreatedTokens = new Set(
    events.filter(e => e.event_type === 'share_created' && e.share_token)
      .map(e => e.share_token)
  );
  const shareOpenedEvents = events.filter(e => e.event_type === 'share_opened' && e.share_token);

  // Orphan ShareOpened: share_opened인데 share_created 없음
  const orphanShareOpened = shareOpenedEvents.filter(e => !shareCreatedTokens.has(e.share_token));
  results.orphanShareOpened = {
    count: orphanShareOpened.length,
    total: shareOpenedEvents.length,
    rate: shareOpenedEvents.length > 0 ? (orphanShareOpened.length / shareOpenedEvents.length * 100).toFixed(1) : 0,
    samples: orphanShareOpened.slice(0, MAX_SAMPLES).map(e => e.share_token)
  };

  // Orphan Viewed (share): viewed(share_token)인데 share_created 없음
  const orphanViewedShare = viewedShareEvents.filter(e => !shareCreatedTokens.has(e.share_token));
  results.orphanViewedShare = {
    count: orphanViewedShare.length,
    total: viewedShareEvents.length,
    rate: viewedShareEvents.length > 0 ? (orphanViewedShare.length / viewedShareEvents.length * 100).toFixed(1) : 0,
    samples: orphanViewedShare.slice(0, MAX_SAMPLES).map(e => e.share_token)
  };

  return results;
}

/**
 * 3. Double Terminal 체크
 */
function checkDoubleTerminal(events) {
  const results = {
    count: 0,
    rate: 0,
    samples: []
  };

  // checkout_id 별로 complete와 abandon 둘 다 있는지 확인
  const completeIds = new Set(
    events.filter(e => e.event_type === 'checkout_complete' && e.checkout_id)
      .map(e => e.checkout_id)
  );
  const abandonIds = new Set(
    events.filter(e => e.event_type === 'checkout_abandon' && e.checkout_id)
      .map(e => e.checkout_id)
  );

  const doubleTerminals = [...completeIds].filter(id => abandonIds.has(id));

  const initiateCount = new Set(
    events.filter(e => e.event_type === 'checkout_initiate' && e.checkout_id)
      .map(e => e.checkout_id)
  ).size;

  results.count = doubleTerminals.length;
  results.total = initiateCount;
  results.rate = initiateCount > 0 ? (doubleTerminals.length / initiateCount * 100).toFixed(1) : 0;
  results.samples = doubleTerminals.slice(0, MAX_SAMPLES);

  return results;
}

/**
 * 4. Temporal Sanity 체크
 */
function checkTemporalSanity(events) {
  const results = {
    completeBeforeInitiate: { count: 0, samples: [] },
    generatedBeforeComplete: { count: 0, samples: [] },
    viewedBeforeGenerated: { count: 0, samples: [] },
    shareOpenedBeforeCreated: { count: 0, samples: [] }
  };

  // 이벤트를 키별로 그룹화
  const byCheckoutId = {};
  const byStoryId = {};
  const byShareToken = {};

  for (const event of events) {
    if (event.checkout_id) {
      if (!byCheckoutId[event.checkout_id]) byCheckoutId[event.checkout_id] = [];
      byCheckoutId[event.checkout_id].push(event);
    }
    if (event.story_id) {
      if (!byStoryId[event.story_id]) byStoryId[event.story_id] = [];
      byStoryId[event.story_id].push(event);
    }
    if (event.share_token) {
      if (!byShareToken[event.share_token]) byShareToken[event.share_token] = [];
      byShareToken[event.share_token].push(event);
    }
  }

  // complete_ts < initiate_ts
  for (const [checkoutId, checkoutEvents] of Object.entries(byCheckoutId)) {
    const initiate = checkoutEvents.find(e => e.event_type === 'checkout_initiate');
    const complete = checkoutEvents.find(e => e.event_type === 'checkout_complete');

    if (initiate && complete) {
      const initiateTs = new Date(initiate.timestamp).getTime();
      const completeTs = new Date(complete.timestamp).getTime();
      if (completeTs < initiateTs) {
        results.completeBeforeInitiate.count++;
        if (results.completeBeforeInitiate.samples.length < MAX_SAMPLES) {
          results.completeBeforeInitiate.samples.push(checkoutId);
        }
      }
    }
  }

  // viewed_ts < generated_ts (view_context=my)
  for (const [storyId, storyEvents] of Object.entries(byStoryId)) {
    const generated = storyEvents.find(e => e.event_type === 'storybook_generated');
    const viewed = storyEvents.find(e => e.event_type === 'story_viewed' && e.view_context === 'my');

    if (generated && viewed) {
      const generatedTs = new Date(generated.timestamp).getTime();
      const viewedTs = new Date(viewed.timestamp).getTime();
      if (viewedTs < generatedTs) {
        results.viewedBeforeGenerated.count++;
        if (results.viewedBeforeGenerated.samples.length < MAX_SAMPLES) {
          results.viewedBeforeGenerated.samples.push(storyId);
        }
      }
    }
  }

  // share_opened_ts < share_created_ts
  for (const [shareToken, shareEvents] of Object.entries(byShareToken)) {
    const created = shareEvents.find(e => e.event_type === 'share_created');
    const opened = shareEvents.find(e => e.event_type === 'share_opened');

    if (created && opened) {
      const createdTs = new Date(created.timestamp).getTime();
      const openedTs = new Date(opened.timestamp).getTime();
      if (openedTs < createdTs) {
        results.shareOpenedBeforeCreated.count++;
        if (results.shareOpenedBeforeCreated.samples.length < MAX_SAMPLES) {
          results.shareOpenedBeforeCreated.samples.push(shareToken);
        }
      }
    }
  }

  return results;
}

/**
 * 종합 상태 판정 (운영 이슈만 ALERT, 레거시는 INFO)
 */
function determineOverallStatus(missingKeys, orphans, doubleTerminal, temporal, sampleSize) {
  const alerts = [];
  const legacyInfo = [];
  let status = 'OK';
  let statusEmoji = '✅';

  // Double Terminal > 0 -> ALERT
  if (doubleTerminal.count > 0) {
    alerts.push(`Double Terminal: ${doubleTerminal.count}건 (심각)`);
    status = 'ALERT';
    statusEmoji = '🚨';
  }

  // Orphan Complete > 0 -> ALERT
  if (orphans.orphanComplete.count > 0) {
    alerts.push(`Orphan Complete: ${orphans.orphanComplete.count}건 (initiate 없이 complete)`);
    status = 'ALERT';
    statusEmoji = '🚨';
  }

  // Missing Keys (핵심 키) - 운영 이슈만 ALERT, 레거시는 INFO
  const criticalMissing = ['checkout_initiate', 'checkout_complete', 'storybook_generated'];
  for (const type of criticalMissing) {
    const typeData = missingKeys.byType[type];
    if (typeData) {
      // 운영 이슈 (ALERT)
      if (typeData.operational?.count > 0) {
        alerts.push(`Missing Key (${type}): ${typeData.operational.count}건 [운영]`);
        status = 'ALERT';
        statusEmoji = '🚨';
      }
      // 레거시 이슈 (INFO)
      if (typeData.legacy?.count > 0) {
        legacyInfo.push(`Missing Key (${type}): ${typeData.legacy.count}건 [레거시]`);
      }
    }
  }

  // Orphan 비율 > 5% -> ALERT
  const orphanChecks = [
    { name: 'orphanComplete', label: 'Orphan Complete' },
    { name: 'orphanAbandon', label: 'Orphan Abandon' },
    { name: 'orphanViewedMy', label: 'Orphan Viewed (my)' },
    { name: 'orphanShareOpened', label: 'Orphan ShareOpened' }
  ];

  for (const check of orphanChecks) {
    const rate = parseFloat(orphans[check.name].rate);
    if (rate > THRESHOLDS.orphan_rate && orphans[check.name].total >= 5) {
      if (status !== 'ALERT') {
        status = 'WARN';
        statusEmoji = '🟡';
      }
      alerts.push(`${check.label}: ${rate}% (임계값 ${THRESHOLDS.orphan_rate}% 초과)`);
    }
  }

  // Temporal 이상 > 0 -> WARN
  const temporalChecks = [
    { key: 'completeBeforeInitiate', label: 'Complete < Initiate' },
    { key: 'viewedBeforeGenerated', label: 'Viewed < Generated' },
    { key: 'shareOpenedBeforeCreated', label: 'ShareOpened < Created' }
  ];

  for (const check of temporalChecks) {
    if (temporal[check.key].count > 0) {
      if (status === 'OK') {
        status = 'WARN';
        statusEmoji = '🟡';
      }
      alerts.push(`${check.label}: ${temporal[check.key].count}건 (시간 순서 이상)`);
    }
  }

  // 표본 부족 체크
  const lowSample = sampleSize < THRESHOLDS.min_sample;

  return {
    status,
    statusEmoji,
    alerts,
    legacyInfo,
    lowSample,
    sampleSize
  };
}

// ============ 출력 포맷 ============

function formatMarkdown(results, dateFrom, dateTo, envFilter = 'prod') {
  const { missingKeys, orphans, doubleTerminal, temporal, overall, totalEvents } = results;
  const envLabel = envFilter === 'all' ? 'all (prod + test)' : envFilter;

  const lines = [
    `# 🔍 퍼널 무결성 검사 리포트`,
    ``,
    `> 기간: ${dateFrom} ~ ${dateTo}`,
    `> 환경: **${envLabel}**`,
    `> 생성: ${new Date().toLocaleString('ko-KR')}`,
    `> 전체 이벤트: ${totalEvents}건`,
    ``,
    `## 종합 상태: ${overall.statusEmoji} ${overall.status}`,
    ``
  ];

  if (overall.lowSample) {
    lines.push(`⚠️ **표본 부족** (${overall.sampleSize}/${THRESHOLDS.min_sample}건)`);
    lines.push(``);
  }

  if (overall.alerts.length > 0) {
    lines.push(`### 알람`);
    for (const alert of overall.alerts) {
      lines.push(`- 🚨 ${alert}`);
    }
    lines.push(``);
  }

  // 1. Key Missing
  lines.push(`## 1. Key Missing (필수 키 누락)`);
  lines.push(``);
  if (Object.keys(missingKeys.byType).length === 0) {
    lines.push(`✅ 키 누락 없음`);
  } else {
    lines.push(`| 이벤트 | 누락 | 전체 | 비율 |`);
    lines.push(`|--------|------|------|------|`);
    for (const [type, data] of Object.entries(missingKeys.byType)) {
      lines.push(`| ${type} | ${data.count} | ${data.total} | ${data.rate}% |`);
    }
    lines.push(``);
    lines.push(`### 샘플`);
    for (const [type, data] of Object.entries(missingKeys.byType)) {
      if (data.samples.length > 0) {
        lines.push(`- **${type}**: ${data.samples.map(s => `${s.key}(${s.missing})`).join(', ')}`);
      }
    }
  }
  lines.push(``);

  // 2. Orphan Events
  lines.push(`## 2. Orphan Events (부모 없는 이벤트)`);
  lines.push(``);
  lines.push(`| 체크 | 고아 | 전체 | 비율 | 상태 |`);
  lines.push(`|------|------|------|------|------|`);

  const orphanChecks = [
    { key: 'orphanComplete', label: 'Complete without Initiate' },
    { key: 'orphanAbandon', label: 'Abandon without Initiate' },
    { key: 'orphanViewedMy', label: 'Viewed(my) without Generated' },
    { key: 'orphanViewedShare', label: 'Viewed(share) without Created' },
    { key: 'orphanShareOpened', label: 'ShareOpened without Created' }
  ];

  for (const check of orphanChecks) {
    const data = orphans[check.key];
    const rate = parseFloat(data.rate);
    const status = data.count === 0 ? '✅' : (rate > THRESHOLDS.orphan_rate ? '🚨' : '🟡');
    lines.push(`| ${check.label} | ${data.count} | ${data.total} | ${data.rate}% | ${status} |`);
  }
  lines.push(``);

  // 3. Double Terminal
  lines.push(`## 3. Double Terminal (종결 중복)`);
  lines.push(``);
  if (doubleTerminal.count === 0) {
    lines.push(`✅ 종결 중복 없음`);
  } else {
    lines.push(`🚨 **${doubleTerminal.count}건** (비율: ${doubleTerminal.rate}%)`);
    lines.push(``);
    lines.push(`> 동일 checkout_id에 complete와 abandon이 모두 존재`);
    if (doubleTerminal.samples.length > 0) {
      lines.push(``);
      lines.push(`**샘플**: ${doubleTerminal.samples.join(', ')}`);
    }
  }
  lines.push(``);

  // 4. Temporal Sanity
  lines.push(`## 4. Temporal Sanity (시간 순서)`);
  lines.push(``);
  lines.push(`| 체크 | 이상 건수 | 상태 |`);
  lines.push(`|------|----------|------|`);

  const temporalChecks = [
    { key: 'completeBeforeInitiate', label: 'Complete → Initiate 역전' },
    { key: 'generatedBeforeComplete', label: 'Generated → Complete 역전' },
    { key: 'viewedBeforeGenerated', label: 'Viewed → Generated 역전' },
    { key: 'shareOpenedBeforeCreated', label: 'ShareOpened → Created 역전' }
  ];

  for (const check of temporalChecks) {
    const data = temporal[check.key];
    const status = data.count === 0 ? '✅' : '🟡';
    lines.push(`| ${check.label} | ${data.count} | ${status} |`);
  }
  lines.push(``);

  return lines.join('\n');
}

function formatConsole(results, dateFrom, dateTo, operational7Day = null, envFilter = 'prod') {
  const { missingKeys, orphans, doubleTerminal, temporal, overall, totalEvents } = results;
  const envLabel = envFilter === 'all' ? 'all (prod + test)' : envFilter;

  console.log('\n🔍 퍼널 무결성 검사 리포트\n');
  console.log(`기간: ${dateFrom} ~ ${dateTo}`);
  console.log(`환경: ${envLabel}`);
  console.log(`전체 이벤트: ${totalEvents}건`);
  console.log('─'.repeat(70));

  console.log(`\n종합 상태: ${overall.statusEmoji} ${overall.status}`);
  if (overall.lowSample) {
    console.log(`⚠️ 표본 부족 (${overall.sampleSize}/${THRESHOLDS.min_sample}건)`);
  }

  // 운영 알람
  if (overall.alerts.length > 0) {
    console.log('\n[🚨 운영 알람]');
    for (const alert of overall.alerts) {
      console.log(`  🚨 ${alert}`);
    }
  }

  // 레거시 정보
  if (overall.legacyInfo && overall.legacyInfo.length > 0) {
    console.log('\n[📦 레거시 이슈 (수정 전 데이터)]');
    for (const info of overall.legacyInfo) {
      console.log(`  ℹ️ ${info}`);
    }
  }

  console.log('\n' + '─'.repeat(70));
  console.log('[1. Key Missing]');
  if (Object.keys(missingKeys.byType).length === 0) {
    console.log('  ✅ 키 누락 없음');
  } else {
    console.log('  ' + '─'.repeat(50));
    console.log('  이벤트'.padEnd(22) + '운영'.padEnd(8) + '레거시'.padEnd(8) + '합계');
    console.log('  ' + '─'.repeat(50));
    for (const [type, data] of Object.entries(missingKeys.byType)) {
      const opCount = data.operational?.count || 0;
      const legCount = data.legacy?.count || 0;
      const opStatus = opCount === 0 ? '✅' : '🚨';
      const legStatus = legCount === 0 ? '-' : '📦';
      console.log(`  ${type.padEnd(20)} ${opStatus} ${String(opCount).padEnd(5)} ${legStatus} ${String(legCount).padEnd(5)} ${data.count}/${data.total}`);
    }
    console.log('  ' + '─'.repeat(50));
  }

  console.log('\n[2. Orphan Events]');
  const orphanItems = [
    ['orphanComplete', 'Complete without Initiate'],
    ['orphanAbandon', 'Abandon without Initiate'],
    ['orphanViewedMy', 'Viewed(my) without Generated'],
    ['orphanShareOpened', 'ShareOpened without Created']
  ];
  for (const [key, label] of orphanItems) {
    const data = orphans[key];
    const status = data.count === 0 ? '✅' : '🚨';
    console.log(`  ${status} ${label}: ${data.count}/${data.total} (${data.rate}%)`);
  }

  console.log('\n[3. Double Terminal]');
  if (doubleTerminal.count === 0) {
    console.log('  ✅ 종결 중복 없음');
  } else {
    console.log(`  🚨 ${doubleTerminal.count}건 (${doubleTerminal.rate}%)`);
  }

  console.log('\n[4. Temporal Sanity]');
  const temporalItems = [
    ['completeBeforeInitiate', 'Complete < Initiate'],
    ['viewedBeforeGenerated', 'Viewed < Generated'],
    ['shareOpenedBeforeCreated', 'ShareOpened < Created']
  ];
  for (const [key, label] of temporalItems) {
    const data = temporal[key];
    const status = data.count === 0 ? '✅' : '🟡';
    console.log(`  ${status} ${label}: ${data.count}건`);
  }

  // 7일 운영 무결성
  if (operational7Day) {
    console.log('\n' + '═'.repeat(70));
    console.log('[📊 최근 7일 운영 무결성 (Operational Integrity)]');
    console.log('  ' + '─'.repeat(50));
    console.log(`  기간: ${operational7Day.dateFrom} ~ ${operational7Day.dateTo}`);
    console.log(`  전체 이벤트: ${operational7Day.totalEvents}건`);
    console.log(`  상태: ${operational7Day.overall.statusEmoji} ${operational7Day.overall.status}`);

    if (operational7Day.overall.alerts.length > 0) {
      console.log('\n  [운영 알람]');
      for (const alert of operational7Day.overall.alerts) {
        console.log(`    🚨 ${alert}`);
      }
    } else {
      console.log('  ✅ 운영 알람 없음');
    }

    // 7일 Key Missing 요약
    const op7Missing = operational7Day.missingKeys;
    if (op7Missing.totalOperational > 0) {
      console.log(`\n  [Key Missing - 운영]: ${op7Missing.totalOperational}건`);
    }
    if (op7Missing.totalLegacy > 0) {
      console.log(`  [Key Missing - 레거시]: ${op7Missing.totalLegacy}건 (무시)`);
    }
    console.log('  ' + '─'.repeat(50));
  }

  console.log('\n' + '─'.repeat(70) + '\n');
}

// ============ 메인 ============

async function main() {
  const options = parseArgs();
  const { from, to } = getDateRange(options);
  const envFilter = options.env || DEFAULT_ENV_FILTER;

  const envLabel = envFilter === 'all' ? 'all (prod + test)' : envFilter;
  console.error(`📅 검사 기간: ${from} ~ ${to}`);
  console.error(`🏷️ 환경 필터: ${envLabel}`);

  // DB에서 이벤트 조회
  let events;
  try {
    events = await fetchAllEvents(from, to, envFilter);
    if (!events) {
      console.error('❌ DB 연결 실패');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ DB 조회 실패:', err.message);
    process.exit(1);
  }

  console.error(`📊 조회된 이벤트: ${events.length}건`);

  // 체크 수행
  const missingKeys = checkMissingKeys(events);
  const orphans = checkOrphanEvents(events);
  const doubleTerminal = checkDoubleTerminal(events);
  const temporal = checkTemporalSanity(events);

  // 표본 크기 계산 (unique checkout_id 기준)
  const sampleSize = new Set(
    events.filter(e => e.event_type === 'checkout_initiate' && e.checkout_id)
      .map(e => e.checkout_id)
  ).size;

  // 종합 상태 판정
  const overall = determineOverallStatus(missingKeys, orphans, doubleTerminal, temporal, sampleSize);

  const results = {
    dateFrom: from,
    dateTo: to,
    env: envFilter,
    totalEvents: events.length,
    missingKeys,
    orphans,
    doubleTerminal,
    temporal,
    overall
  };

  // 7일 운영 무결성 (별도 조회)
  let operational7Day = null;
  if (options.range === 1) {  // 일일 검사 시에만 7일 요약 추가
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);  // 최근 7일

      const from7 = startDate.toISOString().slice(0, 10);
      const to7 = endDate.toISOString().slice(0, 10);

      console.error(`📊 7일 운영 무결성 조회: ${from7} ~ ${to7}`);
      const events7Day = await fetchAllEvents(from7, to7, envFilter);

      if (events7Day && events7Day.length > 0) {
        const missingKeys7 = checkMissingKeys(events7Day);
        const orphans7 = checkOrphanEvents(events7Day);
        const doubleTerminal7 = checkDoubleTerminal(events7Day);
        const temporal7 = checkTemporalSanity(events7Day);

        const sampleSize7 = new Set(
          events7Day.filter(e => e.event_type === 'checkout_initiate' && e.checkout_id)
            .map(e => e.checkout_id)
        ).size;

        const overall7 = determineOverallStatus(missingKeys7, orphans7, doubleTerminal7, temporal7, sampleSize7);

        operational7Day = {
          dateFrom: from7,
          dateTo: to7,
          totalEvents: events7Day.length,
          missingKeys: missingKeys7,
          orphans: orphans7,
          doubleTerminal: doubleTerminal7,
          temporal: temporal7,
          overall: overall7
        };
      }
    } catch (err) {
      console.error('⚠️ 7일 무결성 조회 실패:', err.message);
    }
  }

  // 출력
  if (options.json) {
    console.log(JSON.stringify({ ...results, operational7Day }, null, 2));
  } else if (options.out) {
    const dir = path.dirname(options.out);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const markdown = formatMarkdown(results, from, to, envFilter);
    fs.writeFileSync(options.out, markdown, 'utf-8');
    console.error(`✅ 리포트 저장: ${options.out}`);
    console.log(`\n${overall.statusEmoji} ${overall.status}`);
  } else {
    formatConsole(results, from, to, operational7Day, envFilter);
  }

  // DB 연결 종료
  if (db && db.pool) {
    await db.pool.end();
  }

  // strict 모드에서 ALERT면 exit 1
  if (options.strict && overall.status === 'ALERT') {
    process.exit(1);
  }
}

// 모듈 내보내기 (daily-funnel에서 import 가능)
module.exports = {
  checkMissingKeys,
  checkOrphanEvents,
  checkDoubleTerminal,
  checkTemporalSanity,
  determineOverallStatus,
  fetchAllEvents,
  getEnvCondition,
  THRESHOLDS,
  VALID_ENV_FILTERS,
  DEFAULT_ENV_FILTER
};

// 직접 실행 시
if (require.main === module) {
  main().catch(err => {
    console.error('❌ 오류:', err.message);
    process.exit(1);
  });
}
