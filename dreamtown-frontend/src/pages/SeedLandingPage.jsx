/**
 * SeedLandingPage.jsx — Seed 공유 진입점
 * 경로: /seed/:id?ref=XXXXXXXX
 *
 * 책임:
 *   - 비로그인 외부 사용자가 카카오/링크로 진입하는 첫 화면
 *   - Seed 메타(이미지, 타이틀, location) 표시
 *   - "나도 만들기" → /entry?loc={location}&ref={ref_code} 로 이동 (ref_code 보존)
 *   - view / click 이벤트 기록
 *
 * 자동복귀 금지 — share-policy SSOT 원칙 준수
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const LOC_BRAND = {
  cablecar: 'Daily Miracles · 여수 케이블카',
  hamel:    'Daily Miracles · 하멜 등대마을',
};

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #000005 0%, #0D1228 50%, #0A1E3A 100%)',
    color: '#E8E4F0',
    fontFamily: "'Noto Sans KR', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px 40px',
  },
  brand: {
    paddingTop: 28,
    fontSize: 11,
    letterSpacing: '0.13em',
    color: 'rgba(255,255,255,0.32)',
    textTransform: 'uppercase',
  },
  imgWrap: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: '1 / 1',
    margin: '32px auto 28px',
    borderRadius: 18,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 0 32px rgba(155,135,245,0.2)',
    background: 'rgba(255,255,255,0.04)',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  title: {
    width: '100%', maxWidth: 360,
    fontSize: 22, fontWeight: 800, lineHeight: 1.45,
    color: '#fff', textAlign: 'center', marginBottom: 14, letterSpacing: '-0.02em',
  },
  sub: {
    width: '100%', maxWidth: 360,
    fontSize: 13.5, color: '#9B8FC4',
    lineHeight: 1.75, textAlign: 'center', marginBottom: 30,
  },
  cta: {
    width: '100%', maxWidth: 360,
    padding: '17px 0', borderRadius: 16, border: 'none',
    background: 'linear-gradient(135deg, #9B87F5 0%, #6B4FD8 100%)',
    color: '#fff', fontSize: 16, fontWeight: 800,
    cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
    boxShadow: '0 4px 20px rgba(155,135,245,0.4)',
  },
  err: {
    paddingTop: 120,
    fontSize: 14, color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', lineHeight: 1.7,
  },
  refBadge: {
    fontSize: 11, color: 'rgba(155,135,245,0.45)',
    marginTop: 18, letterSpacing: '0.05em',
  },
};

export default function SeedLandingPage() {
  const { id }            = useParams();
  const [params]          = useSearchParams();
  const navigate          = useNavigate();
  const refFromUrl        = params.get('ref') || null;

  const [seed,    setSeed]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // 진입 시 메타 조회 + view 이벤트 기록
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/seeds/${encodeURIComponent(id)}`);
        const d = await r.json();
        if (cancelled) return;
        if (!d.success) {
          setError(d.error || '이 별의 이야기를 찾지 못했어요.');
          setLoading(false);
          return;
        }
        setSeed(d.seed);
        setLoading(false);
        // view 이벤트 — 비동기, 실패해도 무시
        fetch(`/api/seeds/${encodeURIComponent(id)}/event`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ type: 'view', ref_code: refFromUrl }),
        }).catch(() => {});
      } catch (e) {
        if (!cancelled) {
          setError('네트워크 오류 — 잠시 후 다시 시도해주세요.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id, refFromUrl]);

  function handleStart() {
    if (!seed) return;
    // click 이벤트 기록 (실패해도 진행)
    fetch(`/api/seeds/${encodeURIComponent(id)}/event`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type: 'click', ref_code: refFromUrl || seed.ref_code }),
    }).catch(() => {});

    // ref_code 유지 — /entry?loc={location}&ref={ref_code}
    const refToUse = refFromUrl || seed.ref_code;
    navigate(`/entry?loc=${encodeURIComponent(seed.location)}&ref=${encodeURIComponent(refToUse)}`);
  }

  if (loading) {
    return (
      <div style={S.page}>
        <div style={{ paddingTop: 160, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          별의 이야기를 불러오는 중…
        </div>
      </div>
    );
  }

  if (error || !seed) {
    return (
      <div style={S.page}>
        <div style={S.err}>
          {error || '이 별의 이야기를 찾지 못했어요.'}
          <br /><br />
          <button style={{ ...S.cta, maxWidth: 240, marginTop: 20 }} onClick={() => navigate('/')}>
            처음으로
          </button>
        </div>
      </div>
    );
  }

  const brand = LOC_BRAND[seed.location] || 'Daily Miracles';

  return (
    <div style={S.page}>
      <div style={S.brand}>{brand}</div>

      <motion.div
        style={S.imgWrap}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img src={seed.image_url} alt="" style={S.img} loading="eager" />
      </motion.div>

      <div style={S.title}>
        {seed.title || '누군가의 별이\n당신을 초대했어요'}
      </div>
      <div style={S.sub}>
        이 마음에서 시작된 별이에요.<br />
        당신의 이야기도 같은 자리에 남길 수 있어요.
      </div>

      <button style={S.cta} onClick={handleStart}>
        나도 만들기 ✨
      </button>

      {refFromUrl && (
        <div style={S.refBadge}>초대 코드 · {refFromUrl}</div>
      )}
    </div>
  );
}
