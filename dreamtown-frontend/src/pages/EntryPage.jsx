/**
 * EntryPage.jsx — 장소별 공통 진입 페이지
 * 경로: /entry?loc=cablecar
 *
 * loc 파라미터로 장소를 분기:
 *   cablecar  → 케이블카 캐빈 체험 흐름
 *   (hamel, odongjae 등 추후 확장)
 *
 * 분기:
 *   hasStar  → "별의 약속 보기" → /my-star/:id
 *   noStar   → "내 별 만들기"   → /cablecar
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { readSavedStar } from '../lib/utils/starSession.js';

// ── 장소별 설정 (추후 hamel, odongjae 등 추가) ──────────────────────
const LOC_CONFIG = {
  cablecar: {
    badge_hasStar: '내 별이 기다리고 있어요',
    badge_noStar:  '여수 케이블카 캐빈 × DreamTown',
    headline_hasStar: '당신의 별이\n다시 깨어납니다',
    headline_noStar:  '지금, 당신의 별이\n깨어납니다',
    subline_hasStar:  '이미 만든 별이 있어요.\n케이블카 위에서 다시 만나볼 수 있어요.',
    subline_noStar:   '이 순간은, 그냥 지나가지 않습니다.\n케이블카 위에서 소원을 담아\n별을 탄생시키세요.',
    btn_hasStar: '별의 약속 보기 →',
    btn_noStar:  '내 별 만들기 ✨',
    dest_hasStar: (starId) => `/my-star/${starId}`,
    dest_noStar:  () => '/wish',
    features: [
      { icon: '✨', text: '케이블카 위에서 소원 담기' },
      { icon: '⭐', text: '나만의 별 탄생 + 여수 기억 저장' },
      { icon: '🌌', text: '도전 은하에 별 등록' },
      { icon: '📍', text: '여수 케이블카 방문 기록 영구 보존' },
    ],
  },
  // hamel: { ... },
  // odongjae: { ... },
};

const DEFAULT_LOC = 'cablecar';

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
  featureList: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 36,
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
  unknownBox: {
    textAlign: 'center',
    paddingTop: 120,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },
};

export default function EntryPage() {
  const navigate          = useNavigate();
  const [searchParams]    = useSearchParams();
  const locRaw            = searchParams.get('loc') || DEFAULT_LOC;
  // QR 인쇄값 정규화: yeosu_cablecar → cablecar
  const loc               = locRaw === 'yeosu_cablecar' ? 'cablecar' : locRaw;
  const cfg               = LOC_CONFIG[loc];

  const starId  = readSavedStar();
  const hasStar = !!starId;

  // 미지원 loc → fallback
  if (!cfg) {
    return (
      <div style={S.page}>
        <div style={S.unknownBox}>
          알 수 없는 진입 경로입니다.<br />
          <button
            style={{ ...S.ctaBtn, marginTop: 32, maxWidth: 240 }}
            onClick={() => navigate('/cablecar')}
          >
            케이블카로 가기
          </button>
        </div>
      </div>
    );
  }

  const badge    = hasStar ? cfg.badge_hasStar    : cfg.badge_noStar;
  const headline = hasStar ? cfg.headline_hasStar : cfg.headline_noStar;
  const subline  = hasStar ? cfg.subline_hasStar  : cfg.subline_noStar;
  const btnLabel = hasStar ? cfg.btn_hasStar      : cfg.btn_noStar;
  const dest     = hasStar ? cfg.dest_hasStar(starId) : cfg.dest_noStar();

  return (
    <div style={S.page}>

      {/* ── 히어로 ── */}
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
        <div style={S.badge}>{badge}</div>
        <div style={S.headline}>
          {headline.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </div>
        <div style={S.subline}>
          {subline.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </div>
      </motion.div>

      {/* ── 경험 목록 ── */}
      <motion.div
        style={S.featureList}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {cfg.features.map((f, i) => (
          <div key={i} style={S.featureItem}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
            <span style={S.featureText}>{f.text}</span>
          </div>
        ))}
      </motion.div>

      {/* ── CTA ── */}
      <motion.div
        style={{ width: '100%', maxWidth: 360 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
      >
        <button
          style={S.ctaBtn}
          onClick={() => hasStar
            ? navigate(dest)
            : navigate(dest, { state: { sourceEvent: loc === 'cablecar' ? 'cablecar' : 'wish' } })
          }
        >
          {btnLabel}
        </button>

        <p style={{
          marginTop: 20,
          fontSize: 11,
          color: 'rgba(155,135,245,0.35)',
          lineHeight: 1.7,
          textAlign: 'center',
        }}>
          이 서비스는 위치를 추적하지 않고,<br />선택한 순간만 기록합니다.
        </p>
      </motion.div>

    </div>
  );
}
