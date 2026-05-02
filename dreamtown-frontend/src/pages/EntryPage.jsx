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

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { readSavedStar } from '../lib/utils/starSession.js';

// ── 장소별 설정 (추후 hamel, odongjae 등 추가) ──────────────────────
const LOC_CONFIG = {
  global: {
    badge_hasStar: '내 별이 기다리고 있어요',
    badge_noStar:  '별공방 × DreamTown',
    headline_hasStar: '당신의 별이\n다시 깨어납니다',
    headline_noStar:  '지금, 당신의 소원이\n별이 됩니다',
    subline_hasStar:  '이미 만든 별이 있어요.\n다시 만나볼 수 있어요.',
    subline_noStar:   '이 순간은, 그냥 지나가지 않습니다.\n소원을 담아 별을 탄생시키세요.',
    btn_hasStar: '별의 약속 보기 →',
    btn_noStar:  '내 별 만들기 ✨',
    dest_hasStar: (starId) => `/my-star/${starId}`,
    dest_noStar:  () => '/wish',
    features: [
      { icon: '✨', text: '소원을 담아 별 만들기' },
      { icon: '⭐', text: '나만의 별 탄생 + 기억 저장' },
      { icon: '🌌', text: '도전 은하에 별 등록' },
      { icon: '🌟', text: '별의 여정 시작하기' },
    ],
  },
  lattoa: {
    badge_hasStar: '내 별이 기다리고 있어요',
    badge_noStar:  '라또아 카페 × DreamTown',
    headline_hasStar: '당신의 별이\n다시 깨어납니다',
    headline_noStar:  '이 카페의 순간,\n별이 됩니다',
    subline_hasStar:  '이미 만든 별이 있어요.\n다시 만나볼 수 있어요.',
    subline_noStar:   '라또아에서의 이 시간을\n소원과 함께 별에 담아보세요.',
    btn_hasStar: '별의 약속 보기 →',
    btn_noStar:  '내 별 만들기 ✨',
    dest_hasStar: (starId) => `/my-star/${starId}`,
    dest_noStar:  () => '/wish',
    features: [
      { icon: '☕', text: '라또아에서의 이 순간 기록' },
      { icon: '⭐', text: '나만의 별 탄생 + 기억 저장' },
      { icon: '🌌', text: '도전 은하에 별 등록' },
      { icon: '📍', text: '라또아 카페 방문 기록 영구 보존' },
    ],
  },
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

const DEFAULT_LOC = 'global';

// LOC_CONFIG 키 → DB canonical origin_place 코드
const LOC_TO_CANONICAL = {
  'global':   'global_default_workshop',
  'cablecar': 'yeosu_cablecar_workshop',
  'lattoa':   'yeosu_lattoa_cafe',
};

// URL ?loc= 파라미터 → LOC_CONFIG 키 정규화 (구 QR 코드 / 신규 canonical 양쪽 지원)
const LOC_NORMALIZE = {
  'yeosu_cablecar_workshop': 'cablecar',
  'yeosu_cablecar':          'cablecar',
  'yeosu-cablecar':          'cablecar',
  'cablecar':                'cablecar',
  'yeosu_lattoa_cafe':       'lattoa',
  'lattoa_cafe':             'lattoa',
  'lattoa':                  'lattoa',
  'global_default_workshop': 'global',
  'global':                  'global',
};

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

const EMOTION_LABEL = {
  calm: '편안함', peaceful: '편안함', relaxed: '편안함',
  excited: '설렘', hopeful: '기대', hope: '기대',
  happy: '행복', grateful: '감사', energetic: '활기',
  joy: '기쁨', love: '사랑', proud: '뿌듯함',
  longing: '그리움', nostalgia: '그리움', tired: '지침',
  sad: '슬픔', anxious: '불안', clarity: '정리됨',
};

// ── 공유 유입 화면 ────────────────────────────────────────────────
function ShareInflow({ sharedStarId, navigate }) {
  const [star,    setStar]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sharedStarId) { setLoading(false); return; }
    fetch(`/api/stars/public/${sharedStarId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setStar(data?.success ? data : null))
      .catch(() => setStar(null))
      .finally(() => setLoading(false));
  }, [sharedStarId]);

  const emo     = star?.emotion ? (EMOTION_LABEL[star.emotion] ?? star.emotion) : null;
  const preview = star?.wish_preview ?? null;

  return (
    <div style={S.page}>
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

        <div style={S.badge}>누군가의 마음이 당신을 초대했어요</div>

        {loading ? (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginTop: 20 }}>
            불러오는 중…
          </div>
        ) : (
          <>
            <div style={S.headline}>
              {preview ? '이 마음이\n당신을 불렀습니다' : '이 별이\n당신을 기다렸어요'}
            </div>

            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                style={{
                  fontSize: 15, color: 'rgba(255,215,106,0.9)',
                  lineHeight: 1.75, marginBottom: 20,
                  background: 'rgba(255,215,106,0.07)',
                  border: '1px solid rgba(255,215,106,0.18)',
                  borderRadius: 14, padding: '14px 18px',
                  textAlign: 'left',
                }}
              >
                "{preview}{preview.length >= 30 ? '…' : ''}"
              </motion.div>
            )}

            {emo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{
                  display: 'inline-block',
                  padding: '5px 16px',
                  borderRadius: 20,
                  background: 'rgba(155,135,245,0.12)',
                  border: '1px solid rgba(155,135,245,0.25)',
                  fontSize: 12, fontWeight: 700,
                  color: '#C4BAE0', marginBottom: 8,
                }}
              >
                {emo}의 마음으로 남겨진 별
              </motion.div>
            )}

            {!preview && !loading && (
              <div style={{ ...S.subline, marginTop: 12 }}>
                소원이 별이 되는 곳입니다.<br />당신의 이야기도 여기에 남겨보세요.
              </div>
            )}
          </>
        )}
      </motion.div>

      <motion.div
        style={{ width: '100%', maxWidth: 360 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
      >
        <button
          style={S.ctaBtn}
          onClick={() => navigate('/wish', { state: { sourceEvent: 'share', sharedStarId } })}
        >
          나도 남겨볼게요 ✨
        </button>

        {sharedStarId && (
          <button
            style={{
              width: '100%', maxWidth: 360, padding: '13px 0',
              borderRadius: 16, border: '1px solid rgba(155,135,245,0.2)',
              background: 'transparent', color: 'rgba(155,135,245,0.6)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
            onClick={() => navigate(`/star/${sharedStarId}`)}
          >
            이 별 먼저 보기
          </button>
        )}

        <p style={{
          marginTop: 20, fontSize: 11,
          color: 'rgba(155,135,245,0.3)',
          lineHeight: 1.7, textAlign: 'center',
        }}>
          이 서비스는 위치를 추적하지 않고,<br />선택한 순간만 기록합니다.
        </p>
      </motion.div>
    </div>
  );
}

export default function EntryPage() {
  const navigate          = useNavigate();
  const [searchParams]    = useSearchParams();
  const from              = searchParams.get('from');
  const sharedStarId      = searchParams.get('star');
  const locRaw            = searchParams.get('loc') || DEFAULT_LOC;
  const loc               = LOC_NORMALIZE[locRaw] ?? locRaw;
  const cfg               = LOC_CONFIG[loc];

  const starId  = readSavedStar();
  const hasStar = !!starId;

  // ── 공유 유입 분기 ──────────────────────────────────────────────
  if (from === 'share') {
    return <ShareInflow sharedStarId={sharedStarId} navigate={navigate} />;
  }

  // ── 미지원 loc → fallback ───────────────────────────────────────
  if (!cfg) {
    return (
      <div style={S.page}>
        <div style={S.unknownBox}>
          알 수 없는 진입 경로입니다.<br />
          <button
            style={{ ...S.ctaBtn, marginTop: 32, maxWidth: 240 }}
            onClick={() => navigate('/entry')}
          >
            기본 별공방으로 가기
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
            : navigate(dest, { state: {
                sourceEvent:    ['cablecar', 'lattoa'].includes(loc) ? loc : 'wish',
                originLocation: LOC_TO_CANONICAL[loc] ?? loc,
              }})
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
