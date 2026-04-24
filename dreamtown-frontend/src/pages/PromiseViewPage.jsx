/**
 * PromiseViewPage.jsx — 약속 기록 열기
 * 경로: /promise/:id?loc=yeosu-cablecar
 *
 * Phases: loading → opening → open | locked_loc | locked_time | error
 * Lock states: LOCKED_LOCATION | LOCKED_TIME | OPEN
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrCreateUserId } from '../api/dreamtown.js';

const LOCATION_NAMES = {
  'yeosu-cablecar':  '여수 해상 케이블카',
  'yeosu-aqua':      '여수 아쿠아플라넷',
  'yeosu-yacht':     '여수 야경 요트',
  'yeosu-odongdo':   '여수 오동도',
  'yeosu-hyangiram': '향일암',
};

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #05040a 0%, #0c0a18 50%, #070b1a 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '0 20px',
    fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0',
  },
  card: {
    width: '100%', maxWidth: 360,
    background: 'rgba(180,120,255,0.04)',
    border: '1px solid rgba(180,120,255,0.18)',
    borderRadius: 24, padding: '36px 22px', textAlign: 'center',
  },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#A78BFA', display: 'inline-block', margin: '0 4px',
  },
};

// ── 개봉 연출 (보라빛 구슬, 2.5초) ─────────────────────────────────
// 연출 실패 시 fallback: 1초 후 강제 전환
function OpeningScene({ onComplete }) {
  const calledRef = useRef(false);

  useEffect(() => {
    const done = () => {
      if (!calledRef.current) { calledRef.current = true; onComplete(); }
    };
    const normal   = setTimeout(done, 2600);          // 정상 종료
    const fallback = setTimeout(done, 3500);           // 연출 실패 대비 안전망
    return () => { clearTimeout(normal); clearTimeout(fallback); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const D = 2.5;
  const t = s => s / D;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#05040a', zIndex: 9999, overflow: 'hidden',
    }}>
      {/* 배경 글로우 */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(167,139,250,0.4) 0%, rgba(120,80,220,0.1) 40%, transparent 65%)',
        }}
        animate={{ opacity: [0, 0, 0.1, 0.5, 0.7, 0.5, 0] }}
        transition={{ duration: D, times: [0, t(0.3), t(0.7), t(1.3), t(1.9), t(2.2), 1], ease: 'linear' }}
      />
      {/* 구슬 */}
      <motion.div
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 52, height: 52, marginTop: -26, marginLeft: -26,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #e8d8ff 0%, #A78BFA 30%, #7B5CE5 60%, transparent 80%)',
          boxShadow: '0 0 20px 8px rgba(167,139,250,0.8), 0 0 50px 20px rgba(120,80,220,0.4)',
        }}
        animate={{
          scale:   [0, 0, 0.05, 0.2, 0.6, 1.2, 4, 18],
          opacity: [0, 0, 0.7, 0.9, 1,   1,   1,  0],
        }}
        transition={{
          duration: D,
          times: [0, t(0.3), t(0.9), t(1.4), t(1.8), t(2.1), t(2.4), 1],
          ease: [0.2, 0.0, 0.9, 1.0],
        }}
      />
      {/* 플래시 */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(230,210,255,0.95) 0%, rgba(167,139,250,0.4) 50%, transparent 80%)',
        }}
        animate={{ opacity: [0, 0, 0, 0.7, 0] }}
        transition={{ duration: D, times: [0, t(2.0), t(2.2), t(2.35), 1], ease: 'linear' }}
      />
    </div>
  );
}

// ── 로딩 ─────────────────────────────────────────────────────────────
function LoadingView() {
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
        <div style={{ fontSize: 14, color: '#6A6090' }}>기록을 찾는 중...</div>
      </motion.div>
    </div>
  );
}

// QR 직접 진입 시 history 없음 → nav(-1) 무시됨. 명시적 경로 fallback
function goBack(nav) {
  if (window.history.length > 1) nav(-1);
  else nav('/home');
}

// ── LOCKED_LOCATION ───────────────────────────────────────────────────
function LockedLocationView({ locationId, createdAt, distanceM }) {
  const nav          = useNavigate();
  const locationName = LOCATION_NAMES[locationId] || locationId;
  const date         = new Date(createdAt).toLocaleDateString('ko-KR',
    { year: 'numeric', month: 'long', day: 'numeric' });
  const awayStr = distanceM != null
    ? (distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)}km` : `${distanceM}m`)
    : null;

  return (
    <div style={S.page}>
      <motion.div style={S.card}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)',
          border: '1.5px solid rgba(167,139,250,0.3)',
          margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>🔒</div>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#4A3A70', letterSpacing: '0.1em', marginBottom: 10 }}>
          약속 기록
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 10 }}>
          이곳에서만<br />열립니다
        </div>
        <div style={{ fontSize: 13, color: '#6A6090', lineHeight: 1.7, marginBottom: 20 }}>
          이 기록은 <strong style={{ color: '#A78BFA' }}>{locationName}</strong>에서<br />
          봉인된 약속이에요.<br />그 자리로 돌아가면 열립니다.
          {awayStr && (
            <><br />현재 위치에서 약 <strong style={{ color: '#A78BFA' }}>{awayStr}</strong> 떨어져 있어요.</>
          )}
        </div>
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(167,139,250,0.05)',
          border: '1px solid rgba(167,139,250,0.1)',
          fontSize: 12, color: '#4A3A70', marginBottom: 20,
        }}>📅 {date}에 이곳에서 봉인됨</div>
        <button onClick={() => goBack(nav)} style={{
          position: 'relative', zIndex: 10,
          background: 'none', border: '1px solid rgba(255,255,255,0.08)',
          color: '#6A6090', fontSize: 13, borderRadius: 12,
          padding: '14px 0', width: '100%', cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>돌아가기</button>
      </motion.div>
    </div>
  );
}

// ── LOCKED_TIME ───────────────────────────────────────────────────────
function LockedTimeView({ daysLeft, openAt, locationId, createdAt }) {
  const nav          = useNavigate();
  const locationName = LOCATION_NAMES[locationId] || locationId;
  const openDate     = new Date(openAt).toLocaleDateString('ko-KR',
    { year: 'numeric', month: 'long', day: 'numeric' });
  const createDate   = new Date(createdAt).toLocaleDateString('ko-KR',
    { year: 'numeric', month: 'long', day: 'numeric' });

  const total = 90;
  const pct   = Math.max(0, Math.min(100, Math.round(((total - daysLeft) / total) * 100)));

  return (
    <div style={S.page}>
      <motion.div style={S.card}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <motion.div
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)',
            border: '1.5px solid rgba(167,139,250,0.3)',
            margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            pointerEvents: 'none', // 글로우가 하위 버튼 터치 차단 방지
          }}
          animate={{ boxShadow: [
            '0 0 12px 4px rgba(167,139,250,0.2)',
            '0 0 22px 8px rgba(167,139,250,0.38)',
            '0 0 12px 4px rgba(167,139,250,0.2)',
          ]}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >⏳</motion.div>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#4A3A70', letterSpacing: '0.1em', marginBottom: 10 }}>
          약속 기록
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 10 }}>
          아직 열릴 때가<br />아니에요
        </div>
        <div style={{ fontSize: 13, color: '#6A6090', lineHeight: 1.7, marginBottom: 8 }}>
          <strong style={{ color: '#A78BFA', fontSize: 30, fontWeight: 900, display: 'block', marginBottom: 4 }}>
            {daysLeft}일
          </strong>
          후에 열립니다.
        </div>
        <div style={{ fontSize: 12, color: 'rgba(167,139,250,0.38)', lineHeight: 1.7, marginBottom: 16 }}>
          이 마음은, 시간이 지나며 더 또렷해질 거예요.
        </div>

        {/* 진행 바 */}
        <div style={{
          height: 6, borderRadius: 3,
          background: 'rgba(167,139,250,0.1)', marginBottom: 6, overflow: 'hidden',
        }}>
          <motion.div style={{
            height: '100%', borderRadius: 3,
            background: 'linear-gradient(90deg, #7B5CE5, #A78BFA)',
          }}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div style={{ fontSize: 11, color: '#4A3A70', marginBottom: 20, textAlign: 'right' }}>
          {pct}% 흘렀어요
        </div>

        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(167,139,250,0.05)',
          border: '1px solid rgba(167,139,250,0.1)',
          fontSize: 12, color: '#4A3A70', marginBottom: 20, lineHeight: 1.8,
        }}>
          📅 {createDate} {locationName}에서 봉인<br />
          🔓 {openDate} 개봉 예정
        </div>
        <button onClick={() => goBack(nav)} style={{
          position: 'relative', zIndex: 10,
          background: 'none', border: '1px solid rgba(255,255,255,0.08)',
          color: '#6A6090', fontSize: 13, borderRadius: 12,
          padding: '14px 0', width: '100%', cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>돌아가기</button>
      </motion.div>
    </div>
  );
}

// ── OPEN ─────────────────────────────────────────────────────────────
function OpenView({ data }) {
  const { emotion_text, message_to_future, photo_url, location_id, created_at, is_first_open, aurora_comment } = data;
  const locationName = LOCATION_NAMES[location_id] || location_id;
  const createDate   = new Date(created_at).toLocaleDateString('ko-KR',
    { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ ...S.page, justifyContent: 'flex-start', paddingTop: 48, paddingBottom: 60 }}>
      <motion.div
        style={{ width: '100%', maxWidth: 360 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
      >
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'radial-gradient(circle, #A78BFA 0%, rgba(167,139,250,0.25) 60%, transparent 100%)',
              margin: '0 auto 16px',
            }}
            animate={{ boxShadow: [
              '0 0 20px 8px rgba(167,139,250,0.4)',
              '0 0 36px 14px rgba(167,139,250,0.6)',
              '0 0 20px 8px rgba(167,139,250,0.4)',
            ]}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {is_first_open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA', marginBottom: 8 }}
            >
              ✦ 처음 열렸어요
            </motion.div>
          )}
          <div style={{ fontSize: 11, color: '#4A3A70', marginBottom: 4 }}>📍 {locationName}</div>
          <div style={{ fontSize: 11, color: '#3A2F60' }}>{createDate}에 봉인된 약속</div>
        </div>

        {/* 사진 */}
        {photo_url && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}
          >
            <img src={photo_url} alt="봉인 사진"
              style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
          </motion.div>
        )}

        {/* 다짐 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{
            padding: '20px 18px', borderRadius: 18,
            background: 'rgba(167,139,250,0.05)',
            border: '1px solid rgba(167,139,250,0.15)',
            fontSize: 15, color: '#E8E4F0', lineHeight: 1.85,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            marginBottom: message_to_future ? 14 : 20,
          }}
        >{emotion_text}</motion.div>

        {/* 미래 메시지 */}
        {message_to_future && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{
              padding: '16px 18px', borderRadius: 18,
              background: 'rgba(167,139,250,0.03)',
              border: '1px dashed rgba(167,139,250,0.2)',
              fontSize: 13, color: '#9B7FE0', lineHeight: 1.8,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4A3A70', marginBottom: 8, letterSpacing: '0.1em' }}>
              미래의 나에게
            </div>
            {message_to_future}
          </motion.div>
        )}

        {/* Aurora5 코멘트 */}
        {aurora_comment && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            style={{
              padding: '14px 18px', borderRadius: 16, marginBottom: 20,
              background: 'rgba(167,139,250,0.05)',
              border: '1px solid rgba(167,139,250,0.18)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.5)', marginBottom: 6, letterSpacing: '0.06em' }}>
              ✨ Aurora5
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {aurora_comment}
            </div>
          </motion.div>
        )}
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
        <button onClick={() => goBack(nav)} style={{
          position: 'relative', zIndex: 10,
          background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
          color: '#9B7FE0', fontSize: 13, borderRadius: 12,
          padding: '14px 0', width: '100%', cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>돌아가기</button>
      </motion.div>
    </div>
  );
}

// GPS 취득 (best-effort — 거부해도 계속 진행, 서버가 문자열 fallback 처리)
function tryGetGps() {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      ()           => resolve(null),
      { timeout: 6000, maximumAge: 30000 }
    );
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── 메인 ─────────────────────────────────────────────────────────────
export default function PromiseViewPage() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [phase,  setPhase]  = useState('loading');
  const [data,   setData]   = useState(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    // id가 UUID 형식이 아니면 create 페이지로 리다이렉트
    if (!id || !UUID_RE.test(id)) {
      nav('/promise/create', { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const userId = getOrCreateUserId();
        const params = new URLSearchParams(window.location.search);
        const currentLoc = params.get('loc') || '';

        // ① GPS 취득 (서버 GPS 검증을 위해 — 조작 방지 1순위)
        const gps = await tryGetGps();
        if (cancelled) return;

        const r = await fetch(`/api/promise/${id}/open`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            user_id:     userId,
            location_id: currentLoc || undefined,
            lat:         gps?.lat ?? null,  // 서버가 haversine 거리 계산
            lng:         gps?.lng ?? null,
          }),
        });
        const d = await r.json();

        if (cancelled) return;

        if (!r.ok || !d.success) {
          setErrMsg(d.error || '기록을 찾을 수 없어요');
          setPhase('error');
          return;
        }

        setData(d);
        if      (d.lock_state === 'LOCKED_LOCATION') setPhase('locked_loc');
        else if (d.lock_state === 'LOCKED_TIME')     setPhase('locked_time');
        else                                          setPhase('opening');   // → 연출 → open
      } catch (e) {
        if (!cancelled) { setErrMsg(e.message); setPhase('error'); }
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  if (phase === 'loading')    return <LoadingView />;
  if (phase === 'opening')    return <OpeningScene onComplete={() => setPhase('open')} />;
  if (phase === 'locked_loc') return (
    <LockedLocationView
      locationId={data?.location_id}
      createdAt={data?.created_at}
      distanceM={data?.distance_m ?? null}
    />
  );
  if (phase === 'locked_time') return (
    <LockedTimeView
      daysLeft={data?.days_left ?? 90}
      openAt={data?.open_at}
      locationId={data?.location_id}
      createdAt={data?.created_at}
    />
  );
  if (phase === 'open') return <OpenView data={data} />;
  return <ErrorView message={errMsg || '알 수 없는 오류입니다'} />;
}
