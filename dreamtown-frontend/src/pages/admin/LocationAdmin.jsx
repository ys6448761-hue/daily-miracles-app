import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const PLACE_EMOJI = {
  lattoa_cafe:      '☕',
  lattoa:           '☕', // alias
  forestland:       '🌿',
  paransi:          '🌊',
  'yeosu-cablecar': '🚡',
  yeosu_cablecar:   '🚡',
};

export default function LocationAdmin() {
  const { loc }            = useParams();
  const [searchParams]     = useSearchParams();
  const token              = searchParams.get('token') ?? '';

  const [data, setData]    = useState(null);
  const [error, setError]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = token
      ? `/api/admin/dt/location/${encodeURIComponent(loc)}?token=${encodeURIComponent(token)}`
      : `/api/admin/dt/location/${encodeURIComponent(loc)}`;

    fetch(url)
      .then(r => r.json())
      .then(body => {
        if (body.error) setError(body.error);
        else setData(body);
      })
      .catch(() => setError('서버에 연결할 수 없어요.'))
      .finally(() => setLoading(false));
  }, [loc, token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#06060e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#06060e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,100,100,0.8)', fontSize: 15, marginBottom: 8 }}>조회 오류</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{error}</p>
        </div>
      </div>
    );
  }

  const emoji      = PLACE_EMOJI[loc] ?? '✦';
  const today      = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const maxEmotion = data.emotion_top3[0]?.count ?? 1;

  return (
    <div style={{ minHeight: '100vh', background: '#06060e', padding: '32px 20px 48px', maxWidth: 480, margin: '0 auto' }}>

      {/* 헤더 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.55)', marginBottom: 4, letterSpacing: '0.06em' }}>
          별공방 현황
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
          {emoji} {data.place_label}
        </h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>{today} 기준</p>
      </motion.div>

      {/* 핵심 수치 3개 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}
      >
        {[
          { label: '오늘 별 생성',  value: data.today_count,     unit: '개' },
          { label: '누적 별',       value: data.total_count,     unit: '개' },
          { label: '총 공명',       value: data.resonance_total, unit: '회' },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '16px 10px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#FFD76A', lineHeight: 1.1 }}>{value}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{unit} · {label}</p>
          </div>
        ))}
      </motion.div>

      {/* 대표 문장 */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{
          background: 'rgba(255,215,106,0.07)',
          border: '1px solid rgba(255,215,106,0.18)',
          borderRadius: 16, padding: '16px 18px', marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 14, color: 'rgba(255,215,106,0.9)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          ✦ {data.summary_sentence}
        </p>
      </motion.div>

      {/* 감정 TOP 3 */}
      {data.emotion_top3.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '18px 16px', marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, letterSpacing: '0.05em' }}>감정 TOP 3</p>
          {data.emotion_top3.map(({ emotion, count }, i) => (
            <div key={emotion} style={{ marginBottom: i < data.emotion_top3.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                  {['🥇', '🥈', '🥉'][i]} {emotion}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,215,106,0.7)' }}>{count}개</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((count / maxEmotion) * 100)}%` }}
                  transition={{ delay: 0.35 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'rgba(255,215,106,0.6)', borderRadius: 99 }}
                />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* 최근 별 목록 */}
      {data.recent_stars.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '18px 16px',
          }}
        >
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, letterSpacing: '0.05em' }}>최근 탄생 별</p>
          {data.recent_stars.map((star, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: i < data.recent_stars.length - 1 ? 10 : 0,
              marginBottom: i < data.recent_stars.length - 1 ? 10 : 0,
              borderBottom: i < data.recent_stars.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>✦ {star.star_name}</p>
                {star.wish_emotion && (
                  <p style={{ fontSize: 11, color: 'rgba(255,215,106,0.5)' }}>{star.wish_emotion}</p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {new Date(star.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </p>
                {star.resonance_count > 0 && (
                  <p style={{ fontSize: 10, color: 'rgba(255,215,106,0.5)', marginTop: 2 }}>공명 {star.resonance_count}회</p>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* 푸터 */}
      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 32 }}>
        DreamTown 별공방 · powered by Aurora5
      </p>
    </div>
  );
}
