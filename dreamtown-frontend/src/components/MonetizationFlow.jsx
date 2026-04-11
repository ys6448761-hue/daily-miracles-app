/**
 * MonetizationFlow.jsx — 공명/연결 이후 → 결제까지 5단계 흐름
 *
 * 트리거: window 이벤트 'dt:voyage_offer'
 *   → ConnectionStageCard 소멸 후 1.5초 뒤 발생
 *
 * 5단계:
 *   1. emotion     — 감정 유지 (판매 없음)
 *   2. action      — 행동 제안 (판매 없음)
 *   3. experience  — 경험 연결 (약하게)
 *   4. routes      — 항로 선택
 *   5. detail      — 상세 → 결제
 *
 * 설계 원칙:
 *   - 상품은 3단계 이후에만 등장
 *   - 사용자가 "선택했다"는 느낌이 먼저
 *   - 결제 버튼은 마지막 장면에서만
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logEvent } from '../lib/events.js';

const WHISPER_JOURNEY_KEY  = 'dreamtown_whisper_journey_id';
const LS_OFFER_SHOWN       = 'dreamtown_voyage_offer_ts';
const OFFER_COOLDOWN_MS    = 7 * 24 * 60 * 60 * 1000; // 7일
const PHASE1_AUTO_DISMISS  = 15000; // 15초 무반응 시 자동 소멸

const VOYAGE_ROUTES = [
  {
    key:    'quiet',
    icon:   '🌿',
    name:   '주중 항로',
    desc:   '조용히 쉬어가는 시간',
    when:   '평일',
    time:   '09:00 ~ 13:00',
    amount: '60,000원',
    detail: '여수 바다를 바라보며, 아무 것도 하지 않아도 되는 반나절.',
  },
  {
    key:    'starlit',
    icon:   '✨',
    name:   '별빛 항로',
    desc:   '감정을 깊게 느끼는 시간',
    when:   '평일 저녁',
    time:   '17:00 ~ 21:00',
    amount: '60,000원',
    detail: '해가 넘어가는 여수에서, 오늘 하루를 조용히 담아두는 시간.',
  },
  {
    key:    'wish',
    icon:   '🌊',
    name:   '소망 항로',
    desc:   '나를 다시 시작하는 시간',
    when:   '주말',
    time:   '09:00 ~ 13:00',
    amount: '89,000원',
    detail: '바다 앞에서 소원을 하나 품고, 그것을 별로 만드는 여정.',
  },
];

// ── 페이드 애니메이션 공통 variant ────────────────────────────────
const fadeSlide = {
  initial:  { opacity: 0, y: 14 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.25, ease: 'easeIn' } },
};

// ─────────────────────────────────────────────────────────────────
export default function MonetizationFlow() {
  const nav = useNavigate();
  const [phase,  setPhase]  = useState(null);   // null = 비노출
  const [route,  setRoute]  = useState(null);   // 선택된 항로
  const journeyId    = useRef(null);
  const dismissTimer = useRef(null);

  // ── 트리거 리스너 ────────────────────────────────────────────
  useEffect(() => {
    function onOffer() {
      // 7일 쿨다운 체크
      const last = localStorage.getItem(LS_OFFER_SHOWN);
      if (last && Date.now() - parseInt(last, 10) < OFFER_COOLDOWN_MS) return;

      journeyId.current = localStorage.getItem(WHISPER_JOURNEY_KEY);
      localStorage.setItem(LS_OFFER_SHOWN, String(Date.now()));

      setPhase('emotion');
      logEvent('voyage_offer_shown', { journey_id: journeyId.current, phase: 'emotion' });

      // Phase 1 무반응 자동 소멸
      dismissTimer.current = setTimeout(dismiss, PHASE1_AUTO_DISMISS);
    }

    window.addEventListener('dt:voyage_offer', onOffer);
    return () => window.removeEventListener('dt:voyage_offer', onOffer);
  }, []);

  // ── 클린업 ───────────────────────────────────────────────────
  useEffect(() => () => clearTimeout(dismissTimer.current), []);

  function dismiss() {
    clearTimeout(dismissTimer.current);
    setPhase(null);
    setRoute(null);
  }

  function advance(nextPhase) {
    clearTimeout(dismissTimer.current);
    setPhase(nextPhase);
    logEvent('voyage_offer_shown', { journey_id: journeyId.current, phase: nextPhase });
  }

  function selectRoute(r) {
    setRoute(r);
    advance('detail');
    logEvent('voyage_route_selected', { journey_id: journeyId.current, route: r.key });
  }

  function goToVoyage() {
    logEvent('voyage_booking_intent', { journey_id: journeyId.current, route: route?.key });
    dismiss();
    nav('/voyage');
  }

  if (!phase) return null;

  // 전체화면 여부 (4, 5단계는 full)
  const isFull = phase === 'routes' || phase === 'detail';

  return (
    <div style={backdropStyle(isFull)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          variants={fadeSlide}
          initial="initial"
          animate="animate"
          exit="exit"
          style={containerStyle(isFull)}
        >
          {phase === 'emotion'    && <EmotionPhase    onNext={() => advance('action')}      onDismiss={dismiss} />}
          {phase === 'action'     && <ActionPhase     onNext={() => advance('experience')}   onDismiss={dismiss} />}
          {phase === 'experience' && <ExperiencePhase onNext={() => advance('routes')}        onDismiss={dismiss} />}
          {phase === 'routes'     && <RoutesPhase     routes={VOYAGE_ROUTES} onSelect={selectRoute} onDismiss={dismiss} />}
          {phase === 'detail'     && <DetailPhase     route={route} onBook={goToVoyage} onBack={() => advance('routes')} onDismiss={dismiss} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 1단계: 감정 유지
// ─────────────────────────────────────────────────────────────────
function EmotionPhase({ onNext, onDismiss }) {
  return (
    <div style={phaseWrap}>
      <DismissBtn onClick={onDismiss} />
      <p style={eyebrowStyle}>✦</p>
      <p style={mainTextStyle}>오늘, 조금 다른 결이 스쳤어요</p>
      <p style={subTextStyle}>그 감각이 아직 여기 있어요</p>
      <button onClick={onNext} style={softCtaStyle}>
        이 느낌을 조금 더 이어볼까요
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 2단계: 행동 제안
// ─────────────────────────────────────────────────────────────────
function ActionPhase({ onNext, onDismiss }) {
  return (
    <div style={phaseWrap}>
      <DismissBtn onClick={onDismiss} />
      <p style={mainTextStyle}>오늘은 조금 다르게<br />보내도 괜찮아요</p>
      <p style={{ ...subTextStyle, lineHeight: 1.9 }}>
        잠깐 혼자 걸어보거나<br />
        조용한 곳에 앉아 있어도 괜찮아요
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <button onClick={onNext} style={actionBtnStyle}>조금 걸어보기</button>
        <button onClick={onNext} style={actionBtnStyle}>그냥 쉬어보기</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 3단계: 경험 연결
// ─────────────────────────────────────────────────────────────────
function ExperiencePhase({ onNext, onDismiss }) {
  return (
    <div style={phaseWrap}>
      <DismissBtn onClick={onDismiss} />
      <p style={eyebrowStyle}>여수</p>
      <p style={mainTextStyle}>이런 시간을 보내는<br />곳도 있어요</p>
      <p style={{ ...subTextStyle, lineHeight: 1.9 }}>
        바다를 보며 하루를 정리하는<br />
        사람들도 있어요
      </p>
      <button onClick={onNext} style={softCtaStyle}>
        그런 시간을 한번 보내볼까요 →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 4단계: 항로 선택
// ─────────────────────────────────────────────────────────────────
function RoutesPhase({ routes, onSelect, onDismiss }) {
  return (
    <div style={{ width: '100%' }}>
      <DismissBtn onClick={onDismiss} />
      <p style={{ ...mainTextStyle, marginBottom: 6 }}>당신에게 맞는<br />항로가 있어요</p>
      <p style={{ ...subTextStyle, marginBottom: 24 }}>어떤 시간을 원하시나요</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {routes.map(r => (
          <RouteCard key={r.key} route={r} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function RouteCard({ route, onSelect }) {
  return (
    <div style={routeCardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{route.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.88)', marginBottom: 3 }}>
            {route.name}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>
            {route.desc}
          </p>
        </div>
        <button onClick={() => onSelect(route)} style={routeCtaStyle}>
          이 항로 보기
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 5단계: 상세 → 결제
// ─────────────────────────────────────────────────────────────────
function DetailPhase({ route, onBook, onBack, onDismiss }) {
  if (!route) return null;
  return (
    <div style={{ width: '100%' }}>
      <DismissBtn onClick={onDismiss} />
      <p style={eyebrowStyle}>{route.icon} {route.name}</p>
      <p style={mainTextStyle}>{route.desc}</p>
      <p style={{ ...subTextStyle, lineHeight: 1.9, marginBottom: 28 }}>
        {route.detail}
      </p>

      {/* 일정 정보 */}
      <div style={infoBoxStyle}>
        <InfoRow label="시간" value={`${route.when} · ${route.time}`} />
        <InfoRow label="구성" value="4시간 여수 바다 체험" />
        <InfoRow label="금액" value={route.amount} highlight />
      </div>

      {/* CTA */}
      <button onClick={onBook} style={bookBtnStyle}>
        이 시간을 선택하기
      </button>

      <button onClick={onBack} style={backBtnStyle}>
        다른 항로 보기
      </button>
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span style={{ fontSize: 13, color: highlight ? 'rgba(255,215,106,0.85)' : 'rgba(255,255,255,0.72)', fontWeight: highlight ? 600 : 400 }}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 공통 컴포넌트
// ─────────────────────────────────────────────────────────────────
function DismissBtn({ onClick }) {
  return (
    <button onClick={onClick} style={dismissBtnStyle} aria-label="닫기">×</button>
  );
}

// ─────────────────────────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────────────────────────
function backdropStyle(isFull) {
  return {
    position:  'fixed',
    inset:     0,
    zIndex:    9998,
    background: isFull ? 'rgba(5, 12, 24, 0.92)' : 'transparent',
    display:   'flex',
    alignItems: isFull ? 'center' : 'flex-end',
    justifyContent: 'center',
    padding:   isFull ? '0 16px' : '0 16px 32px',
    backdropFilter: isFull ? 'blur(6px)' : 'none',
    WebkitBackdropFilter: isFull ? 'blur(6px)' : 'none',
  };
}

function containerStyle(isFull) {
  return {
    width:                '100%',
    maxWidth:             420,
    background:           'rgba(8, 18, 32, 0.96)',
    backdropFilter:       'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    border:               '1px solid rgba(155,135,245,0.15)',
    borderRadius:         24,
    padding:              isFull ? '36px 24px 28px' : '30px 24px',
    boxShadow:            '0 12px 80px rgba(0,0,0,0.5)',
    position:             'relative',
    boxSizing:            'border-box',
  };
}

const phaseWrap = {
  display:       'flex',
  flexDirection: 'column',
  alignItems:    'center',
  textAlign:     'center',
};

const eyebrowStyle = {
  fontSize:      11,
  color:         'rgba(255,215,106,0.55)',
  letterSpacing: '0.08em',
  marginBottom:  12,
};

const mainTextStyle = {
  fontSize:     19,
  fontWeight:   500,
  color:        'rgba(255,255,255,0.88)',
  lineHeight:   1.6,
  marginBottom: 12,
};

const subTextStyle = {
  fontSize:  13,
  color:     'rgba(255,255,255,0.40)',
  lineHeight: 1.75,
  marginBottom: 8,
};

const softCtaStyle = {
  marginTop:     24,
  background:    'none',
  border:        'none',
  color:         'rgba(255,255,255,0.55)',
  fontSize:      13,
  cursor:        'pointer',
  padding:       '8px 0',
  letterSpacing: '0.02em',
  lineHeight:    1.6,
  textDecoration: 'none',
};

const actionBtnStyle = {
  flex:         1,
  padding:      '12px 0',
  borderRadius: 999,
  border:       '1px solid rgba(255,255,255,0.14)',
  background:   'rgba(255,255,255,0.05)',
  color:        'rgba(255,255,255,0.7)',
  fontSize:     13,
  cursor:       'pointer',
  letterSpacing: '0.02em',
};

const routeCardStyle = {
  background:   'rgba(255,255,255,0.04)',
  border:       '1px solid rgba(255,255,255,0.09)',
  borderRadius: 16,
  padding:      '14px 16px',
};

const routeCtaStyle = {
  background:    'none',
  border:        '1px solid rgba(155,135,245,0.35)',
  borderRadius:  999,
  color:         'rgba(155,135,245,0.8)',
  fontSize:      11,
  padding:       '6px 12px',
  cursor:        'pointer',
  whiteSpace:    'nowrap',
  flexShrink:    0,
};

const infoBoxStyle = {
  background:   'rgba(255,255,255,0.03)',
  borderRadius: 14,
  padding:      '4px 14px',
  marginBottom: 24,
};

const bookBtnStyle = {
  width:        '100%',
  padding:      '16px 0',
  borderRadius: 9999,
  background:   '#FFD76A',
  color:        '#0D1B2A',
  fontSize:     15,
  fontWeight:   700,
  border:       'none',
  cursor:       'pointer',
  marginBottom: 10,
  letterSpacing: '0.02em',
};

const backBtnStyle = {
  width:        '100%',
  padding:      '10px 0',
  borderRadius: 9999,
  background:   'none',
  border:       '1px solid rgba(255,255,255,0.10)',
  color:        'rgba(255,255,255,0.35)',
  fontSize:     12,
  cursor:       'pointer',
};

const dismissBtnStyle = {
  position:   'absolute',
  top:        14,
  right:      18,
  background: 'none',
  border:     'none',
  color:      'rgba(255,255,255,0.22)',
  fontSize:   20,
  cursor:     'pointer',
  lineHeight: 1,
  padding:    4,
};
