// DreamTown API client

const BASE = '/api/dt';

async function fetchWithRetry(url, options, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    if (res.ok) return res.json();
    if (i < retries) await new Promise(r => setTimeout(r, 800));
    else {
      let msg = '서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.';
      try {
        const body = await res.json();
        if (body?.error && typeof body.error === 'string') msg = body.error;
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

export async function getRecentStars(limit = 13) {
  const res = await fetch(`${BASE}/stars/recent?limit=${limit}`);
  if (!res.ok) throw new Error('광장 별 목록 조회 실패');
  return res.json();
}

export async function getStar(starId) {
  const res = await fetch(`${BASE}/stars/${starId}`);
  if (!res.ok) throw new Error('별 조회 실패');
  return res.json();
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
