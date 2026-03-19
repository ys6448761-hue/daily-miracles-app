/**
 * SelectionTransition — 별 선택 순간 "빛이 내려오는" 경험
 *
 * 설계 원칙:
 * - direction별 고유 색상 (도전=청, 성장=금, 관계=보라, 치유=민트)
 * - 빛줄기가 별에서 화면 중심으로 흘러들어오는 연출
 * - flash 금지 — 모든 opacity 0.2 이하, 페이드인 18% 지점
 * - 총 1080ms 재생 (transitioning phase 기준)
 */

// direction별 빛 색상 (RGB) — 브랜드 감성 연동
const DIRECTION_COLORS = {
  north: { r: 155, g: 195, b: 255 }, // 도전 — 차가운 별빛 (푸름)
  east:  { r: 255, g: 212, b: 120 }, // 성장 — 새벽 금빛
  west:  { r: 210, g: 165, b: 255 }, // 관계 — 연보라
  south: { r: 120, g: 220, b: 195 }, // 치유 — 아쿠아민트
};

// 별 위치 → 화면 anchor
const ANCHOR_MAP = {
  north: { x: '50%', y: '18%' },
  east:  { x: '82%', y: '44%' },
  west:  { x: '18%', y: '44%' },
  south: { x: '50%', y: '82%' },
};

// 빛줄기 방향 — 별에서 화면 중심 방향으로
const BEAM_DIR = {
  north: 'to bottom',
  east:  'to left',
  west:  'to right',
  south: 'to top',
};

export default function SelectionTransition({ phase, selectedDirection }) {
  if (phase !== 'transitioning' || !selectedDirection) return null;

  const { r, g, b } = DIRECTION_COLORS[selectedDirection];
  const anchor = ANCHOR_MAP[selectedDirection];
  const beamDir = BEAM_DIR[selectedDirection];

  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* ① 빛줄기 — 별에서 화면 중심으로 흘러내려오는 색광 */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            ${beamDir},
            rgba(${r},${g},${b},0.20) 0%,
            rgba(${r},${g},${b},0.10) 38%,
            rgba(${r},${g},${b},0.03) 65%,
            rgba(${r},${g},${b},0.00) 100%
          )`,
          animation: 'light-descend 1050ms ease-out forwards',
        }}
      />

      {/* ② 방사 글로우 — 별 위치에서 사방으로 퍼지는 빛 */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            circle at ${anchor.x} ${anchor.y},
            rgba(${r},${g},${b},0.18) 0%,
            rgba(${r},${g},${b},0.09) 15%,
            rgba(${r},${g},${b},0.03) 32%,
            rgba(0,0,0,0) 58%
          )`,
          animation: 'selection-glow 1050ms ease-out forwards',
        }}
      />

      {/* ③ 대기 블룸 — 색이 공기에 스며드는 느낌 (blur) */}
      <div
        className="absolute inset-[-8%]"
        style={{
          background: `radial-gradient(
            ellipse at ${anchor.x} ${anchor.y},
            rgba(${r},${g},${b},0.12) 0%,
            rgba(${r},${g},${b},0.05) 28%,
            rgba(0,0,0,0) 62%
          )`,
          filter: 'blur(32px)',
          animation: 'selection-bloom 1050ms ease-out forwards',
        }}
      />

      {/* ④ 부드러운 베일 — 화면 가장자리 어두워짐 (집중감) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            circle at ${anchor.x} ${anchor.y},
            rgba(4,6,10,0.00) 0%,
            rgba(4,6,10,0.08) 30%,
            rgba(3,4,8,0.22) 65%,
            rgba(2,3,6,0.36) 100%
          )`,
          animation: 'selection-veil 1050ms ease-out forwards',
        }}
      />
    </div>
  );
}
