/**
 * experiment.js — 경량 A/B 실험 프레임워크
 *
 * 규칙:
 * - 한 번에 1개 변수만 비교
 * - 감으로 결정 금지, 최소 50~100명 데이터
 * - 승자: CTR + 진입률 + 완성률 중 1개라도 확실히 높은 안
 *
 * 저장소: localStorage
 * - dt_variants   : { [experimentId]: 'A' | 'B' }  유저당 고정
 * - dt_events     : Event[] (최대 500개, FIFO)
 */

const VARIANT_KEY = 'dt_variants';
const EVENTS_KEY  = 'dt_events';
const MAX_EVENTS  = 500;

// 유저당 variant 고정 — 재방문해도 동일 그룹 유지
// variants 배열로 A/B/C 등 N개 지원
export function getVariant(experimentId, variants = ['A', 'B']) {
  const stored = JSON.parse(localStorage.getItem(VARIANT_KEY) || '{}');
  if (stored[experimentId]) return stored[experimentId];

  const variant = variants[Math.floor(Math.random() * variants.length)];
  stored[experimentId] = variant;
  localStorage.setItem(VARIANT_KEY, JSON.stringify(stored));
  return variant;
}

// 이벤트 추적 — localStorage 적재 + 콘솔 (개발 확인용)
export function track(event, props = {}) {
  const entry = {
    event,
    ts: Date.now(),
    ...props,
  };

  // 콘솔 확인 (개발/운영 공통, 추후 제거 가능)
  if (typeof window !== 'undefined') {
    console.debug('[DT track]', entry);
  }

  // localStorage 저장 (FIFO, MAX_EVENTS 초과 시 오래된 것 제거)
  const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  events.push(entry);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

// 수집된 이벤트 조회 (결과 분석용)
export function getEvents(eventName) {
  const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  return eventName ? events.filter(e => e.event === eventName) : events;
}

// 간단 전환율 계산 (콘솔 분석용)
export function summarize() {
  const events = getEvents();
  const count  = (name) => events.filter(e => e.event === name).length;
  const byVariant = (name, v) =>
    events.filter(e => e.event === name && e.variant === v).length;

  const experiments = [...new Set(
    events.filter(e => e.variant).map(e => e.experiment).filter(Boolean)
  )];

  console.table({
    screen_view:        count('screen_view'),
    cta_click:          count('cta_click'),
    galaxy_enter:       count('galaxy_enter'),
    star_select:        count('star_select'),
    postcard_complete:  count('postcard_complete'),
  });

  experiments.forEach(exp => {
    console.group(`[Experiment] ${exp}`);
    ['A', 'B'].forEach(v => {
      const clicks    = byVariant('cta_click', v);
      const enters    = byVariant('galaxy_enter', v);
      const completes = byVariant('postcard_complete', v);
      console.log(`  ${v}: cta_click=${clicks} / galaxy_enter=${enters} / postcard_complete=${completes}`);
    });
    console.groupEnd();
  });
}
