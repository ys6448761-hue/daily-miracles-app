/**
 * InviteIntro.jsx
 * ?entry=invite 전용 단일 인트로 화면
 *
 * 원칙:
 *  - 설명 화면 아님 → 행동 트리거
 *  - "다음" 없음, 단일 CTA만
 *  - 배경: intro-03-transform.jpg (별이 되는 장면)
 *  - 텍스트 순차 등장 (0.3s 간격)
 *  - CTA 클릭 → onStart() (WishInputScreen으로 즉시 전환)
 *
 * 성능:
 *  - 배경 fade-in 0.5s
 *  - CTA 1.0s에 등장 (2초 이내 기준 충족)
 *  - onStart() 는 state 변경만 → 전환 ≤ 300ms
 */

import { motion } from 'framer-motion';

// import.meta.env.BASE_URL: dev='/', prod='/dreamtown/'
const BASE = import.meta.env.BASE_URL;

export default function InviteIntro({ onStart }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* ── 배경 이미지 fade-in 0.5s ─────────────────────────────── */}
      <motion.img
        src={`${BASE}images/intro/intro-03-transform.jpg`}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.88 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* ── 어두운 오버레이 ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* ── 텍스트 — 순차 등장 ──────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 128,
          width: '100%',
          textAlign: 'center',
          padding: '0 28px',
        }}
      >
        {/* 메인 카피 — 0.3s */}
        <motion.p
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: 'white',
            lineHeight: 1.4,
            marginBottom: 10,
            textShadow: '0 1px 8px rgba(0,0,0,0.4)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        >
          소원은 별이 됩니다
        </motion.p>

        {/* 서브 카피 — 0.6s */}
        <motion.p
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
        >
          당신의 소원이 별이 되는 공간
        </motion.p>
      </div>

      {/* ── CTA — 1.0s에 등장 ───────────────────────────────────────── */}
      <motion.button
        onClick={onStart}
        style={{
          position: 'absolute',
          bottom: 44,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '14px 52px',
          borderRadius: 9999,
          background: 'rgba(255,255,255,0.11)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.28)',
          color: 'white',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.5, ease: 'easeOut' }}
        whileTap={{ scale: 0.96 }}
      >
        시작하기 ✦
      </motion.button>
    </div>
  );
}
