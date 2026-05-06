import { useNavigate } from 'react-router-dom';

const DIRECTIONS = [
  { id: 'challenge',    name: '도전 은하', dir: '북', emoji: '⬆', pos: { top: '8%',  left: '50%',  transform: 'translateX(-50%)' } },
  { id: 'growth',       name: '성장 은하', dir: '동', emoji: '➡', pos: { top: '50%', right: '8%',  transform: 'translateY(-50%)' } },
  { id: 'healing',      name: '치유 은하', dir: '남', emoji: '⬇', pos: { bottom: '8%', left: '50%', transform: 'translateX(-50%)' } },
  { id: 'relationship', name: '관계 은하', dir: '서', emoji: '⬅', pos: { top: '50%', left: '8%',  transform: 'translateY(-50%)' } },
];

const DIR_COLOR = {
  challenge:    { glow: 'rgba(255,106,106,0.35)', border: 'rgba(255,106,106,0.25)' },
  growth:       { glow: 'rgba(106,220,168,0.35)', border: 'rgba(106,220,168,0.25)' },
  healing:      { glow: 'rgba(106,168,255,0.35)', border: 'rgba(106,168,255,0.25)' },
  relationship: { glow: 'rgba(255,215,106,0.35)', border: 'rgba(255,215,106,0.25)' },
};

export default function DreamTownMapPage() {
  const nav = useNavigate();

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at center, #0e0b28 0%, #060414 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <h1 style={{
        fontSize: 17,
        fontWeight: 600,
        color: 'rgba(255,215,106,0.8)',
        marginBottom: 6,
        letterSpacing: '0.06em',
      }}>
        🌌 DreamTown
      </h1>
      <p style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.25)',
        marginBottom: 48,
      }}>
        감정의 방향을 따라가세요
      </p>

      {/* 지도 영역 */}
      <div style={{
        position: 'relative',
        width: 300,
        height: 300,
      }}>
        {/* 중심 별 */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,106,0.25) 0%, transparent 70%)',
          border: '1px solid rgba(255,215,106,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}>
          ✦
        </div>

        {/* 방향선 */}
        {['0deg', '90deg', '180deg', '270deg'].map(deg => (
          <div key={deg} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 1, height: '42%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)',
            transformOrigin: 'top center',
            transform: `rotate(${deg}) translateX(-50%)`,
          }} />
        ))}

        {/* 4방향 버튼 */}
        {DIRECTIONS.map(({ id, name, dir, pos }) => {
          const color = DIR_COLOR[id];
          return (
            <button
              key={id}
              onClick={() => nav(`/galaxy/${id}`)}
              style={{
                position: 'absolute',
                ...pos,
                background: 'rgba(12, 10, 30, 0.9)',
                border: `1px solid ${color.border}`,
                borderRadius: 14,
                padding: '12px 16px',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: `0 0 20px ${color.glow}`,
                minWidth: 80,
                transition: 'box-shadow 0.3s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 32px ${color.glow}`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 20px ${color.glow}`}
            >
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{dir}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{name}</p>
            </button>
          );
        })}
      </div>

      <p style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.18)',
        marginTop: 48,
        textAlign: 'center',
      }}>
        나는 지금 어디로 가고 있을까요
      </p>
    </div>
  );
}
