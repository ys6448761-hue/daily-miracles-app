/**
 * AurumCreatePage.jsx — 아우룸 기록 생성
 * 경로: /aurum/create
 *
 * GPS 캡처 → 내용 입력 → 저장 → 확인 ("이 기록은 이곳에서 다시 열립니다")
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrCreateUserId } from '../api/dreamtown.js';
import { readSavedStar } from '../lib/utils/starSession.js';

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #05040a 0%, #0f0c1a 50%, #0a0e1f 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 24px 48px',
    fontFamily: "'Noto Sans KR', sans-serif",
    color: '#E8E4F0',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    background: 'rgba(255,215,106,0.05)',
    border: '1px solid rgba(255,215,106,0.18)',
    borderRadius: 24,
    padding: '32px 22px',
  },
  gpsOk: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 20,
    background: 'rgba(255,215,106,0.1)',
    border: '1px solid rgba(255,215,106,0.3)',
    fontSize: 12,
    color: '#FFD76A',
    fontWeight: 600,
  },
  gpsFail: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 20,
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.3)',
    fontSize: 12,
    color: '#f87171',
    fontWeight: 600,
  },
  label: { fontSize: 11, fontWeight: 700, color: '#B8A84A', letterSpacing: '0.08em', marginBottom: 8 },
  headline: { fontSize: 20, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 6 },
  sub: { fontSize: 13, color: '#7A6E9C', lineHeight: 1.65, marginBottom: 24 },
  textarea: {
    width: '100%',
    padding: '14px',
    borderRadius: 14,
    border: '1px solid rgba(255,215,106,0.2)',
    background: 'rgba(255,255,255,0.03)',
    color: '#E8E4F0',
    fontSize: 14,
    lineHeight: 1.7,
    resize: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Noto Sans KR', sans-serif",
    marginBottom: 4,
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '15px 0',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #d4a000, #FFD76A)',
    color: '#1a1200',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: 12,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  btnDisabled: {
    background: 'rgba(255,215,106,0.15)',
    color: '#5a5030',
    cursor: 'default',
  },
};

// GPS 취득
function useGps() {
  const [gps,     setGps]     = useState(null);  // { lat, lng }
  const [gpsErr,  setGpsErr]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsErr('이 기기에서 위치 정보를 사용할 수 없어요');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGps({ lat: coords.latitude, lng: coords.longitude });
        setLoading(false);
      },
      (e) => {
        setGpsErr('위치 접근이 거부됐어요. 브라우저 설정에서 허용해주세요.');
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { gps, gpsErr, gpsLoading: loading };
}

// ── 생성 완료 화면 ──────────────────────────────────────────────────
function CreatedView({ id }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/aurum/${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div style={S.page}>
      <motion.div
        style={{ ...S.card, textAlign: 'center', marginTop: 64 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 금빛 글로우 */}
        <motion.div
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'radial-gradient(circle, #FFD76A 0%, rgba(255,215,106,0.3) 60%, transparent 100%)',
            margin: '0 auto 20px',
          }}
          animate={{ boxShadow: [
            '0 0 20px 8px rgba(255,215,106,0.5)',
            '0 0 36px 14px rgba(255,215,106,0.7)',
            '0 0 20px 8px rgba(255,215,106,0.5)',
          ]}}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div style={{ fontSize: 11, fontWeight: 700, color: '#B8A84A', letterSpacing: '0.1em', marginBottom: 10 }}>
          아우룸 생성 완료
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 10 }}>
          이 기록은 이곳에서<br />다시 열립니다
        </div>
        <div style={{ fontSize: 13, color: '#7A6E9C', lineHeight: 1.65, marginBottom: 24 }}>
          이 자리에서 다시 이 링크를 열면<br />
          기록이 모습을 드러냅니다.
        </div>

        {/* URL 박스 */}
        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(255,215,106,0.07)',
          border: '1px solid rgba(255,215,106,0.15)',
          fontSize: 11,
          color: '#B8A84A',
          wordBreak: 'break-all',
          marginBottom: 14,
          textAlign: 'left',
        }}>
          {url}
        </div>

        <button onClick={handleCopy} style={{ ...S.btn, fontSize: 14, padding: '13px 0', marginTop: 0 }}>
          {copied ? '링크 복사됨 ✓' : '링크 복사하기'}
        </button>
      </motion.div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────
export default function AurumCreatePage() {
  const nav    = useNavigate();
  const { gps, gpsErr, gpsLoading } = useGps();

  const [text,    setText]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [created, setCreated] = useState(null); // id after creation

  if (created) return <CreatedView id={created} />;

  const canSubmit = !!gps && !!text.trim() && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');

    try {
      const userId  = getOrCreateUserId();
      const starId  = readSavedStar();
      const r = await fetch('/api/aurum/record', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          user_id:  userId,
          star_id:  starId || null,
          content:  text.trim(),
          lat:      gps.lat,
          lng:      gps.lng,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || '저장 실패');
      setCreated(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <motion.div
        style={{ width: '100%', maxWidth: 360, paddingTop: 52 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* GPS 상태 */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          {gpsLoading && (
            <span style={S.gpsOk}>⏳ 위치 확인 중...</span>
          )}
          {!gpsLoading && gps && (
            <span style={S.gpsOk}>📍 위치 확인됨</span>
          )}
          {!gpsLoading && gpsErr && (
            <span style={S.gpsFail}>⚠️ {gpsErr}</span>
          )}
        </div>

        <div style={S.card}>
          <div style={S.label}>아우룸</div>
          <div style={S.headline}>이 자리에<br />기록을 새깁니다</div>
          <div style={S.sub}>
            이 기록은 만든 자리에서만 다시 열립니다.<br />
            다른 곳에서는 잠겨 있어요.
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="지금 이 자리에서 남기고 싶은 것을 적어주세요"
              maxLength={300}
              rows={5}
              style={S.textarea}
              autoFocus
            />
            <div style={{ fontSize: 11, color: '#4A4260', textAlign: 'right', marginBottom: 4 }}>
              {text.length}/300
            </div>

            {error && (
              <div style={{ fontSize: 13, color: '#f87171', marginBottom: 8 }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{ ...S.btn, ...(canSubmit ? {} : S.btnDisabled) }}
            >
              {loading ? '저장 중...' : '지금 이 자리에 새기기 ✦'}
            </button>
          </form>
        </div>

        <button
          onClick={() => nav(-1)}
          style={{
            background: 'none', border: 'none', color: '#4A4260',
            fontSize: 12, cursor: 'pointer', marginTop: 20,
            fontFamily: "'Noto Sans KR', sans-serif",
            display: 'block', width: '100%', textAlign: 'center',
          }}
        >
          ← 뒤로
        </button>
      </motion.div>
    </div>
  );
}
