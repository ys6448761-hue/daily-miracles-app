/**
 * PHX-KENNY-003 — 케니호텔 전용 무여정 영업 시연판 V0.1
 *
 * Route: /kenny  (URL param: ?lang=ko|en)
 * Scope: 로컬 개발 + 격리 시연 환경 한정. Production 배포 별도 Founder 승인 필요.
 *
 * 메뉴 6개:
 *   GUIDE     — 여수 여행 가이드 (무여정 SOUL 채팅 연결 — OPERATIONAL)
 *   ROOFTOP   — 루프탑 전망 안내 (시연용 — 사진 미확정)
 *   STARLIGHT — 별빛항로·소원그림 소개 (시연용)
 *   BENEFIT   — 여수 전체 별빛혜택 (시연용)
 *   FOOD      — 호텔 주변 맛집·쿠폰 (시연용 — 쿠폰 발급 미구현)
 *   ROUTE     — 별빛항로 1박 2일 여행 코스 (시연용)
 *
 * 구현 상태 범례:
 *   OPERATIONAL — 실제 기능 연결
 *   DEMO_CARD   — 시연용 카드 (실 기능 미연결)
 *
 * Evidence: docs/knowledge/KENNY-003-EVIDENCE-V0_1.md
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSoulTheme } from '../contexts/SoulThemeContext.jsx';

// ── i18n 텍스트 사전 ──────────────────────────────────────────────────────────
const T = {
  ko: {
    hotelTag:    '케니호텔 전용',
    hotelName:   '케니 호텔',
    headline:    '여수를 더 깊이, 무여정과 함께',
    sub:         '투숙하시는 동안 여수를 가장 잘 아는 여행 친구 SOUL이 함께해요.',
    freeLabel:   '여행 가이드 무료 제공',
    menuTitle:   '이런 걸 도와드릴 수 있어요',
    // 메뉴 항목
    guide:       '여수 여행 가이드',
    guideSub:    'SOUL에게 여수 여행 궁금증을 물어보세요.',
    guideTag:    '여수 여행 가이드',
    rooftop:     '루프탑 전망 안내',
    rooftopSub:  '케니호텔 루프탑에서 보이는 여수 파노라마 뷰.',
    rooftopTag:  '준비 중',
    starlight:   '별빛항로·소원그림',
    starlightSub:'여수의 밤을 더 특별하게 만드는 1박 2일 별빛 경험.',
    starlightTag:'시연용',
    benefit:     '여수 별빛혜택',
    benefitSub:  '케니호텔 투숙객을 위한 여수 전체 혜택 모음.',
    benefitTag:  '시연용',
    food:        '호텔 주변 맛집·쿠폰',
    foodSub:     '케니호텔 주변 추천 식당과 혜택 정보.',
    foodTag:     '시연용',
    route:       '별빛항로 1박 2일 코스',
    routeSub:    'Day 1 케이블카·크루즈, Day 2 오동도·수산시장.',
    routeTag:    '시연용',
    // 하단
    demoNotice:  '이 페이지는 케니호텔 전용 시연 버전입니다.',
    soulFooter:  'SOUL은 현재 알고 있는 정보를 바탕으로 답해드려요. 최신 운영 정보는 현장에서 확인을 권장해요.',
    // 준비 중 카드
    comingSoon:  '준비 중이에요',
    comingDesc:  '더 완성된 서비스로 곧 찾아올게요.',
    goGuide:     'SOUL에게 물어보기 →',
    // 소원패스 혜택 패널
    sowonpassTitle:    '소원패스 별빛혜택',
    sowonpassEp:       'EP01 별빛혜택',
    sowonpassTabHotel: '호텔 케니 주변',
    sowonpassTabCity:  '여수 시내',
    sowonpassNight:    '야간',
    sowonpassEmpty:    '별빛혜택 준비 중이에요. 곧 여수의 멋진 혜택들을 소개할게요.',
    sowonpassLoading:  '혜택 정보를 불러오는 중…',
    sowonpassError:    '혜택 정보를 불러오지 못했어요.',
    sowonpassMapLink:  '지도 보기',
    // 별빛항로 카드 내용
    day1:        'Day 1 — 별빛을 따라서',
    day1desc:    '케이블카, 여수 크루즈, 케니호텔 숙박 — 도착 시간과 크루즈 운항 일정에 맞춰 이용하는 추천 여정이에요.',
    day2:        'Day 2 — 나만의 속도로',
    day2desc:    '오동도·모이핀 카페·장도·여수수산시장 등 — 원하는 장소를 자유롭게 선택하세요.',
    day2note:    '2일차 장소는 자유 선택이에요. 일부 장소는 추가 비용이 발생할 수 있어요.',
    wishArt:     '소원그림 — 나만의 여정 기념',
    wishArtDesc: '여수 여정을 담은 나만의 소원 그림 — QR 가이드로 체험해 보세요.',
    // 헤더 토글
    langKo:      '한국어',
    langEn:      'English',
  },
  en: {
    hotelTag:    'Kenny Hotel Exclusive',
    hotelName:   'Kenny Hotel',
    headline:    'Discover Yeosu, deeper with Muyojeong',
    sub:         'During your stay, SOUL — your Yeosu travel companion — is here for you.',
    freeLabel:   'Travel Guide · Free',
    menuTitle:   'How we can help you',
    // 메뉴 항목
    guide:       'Yeosu Travel Guide',
    guideSub:    'Ask SOUL anything about traveling in Yeosu.',
    guideTag:    'Yeosu Travel Guide',
    rooftop:     'Rooftop Panorama',
    rooftopSub:  'Panoramic views of Yeosu from the Kenny Hotel rooftop.',
    rooftopTag:  'Coming Soon',
    starlight:   'Starlight Route · Wish Art',
    starlightSub:'A special 1-night-2-day starlight experience in Yeosu.',
    starlightTag:'Demo',
    benefit:     'Yeosu Starlight Benefits',
    benefitSub:  'Exclusive perks in Yeosu for Kenny Hotel guests.',
    benefitTag:  'Demo',
    food:        'Nearby Restaurants & Coupons',
    foodSub:     'Recommended dining spots near Kenny Hotel.',
    foodTag:     'Demo',
    route:       'Starlight Route — 2 Days',
    routeSub:    'Day 1: Cable Car & Cruise. Day 2: Odongdo & Fish Market.',
    routeTag:    'Demo',
    // 하단
    demoNotice:  'This is a demo version exclusive to Kenny Hotel.',
    soulFooter:  'SOUL answers based on current knowledge. Please verify the latest operational info on-site.',
    // 준비 중 카드
    comingSoon:  'Coming soon',
    comingDesc:  "We're preparing a more complete experience for you.",
    goGuide:     'Ask SOUL →',
    // 소원패스 혜택 패널
    sowonpassTitle:    'Sowon Pass Starlight Benefits',
    sowonpassEp:       'EP01 Starlight Benefits',
    sowonpassTabHotel: 'Near Kenny Hotel',
    sowonpassTabCity:  'Downtown Yeosu',
    sowonpassNight:    'Night',
    sowonpassEmpty:    'Starlight benefits coming soon. We\'ll share great Yeosu perks shortly.',
    sowonpassLoading:  'Loading benefits…',
    sowonpassError:    'Could not load benefits.',
    sowonpassMapLink:  'Map',
    // 별빛항로 카드 내용
    day1:        'Day 1 — Follow the Starlight',
    day1desc:    'Cable car, Yeosu cruise, and Hotel Kenny stay — arranged around your arrival time and confirmed cruise schedule.',
    day2:        'Day 2 — Explore at Your Own Pace',
    day2desc:    'Choose from Odongdo Island, Moifin Café, Jangdo Island, and Yeosu Fish Market, or discover other places that suit your interests.',
    day2note:    'Day 2 places are optional selections. Additional costs may apply.',
    wishArt:     'Wish Art — A Memory to Keep',
    wishArtDesc: 'Use your provided QR guide to create a personalized wish painting inspired by your Yeosu journey.',
    // 헤더 토글
    langKo:      '한국어',
    langEn:      'English',
  },
};

// ── 메뉴 정의 ─────────────────────────────────────────────────────────────────
const MENU_IDS = ['guide', 'route', 'starlight', 'rooftop', 'food', 'benefit'];

// ── 메뉴 카드 컴포넌트 ────────────────────────────────────────────────────────
function MenuCard({ id, t, onClick, active, theme }) {
  const label   = t[id];
  const sub     = t[`${id}Sub`];
  const tag     = t[`${id}Tag`];
  const isLive  = id === 'guide';

  const tagStyle = {
    fontSize:   '0.625rem',
    padding:    '2px 8px',
    borderRadius: '20px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    background: isLive ? 'rgba(100,220,100,0.15)' : 'rgba(255,214,122,0.12)',
    color:      isLive ? '#6fdc80' : '#FFD67A',
    border:     `1px solid ${isLive ? 'rgba(100,220,100,0.30)' : 'rgba(255,214,122,0.25)'}`,
  };

  return (
    <button
      onClick={() => onClick(id)}
      style={{
        width:        '100%',
        textAlign:    'left',
        padding:      '14px 16px',
        borderRadius: '14px',
        border:       active ? '1.5px solid var(--soul-accent)' : '1px solid var(--soul-chip-border)',
        background:   active ? 'var(--soul-card-bg)' : 'var(--soul-chip-bg)',
        cursor:       'pointer',
        transition:   'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--soul-text)', wordBreak: 'keep-all', margin: 0 }}>
          {label}
        </p>
        <span style={tagStyle}>{tag}</span>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--soul-text-muted)', lineHeight: 1.45, wordBreak: 'keep-all', margin: 0 }}>
        {sub}
      </p>
    </button>
  );
}

// ── 준비 중 카드 ──────────────────────────────────────────────────────────────
function DemoCard({ t, onGoGuide }) {
  return (
    <div
      style={{
        borderRadius: '14px',
        border:       '1px solid var(--soul-chip-border)',
        background:   'var(--soul-card-bg)',
        padding:      '20px 16px',
        textAlign:    'center',
      }}
    >
      <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✦</p>
      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--soul-text)', marginBottom: '6px', wordBreak: 'keep-all' }}>
        {t.comingSoon}
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--soul-text-muted)', lineHeight: 1.5, wordBreak: 'keep-all', marginBottom: '14px' }}>
        {t.comingDesc}
      </p>
      <button
        onClick={onGoGuide}
        style={{
          padding:      '8px 18px',
          borderRadius: '20px',
          border:       '1px solid var(--soul-accent)',
          background:   'transparent',
          color:        'var(--soul-accent)',
          fontSize:     '0.8125rem',
          fontWeight:   600,
          cursor:       'pointer',
        }}
      >
        {t.goGuide}
      </button>
    </div>
  );
}

// ── 소원패스 별빛혜택 패널 ─────────────────────────────────────────────────────
function SowonPassPanel({ t, lang }) {
  const [activeTab, setActiveTab] = React.useState('hotel_vicinity');
  const [data, setData] = React.useState({ hotel_vicinity: [], yeosu_city: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    setError(false);
    fetch('/api/dt/benefits/starlight?city_code=yeosu')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const list = data[activeTab] ?? [];

  const CATEGORY_ICON = {
    cafe:          '☕',
    restaurant:    '🍽',
    night:         '🌙',
    activity:      '✦',
    transport:     '🚢',
    accommodation: '🏨',
    etc:           '📍',
  };

  return (
    <div
      style={{
        borderRadius: '14px',
        border:       '1px solid rgba(255,214,122,0.25)',
        background:   'rgba(255,214,122,0.03)',
        padding:      '16px',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.6875rem', color: '#FFD67A', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {t.sowonpassEp}
        </span>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {(['hotel_vicinity', 'yeosu_city']).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding:      '6px 14px',
              borderRadius: '20px',
              border:       activeTab === tab ? '1.5px solid #FFD67A' : '1px solid var(--soul-chip-border)',
              background:   activeTab === tab ? 'rgba(255,214,122,0.12)' : 'var(--soul-chip-bg)',
              color:        activeTab === tab ? '#FFD67A' : 'var(--soul-text-muted)',
              fontSize:     '0.8125rem',
              fontWeight:   activeTab === tab ? 600 : 400,
              cursor:       'pointer',
            }}
          >
            {tab === 'hotel_vicinity' ? t.sowonpassTabHotel : t.sowonpassTabCity}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      {loading ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--soul-text-muted)', textAlign: 'center', padding: '20px 0' }}>
          {t.sowonpassLoading}
        </p>
      ) : error ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--soul-text-muted)', textAlign: 'center', padding: '20px 0' }}>
          {t.sowonpassError}
        </p>
      ) : list.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--soul-text-muted)', textAlign: 'center', padding: '20px 0', lineHeight: 1.6, wordBreak: 'keep-all' }}>
          {t.sowonpassEmpty}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {list.map(partner => (
            <div
              key={partner.id}
              style={{
                borderRadius: '12px',
                border:       '1px solid var(--soul-chip-border)',
                background:   'var(--soul-card-bg)',
                padding:      '12px 14px',
              }}
            >
              {/* 업체 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1rem' }}>{CATEGORY_ICON[partner.category] ?? '📍'}</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--soul-text)', wordBreak: 'keep-all' }}>
                    {partner.name}
                  </span>
                  {partner.is_night && (
                    <span style={{
                      fontSize: '0.625rem', fontWeight: 600, padding: '2px 7px', borderRadius: '12px',
                      background: 'rgba(100,120,255,0.12)', color: '#8899ff',
                      border: '1px solid rgba(100,120,255,0.25)',
                    }}>
                      {t.sowonpassNight}
                    </span>
                  )}
                </div>
                {partner.naver_map_url && (
                  <a
                    href={partner.naver_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.6875rem', color: '#FFD67A', textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    {t.sowonpassMapLink} →
                  </a>
                )}
              </div>

              {/* 혜택 목록 */}
              {(partner.benefits ?? []).map(b => (
                <div
                  key={b.id}
                  style={{
                    marginTop:    '6px',
                    padding:      '8px 10px',
                    borderRadius: '8px',
                    background:   'rgba(255,214,122,0.05)',
                    border:       '1px solid rgba(255,214,122,0.15)',
                  }}
                >
                  <p style={{ fontSize: '0.8125rem', color: 'var(--soul-text)', lineHeight: 1.45, wordBreak: 'keep-all', margin: 0 }}>
                    {b.display_copy}
                  </p>
                  {b.location_hint && (
                    <p style={{ fontSize: '0.6875rem', color: 'var(--soul-text-subtle)', marginTop: '3px', margin: '3px 0 0' }}>
                      {b.location_hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 별빛항로 카드 ─────────────────────────────────────────────────────────────
function StarlightCard({ t, lang }) {
  const rowStyle = {
    padding:      '12px 0',
    borderBottom: '1px solid var(--soul-chip-border)',
  };
  const dayLabel = {
    fontSize:   '0.6875rem',
    color:      '#FFD67A',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '4px',
  };
  const descStyle = {
    fontSize:   '0.875rem',
    color:      'var(--soul-text)',
    lineHeight: 1.5,
    wordBreak:  'keep-all',
  };

  return (
    <div
      style={{
        borderRadius: '14px',
        border:       '1px solid rgba(255,214,122,0.25)',
        background:   'rgba(255,214,122,0.04)',
        padding:      '16px',
      }}
    >
      <p style={{ fontSize: '0.6875rem', color: '#FFD67A', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
        STARLIGHT ROUTE EP01
      </p>
      <div style={rowStyle}>
        <p style={dayLabel}>{t.day1}</p>
        <p style={descStyle}>{t.day1desc}</p>
      </div>
      <div style={{ ...rowStyle, borderBottom: 'none' }}>
        <p style={dayLabel}>{t.day2}</p>
        <p style={descStyle}>{t.day2desc}</p>
      </div>
      <div
        style={{
          marginTop:    '12px',
          padding:      '10px 12px',
          borderRadius: '10px',
          background:   'var(--soul-chip-bg)',
          border:       '1px solid var(--soul-chip-border)',
        }}
      >
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--soul-text)', marginBottom: '4px', wordBreak: 'keep-all' }}>
          {t.wishArt}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--soul-text-muted)', lineHeight: 1.45, wordBreak: 'keep-all' }}>
          {t.wishArtDesc}
        </p>
      </div>
      {/* Day 2 자유 선택 안내 */}
      <p style={{ marginTop: '10px', fontSize: '0.6875rem', color: 'var(--soul-text-subtle)', lineHeight: 1.5, wordBreak: 'keep-all', textAlign: 'center' }}>
        {t.day2note}
      </p>
    </div>
  );
}

// ── 여행 가이드 패널 (SOUL 채팅 연결) ────────────────────────────────────────
function GuidePanel({ t, lang }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        borderRadius: '14px',
        border:       '1px solid var(--soul-card-border)',
        background:   'var(--soul-card-bg)',
        padding:      '16px',
      }}
    >
      <p style={{ fontSize: '0.8125rem', color: 'var(--soul-text-muted)', lineHeight: 1.55, wordBreak: 'keep-all', marginBottom: '14px' }}>
        {lang === 'ko'
          ? 'SOUL이 여수 여행의 모든 궁금증에 답해드려요. 케이블카, 오동도, 향일암, 맛집 추천까지.'
          : 'SOUL answers all your Yeosu travel questions — cable car, Odongdo, Hyangiram, dining, and more.'}
      </p>
      <button
        onClick={() => navigate(`/muyojeong?from=kenny&lang=${lang}`)}
        style={{
          width:        '100%',
          padding:      '12px 16px',
          borderRadius: '12px',
          background:   'var(--soul-send-active)',
          border:       'none',
          color:        '#fff',
          fontSize:     '0.9375rem',
          fontWeight:   600,
          cursor:       'pointer',
        }}
      >
        {lang === 'ko' ? 'SOUL에게 물어보기 →' : 'Ask SOUL →'}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KennyHotelPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pref, resolvedTheme, setPref } = useSoulTheme();

  // 언어: URL param → localStorage → 기본 'ko'
  const [lang, setLang] = useState(() => {
    const urlLang = searchParams.get('lang');
    if (urlLang === 'en' || urlLang === 'ko') return urlLang;
    try { return localStorage.getItem('kenny_lang') || 'ko'; }
    catch { return 'ko'; }
  });

  const [activeMenu, setActiveMenu] = useState(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const t = T[lang];

  // 언어 변경 — URL 파라미터 + localStorage 동기화, 메뉴 패널은 유지
  const switchLang = useCallback((next) => {
    setLang(next);
    try { localStorage.setItem('kenny_lang', next); } catch {}
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('lang', next);
      return p;
    }, { replace: true });
  }, [setSearchParams]);

  function handleMenuClick(id) {
    setActiveMenu(prev => prev === id ? null : id);
  }

  function goToGuide() {
    setActiveMenu('guide');
  }

  return (
    <div
      className="soul-scope min-h-screen pb-24"
      data-soul-theme={resolvedTheme}
      style={{ overflowX: 'hidden', background: 'var(--soul-bg)', color: 'var(--soul-text)' }}
    >

      {/* ── HERO — 기존 무여정 히어로 이미지 재사용 ── */}
      <div
        style={{
          position:   'relative',
          width:      '100%',
          height:     '220px',
          overflow:   'hidden',
          background: 'var(--soul-hero-bg)',
        }}
      >
        <img
          src="/images/muyojeong/muyojeong-mobile-home-hero-v1.png"
          alt={lang === 'ko' ? '여수 케니호텔 무여정' : 'Yeosu Kenny Hotel Muyojeong'}
          onLoad={() => setHeroLoaded(true)}
          style={{
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            objectPosition: '50% 68%',
            display:        'block',
            opacity:        heroLoaded ? 1 : 0,
            transition:     'opacity 0.4s ease',
          }}
        />
        <div
          style={{
            position:   'absolute',
            bottom:     0, left: 0, right: 0,
            height:     '60px',
            background: 'linear-gradient(to bottom, transparent 0%, var(--soul-bg) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* ── 한국어 / English 토글 — 헤더 좌상단 ── */}
        <div
          style={{
            position:       'absolute',
            top:            '12px',
            left:           '12px',
            display:        'flex',
            gap:            '2px',
            background:     'rgba(0,0,0,0.42)',
            borderRadius:   '20px',
            padding:        '4px',
            backdropFilter: 'blur(8px)',
            zIndex:         10,
          }}
        >
          {(['ko', 'en']).map(l => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              style={{
                padding:      '5px 10px',
                borderRadius: '16px',
                border:       'none',
                fontSize:     '0.75rem',
                fontWeight:   lang === l ? 700 : 400,
                background:   lang === l ? 'rgba(255,255,255,0.28)' : 'transparent',
                color:        '#fff',
                cursor:       'pointer',
                minHeight:    '32px',
                transition:   'background 0.15s',
              }}
            >
              {l === 'ko' ? t.langKo : t.langEn}
            </button>
          ))}
        </div>

        {/* ── 테마 토글 — 헤더 우상단 ── */}
        <div
          style={{
            position:       'absolute',
            top:            '12px',
            right:          '12px',
            display:        'flex',
            gap:            '2px',
            background:     'rgba(0,0,0,0.38)',
            borderRadius:   '20px',
            padding:        '4px',
            backdropFilter: 'blur(8px)',
            zIndex:         10,
          }}
        >
          {[
            { key: 'auto',      label: '자동' },
            { key: 'sunshine',  label: '☀️' },
            { key: 'starlight', label: '✦' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPref(key)}
              style={{
                padding:    '5px 10px',
                borderRadius: '16px',
                border:     'none',
                fontSize:   key === 'sunshine' ? '1rem' : '0.75rem',
                fontWeight: pref === key ? 700 : 400,
                background: pref === key ? 'rgba(255,255,255,0.28)' : 'transparent',
                color:      '#fff',
                cursor:     'pointer',
                minHeight:  '32px',
                minWidth:   '36px',
                transition: 'background 0.15s',
                lineHeight: 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BRAND ── */}
      <div
        className="max-w-md mx-auto text-center"
        style={{ padding: '0.5rem 1rem 0.75rem' }}
      >
        <span
          style={{
            display:        'inline-block',
            fontSize:       '0.625rem',
            color:          '#FFD67A',
            border:         '1px solid rgba(255,214,122,0.35)',
            borderRadius:   '20px',
            padding:        '3px 10px',
            letterSpacing:  '0.1em',
            textTransform:  'uppercase',
            fontWeight:     600,
            marginBottom:   '0.5rem',
          }}
        >
          {t.hotelTag}
        </span>
        <h1
          style={{
            fontWeight:    800,
            fontSize:      '1.625rem',
            letterSpacing: '0.03em',
            color:         '#FFD67A',
            lineHeight:    1.1,
            marginBottom:  '0.5rem',
          }}
        >
          무여정
        </h1>
        <h2
          style={{
            fontWeight:  600,
            fontSize:    '1rem',
            color:       'var(--soul-text)',
            lineHeight:  1.5,
            wordBreak:   'keep-all',
            marginBottom: '0.375rem',
          }}
        >
          {t.headline}
        </h2>
        <p
          style={{
            fontSize:   '0.8125rem',
            color:      'var(--soul-text-muted)',
            lineHeight: 1.55,
            wordBreak:  'keep-all',
          }}
        >
          {t.sub}
        </p>
        <span
          style={{
            display:      'inline-block',
            marginTop:    '8px',
            fontSize:     '0.6875rem',
            color:        'rgba(111,220,128,0.90)',
            border:       '1px solid rgba(111,220,128,0.30)',
            borderRadius: '20px',
            padding:      '3px 10px',
            fontWeight:   600,
          }}
        >
          ✓ {t.freeLabel}
        </span>
      </div>

      {/* ── CONTENT ── */}
      <div
        className="max-w-md mx-auto px-4"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >

        {/* 메뉴 섹션 헤더 */}
        <p
          style={{
            fontSize:      '0.6875rem',
            color:         'var(--soul-text-subtle)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom:  '2px',
          }}
        >
          {t.menuTitle}
        </p>

        {/* ── 메뉴 카드 목록 ── */}
        {MENU_IDS.map(id => (
          <div key={id}>
            <MenuCard
              id={id}
              t={t}
              onClick={handleMenuClick}
              active={activeMenu === id}
              theme={resolvedTheme}
            />

            {/* ── 메뉴 패널 — 카드 아래 인라인 펼침 ── */}
            {activeMenu === id && (
              <div style={{ marginTop: '8px' }}>
                {id === 'guide'     && <GuidePanel t={t} lang={lang} />}
                {id === 'route'     && <StarlightCard t={t} lang={lang} />}
                {id === 'starlight' && (
                  <div style={{ borderRadius: '14px', border: '1px solid rgba(255,214,122,0.20)', background: 'rgba(255,214,122,0.04)', padding: '16px' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#FFD67A', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                      {lang === 'ko' ? '별빛항로 소개' : 'Starlight Route'}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--soul-text)', lineHeight: 1.6, wordBreak: 'keep-all', marginBottom: '12px' }}>
                      {lang === 'ko'
                        ? '여수의 밤을 더 특별하게 만드는 1박 2일 별빛 경험이에요. 케이블카 노을, 크루즈, 소원그림까지 연결되는 여정이에요.'
                        : 'A 1-night-2-day starlight journey that makes your Yeosu night unforgettable. Cable car sunset, evening cruise, and your personal wish painting.'}
                    </p>
                    <DemoCard t={t} onGoGuide={goToGuide} />
                  </div>
                )}
                {id === 'benefit' && <SowonPassPanel t={t} lang={lang} />}
                {(id === 'rooftop' || id === 'food') && (
                  <DemoCard t={t} onGoGuide={goToGuide} />
                )}
              </div>
            )}
          </div>
        ))}

        {/* ── 시연 버전 고지 ── */}
        <div
          style={{
            marginTop:    '8px',
            padding:      '10px 14px',
            borderRadius: '10px',
            background:   'rgba(255,214,122,0.06)',
            border:       '1px solid rgba(255,214,122,0.18)',
            textAlign:    'center',
          }}
        >
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,214,122,0.72)', lineHeight: 1.5, wordBreak: 'keep-all' }}>
            {t.demoNotice}
          </p>
        </div>

        {/* ── 푸터 ── */}
        <div style={{ textAlign: 'center', paddingTop: '4px', paddingBottom: '1.5rem' }}>
          <p
            style={{
              fontSize:   '0.6875rem',
              color:      'var(--soul-text-subtle)',
              lineHeight: 1.6,
              wordBreak:  'keep-all',
            }}
          >
            {t.soulFooter}
          </p>
        </div>

      </div>
    </div>
  );
}
