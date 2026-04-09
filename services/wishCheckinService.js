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
// 6개 상태. 이 외 추가 금지 (UX 무게 원칙)
const STATE_MAP = {
  'tired': {
    label:   '좀 지쳐있어요',
    message: '지금 흐름, 순간도 필요한 흐름이에요',
    action:  '3분만 아무것도 안 해볼까요?',
    action_key: 'rest',
  },
  'want_more': {
    label:   '괜찮은데 더 잘해보고 싶어요',
    message: '지금 흐름, 잘 타고 있어요',
    action:  '지금 할 일 하나만 더 해볼까요?',
    action_key: 'next_step',
  },
  'excited_unsure': {
    label:   '설레는데 뭔지 모르겠어요',
    message: '그 설렘 자체가 신호예요',
    action:  '지금 느낌 그대로 별로 만들어볼까요?',
    action_key: 'make_star',
  },
  'heavy': {
    label:   '무겁고 막막해요',
    message: '무거운 게 당연한 날도 있어요',
    action:  '한 문장만 꺼내볼까요?',
    action_key: 'write_one',
  },
  'floating': {
    label:   '뭔가 하고 싶은데 잘 모르겠어요',
    message: '지금 딱 그 순간이에요',
    action:  '소원 하나만 적어볼까요?',
    action_key: 'write_wish',
  },
  'okay': {
    label:   '그냥 평범해요',
    message: '평범한 날에 생긴 소원이 제일 진짜예요',
    action:  '오늘 하나 남겨볼까요?',
    action_key: 'leave_one',
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
