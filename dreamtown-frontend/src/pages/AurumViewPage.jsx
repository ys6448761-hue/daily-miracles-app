/**
 * AurumViewPage.jsx — 아우룸 기록 열기
 * 경로: /aurum/:id
 *
 * Phase:
 *   checking    → GPS 확인 + API 호출
 *   locked      → 다른 위치 ("이곳에서만 열립니다")
 *   opening     → AurumOpenScene 3초 연출
 *   open        → 기록 표시
 *   error       → 오류
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AurumOpenScene from '../components/AurumOpenScene.jsx';

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #05040a 0%, #0f0c1a 50%, #0a0e1f 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 24px',
    fontFamily: "'Noto Sans KR', sans-serif",
    color: '#E8E4F0',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    background: 'rgba(255,215,106,0.05)',
    border: '1px solid rgba(255,215,106,0.18)',
    borderRadius: 24,
    padding: '36px 22px',
    textAlign: 'center',
  },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#FFD76A', display: 'inline-block', margin: '0 4px',
  },
};

// GPS 취득 (1회)
function getGps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('geolocation_unsupported')); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => reject(new Error('permission_denied')),
      { timeout: 10000, maximumAge: 30000 }
    );
  });
}

// ── 확인 중 ──────────────────────────────────────────────────────────
function CheckingView() {
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ marginBottom: 20 }}>
          {[0, 1, 2].map(i => (
            <motion.span key={i} style={S.dot}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        <div style={{ fontSize: 14, color: '#B8A84A' }}>위치를 확인하는 중...</div>
      </motion.div>
    </div>
  );
}

// ── 잠김 ─────────────────────────────────────────────────────────────
function LockedView({ distanceM, radiusM, placeName }) {
  const nav = useNavigate();
  const awayKm = distanceM >= 1000
    ? `${(distanceM / 1000).toFixed(1)}km`
    : `${distanceM}m`;

  return (
    <div style={S.page}>
      <motion.div
        style={S.card}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* 잠긴 구슬 */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,106,0.25) 0%, rgba(255,215,106,0.05) 70%, transparent 100%)',
          border: '1.5px solid rgba(255,215,106,0.3)',
          margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          🔒
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#6A5A20', letterSpacing: '0.1em', marginBottom: 10 }}>
          아우룸
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 10 }}>
          이곳에서만<br />열립니다
        </div>
        <div style={{ fontSize: 13, color: '#7A6E9C', lineHeight: 1.7, marginBottom: 20 }}>
          {placeName
            ? `이 기록은 "${placeName}"에서만 열려요.`
            : '이 기록은 만들어진 자리에서만 열려요.'}
          <br />
          현재 위치에서 약 <strong style={{ color: '#FFD76A' }}>{awayKm}</strong> 떨어져 있어요.
        </div>

        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(255,215,106,0.05)',
          border: '1px solid rgba(255,215,106,0.1)',
          fontSize: 12,
          color: '#6A5A20',
          marginBottom: 20,
        }}>
          기록을 만든 자리로 돌아가면 열립니다
        </div>

        <button
          onClick={() => nav(-1)}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            color: '#7A6E9C', fontSize: 13, borderRadius: 12,
            padding: '10px 0', width: '100%', cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          돌아가기
        </button>
      </motion.div>
    </div>
  );
}

// ── 열림 (기록 표시) ─────────────────────────────────────────────────
function OpenView({ content, createdAt, placeName, firstOpenedAt }) {
  const date   = new Date(createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const isFirst = !firstOpenedAt;

  return (
    <div style={S.page}>
      <motion.div
        style={{ ...S.card, paddingTop: 40 }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* 금빛 글로우 */}
        <motion.div
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'radial-gradient(circle, #FFD76A 0%, rgba(255,215,106,0.3) 60%, transparent 100%)',
            margin: '0 auto 20px',
          }}
          animate={{ boxShadow: [
            '0 0 18px 7px rgba(255,215,106,0.5)',
            '0 0 30px 12px rgba(255,215,106,0.7)',
            '0 0 18px 7px rgba(255,215,106,0.5)',
          ]}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {isFirst && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: 11, fontWeight: 700, color: '#FFD76A', letterSpacing: '0.1em', marginBottom: 8 }}
          >
            ✦ 처음 열렸어요
          </motion.div>
        )}

        <div style={{ fontSize: 11, color: '#6A5A20', marginBottom: 16 }}>
          {placeName ? `📍 ${placeName}` : '📍 이 자리에서 만들어진 기록'}
        </div>

        {/* 기록 내용 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            padding: '18px 16px',
            borderRadius: 14,
            background: 'rgba(255,215,106,0.06)',
            border: '1px solid rgba(255,215,106,0.15)',
            fontSize: 15,
            color: '#E8E4F0',
            lineHeight: 1.8,
            textAlign: 'left',
            marginBottom: 20,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content}
        </motion.div>

        <div style={{ fontSize: 11, color: '#4A4260' }}>{date}</div>
      </motion.div>
    </div>
  );
}

// ── 에러 ─────────────────────────────────────────────────────────────
function ErrorView({ message }) {
  const nav = useNavigate();
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>열 수 없어요</div>
        <div style={{ fontSize: 13, color: '#f87171', marginBottom: 20, lineHeight: 1.5 }}>{message}</div>
        <button
          onClick={() => nav(-1)}
          style={{
            background: 'rgba(255,215,106,0.08)', border: '1px solid rgba(255,215,106,0.2)',
            color: '#B8A84A', fontSize: 13, borderRadius: 12,
            padding: '11px 0', width: '100%', cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          돌아가기
        </button>
      </motion.div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────
export default function AurumViewPage() {
  const { id } = useParams();
  const [phase,  setPhase]  = useState('checking');
  const [data,   setData]   = useState(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1. GPS 취득
        let gps;
        try {
          gps = await getGps();
        } catch {
          // GPS 실패 시 위치 없이 시도 (서버가 can_open: false 반환)
          gps = { lat: 0, lng: 0 };
        }

        if (cancelled) return;

        // 2. 열기 시도
        const r = await fetch(`/api/aurum/record/${id}/open`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ lat: gps.lat, lng: gps.lng }),
        });
        const d = await r.json();

        if (cancelled) return;

        if (!r.ok) {
          setErrMsg(d.error || '기록을 찾을 수 없습니다.');
          setPhase('error');
          return;
        }

        setData(d);

        if (d.can_open) {
          setPhase('opening'); // → AurumOpenScene
        } else {
          setPhase('locked');
        }
      } catch (e) {
        if (!cancelled) {
          setErrMsg(e.message);
          setPhase('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  if (phase === 'checking') return <CheckingView />;
  if (phase === 'opening')  return <AurumOpenScene onComplete={() => setPhase('open')} />;
  if (phase === 'locked')   return (
    <LockedView
      distanceM={data?.distance_m ?? 0}
      radiusM={data?.radius_m ?? 200}
      placeName={data?.place_name ?? null}
    />
  );
  if (phase === 'open')     return (
    <OpenView
      content={data?.content ?? ''}
      createdAt={data?.created_at}
      placeName={data?.place_name}
      firstOpenedAt={data?.first_opened_at}
    />
  );
  return <ErrorView message={errMsg || '알 수 없는 오류입니다'} />;
}
