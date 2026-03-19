/**
 * PostcardView — 화면용 / 캡처용 분기 (DEC-2026-0319-005)
 *
 * captureMode = false  → blur 있음, 감성 최적화
 * captureMode = true   → blur 제거 + opacity 보정, 렌더 안정화
 *
 * direction 연동:
 * - watercolor 배경: 방향별 색 tint
 * - 광원 위치: 선택한 별이 있던 방향에서 빛이 들어옴
 * - 중앙 실루엣: 방향 색 반영
 *
 * 금지:
 * ❌ 캡처용 UI 따로 만들기
 * ❌ 텍스트 위치 변경
 * 👉 "같아 보이지만 내부만 다르게"
 */

// 방향별 테마 — rgb 값으로 관리 (opacity는 사용처에서 결정)
const DIRECTION_THEME = {
  north: { r: 140, g: 185, b: 255, lightPos: '50% 8%'  },  // 도전 — 차가운 청
  east:  { r: 245, g: 195, b:  85, lightPos: '88% 44%' },  // 성장 — 따뜻한 금
  west:  { r: 240, g: 140, b: 195, lightPos: '12% 44%' },  // 관계 — 부드러운 핑크
  south: { r:  80, g: 210, b: 175, lightPos: '50% 88%' },  // 치유 — 아쿠아민트
};

// 방향 미지정 시 중립 fallback
const NEUTRAL = { r: 185, g: 205, b: 255, lightPos: '50% 22%' };

export default function PostcardView({ direction, message, growthLine, captureMode = false }) {
  const { r, g, b, lightPos } = DIRECTION_THEME[direction] || NEUTRAL;

  return (
    <div
      id="dreamtown-postcard"
      data-capture={captureMode ? 'true' : 'false'}
      className="relative w-full max-w-sm aspect-[3/4] rounded-[28px] overflow-hidden bg-[#070b14] shadow-2xl"
    >
      {/* watercolor background — 선택 방향에서 빛이 스며드는 느낌 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(44% 38% at ${lightPos}, rgba(${r},${g},${b},0.16) 0%, rgba(${r},${g},${b},0) 70%),
            radial-gradient(36% 30% at 82% 44%, rgba(${r},${g},${b},0.07) 0%, rgba(${r},${g},${b},0) 72%),
            radial-gradient(36% 30% at 18% 44%, rgba(${r},${g},${b},0.07) 0%, rgba(${r},${g},${b},0) 72%),
            radial-gradient(40% 34% at 50% 82%, rgba(${r},${g},${b},0.08) 0%, rgba(${r},${g},${b},0) 70%)
          `,
          filter: captureMode ? 'none' : 'blur(44px)',
          opacity: captureMode ? 0.85 : 1,
        }}
      />

      {/* mist */}
      <div
        className="absolute inset-[-8%]"
        style={{
          background: `
            radial-gradient(30% 24% at 30% 28%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%),
            radial-gradient(26% 22% at 68% 30%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 74%),
            radial-gradient(34% 26% at 52% 70%, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 74%)
          `,
          filter: captureMode ? 'none' : 'blur(64px)',
          opacity: captureMode ? 0.7 : 0.9,
        }}
      />

      {/* central star + 변화된 소원이 실루엣 빛 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* 실루엣 — 방향 색이 스며든 잔광 */}
          <div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              background: captureMode
                ? `rgba(${r},${g},${b},0.07)`
                : `radial-gradient(circle, rgba(${r},${g},${b},0.14) 0%, rgba(${r},${g},${b},0.06) 40%, rgba(${r},${g},${b},0) 70%)`,
              filter: captureMode ? 'none' : 'blur(36px)',
              opacity: captureMode ? 0.12 : 1,
            }}
          />
          {/* outer halo — 방향 색 미세 tint */}
          <div
            className="absolute w-44 h-44 rounded-full"
            style={{
              background: captureMode
                ? `rgba(${r},${g},${b},0.10)`
                : `rgba(${r},${g},${b},0.10)`,
              filter: captureMode ? 'none' : 'blur(48px)',
              opacity: captureMode ? 0.18 : 1,
            }}
          />
          {/* inner glow */}
          <div
            className="absolute w-28 h-28 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.10)',
              filter: captureMode ? 'none' : 'blur(32px)',
              opacity: captureMode ? 0.15 : 1,
            }}
          />
          {/* core */}
          <div className="w-4 h-4 rounded-full bg-white" />
        </div>
      </div>

      {/* main message */}
      <div className="absolute inset-x-0 top-[18%] px-8 text-center">
        <p className="text-[22px] leading-relaxed tracking-[-0.01em] text-white">
          {message}
        </p>
      </div>

      {/* growth line */}
      {growthLine ? (
        <div className="absolute inset-x-0 bottom-20 px-8 text-center">
          <p className="text-sm opacity-70 text-white">
            {growthLine}
          </p>
        </div>
      ) : null}

      {/* brand */}
      <div className="absolute inset-x-0 bottom-8 text-center">
        <p className="text-xs tracking-[0.18em] uppercase opacity-45">
          DreamTown
        </p>
        <p className="text-xs opacity-45 mt-1">
          하루하루의 기적
        </p>
      </div>

      {/* subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(8,10,18,0) 0%, rgba(5,7,13,0.18) 58%, rgba(3,4,8,0.42) 100%)',
        }}
      />
    </div>
  );
}
