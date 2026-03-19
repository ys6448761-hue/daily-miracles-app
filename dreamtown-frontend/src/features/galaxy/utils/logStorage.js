/**
 * DreamTown Log Storage SSOT
 *
 * localStorage는 DB가 아니라 "기억이 남았다는 감각"을 만드는 장치다.
 * 저장 구조는 별 성장 / 히스토리로 그대로 이어진다.
 *
 * 저장 포맷:
 * {
 *   id:         'uuid',
 *   createdAt:  '2026-03-19T10:20:00+09:00',
 *   direction:  'north',
 *   message:    '오늘은 한 걸음 내딛어 봅니다',
 *   feeling:    '용기났어요',
 *   helpTag:    '실행',
 *   growthLine: '조금 용감해졌어요',
 * }
 *
 * 금지:
 * ❌ 저장 성공 알림 (toast 등)
 * ❌ 점수 / 레벨 표시
 * ❌ 통계 UI 바로 붙이기
 * 👉 지금은 "조용한 축적"이 핵심
 */

const STORAGE_KEY = 'dreamtown_logs';

export function saveLog(log) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  const newLog = {
    id: crypto.randomUUID(),
    ...log,
  };

  const updated = [newLog, ...existing];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return newLog;
}

export function getLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
