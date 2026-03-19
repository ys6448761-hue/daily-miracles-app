/**
 * PostcardView — 화면용 / 캡처용 분기 (DEC-2026-0319-005)
 *
 * captureMode = false  → blur 있음, 감성 최적화
 * captureMode = true   → blur 제거 + opacity 보정, 렌더 안정화
 *
 * 비율: 4:5 (1080×1350 — 카톡/인스타/앨범 저장 최적)
 * 안전 영역: 상하 8~10%, 좌우 7~8% 기준
 *
 * 금지:
 * ❌ 캡처용 UI 따로 만들기
 * ❌ 텍스트 위치 변경
 * 👉 "같아 보이지만 내부만 다르게"
 */

const DIRECTION_THEME = {
  north: { r: 140, g: 185, b: 255, lightPos: '50% 8%'  },
  east:  { r: 245, g: 195, b:  85, lightPos: '88% 44%' },
  west:  { r: 240, g: 140, b: 195, lightPos: '12% 44%' },
  south: { r:  80, g: 210, b: 175, lightPos: '50% 88%' },
};

const NEUTRAL = { r: 185, g: 205, b: 255, lightPos: '50% 22%' };

export default function PostcardView({ direction, message, growthLine, captureMode = false }) {
  const { r, g, b, lightPos } = DIRECTION_THEME[direction] || NEUTRAL;

  return (
    <div
      id="dreamtown-postcard"
      data-capture={captureMode ? 'true' : 'false'}
      className="relative w-full max-w-sm aspect-[4/5] rounded-[28px] overflow-hidden bg-[#070b14] shadow-2xl"
    >
      {/* watercolor background — 0.18로 썸네일 차이 강화 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(44% 38% at ${lightPos}, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0) 70%),
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
          {/* outer halo */}
          <div
            className="absolute w-44 h-44 rounded-full"
            style={{
              background: `rgba(${r},${g},${b},0.10)`,
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

      {/* message backing gradient — 텍스트 가독성 받침 */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: '11%',
          height: '28%',
          background:
            'linear-gradient(to bottom, rgba(4,6,12,0.18) 0%, rgba(4,6,12,0.08) 65%, transparent 100%)',
        }}
      />

      {/* main message — 안전 영역 상단 18%, 최대 2줄 */}
      <div className="absolute inset-x-0 top-[18%] px-8 text-center">
        <p
          className="text-[22px] leading-relaxed tracking-[-0.01em] text-white/90"
          style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}
        >
          {message}
        </p>
      </div>

      {/* growth line — 안전 영역 내 % 기준 배치 */}
      {growthLine ? (
        <div className="absolute inset-x-0 bottom-[22%] px-8 text-center">
          <p
            className="text-sm text-white/70"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
          >
            {growthLine}
          </p>
        </div>
      ) : null}

      {/* brand — 하단 안전 영역 10% 확보 */}
      <div className="absolute inset-x-0 bottom-[10%] text-center">
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
