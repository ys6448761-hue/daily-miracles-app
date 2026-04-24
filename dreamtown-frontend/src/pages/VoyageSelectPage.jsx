/**
 * VoyageSelectPage.jsx — 여수 숙박/레저 선택 (앱 전용)
 * 경로: /voyage-select
 *
 * 별공방(QR) 흐름에는 절대 포함하지 않음.
 * StarDetail 하단 "여수에서 이어가기" → 이 페이지로만 진입.
 *
 * 수수료: 예약 완료 건당 5,000원 (내부 정산 메모 — 외부 노출 없음)
 *
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { postTravelLog } from '../api/dreamtown.js';

const HOTELS = [
  {
    id:      'rest',
    emotion: '쉼',
    name:    '유탑 마리나 호텔',
    tag:     '오동도 바다 앞',
    desc:    '오동도 앞 · 수영장 · 전 객실 테라스 오션뷰',
    tel:     '061-690-8000',
    icon:    '⚓',
    accent:  '#5BC8C0',
  },
  {
    id:      'mood',
    emotion: '감성',
    name:    '라마다 호텔',
    tag:     '시내 중심',
    desc:    '여수 시내 · 오동도 근처 · 루프탑 뷰',
    tel:     '061-642-0000',
    icon:    '🏨',
    accent:  '#9B87F5',
  },
  {
    id:      'value',
    emotion: '시작',
    name:    '케니호텔',
    tag:     '케이블카 인근',
    desc:    '케이블카 도보 · 오션뷰 객실',
    tel:     '0507-1383-5001',
    icon:    '🌊',
    accent:  '#FFD76A',
  },
];

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #060812 0%, #0D1228 60%, #0A1E3A 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px 48px',
    fontFamily: "'Noto Sans KR', sans-serif",
    color: '#E8E4F0',
  },
  header: {
    width: '100%',
    maxWidth: 360,
    paddingTop: 52,
    paddingBottom: 32,
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 20,
    background: 'rgba(91,200,192,0.12)',
    border: '1px solid rgba(91,200,192,0.25)',
    fontSize: 11,
    fontWeight: 700,
    color: '#5BC8C0',
    letterSpacing: '0.08em',
    marginBottom: 16,
  },
  headline: {
    fontSize: 22,
    fontWeight: 900,
    color: '#fff',
    lineHeight: 1.4,
    marginBottom: 8,
  },
  subline: {
    fontSize: 13,
    color: '#7A6E9C',
    lineHeight: 1.7,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 12,
    borderRadius: 20,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  cardInner: {
    padding: '20px 20px 0',
  },
  tagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 800,
    color: '#fff',
    marginBottom: 4,
  },
  hotelDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.6,
    marginBottom: 16,
  },
  callBtn: {
    display: 'block',
    width: '100%',
    padding: '14px 0',
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
    letterSpacing: '0.02em',
  },
  privacyNote: {
    marginTop: 28,
    fontSize: 11,
    color: 'rgba(122,110,156,0.4)',
    textAlign: 'center',
    lineHeight: 1.7,
  },
};

function HotelCard({ hotel, index, onSelect }) {
  const handleCall = () => {
    onSelect(hotel);
    window.location.href = `tel:${hotel.tel}`;
  };

  return (
    <motion.div
      style={S.card}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
    >
      <div style={S.cardInner}>
        <div style={S.tagRow}>
          <span style={{ fontSize: 22 }}>{hotel.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20,
            background: `${hotel.accent}18`,
            border: `1px solid ${hotel.accent}30`,
            color: hotel.accent,
            letterSpacing: '0.06em',
          }}>
            {hotel.tag}
          </span>
        </div>
        <div style={S.hotelName}>{hotel.name}</div>
        <div style={S.hotelDesc}>{hotel.desc}</div>
      </div>

      <button
        onClick={handleCall}
        style={{
          ...S.callBtn,
          background: `linear-gradient(135deg, ${hotel.accent}22 0%, ${hotel.accent}10 100%)`,
          borderTop: `1px solid ${hotel.accent}20`,
          color: hotel.accent,
        }}
      >
        이곳에서 이어가기 →
      </button>
    </motion.div>
  );
}

export default function VoyageSelectPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const starId = searchParams.get('starId');
  const [toast, setToast] = useState(false);

  const handleSelect = (hotel) => {
    if (starId) {
      postTravelLog(starId, { place: hotel.name, emotion: hotel.emotion }).catch(() => {});
    }
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <div style={S.page}>

      {/* 선택 토스트 */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(91,200,192,0.15)', border: '1px solid rgba(91,200,192,0.35)',
            color: '#5BC8C0', fontSize: 13, fontWeight: 600,
            padding: '10px 20px', borderRadius: 20,
            fontFamily: "'Noto Sans KR', sans-serif",
            zIndex: 999, whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
          }}
        >
          이 선택이, 당신의 별을 조금 더 밝히고 있어요 ✨
        </motion.div>
      )}

      {/* 헤더 */}
      <motion.div
        style={S.header}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={S.badge}>여수에서 이어가기</div>
        <div style={S.headline}>
          별이 시작된 곳에서<br />하룻밤 더
        </div>
        <div style={S.subline}>
          가장 잘 맞는 숙소로 바로 연결됩니다 ✨
        </div>
      </motion.div>

      {/* 호텔 카드 3종 */}
      {HOTELS.map((hotel, i) => (
        <HotelCard key={hotel.id} hotel={hotel} index={i} onSelect={handleSelect} />
      ))}

      {/* 뒤로 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={() => nav(-1)}
        style={{
          marginTop: 8,
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        ← 돌아가기
      </motion.button>

      {/* 개인정보 안내 */}
      <p style={S.privacyNote}>
        이 서비스는 위치를 추적하지 않고,<br />선택한 순간만 기록합니다.<br />
        예약은 각 호텔 예약실과 직접 진행됩니다.
      </p>

    </div>
  );
}
