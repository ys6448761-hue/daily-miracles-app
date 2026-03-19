/**
 * PostcardView — 화면용 / 캡처용 분기 (DEC-2026-0319-005)
 *
 * captureMode = false  → blur 있음, 감성 최적화
 * captureMode = true   → blur 제거 + opacity 보정, 렌더 안정화
 *
 * 금지:
 * ❌ 캡처용 UI 따로 만들기
 * ❌ 텍스트 위치 변경
 * 👉 "같아 보이지만 내부만 다르게"
 */
export default function PostcardView({ message, growthLine, captureMode = false }) {
  return (
    <div
      id="dreamtown-postcard"
      data-capture={captureMode ? 'true' : 'false'}
      className="relative w-full max-w-sm aspect-[3/4] rounded-[28px] overflow-hidden bg-[#070b14] shadow-2xl"
    >
      {/* watercolor background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(42% 36% at 50% 22%, rgba(185,205,255,0.12) 0%, rgba(185,205,255,0) 70%),
            radial-gradient(38% 32% at 82% 44%, rgba(185,220,255,0.08) 0%, rgba(185,220,255,0) 72%),
            radial-gradient(38% 32% at 18% 44%, rgba(215,205,255,0.08) 0%, rgba(215,205,255,0) 72%),
            radial-gradient(42% 36% at 50% 82%, rgba(215,235,255,0.09) 0%, rgba(215,235,255,0) 70%)
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
          {/* 실루엣 — 변화된 소원이의 잔광 */}
          <div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              background: captureMode
                ? 'rgba(200,220,255,0.07)'
                : 'radial-gradient(circle, rgba(200,220,255,0.13) 0%, rgba(180,205,255,0.06) 40%, rgba(160,190,255,0) 70%)',
              filter: captureMode ? 'none' : 'blur(36px)',
              opacity: captureMode ? 0.12 : 1,
            }}
          />
          {/* outer halo */}
          <div
            className="absolute w-44 h-44 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.12)',
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
