'use strict';
/**
 * PHX-MUYEOJEONG-FOOD §81 — 머먹지 고객 질문 응답 조립.
 * 판단은 munmeokjiTimeGate 가 한다 (신규 판단 Engine 아님). 여기서는 의도·시각을 게이트에 넘기고,
 * 게이트 결과를 확인된 값만으로 문장화한다. 확인되지 않은 식당·시간·혜택은 말하지 않는다.
 */

const gate = require('./munmeokjiTimeGate');
const intent = require('./munmeokjiIntent');
const { naverDetailFromUrl } = gate;

const RENDER_VARS = ['RENDER', 'RENDER_SERVICE_ID', 'RENDER_SERVICE_NAME', 'RENDER_EXTERNAL_URL', 'RENDER_GIT_COMMIT', 'RENDER_GIT_BRANCH'];

/**
 * 개발 미리보기 (미공개 행 표시) 허용 조건: 환경변수 명시 + 운영 아님 + Render 아님.
 * 운영에서는 항상 false → customer_public 이 true 인 행만 노출.
 */
function isDevPreviewEnabled(env = process.env) {
  if (env.MUNMEOKJI_DEV_PREVIEW !== '1') return false;
  if (String(env.NODE_ENV || '').toLowerCase() === 'production') return false;
  if (RENDER_VARS.some((k) => env[k] && String(env[k]).length > 0)) return false;
  return true;
}

const REASON_TEXT = {
  OUT_OF_HOURS: (t) => `${t}에는 영업 시간이 아니에요.`,
  BREAK_TIME: (b) => `브레이크타임(${b})이라 지금은 어려워요.`,
  CLOSED_DAY: (d) => `${d}요일은 정기휴무예요.`,
  HOURS_UNKNOWN: () => '영업시간이 확인되지 않았어요.',
  LAST_ORDER_UNKNOWN: () => '라스트오더가 확인되지 않아 시간 기준으로 안내할 수 없어요.',
  AFTER_LAST_ORDER_CUTOFF: (c) => `추천 마감(${c}) 이후예요.`,
  INVALID_TIME: () => '시각을 확인하지 못했어요.',
};

function scheduleOf(rec, dayKey) {
  const h = rec.opening_hours_json;
  return h && typeof h === 'object' && h[dayKey] && typeof h[dayKey] === 'object' ? h[dayKey] : null;
}

/** 추천 마감 문자열 (LO − 30분). LO 미확인·저녁 전용 범위 밖이면 null. */
function cutoffText(rec, visit) {
  const s = scheduleOf(rec, visit.day);
  if (!s || s.closed) return null;
  if (s.last_order_scope === 'dinner_only') {
    const df = gate.LO_BUFFER_MIN !== undefined ? toMin(s.dinner_from) : null;
    if (df === null || toMin(visit.time) < df) return null;
  }
  const lo = toMin(s.last_order);
  if (lo === null) return null;
  const c = lo - gate.LO_BUFFER_MIN;
  return `${pad(Math.floor(c / 60))}:${pad(c % 60)}`;
}

function toMin(hhmm) {
  if (typeof hhmm !== 'string' || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function pad(n) { return String(n).padStart(2, '0'); }

function hoursText(rec, visit) {
  const s = scheduleOf(rec, visit.day);
  if (!s) return null;
  if (s.closed) return '정기휴무';
  const br = Array.isArray(s.break) && s.break.length === 2 ? ` (브레이크 ${s.break[0]}~${s.break[1]})` : '';
  return `${s.open}~${s.close}${br}`;
}

function sourceLine(visit) {
  if (visit.source === 'NOW') return '지금 시각';
  if (visit.source === 'EXPLICIT') return '말씀하신 시각';
  return '식사 시점 기본 시각 (정확한 시각을 말씀해 주시면 다시 확인할게요)';
}

// 가격 문자열 (예: 16,000원) 도 응답 가드 corpus 에 들어가야 정상 응답이 대체되지 않는다 (응답이 원자료에서 만든 값).
function priceTokens(text) {
  return (String(text).match(/\d[\d,]*원/g) || []);
}

function clockTokens(text) {
  return (String(text).match(/\d{2}:\d{2}/g) || []);
}

function payloadOf(sessionId, message_ko, extra = {}) {
  return {
    session_id: sessionId,
    understood_context: {},
    places: [],
    why_details: [],
    message_ko,
    status: 'PLACE_LOOKUP',
    intent: 'FOOD_RECOMMENDATION',
    presentation_mode: 'PLACE_KNOWLEDGE',
    resolved_code: null,
    next_options: [],
    timestamp: new Date().toISOString(),
    shared_journey: null,
    quote: null,
    route: null,
    verified_clock_tokens: [...clockTokens(message_ko), ...priceTokens(message_ko)],
    ...extra,
  };
}

function namedAnswer(rec, visit, companion, rows) {
  const lines = [];
  const dayLabel = visit.dayLabel;
  const hours = hoursText(rec, visit);
  if (hours === '정기휴무') {
    lines.push(`${rec.name}은 ${dayLabel}요일 정기휴무예요.`);
  } else {
    const s = gate.statusAt(rec, { time: visit.time, day: visit.day });
    if (s.ok) {
      const co = cutoffText(rec, visit);
      lines.push(`${rec.name}은 ${dayLabel}요일 ${visit.time}에 추천할 수 있어요. 영업 ${hours}${co ? `, 추천 마감 ${co}` : ''}.`);
    } else {
      const sched = scheduleOf(rec, visit.day) || {};
      const co = cutoffText(rec, visit);
      let detail;
      if (s.reason === 'BREAK_TIME') detail = REASON_TEXT.BREAK_TIME(`${sched.break[0]}~${sched.break[1]}`);
      else if (s.reason === 'AFTER_LAST_ORDER_CUTOFF') detail = REASON_TEXT.AFTER_LAST_ORDER_CUTOFF(co || '');
      else if (s.reason === 'OUT_OF_HOURS') detail = REASON_TEXT.OUT_OF_HOURS(visit.time);
      else detail = (REASON_TEXT[s.reason] || (() => '확인되지 않았어요.'))(visit.time);
      lines.push(`${rec.name}은 ${dayLabel}요일 ${visit.time}에 추천하기 어려워요. ${detail}`);
      if (hours) lines.push(`${dayLabel}요일 영업: ${hours}.`);
    }
    if (rec.opening_hours_json?.[visit.day]?.last_order_scope === 'dinner_only' && toMin(visit.time) < toMin(rec.opening_hours_json[visit.day].dinner_from)) {
      lines.push('라스트오더 18:50은 저녁 시간대에만 적용하며, 점심 라스트오더는 확인 중이에요.');
    }
  }
  if (companion === 'solo' && !(Array.isArray(rec.suitable_for) && rec.suitable_for.includes('solo'))) {
    lines.push('혼밥 가능 여부는 확인되지 않았어요.');
  }
  void rows;
  return lines.join('\n');
}

/**
 * @param {{sessionId, message, rows, now?: Date, devPreview?: boolean}} args
 *   rows: travelGuideService._getRestaurants 결과 (DB 행 또는 Fixture)
 */
function buildMunmeokjiAnswer({ sessionId, message, rows, now = new Date(), devPreview = false }) {
  const all = Array.isArray(rows) ? rows : [];
  const visible = all.filter((r) => !r._mock && (r.customer_public === true || devPreview));
  const visit = intent.parseVisit(message, now);
  const companion = intent.parseCompanion(message);
  const cuisine = intent.parseCuisine(message);
  const basis = `${visit.dayLabel}요일 ${visit.time} 기준 (${sourceLine(visit)}).`;

  if (visible.length === 0) {
    return payloadOf(sessionId, `${basis}\n지금 확인된 음식점 정보가 없어요. 확인되지 않은 식당은 추천하지 않았어요.`, {
      munmeokji: { visit, companion, cuisine, kept: [], excluded: {} },
    });
  }

  // 1) 특정 식당 질문
  const named = intent.findNamedRestaurant(message, all.filter((r) => !r._mock));
  if (named) {
    if (!(named.customer_public === true || devPreview)) {
      return payloadOf(sessionId, '그 식당은 아직 정보를 확인 중이라 안내할 수 없어요.', { munmeokji: { visit, kept: [], excluded: {} } });
    }
    const body = namedAnswer(named, visit, companion, all);
    return payloadOf(sessionId, `${basis}\n${body}`, { munmeokji: { visit, kept: [], excluded: {}, named: named.code } });
  }

  // 2) 메뉴 항목 질문 (예: 꽃게탕 혼자)
  const mi = intent.findMenuItem(message, visible);
  if (mi && companion === 'solo' && mi.item.min_party && mi.item.min_party > 1) {
    return payloadOf(sessionId, `${mi.restaurant.name}의 ${mi.item.name}은 ${mi.item.min_party}인 이상 주문 메뉴라 혼자 주문하기 어려워요.`, {
      munmeokji: { visit, kept: [], excluded: {}, menu_item: mi.item.name },
    });
  }

  // 3) 바다 전망 요구: 확인된 전망 정보가 없으므로 임의 추천 금지
  if (/바다|전망|오션뷰|야경|밤바다/.test(message)) {
    return payloadOf(sessionId, '바다 전망이 확인된 식당은 아직 없어요. 확인되지 않은 식당은 추천하지 않았어요.', {
      munmeokji: { visit, kept: [], excluded: { SEA_VIEW_UNVERIFIED: 1 } },
    });
  }

  // 4) 일반 추천: 음식 종류 → 동반자 → 시간 게이트
  let list = visible;
  if (cuisine) list = list.filter((r) => String(r.cuisine_type || '').includes(cuisine) || String(r.name || '').includes(cuisine));
  const beforeCompanion = list.length;
  if (companion === 'solo') list = list.filter((r) => Array.isArray(r.suitable_for) && r.suitable_for.includes('solo'));
  if (companion === 'kids') list = list.filter((r) => Array.isArray(r.suitable_for) && r.suitable_for.includes('family'));
  if (companion === 'elderly') list = list.filter((r) => Array.isArray(r.suitable_for) && (r.suitable_for.includes('elderly') || r.suitable_for.includes('family')));
  const companionExcluded = beforeCompanion - list.length;

  const g = gate.applyRestaurantTimeGate(list, { time: visit.time, day: visit.day });
  const counts = {};
  for (const e of g.excluded) counts[e.reason] = (counts[e.reason] || 0) + 1;
  if (companionExcluded > 0) counts.COMPANION_UNCONFIRMED = companionExcluded;

  if (g.kept.length === 0) {
    const why = Object.keys(counts).length ? ` 제외: ${Object.entries(counts).map(([k, v]) => `${k} ${v}곳`).join(', ')}.` : '';
    return payloadOf(sessionId, `${basis}\n지금 시간에 확인된 식당이 없어요. 확인되지 않은 식당은 추천하지 않았어요.${why}`, {
      munmeokji: { visit, companion, cuisine, kept: [], excluded: counts },
    });
  }

  const lines = [basis];
  const cards = [];
  for (const r of g.kept) {
    const co = cutoffText(r, visit);
    const hrs = hoursText(r, visit);
    const card = buildCard(r, visit, companion, co, hrs);
    cards.push(card);
    lines.push(`• ${r.name} (${r.cuisine_type || '음식'}): 영업 ${hrs}, 추천 마감 ${co || '미확인'}. 이동 시간은 확인되지 않았어요.`);
    for (const l of card.lines) lines.push(`  ${l}`);
  }
  const reasonLabels = { CLOSED_DAY: '정기휴무', OUT_OF_HOURS: '영업 외', BREAK_TIME: '브레이크타임', HOURS_UNKNOWN: '영업시간 미확인', LAST_ORDER_UNKNOWN: '라스트오더 미확인', AFTER_LAST_ORDER_CUTOFF: '추천 마감 지남', COMPANION_UNCONFIRMED: '동반 조건 미확인' };
  const parts = Object.entries(counts).map(([k, v]) => `${reasonLabels[k] || k} ${v}곳`);
  if (parts.length) lines.push(`제외: ${parts.join(', ')}.`);
  return payloadOf(sessionId, lines.join('\n'), {
    cards,
    munmeokji: { visit, companion, cuisine, kept: g.kept.map((r) => r.code), excluded: counts },
  });
}

function fmtWon(n) { return `${Number(n).toLocaleString('en-US')}원`; }

function fmtItem(m) {
  const extra = [];
  if (m.price_basis) extra.push(m.price_basis);
  if (m.min_party && !m.price_basis) extra.push(`${m.min_party}인 이상 주문`);
  if (m.limited) extra.push('한정 수량');
  if (m.note) extra.push(m.note);
  return `${m.name} ${fmtWon(m.price)}${extra.length ? ` (${extra.join(', ')})` : ''}`;
}

/**
 * 고객 추천 카드 (확인된 값만). 네이버 링크는 상세 URL 이 검증된 경우에만.
 * 혜택 문구는 넣지 않는다 (소원패스 노출은 별도 Gate).
 */
function buildCard(r, visit, companion, co, hrs) {
  const menu = Array.isArray(r.menu) ? r.menu : [];
  const main = menu.filter((m) => !m.addon);
  const kids = gate.kidsMenu(menu);
  const solo = main.filter((m) => m.solo);
  const lines = [];
  if (main.length && companion !== 'kids') {
    const show = (companion === 'solo' && solo.length ? solo : main).slice(0, 6);
    lines.push(`메뉴: ${show.map(fmtItem).join(' / ')}`);
  }
  if (companion === 'kids' && kids.length) lines.push(`어린이 메뉴: ${kids.map(fmtItem).join(' / ')}`);
  if (companion === 'solo' && solo.length) lines.push(`1인 메뉴: ${solo.map(fmtItem).join(' / ')}`);
  const link = naverDetailFromUrl(r.source_url);
  if (link) lines.push(`네이버 지도: ${link.url}`);
  return {
    code: r.code,
    name: r.name,
    cuisine: r.cuisine_type || null,
    hours: hrs,
    cutoff: co,
    menu_main: main.map((m) => ({ name: m.name, price: m.price, note: m.note || null, min_party: m.min_party || null, limited: !!m.limited })),
    menu_kids: kids.map((m) => ({ name: m.name, price: m.price, note: m.note || null })),
    naver_url: link ? link.url : null,
    lines,
  };
}

module.exports = { buildMunmeokjiAnswer, isDevPreviewEnabled, cutoffText, hoursText };
