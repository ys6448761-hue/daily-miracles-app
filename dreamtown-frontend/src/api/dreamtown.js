// DreamTown API client

const BASE = '/api/dt';

async function fetchWithRetry(url, options, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    if (res.ok) return res.json();
    // 인증 오류(401/403)는 에러 본문 노출 금지 — fallback 메시지만
    if (res.status === 401 || res.status === 403) {
      throw new Error('잠시 후 다시 시도해주세요.');
    }
    if (i < retries) await new Promise(r => setTimeout(r, 800));
    else {
      let msg = '서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.';
      try {
        const body = await res.json();
        // 서버 내부 에러 메시지는 노출하지 않음 — 사용자 친화적 메시지만
        if (body?.message && typeof body.message === 'string' && !body.message.includes('Internal')) {
          msg = body.message;
        }
      } catch (_) {}
      throw new Error(msg);
    }
  }
}

export async function postWish({ userId, wishText, gemType, yeosuTheme }) {
  return fetchWithRetry(`${BASE}/wishes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      wish_text: wishText,
      gem_type: gemType,
      yeosu_theme: yeosuTheme,
    }),
  });
}

export async function postStarCreate({ wishId, userId, phoneNumber }) {
  return fetchWithRetry(`${BASE}/stars/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wish_id:      wishId,
      user_id:      userId,
      phone_number: phoneNumber ?? null,
    }),
  });
}

export async function getTodayStars() {
  const res = await fetch(`${BASE}/stars/today`);
  if (!res.ok) throw new Error('오늘의 탄생 별 조회 실패');
  return res.json();
}

// 성장 루프 노출 구조 — hot(공명 가중) + fresh(0공명 신생별)
// 실패 시 빈 배열 반환 — Home 렌더 블로킹 없음
export async function getFeaturedStars() {
  try {
    const res = await fetch(`${BASE}/stars/featured`);
    if (!res.ok) return { hot: [], fresh: [] };
    return res.json();
  } catch {
    return { hot: [], fresh: [] };
  }
}

export async function getRecentStars(limit = 20, galaxy = null) {
  const params = new URLSearchParams({ limit });
  if (galaxy) params.set('galaxy', galaxy);
  const res = await fetch(`${BASE}/stars/recent?${params}`);
  if (!res.ok) throw new Error('광장 별 목록 조회 실패');
  return res.json();
}

export async function getStar(starId) {
  const res = await fetch(`${BASE}/stars/${starId}`);
  if (!res.ok) throw new Error('별 조회 실패');  // StarDetail catch에서 처리
  return res.json();
}

// GET /api/dt/engine/artifact/:jobId — artifact 작업 상태 폴링
// artifact_status: 'pending' | 'processing' | 'done' | 'failed'
export async function getArtifactJob(jobId) {
  try {
    const res = await fetch(`/api/dt/engine/artifact/${jobId}`);
    if (!res.ok) return null;
    const body = await res.json();
    return body.job ?? null;
  } catch {
    return null;
  }
}

// 비로그인 공개 접근용 — 실패 시 null 반환 (에러 화면 방지)
export async function getStarPublic(starId) {
  try {
    const res = await fetch(`${BASE}/stars/${starId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getGalaxies() {
  const res = await fetch(`${BASE}/galaxies`);
  if (!res.ok) throw new Error('은하 조회 실패');
  return res.json();
}

export async function getGalaxy(code) {
  const res = await fetch(`${BASE}/galaxies/${code}`);
  if (!res.ok) throw new Error('은하 상세 조회 실패');
  return res.json();
}

export async function getGalaxyStars(galaxyCode, { limit = 5, exclude = null } = {}) {
  const params = new URLSearchParams({ limit });
  if (exclude) params.set('exclude', exclude);
  const res = await fetch(`${BASE}/galaxies/${galaxyCode}/stars?${params}`);
  if (!res.ok) throw new Error('은하 별 목록 조회 실패');
  return res.json();
}

// ── 공명 & 나눔 API ──────────────────────────────────────────

export async function getResonance(starId) {
  const res = await fetch(`/api/resonance/${starId}`);
  if (!res.ok) throw new Error('공명 조회 실패');
  return res.json();
}

export async function getSimilarStars({ starId, token }) {
  const params = new URLSearchParams();
  if (starId) params.set('star_id', starId);
  if (token)  params.set('token', token);
  const res = await fetch(`/api/resonance/similar?${params}`);
  if (!res.ok) throw new Error('유사 별 조회 실패');
  return res.json();
}

export async function getResonancePeople(starId) {
  try {
    const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/resonance-people`);
    if (!res.ok) return { people: [], total: 0 };
    return res.json();
  } catch {
    return { people: [], total: 0 };
  }
}

export async function getStarLogs(starId) {
  try {
    const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/logs`);
    if (!res.ok) return { logs: [] };
    return res.json();
  } catch { return { logs: [] }; }
}

export async function postStarLog(starId, { action_type = 'connected', message }) {
  try {
    await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type, message }),
    });
  } catch (_) {}
}

export async function getRelatedStars(starId, galaxy = null) {
  const qs  = galaxy ? `?galaxy=${encodeURIComponent(galaxy)}&limit=5` : '';
  const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/similar${qs}`);
  if (!res.ok) return { stars: [] };
  return res.json();
}

export async function getTopTodayStars() {
  try {
    const res = await fetch(`${BASE}/stars/top-today`);
    if (!res.ok) return { stars: [] };
    return res.json();
  } catch {
    return { stars: [] };
  }
}

export async function getTrendingStars(limit = 5) {
  try {
    const res = await fetch(`${BASE}/stars/trending?limit=${limit}`);
    if (!res.ok) return { stars: [] };
    return res.json();
  } catch {
    return { stars: [] };
  }
}

export async function postResonance({ starId, resonanceType, anonymousToken }) {
  return fetchWithRetry('/api/resonance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      star_id:          starId,
      resonance_type:   resonanceType,
      anonymous_token:  anonymousToken,
    }),
  });
}

export async function postDtResonance({ starId, type }) {
  return fetchWithRetry(`${BASE}/resonance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ starId, type }),
  });
}

export async function postGrowthLog(starId, text) {
  const userId = getOrCreateUserId();
  return fetchWithRetry(`${BASE}/stars/${starId}/growth-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, text }),
  });
}

// emotion/tag/growth → problem/action/result 자동 추론 저장
// source: 'voyage' (기본) | 'resonance' (공명 시 자동 저장)
export async function postVoyageLog(starId, { emotion, tag, growth, source = 'voyage' }) {
  const userId = getOrCreateUserId();
  return fetchWithRetry(`${BASE}/voyage-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, star_id: starId, emotion, tag, growth, source }),
  });
}

// 별의 항해 로그 목록 (D+ 포함)
export async function getVoyageLogs(starId) {
  const res = await fetch(`${BASE}/stars/${starId}/voyage-logs`);
  if (!res.ok) throw new Error('항해 로그 조회 실패');
  return res.json();
}

// GET /api/dt/wisdom/recommend — K-지혜 (context: complete|recommend|star)
export async function getWisdom({ galaxy, starId, context = 'star' } = {}) {
  const params = new URLSearchParams({ context });
  if (galaxy)  params.set('galaxy',  galaxy);
  if (starId)  params.set('star_id', starId);
  const res = await fetch(`${BASE}/wisdom/recommend?${params}`);
  if (!res.ok) return null;
  return res.json(); // { show, context, message? }
}

// GET /api/dt/stars/:id/route-recommendation — 은하 기반 항로 추천
export async function getRouteRecommendation(starId) {
  const journeyId = localStorage.getItem('dreamtown_whisper_journey_id');
  const qs = journeyId ? `?journey_id=${encodeURIComponent(journeyId)}` : '';
  const res = await fetch(`${BASE}/stars/${starId}/route-recommendation${qs}`);
  if (!res.ok) return null;
  return res.json();
}

// POST /api/dt/journeys/from-recommendation — 추천 항로로 journey 시작 (중복 방지)
export async function startJourneyFromRecommendation(userId, routeCode) {
  const res = await fetch(`${BASE}/journeys/from-recommendation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, route_code: routeCode }),
  });
  if (!res.ok) throw new Error('journey 시작 실패');
  return res.json();
}

// GET /api/dt/stars/:id/growth-summary — 별 성장 요약 집계
export async function getGrowthSummary(starId) {
  const res = await fetch(`${BASE}/stars/${starId}/growth-summary`);
  if (!res.ok) return null;
  return res.json();
}

// GET /api/dt/stars/:id/stats — My Star 요약 통계 (카드/마일스톤/차트)
export async function getStarStats(starId) {
  const res = await fetch(`${BASE}/stars/${starId}/stats`);
  if (!res.ok) return null;
  return res.json();
}

// GET /api/dt/stars/:id/today-schedule — 오늘의 Aurora5 스케줄 메시지
export async function getTodaySchedule(starId) {
  const res = await fetch(`${BASE}/stars/${starId}/today-schedule`);
  if (!res.ok) return { schedule: null };
  return res.json();
}

// ── KPI 대시보드 ──────────────────────────────────────────────────
export async function getDashboard(range = '7d') {
  const res = await fetch(`/api/kpi/dashboard?range=${range}`);
  if (!res.ok) throw new Error('대시보드 조회 실패');
  return res.json();
}

// ── 피드백 ────────────────────────────────────────────────────────
export async function postFeedback({ userId, starId, feelingType, reason, comment }) {
  return fetchWithRetry('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id:      userId,
      star_id:      starId,
      feeling_type: feelingType,
      reason:       reason  ?? null,
      comment:      comment ?? null,
    }),
  });
}

// POST /api/dt/stars/:id/aurora5-message — Aurora5 메시지 저장 (fire-and-forget용)
export async function postAurora5Message(starId, { userId, message, wisdomTag }) {
  return fetchWithRetry(`${BASE}/stars/${starId}/aurora5-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, message, wisdom_tag: wisdomTag }),
  });
}

// POST /api/dt/stars/:id/gift — 선물 생성
export async function createGift(starId, { userId, giftCopyType }) {
  return fetchWithRetry(`${BASE}/stars/${starId}/gift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, gift_copy_type: giftCopyType }),
  });
}

// GET /api/dt/gift/:star_id — 선물 카드 조회 (수신자)
export async function getGiftCard(starId) {
  const res = await fetch(`${BASE}/gift/${starId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('선물 정보를 불러올 수 없어요');
  return res.json();
}

// GET /api/dt/stars/:id/journey-story — 항해 장면 조회 (소유자)
export async function getJourneyStory(starId) {
  try {
    const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/journey-story`);
    if (!res.ok) return { origin: null, shift: null, now: null, visibility: 'private' };
    return res.json();
  } catch {
    return { origin: null, shift: null, now: null, visibility: 'private' };
  }
}

// PUT /api/dt/stars/:id/journey-story — 항해 장면 저장
export async function putJourneyStory(starId, { origin, shift, now, visibility, userId }) {
  const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/journey-story`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, shift, now, visibility, user_id: userId }),
  });
  return res.json();
}

// GET /api/dt/stars/:id/detail — 공개 별 상세 (닉네임/마일스톤/항해로그/Aurora5 포함)
export async function getStarDetail(starId) {
  const res = await fetch(`${BASE}/stars/${starId}/detail`);
  if (!res.ok) throw new Error('별 상세 조회 실패');
  return res.json();
}

// GET /api/dt/engine/star/:starId/timeline — 별 전체 여정 타임라인 (책 UI 기반)
export async function getStarTimeline(starId) {
  const res = await fetch(`/api/dt/engine/star/${starId}/timeline`);
  if (!res.ok) throw new Error('타임라인 조회 실패');
  return res.json();
}

// POST /api/dt/stars/:id/next-day-heart — 다음날의 마음 저장
export async function postNextDayHeart(starId, choice) {
  const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/next-day-heart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choice }),
  });
  return res.json();
}

// GET /api/dt/stars/:id/next-day-heart — 다음날의 마음 조회
export async function getNextDayHeart(starId) {
  try {
    const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/next-day-heart`);
    if (!res.ok) return { heart: null };
    return res.json();
  } catch {
    return { heart: null };
  }
}

// POST /api/dt/stars/:id/travel-log — 여행 선택 기록 저장
export async function postTravelLog(starId, { place, emotion }) {
  const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/travel-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ place, emotion }),
  });
  return res.json();
}

// POST /api/dt/stars/:id/travel-reflection — 여행 이후 3단 반성 저장
export async function postTravelReflection(starId, { emotion_label, meaning_label, change_label }) {
  const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/travel-reflection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emotion_label, meaning_label, change_label }),
  });
  return res.json();
}

// GET /api/dt/stars/:id/travel-log — 여행 기록 조회
export async function getTravelLog(starId) {
  try {
    const res = await fetch(`${BASE}/stars/${encodeURIComponent(starId)}/travel-log`);
    if (!res.ok) return { log: null };
    return res.json();
  } catch {
    return { log: null };
  }
}

// POST /api/book/upgrade — 실물책 제작 신청
export async function postBookUpgrade({ starId, userId, phone = null }) {
  return fetchWithRetry('/api/book/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ star_id: starId, user_id: userId, phone }),
  });
}

// Prototype용 임시 user ID (로컬 스토리지 기반)
export function getOrCreateUserId() {
  const key = 'dt_user_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}


// ── AI Unlock 모네타이제이션 API ─────────────────────────────────────

// GET /api/dt/ai-unlock/status
export async function getAiStatus({ userId, daysActive = 0 }) {
  const params = new URLSearchParams({ user_id: userId });
  if (daysActive > 0) params.set('days_active', String(daysActive));
  const res = await fetch(`/api/dt/ai-unlock/status?${params}`);
  if (!res.ok) return null;
  return res.json();
}

// POST /api/dt/ai-unlock/event
export async function logAiUpsellEvent({ userId, starId, eventName, stage, group, productType, context }) {
  try {
    await fetch('/api/dt/ai-unlock/event', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:      userId,
        star_id:      starId ?? null,
        event_name:   eventName,
        stage:        stage ?? null,
        group:        group ?? null,
        product_type: productType ?? null,
        context:      context ?? null,
      }),
    });
  } catch { /* fire-and-forget */ }
}

// POST /api/dt/ai-unlock/purchase
export async function purchaseAiProduct({ userId, productType, pgOrderId, pgTid }) {
  const res = await fetch('/api/dt/ai-unlock/purchase', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id:      userId,
      product_type: productType,
      pg_order_id:  pgOrderId ?? null,
      pg_tid:       pgTid ?? null,
    }),
  });
  return res.json();
}

// ── Wish Checkin ─────────────────────────────────────────────
export async function getCheckinStates() {
  const res = await fetch('/api/dt/wish-checkin/states');
  return res.json();
}

export async function postCheckinState({ userId, stateKey, actionClicked = false, sessionId = null }) {
  const res = await fetch('/api/dt/wish-checkin', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id:        userId ?? null,
      state_key:      stateKey,
      action_clicked: actionClicked,
      session_id:     sessionId ?? null,
    }),
  });
  return res.json();
}

export function postCheckinSkip({ userId, sessionId = null } = {}) {
  fetch('/api/dt/wish-checkin/skip', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId ?? null, session_id: sessionId ?? null }),
  }).catch(() => {}); // fire-and-forget
}

// dreamtown_flow 이벤트 로그 — fire-and-forget (응답 대기 없음)
export function logFlowEvent({ userId, stage, action, value = {}, refId = null }) {
  fetch('/api/dt/flow', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, stage, action, value, refId }),
  }).catch(() => {});
}

// POST /api/dt/user-events — 사용자 반응 이벤트 기록 (fire-and-forget)
export const USER_EVENTS = {
  STAR_PAGE_VIEW:    'star_page_view',
  PHASE_EXPOSED:     'phase_exposed',
  ACTION_CLICKED:    'action_clicked',
  QUESTION_SHOWN:    'question_shown',
  QUESTION_ANSWERED: 'question_answered',
  REVISIT_DETECTED:  'revisit_detected',
};

export function logUserEvent({ userId, eventType, metadata = {} }) {
  fetch('/api/dt/user-events', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ user_id: userId, event_type: eventType, metadata }),
  }).catch(() => {});
}

export function checkRevisit(userId) {
  return fetch('/api/dt/user-events/revisit', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ user_id: userId }),
  }).catch(() => {});
}

// GET /api/dt/trajectory/summary?user_id=uuid — 별 페이지 5블록 요약
export async function getStarPageSummary(userId) {
  const res = await fetch(`${BASE}/trajectory/summary?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('별 요약 조회 실패');
  return res.json();
}

// POST /api/dt/engine/journey — 일상 입력 → 상태/장면/행동/방향
export async function postJourney({ userId, wishText, userState, lifeSpotId = null, history = [] }) {
  return fetchWithRetry(`${BASE}/engine/journey`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id:      userId,
      wish_text:    wishText,
      user_state:   userState,
      life_spot_id: lifeSpotId,
      history,
    }),
  });
}

// GET /api/dt/star/day8-status?user_id= — Day 8 전환 상태 조회
export async function getDay8Status(userId) {
  try {
    const res = await fetch(`${BASE}/star/day8-status?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// POST /api/dt/star/day8-choose — Day 8 플랜 선택
// choice: 'continue' | 'lite' | 'pause'
export async function postDay8Choose({ userId, choice }) {
  return fetchWithRetry(`${BASE}/star/day8-choose`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, choice }),
  });
}

// POST /api/payment/nicepay/request — Day 8 Flow 플랜 결제 요청
// Returns: { order_id, redirect_url, amount }
export async function requestDay8Payment(userId) {
  return fetchWithRetry('/api/payment/nicepay/request', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
}
