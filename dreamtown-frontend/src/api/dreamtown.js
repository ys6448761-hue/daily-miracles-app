// DreamTown API client

const BASE = '/api/dt';

export async function postWish({ userId, wishText, gemType, yeosuTheme }) {
  const res = await fetch(`${BASE}/wishes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      wish_text: wishText,
      gem_type: gemType,
      yeosu_theme: yeosuTheme,
    }),
  });
  if (!res.ok) throw new Error('소원 저장 실패');
  return res.json();
}

export async function postStarCreate({ wishId, userId }) {
  const res = await fetch(`${BASE}/stars/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wish_id: wishId, user_id: userId }),
  });
  if (!res.ok) throw new Error('별 생성 실패');
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
