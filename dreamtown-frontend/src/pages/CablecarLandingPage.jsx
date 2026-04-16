/**
 * CablecarLandingPage.jsx — 케이블카 각성 패스 구매 랜딩
 * 경로: /cablecar-landing
 *
 * 카피: "지금, 당신의 별이 깨어납니다"
 * 결제 후 → /cablecar?code=XXX (nicepayRoutes.js 리디렉트)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getOrCreateUserId } from '../api/dreamtown.js';

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #000005 0%, #0D1228 50%, #0A1E3A 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 24px 48px',
    fontFamily: "'Noto Sans KR', sans-serif",
    color: '#E8E4F0',
  },
  heroSection: {
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
    paddingTop: 64,
    paddingBottom: 48,
  },
  starGlow: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'radial-gradient(circle, #fff 0%, #e8e0ff 25%, #9B87F5 55%, transparent 80%)',
    boxShadow: '0 0 30px 12px rgba(155,135,245,0.6), 0 0 60px 24px rgba(100,80,200,0.3)',
    margin: '0 auto 32px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 20,
    background: 'rgba(155,135,245,0.15)',
    border: '1px solid rgba(155,135,245,0.3)',
    fontSize: 11,
    fontWeight: 700,
    color: '#9B87F5',
    letterSpacing: '0.1em',
    marginBottom: 20,
  },
  headline: {
    fontSize: 26,
    fontWeight: 900,
    color: '#fff',
    lineHeight: 1.35,
    marginBottom: 12,
  },
  subline: {
    fontSize: 14,
    color: '#9B8FC4',
    lineHeight: 1.75,
    marginBottom: 40,
  },
  priceBox: {
    width: '100%',
    maxWidth: 360,
    background: 'rgba(155,135,245,0.07)',
    border: '1px solid rgba(155,135,245,0.2)',
    borderRadius: 20,
    padding: '24px 24px 20px',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6A5FA8',
    textDecoration: 'line-through',
    marginBottom: 2,
  },
  priceMain: {
    fontSize: 32,
    fontWeight: 900,
    color: '#FFD76A',
    marginBottom: 4,
  },
  priceSub: {
    fontSize: 12,
    color: '#9B87F5',
    fontWeight: 600,
  },
  featureList: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 28,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 4px',
    borderBottom: '1px solid rgba(155,135,245,0.08)',
  },
  featureText: {
    fontSize: 13,
    color: '#C4BAE0',
    lineHeight: 1.5,
  },
  ctaBtn: {
    width: '100%',
    maxWidth: 360,
    padding: '17px 0',
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(135deg, #9B87F5 0%, #6B4FD8 100%)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
    boxShadow: '0 4px 20px rgba(155,135,245,0.4)',
    marginBottom: 12,
  },
  ctaBtnDisabled: {
    background: 'rgba(155,135,245,0.2)',
    color: '#7A6E9C',
    cursor: 'default',
    boxShadow: 'none',
  },
  disclaimer: {
    fontSize: 11,
    color: '#4A4260',
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: 320,
  },
  errorMsg: {
    fontSize: 13,
    color: '#f87171',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
};

const FEATURES = [
  { icon: '✨', text: '별 각성 시그니처 연출 (5초 애니메이션)' },
  { icon: '⭐', text: '케이블카 캐빈에서 내 별 탄생 + 즉시 각성' },
  { icon: '🌌', text: '도전 은하에 별 등록 + 기억 저장' },
  { icon: '📍', text: '여수 케이블카 방문 기록 영구 보존' },
];

export default function CablecarLandingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const userId = getOrCreateUserId();
      const r = await fetch('/api/cablecar/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: userId }),
      });
      const data = await r.json();

      if (!r.ok || !data.success) {
        throw new Error(data.error || '결제 요청에 실패했습니다.');
      }

      // NicePay 결제창으로 이동
      window.location.href = data.payment_url;
    } catch (err) {
      setError(err.message || '잠시 후 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>

      {/* ── 히어로 ──────────────────────────────────────────── */}
      <motion.div
        style={S.heroSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          style={S.starGlow}
          animate={{ boxShadow: [
            '0 0 30px 12px rgba(155,135,245,0.6), 0 0 60px 24px rgba(100,80,200,0.3)',
            '0 0 50px 20px rgba(155,135,245,0.8), 0 0 90px 36px rgba(100,80,200,0.4)',
            '0 0 30px 12px rgba(155,135,245,0.6), 0 0 60px 24px rgba(100,80,200,0.3)',
          ]}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div style={S.badge}>여수 케이블카 캐빈 × DreamTown</div>
        <div style={S.headline}>
          지금, 당신의 별이<br />깨어납니다
        </div>
        <div style={S.subline}>
          이 순간은, 그냥 지나가지 않습니다.<br />
          케이블카 위에서 소원을 담아<br />별을 탄생시키고 각성시키세요.
        </div>
      </motion.div>

      {/* ── 가격 ──────────────────────────────────────────── */}
      <motion.div
        style={S.priceBox}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div style={S.priceLabel}>정상가 25,900원</div>
        <div style={S.priceMain}>19,900원</div>
        <div style={S.priceSub}>오픈 기념 특가 · 케이블카 각성 패스</div>
      </motion.div>

      {/* ── 기능 목록 ──────────────────────────────────────── */}
      <motion.div
        style={S.featureList}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        {FEATURES.map((f, i) => (
          <div key={i} style={S.featureItem}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
            <span style={S.featureText}>{f.text}</span>
          </div>
        ))}
      </motion.div>

      {/* ── CTA ──────────────────────────────────────────── */}
      <motion.div
        style={{ width: '100%', maxWidth: 360 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
      >
        {error && <div style={S.errorMsg}>{error}</div>}
        <button
          style={{ ...S.ctaBtn, ...(loading ? S.ctaBtnDisabled : {}) }}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? '결제 준비 중...' : '지금, 내 별을 깨운다'}
        </button>
        <div style={S.disclaimer}>
          결제 완료 후 케이블카 캐빈 체험 화면으로 이동합니다.<br />
          이용권은 결제일로부터 30일간 유효합니다.
        </div>
      </motion.div>

    </div>
  );
}
