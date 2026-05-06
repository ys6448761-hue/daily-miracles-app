import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGalaxy } from '../api/dreamtown.js';

const GALAXY_COLOR = {
  challenge:    { accent: 'rgba(255,106,106,0.7)',  bg: 'rgba(255,106,106,0.06)'  },
  growth:       { accent: 'rgba(106,220,168,0.7)',  bg: 'rgba(106,220,168,0.06)'  },
  healing:      { accent: 'rgba(106,168,255,0.7)',  bg: 'rgba(106,168,255,0.06)'  },
  relationship: { accent: 'rgba(255,215,106,0.7)',  bg: 'rgba(255,215,106,0.06)'  },
};

const EMOTION_KO = {
  confusion:    '흔들림',
  pause:        '멈춤',
  calm:         '고요',
  curiosity:    '호기심',
  fragile_hope: '희망',
};

export default function GalaxyPage() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getGalaxy(id)
      .then(d  => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const color = GALAXY_COLOR[id] || GALAXY_COLOR.growth;

  if (loading) return (
    <div style={WRAP}>
      <p style={MUTED}>은하를 불러오는 중...</p>
    </div>
  );

  if (error || !data?.galaxy) return (
    <div style={WRAP}>
      <p style={{ ...MUTED, color: 'rgba(255,106,106,0.6)' }}>
        {error || '은하를 찾을 수 없어요'}
      </p>
    </div>
  );

  const { galaxy, constellations } = data;

  return (
    <div style={WRAP}>
      {/* 뒤로가기 */}
      <button onClick={() => nav(-1)} style={BACK_BTN}>←</button>

      {/* 은하 헤더 */}
      <div style={{
        textAlign: 'center',
        marginBottom: 36,
        padding: '24px 20px',
        borderRadius: 20,
        background: color.bg,
        border: `1px solid ${color.accent.replace('0.7', '0.15')}`,
      }}>
        <p style={{ fontSize: 12, color: color.accent, marginBottom: 6, letterSpacing: '0.08em' }}>
          {galaxy.direction?.toUpperCase() || ''}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
          {galaxy.name}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          {galaxy.description}
        </p>
      </div>

      {/* 별자리 목록 */}
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 14, paddingLeft: 4 }}>
        {constellations.length > 0
          ? `${constellations.length}개의 별자리`
          : '아직 별자리가 없어요'}
      </p>

      {constellations.map(c => (
        <button
          key={c.id}
          onClick={() => nav(`/constellation/${encodeURIComponent(c.id)}`)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${color.accent.replace('0.7', '0.12')}`,
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 10,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>
              {EMOTION_KO[c.start_emotion] || c.start_emotion}
              {' → '}
              {EMOTION_KO[c.end_emotion] || c.end_emotion}
            </p>
            <p style={{ fontSize: 12, color: color.accent, lineHeight: 1.5 }}>
              {c.summary || '이 흐름 속의 별들'}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              {c.star_count}개 별
            </p>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>›</p>
          </div>
        </button>
      ))}

      <div style={{ height: 40 }} />
    </div>
  );
}

const WRAP = {
  minHeight: '100dvh',
  background: 'linear-gradient(180deg, #080618 0%, #0c0a20 100%)',
  padding: '24px 20px 60px',
  maxWidth: 480,
  margin: '0 auto',
  position: 'relative',
};

const MUTED = {
  color: 'rgba(255,255,255,0.3)',
  textAlign: 'center',
  fontSize: 14,
  marginTop: 60,
};

const BACK_BTN = {
  background: 'none',
  border: 'none',
  color: 'rgba(255,255,255,0.4)',
  fontSize: 20,
  cursor: 'pointer',
  padding: '4px 8px',
  marginBottom: 24,
  display: 'block',
};
