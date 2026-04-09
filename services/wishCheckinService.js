/**
 * wishCheckinService.js — 소원 전 상태 체크인
 *
 * 철학: "툭 던지고 끝" — 분석/해석/조언 없음
 * UX 규칙:
 *   - 클릭 1번 → 바로 응답
 *   - 메시지 1~2문장
 *   - 행동 버튼 1개
 *   - 스킵 가능
 *
 * 사용: GET /api/dt/wish-checkin/states → 상태 목록
 *       POST /api/dt/wish-checkin        → { state } 로그 + 응답 반환
 */

'use strict';

// ── 상태 → 응답 맵 ────────────────────────────────────────────
// 4개 상태. 이 외 추가 금지 (UX 무게 원칙 — 3초 반응)
const STATE_MAP = {
  'breathless': {
    label:      '숨이 좀 막혀요',
    message:    '지금은 잠깐 멈춰도 괜찮아요',
    action:     '30초만 천천히 숨 쉬어볼까요?',
    action_key: 'breathe',
  },
  'overthinking': {
    label:      '생각이 많아요',
    message:    '지금은 하나만 정해도 충분해요',
    action:     '지금 가장 중요한 한 가지만 적어볼까요?',
    action_key: 'write_one',
  },
  'want_rest': {
    label:      '그냥 쉬고 싶어요',
    message:    '지금은 쉬어도 되는 타이밍이에요',
    action:     '3분만 아무것도 안 해볼까요?',
    action_key: 'rest',
  },
  'want_more': {
    label:      '괜찮은데 더 잘해보고 싶어요',
    message:    '지금 흐름 좋네요, 하나만 더 해볼까요?',
    action:     '지금 할 일 하나만 더 해볼까요?',
    action_key: 'next_step',
  },
};

function getStates() {
  return Object.entries(STATE_MAP).map(([key, v]) => ({
    key,
    label: v.label,
  }));
}

function getResponse(stateKey) {
  const state = STATE_MAP[stateKey];
  if (!state) return null;
  return {
    state_key:  stateKey,
    label:      state.label,
    message:    state.message,
    action:     state.action,
    action_key: state.action_key,
  };
}

module.exports = { STATE_MAP, getStates, getResponse };
