/**
 * InviteHero.jsx
 * ?entry=invite 진입 시 표시되는 초대장 히어로 화면
 *
 * CTA:
 *  onWish()        — 소원 시작 → /intro 이동
 *  onSeeDreamtown() — 별 보기 → 기존 DreamTown 렌더로 전환
 */

export default function InviteHero({ onWish, onSeeDreamtown }) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: '#0D1B2A' }}
    >
      {/* 별빛 장식 */}
      <div className="mb-10 flex flex-col items-center">
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#FFD76A',
            boxShadow: '0 0 28px 8px rgba(255,215,106,0.35)',
            marginBottom: 28,
          }}
        />
        <p
          style={{
            fontSize: 11,
            color: 'rgba(255,215,106,0.6)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          DreamTown Invitation
        </p>
        <h1
          className="text-center font-bold text-white"
          style={{ fontSize: 22, lineHeight: 1.45, marginBottom: 14 }}
        >
          드림타운에<br />초대받았어요
        </h1>
        <p
          className="text-center"
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.7,
            maxWidth: 260,
          }}
        >
          소원이 별이 되는 곳이에요.<br />
          직접 별을 만들거나,<br />
          먼저 빛나는 별들을 구경해보세요.
        </p>
      </div>

      {/* CTA 버튼 */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        {/* 1. 소원 시작 (primary) */}
        <button
          onClick={onWish}
          className="w-full rounded-full py-4 text-sm font-semibold text-night-sky"
          style={{
            background: '#FFD76A',
            boxShadow: '0 0 18px 4px rgba(255,215,106,0.25)',
          }}
        >
          ✨ 소원 시작하기
        </button>

        {/* 2. 별 보기 (secondary) */}
        <button
          onClick={onSeeDreamtown}
          className="w-full rounded-full py-4 text-sm font-medium"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          별 구경하러 가기
        </button>
      </div>
    </main>
  );
}
