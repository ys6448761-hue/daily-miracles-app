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

export async function postStarCreate({ wishId, userId }) {
  return fetchWithRetry(`${BASE}/stars/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wish_id: wishId, user_id: userId }),
  });
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
