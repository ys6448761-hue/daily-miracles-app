import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

// ── 감정값 정규화 ─────────────────────────────────────────────────
const EMOTION_KO = {
  calm:       '편안함',
  peaceful:   '편안함',
  relaxed:    '편안함',
  excited:    '설렘',
  excitement: '설렘',
  hopeful:    '기대',
  hope:       '기대',
  clarity:    '정리됨',
  clear:      '정리됨',
  happy:      '행복',
  happiness:  '행복',
  grateful:   '감사',
  gratitude:  '감사',
  energetic:  '활기',
  energy:     '활기',
  sad:        '슬픔',
  sadness:    '슬픔',
  anxious:    '불안',
  anxiety:    '불안',
  joy:        '기쁨',
  love:       '사랑',
  proud:      '뿌듯함',
  longing:    '그리움',
  nostalgia:  '그리움',
};

function normalizeEmotion(val) {
  if (!val || val.trim() === '') return null;
  // U+FFFD 교체 문자 또는 깨진 인코딩 감지
  if (/�/.test(val) || /[\x00-\x08\x0E-\x1F\x7F]/.test(val)) return null;
  const trimmed = val.trim();
  return EMOTION_KO[trimmed.toLowerCase()] ?? trimmed;
}

// ── 보석 라벨 ─────────────────────────────────────────────────────
const GEM_LABEL = {
  ruby:       '루비',
  sapphire:   '사파이어',
  emerald:    '에메랄드',
  diamond:    '다이아몬드',
  amethyst:   '아메시스트',
  pearl:      '진주',
  topaz:      '토파즈',
  opal:       '오팔',
  garnet:     '가넷',
  aquamarine: '아쿠아마린',
};

function gemLabel(val) {
  if (!val) return '미선택';
  return GEM_LABEL[val.toLowerCase()] ?? val;
}

// ── 장소 아이콘 ───────────────────────────────────────────────────
const PLACE_EMOJI = {
  lattoa_cafe:      '☕',
  lattoa:           '☕',
  forestland:       '🌿',
  paransi:          '🌊',
  'yeosu-cablecar': '🚡',
  yeosu_cablecar:   '🚡',
};

// ── 시각 포맷 ─────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtRelative(iso) {
  if (!iso) return '-';
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return '방금';
  if (diff < 60) return `${diff}분 전`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `${h}시간 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────
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

  const emoji = PLACE_EMOJI[loc] ?? '✦';
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  // 감정 TOP3 정규화 — 깨진 값 제거, 영어 → 한국어 변환
  const normalizedEmotions = (data.emotion_top3 ?? [])
    .map(e => ({ ...e, emotion: normalizeEmotion(e.emotion) }))
    .filter(e => e.emotion !== null);

  // 감정 미기록 총 수: 백엔드 제공 + 프론트 깨진값 추가 추산
  const emotionMissingCount = data.emotion_missing ?? 0;

  const maxEmotion = normalizedEmotions[0]?.count ?? 1;

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
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{today} 기준</p>
        <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.5)', marginBottom: 28, lineHeight: 1.6 }}>
          오늘 {data.place_label}에서 탄생한 별과 소원이들의 감정 흐름을 확인합니다.
        </p>
      </motion.div>

      {/* 핵심 수치 — 2행 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ marginBottom: 20 }}
      >
        {/* 1행: 오늘·누적·공명 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          {[
            { label: '오늘 별 생성', value: data.today_count,     unit: '개' },
            { label: '누적 별',      value: data.total_count,     unit: '개' },
            { label: '총 공명',      value: data.resonance_total, unit: '회' },
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
        </div>

        {/* 2행: 공유·감정미기록·최근생성 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            {
              label: '공유 클릭',
              value: data.share_count > 0 ? data.share_count : '-',
              unit:  data.share_count > 0 ? '회' : '',
              dim:   data.share_count === 0,
            },
            {
              label: '감정 미기록',
              value: emotionMissingCount,
              unit:  '건',
              dim:   false,
            },
            {
              label: '최근 생성',
              value: data.last_star_at ? fmtRelative(data.last_star_at) : '-',
              unit:  '',
              dim:   !data.last_star_at,
              small: true,
            },
          ].map(({ label, value, unit, dim, small }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: '12px 8px', textAlign: 'center',
            }}>
              <p style={{ fontSize: small ? 14 : 20, fontWeight: 700, color: dim ? 'rgba(255,255,255,0.25)' : '#FFD76A', lineHeight: 1.2 }}>
                {value}{unit && <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 2 }}>{unit}</span>}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
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

      {/* 감정 TOP3 */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '18px 16px', marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, letterSpacing: '0.05em' }}>감정 TOP 3</p>

        {normalizedEmotions.length > 0 ? (
          <>
            {normalizedEmotions.slice(0, 3).map(({ emotion, count }, i) => (
              <div key={emotion} style={{ marginBottom: i < 2 ? 12 : 0 }}>
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
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>감정 데이터 없음</p>
        )}

        {/* 감정 미기록 — 별도 보조 표시 */}
        {emotionMissingCount > 0 && (
          <div style={{
            marginTop: 14, paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>감정 미기록</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{emotionMissingCount}건</span>
          </div>
        )}
      </motion.div>

      {/* 최근 탄생 별 목록 */}
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
          {data.recent_stars.map((star, i) => {
            const emotion = normalizeEmotion(star.wish_emotion ?? star.emotion);
            return (
              <div key={i} style={{
                paddingBottom: i < data.recent_stars.length - 1 ? 12 : 0,
                marginBottom:  i < data.recent_stars.length - 1 ? 12 : 0,
                borderBottom:  i < data.recent_stars.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                {/* 별 이름 */}
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 6, fontWeight: 600 }}>
                  ✦ {star.star_name}
                </p>
                {/* 메타 그리드 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
                  {[
                    { label: '감정',   value: emotion ?? '미기록', dim: !emotion },
                    { label: '보석',   value: gemLabel(star.gem_type) },
                    { label: '상태',   value: star.status ?? '-' },
                    { label: '생성',   value: fmtTime(star.created_at) },
                  ].map(({ label, value, dim }) => (
                    <div key={label} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{label}:</span>
                      <span style={{ fontSize: 11, color: dim ? 'rgba(255,255,255,0.25)' : 'rgba(255,215,106,0.6)' }}>{value}</span>
                    </div>
                  ))}
                </div>
                {/* 공명 */}
                {star.resonance_count > 0 && (
                  <p style={{ fontSize: 10, color: 'rgba(255,215,106,0.4)', marginTop: 4 }}>공명 {star.resonance_count}회</p>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* 푸터 */}
      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 32 }}>
        DreamTown 별공방 · powered by Aurora5
      </p>
    </div>
  );
}
