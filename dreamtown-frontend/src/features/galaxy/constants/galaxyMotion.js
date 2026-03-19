/**
 * 별 모션 프리셋 — 내부 사용 전용
 * ⚠️ 이 키(challenge/growth/relationship/healing)는 UI에 절대 노출하지 않는다
 *
 * 감정 차이는 오직 여기서만 만든다:
 *   - drift: 방향별 미세 이동
 *   - glowDir: 빛 퍼짐 방향
 *   - breathDuration: 4~6초 호흡 주기
 *   - breathDelay: 별마다 타이밍 offset
 */
export const MOTION_PRESETS = {
  // 북 — 위로 미세 상승
  challenge: {
    drift: { y: [0, -5, 0] },
    glowDir: '0 -16px 32px 6px',
    breathDuration: 5,
    breathDelay: 0,
  },
  // 동 — 오른쪽 확산
  growth: {
    drift: { x: [0, 6, 0] },
    glowDir: '16px 0 32px 6px',
    breathDuration: 4.5,
    breathDelay: 1.3,
  },
  // 서 — 좌우 연결 파동
  relationship: {
    drift: { x: [0, -4, 3, -2, 0] },
    glowDir: '-12px 0 26px 4px rgba(255,255,218,0.10), 12px 0 26px 4px',
    breathDuration: 6,
    breathDelay: 2.1,
  },
  // 남 — 아래로 가라앉음
  healing: {
    drift: { y: [0, 6, 0] },
    glowDir: '0 16px 32px 6px',
    breathDuration: 5.5,
    breathDelay: 1.6,
  },
};

/** 모든 별 공통 — 색상·크기·형태 동일 (DEC-2026-0319-001) */
export const STAR_BASE = {
  size: 14,
  color: 'rgba(255, 255, 224, 0.95)',
  glowBase: '0 0 10px 3px rgba(255,255,218,0.55)',
  glowAlpha: 'rgba(255,255,218,0.10)',
};

/** 호흡 진폭 고정 */
export const BREATH = {
  scaleMin: 0.98,
  scaleMax: 1.02,
  opacityMin: 0.92,
  opacityMax: 1.0,
};
