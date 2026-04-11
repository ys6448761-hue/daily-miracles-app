/**
 * VoyageLanding.jsx — /voyage 랜딩 페이지
 * 여수 소원 여정 소개 + 실시간 별 COUNT + 상품 + 전화 예약
 * 모바일 375px 최적화 | Aurora5 톤
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PHONE     = '010-3819-6178';
const PHONE_TEL = 'tel:01038196178';

// 실시간 별 수
function useLiveStarCount() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    const load = () =>
      fetch('/api/dt/stars/count').then(r => r.json()).then(d => setCount(d.count ?? 0)).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);
  return count;
}

// 별 파티클
function StarField() {
  const pts = Array.from({ length: 20 }, (_, i) => ({
    id: i, top: `${5 + Math.random() * 88}%`, left: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 0.5, delay: Math.random() * 4,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {pts.map(p => (
        <motion.div key={p.id}
          style={{ position: 'absolute', top: p.top, left: p.left, width: p.size, height: p.size, borderRadius: '50%', background: '#E8E4F0' }}
          animate={{ opacity: [0.08, 0.6, 0.08], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 2.5 + Math.random() * 2, delay: p.delay, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// 상품 카드
const PRODUCTS = [
  {
    id: 'weekday',
    emoji: '🌅',
    title: '여수 소원 여정',
    tag: '주중',
    time: '09:00 – 12:30',
    price: 165000,
    highlights: ['아침 여수 해안 산책', '소원 작성 & 별 탄생', '파트너 업체 혜택 3종'],
    color: '#9B87F5',
  },
  {
    id: 'weekend',
    emoji: '🌙',
    title: '여수 소원 여정',
    tag: '주말·불꽃',
    time: '17:00 – 21:00',
    price: 269000,
    highlights: ['일몰 & 불꽃 감상', '소원 작성 & 별 탄생', '낭만 야경 투어 포함'],
    color: '#FFD700',
  },
];

// 샘플 소원 문장
const SAMPLE_WISHES = [
  '"오늘 내 마음을 여수에 남겨봤어요"',
  '"별이 생기고 나서 이상하게 힘이 났어요"',
  '"내 소원이 여수 밤하늘에 있다는 게 신기해요"',
];

export default function VoyageLanding() {
  const nav = useNavigate();
  const starCount = useLiveStarCount();
  const [wishIdx, setWishIdx] = useState(0);

  // 소원 샘플 자동 전환
  useEffect(() => {
    const id = setInterval(() => setWishIdx(i => (i + 1) % SAMPLE_WISHES.length), 3500);
    return () => clearInterval(id);
  }, []);

  function fmtPrice(n) { return n.toLocaleString('ko-KR') + '원'; }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #060E1A 0%, #0D1B2A 45%, #0F1E30 100%)',
      fontFamily: "'Noto Sans KR', sans-serif",
      color: '#E8E4F0',
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: 100, // 하단 고정 CTA 여백
    }}>
      <StarField />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 375, margin: '0 auto' }}>

        {/* ━━━ [1] 훅 ━━━ */}
        <div style={{ padding: '48px 24px 0', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'inline-block', background: 'rgba(155,135,245,0.15)', border: '1px solid rgba(155,135,245,0.3)', borderRadius: 20, padding: '5px 16px', fontSize: 11, color: '#9B87F5', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 20 }}>
              ✦ 2026 여수 세계섬박람회 연계 프로그램
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.4, margin: '0 0 12px' }}
          >
            여수에서,<br />
            <span style={{ color: '#9B87F5' }}>당신의 별이</span> 태어납니다
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 24px' }}
          >
            여행의 감동을 영원히 기억하세요<br />
            소원이 별이 되고, 여수가 고향이 됩니다
          </motion.p>
        </div>

        {/* ━━━ [2] 즉시 체험 버튼 ━━━ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{ padding: '0 24px', marginBottom: 28 }}
        >
          <button
            onClick={() => nav('/wish')}
            style={{
              width: '100%', padding: '17px 0', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #9B87F5, #7C6FD4)',
              color: '#0D1B2A', fontSize: 16, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(155,135,245,0.4)', letterSpacing: '0.02em',
            }}
          >
            ✨ 지금 소원 만들기 — 무료
          </button>
        </motion.div>

        {/* ━━━ [3] 별 이미지 / 소원 샘플 가로 스크롤 ━━━ */}
        <div style={{ padding: '0 24px', marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {[
              { emoji: '⭐', text: '직장 소원', galaxy: '성장 은하', color: '#60a5fa' },
              { emoji: '💎', text: '사랑 소원', galaxy: '기적 은하', color: '#c084fc' },
              { emoji: '🔴', text: '용기 소원', galaxy: '도전 은하', color: '#f87171' },
            ].map((s, i) => (
              <motion.div
                key={s.text}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{ flexShrink: 0, width: 130, background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}33`, borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{s.emoji}</div>
                <div style={{ fontSize: 12, color: s.color, fontWeight: 700, marginBottom: 4 }}>{s.galaxy}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.text}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ━━━ [4] 감정 문장 슬라이드 ━━━ */}
        <div style={{ padding: '0 24px', marginBottom: 28 }}>
          <motion.div
            key={wishIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ background: 'rgba(155,135,245,0.07)', border: '1px solid rgba(155,135,245,0.2)', borderRadius: 16, padding: '18px 20px', textAlign: 'center' }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 14, color: '#C4BAE0', lineHeight: 1.65, fontStyle: 'italic' }}>
              {SAMPLE_WISHES[wishIdx]}
            </div>
          </motion.div>
        </div>

        {/* ━━━ [5] 상품 카드 ━━━ */}
        <div style={{ padding: '0 24px', marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: '#9B87F5', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 12 }}>
            소원 여정 상품
          </div>
          {PRODUCTS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${p.color}33`, borderRadius: 16, padding: '18px 16px', marginBottom: 12 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>{p.emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#E8E4F0' }}>{p.title}</span>
                    <span style={{ fontSize: 11, color: p.color, background: `${p.color}22`, border: `1px solid ${p.color}44`, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{p.tag}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#7A6E9C' }}>🕐 {p.time}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: p.color, flexShrink: 0, marginLeft: 8 }}>
                  {fmtPrice(p.price)}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                {p.highlights.map(h => (
                  <div key={h} style={{ fontSize: 12, color: '#C4BAE0', marginBottom: 3 }}>✓ {h}</div>
                ))}
              </div>
              <a
                href={PHONE_TEL}
                style={{ display: 'block', width: '100%', padding: '11px 0', borderRadius: 10, border: `1px solid ${p.color}55`, background: `${p.color}11`, color: p.color, fontSize: 13, fontWeight: 700, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
              >
                📞 예약하기
              </a>
            </motion.div>
          ))}
        </div>

        {/* ━━━ [6] 신뢰 요소 ━━━ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{ padding: '0 24px', marginBottom: 20 }}
        >
          <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700, marginBottom: 10 }}>✦ 신뢰 요소</div>
            {[
              '✅ 2026 여수 세계섬박람회 공식 연계',
              '✅ 여수 16개 제휴 파트너 업체',
            ].map(t => (
              <div key={t} style={{ fontSize: 13, color: '#C4BAE0', marginBottom: 6 }}>{t}</div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(52,211,153,0.15)' }}>
              <span style={{ fontSize: 13, color: '#7A6E9C' }}>⭐ 지금까지 탄생한 별</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#FFD700' }}>
                {starCount !== null ? starCount.toLocaleString('ko-KR') : '···'}
              </span>
              <span style={{ fontSize: 13, color: '#7A6E9C' }}>개</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ━━━ [7] 하단 고정 CTA ━━━ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'linear-gradient(transparent, rgba(6,14,26,0.97) 30%)',
        padding: '20px 24px 28px',
        maxWidth: 375, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => nav('/wish')}
            style={{ flex: 2, padding: '14px 0', borderRadius: 12, border: 'none', background: '#9B87F5', color: '#0D1B2A', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
          >
            ✨ 내 별 만들기
          </button>
          <a
            href={PHONE_TEL}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0', borderRadius: 12, border: '1px solid rgba(255,215,0,0.4)', background: 'rgba(255,215,0,0.08)', color: '#FFD700', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}
          >
            📞 예약
          </a>
        </div>
      </div>
    </div>
  );
}
