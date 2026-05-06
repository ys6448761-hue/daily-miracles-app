import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConstellation } from '../api/dreamtown.js';

const EMOTION_KO = {
  confusion:    '흔들림',
  pause:        '멈춤',
  calm:         '고요',
  curiosity:    '호기심',
  fragile_hope: '희망',
};

export default function ConstellationPage() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getConstellation(id)
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={WRAP}>
      <p style={MUTED}>별자리를 불러오는 중...</p>
    </div>
  );

  if (error || !data?.constellation) return (
    <div style={WRAP}>
      <p style={{ ...MUTED, color: 'rgba(255,106,106,0.6)' }}>
        {error || '별자리를 찾을 수 없어요'}
      </p>
    </div>
  );

  const { constellation, stars } = data;
  const startKo = EMOTION_KO[constellation.start_emotion] || constellation.start_emotion;
  const endKo   = EMOTION_KO[constellation.end_emotion]   || constellation.end_emotion;

  return (
    <div style={WRAP}>
      {/* 뒤로가기 */}
      <button onClick={() => nav(-1)} style={BACK_BTN}>←</button>

      {/* 별자리 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,215,106,0.5)', marginBottom: 8 }}>
          {startKo} → {endKo}
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
          {constellation.summary || '같은 흐름 속의 별들'}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          {stars.length}개의 별이 이 흐름 안에 있어요
        </p>
      </div>

      {/* 별 카드 목록 */}
      {stars.length === 0 && (
        <p style={{ ...MUTED, marginTop: 40 }}>아직 이 별자리에 별이 없어요</p>
      )}

      {stars.map(star => (
        <div key={star.id} style={CARD}>
          {star.image_url && (
            <img
              src={star.image_url}
              alt=""
              style={{
                width: 72, height: 72,
                borderRadius: 12,
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {star.public_message ? (
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, fontStyle: 'italic' }}>
                "{star.public_message}"
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
                ✦ {EMOTION_KO[star.emotion] || '이 마음'}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* 하단 여백 */}
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

const CARD = {
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  padding: '14px 16px',
  marginBottom: 12,
};
