/**
 * SOUL 무여정 Main Home V1.3 — 소원이 직접 입력형 맞춤 항로 V0.1
 *
 * V1.3 changes (Custom Route UI):
 *   - 장소 선택 칩 (대표 8개 + 더 보기 +4): 소원이 직접 방문지 선택
 *   - 시간 직접 입력 (60~540분) + 빠른 선택 (2시간/반나달/하루)
 *   - buildSoulMessage(): 선택값 → 자연어 메시지 자동 구성
 *   - 기존 POST /api/dt/travel/input/text 재사용 (신규 API 없음)
 *   - 식사/카페 옵션: GPT 추출 신뢰성 미검증 → V0.1 제외
 *   - 중앙시장: TG 추천 전면 제외 상태 → 칩 목록 제외
 *   - CAR GOVERNANCE_HOLD 유지 / 기존 채팅 흐름 미변경
 *   Evidence: docs/knowledge/CUSTOM-ROUTE-V01-DESIGN.md
 *   hamel avg_stay=30, hyangiram=120 → total_known=195분(no-meal)
 *
 * SOUL 무여정 Main Home V1.2
 * 여수맘 파일럿 + Founder Meeting용 프로덕션 홈
 *
 * Route: /muyojeong
 * SOUL runtime: POST /api/dt/travel/input/text (no place_code — traveler context only)
 *
 * V1.2 changes (Founder Hero asset integration):
 *   - Hero: MUYOJEONG_MOBILE_HOME_HERO_V1.png (Founder-approved artwork)
 *     Composition: Lumi viewpoint → Sowon-i + SOUL → Yeosu harbor sunset
 *     250px constrained height / object-fit:cover / object-position:50% 70%
 *     → shows golden sky, harbor, cable cars, Sowon-i, SOUL — no character cropping
 *     Bottom gradient fades hero to page background
 *   - SOUL standalone portrait REMOVED from opening (SOUL present inside Hero artwork — no mascot duplication)
 *   - All previous overflow fixes preserved (min-width:0, overflow-x:hidden, no transform:scale)
 *   - Per-place routing preserved (/soul/cable-car?place=code)
 *   - word-break:keep-all preserved on all Korean text
 *
 * Asset role (Founder directive):
 *   Hero = Brand / Emotion — NOT a Place Hero, NOT a source of travel facts
 *   Place Hero cards (cable car / odongdo / hyangiram) remain unchanged
 *
 * Source: C:\DREAM TOWN\30_Founder Originals\Muyojeong\Home\MUYOJEONG_MOBILE_HOME_HERO_V1.png
 * Repo:   public/images/muyojeong/muyojeong-mobile-home-hero-v1.png
 * soul-master.png retained in repo, not shown in opening (SOUL visible in Hero artwork)
 *
 * Constraints (Founder directive):
 *   - NO schema / migration / seed / new knowledge / FAQ / Commerce / analytics
 *   - STOP after production verification for Founder/Lumi Visual Review
 */

import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrEnsureGuestCredential } from '../api/dreamtown.js';
import CourseDisplay from '../components/TravelGuide/CourseDisplay';
import YeosuMapSelector from '../components/YeosuMapSelector';
import { useSoulTheme } from '../contexts/SoulThemeContext.jsx';
import '../styles/travel-guide.css';

// ── Living Detail nav — place codes with supported detail views ────────────────
// Mirrors SoulCableCarPage.SUPPORTED_PLACE_CODES.
const NAVIGABLE_PLACE_CODES = ['cablecar', 'odongdo', 'hyangiram', 'dolsan_nightscape', 'dolsan_daegyo', 'lee_soon_shin_plaza', 'hamel_lighthouse'];
const PLACE_NAME_KO = {
  cablecar:            '케이블카',
  odongdo:             '오동도',
  hyangiram:           '향일암',
  dolsan_nightscape:   '돌산공원',
  dolsan_daegyo:       '돌산대교',
  lee_soon_shin_plaza: '이순신광장',
  hamel_lighthouse:    '하멜등대',
};
// 돌산대교는 돌산공원 Living Detail 페이지 공유 — 별도 상세 뷰 없음
const PLACE_DETAIL_CODE_MAP = {
  dolsan_daegyo: 'dolsan_nightscape',
};

// ── Color tokens — CSS 변수로 관리 (SoulThemeContext via .soul-scope) ──────────
// 하드코딩 색상은 useSoulTheme() 훅에서 resolvedTheme으로 가져옴
// PAGE_BG: 'var(--soul-bg)' — .soul-scope에 의해 테마별 자동 적용

// ── Time options — shown when SOUL asks '시간이 얼마나 남으셨어요?' ─────────────
// '1박 2일' 제외: routeSkeletonService 미구현 → routeSkeleton=null → _isMultiDayTrip 미설정
const TIME_OPTIONS = [
  { label: '2~3시간', message: '여수에서 2~3시간 있어요. 어디 갈까요?' },
  { label: '반나절',  message: '여수에서 5시간 있어요. 어디 갈까요?' },
  { label: '하루',    message: '여수에서 8시간 있어요. 어디 갈까요?' },
];
const TIME_QUESTION = '시간이 얼마나 남으셨어요?';

// ── SOUL Answer Summary ────────────────────────────────────────────────────────
function SoulAnswerSummary({ response, onNewQuestion, onTimeSelect, isLoading, lang }) {
  if (!response || !response.message_ko) return null;
  const displayMessage = (lang === 'en' && response.message_en) ? response.message_en : response.message_ko;

  const navigate = useNavigate();
  const mode     = response.presentation_mode;
  const status   = response.status;
  const t        = TM[lang] || TM.ko;

  const resolvedCode    = response.resolved_code || null;
  const isNavigable     = status === 'PLACE_LOOKUP' && NAVIGABLE_PLACE_CODES.includes(resolvedCode);
  const placeNameKo     = isNavigable ? (PLACE_NAME_KO[resolvedCode] || resolvedCode) : null;
  const placeNameForBtn = isNavigable
    ? (lang === 'en' ? (PLACE_NAME_EN[resolvedCode] || placeNameKo) : placeNameKo)
    : null;

  let badge = null;
  if (status !== 'JOURNEY_CONTINUITY') {
    if (mode === 'DISCOVERING' || (status === 'PLACE_LOOKUP' && response.places?.length > 0)) {
      badge = { label: t.badgeGood, cls: 'text-green-300 bg-green-900 bg-opacity-40 border-green-700 border-opacity-40' };
    } else if (mode === 'PARTIAL') {
      badge = { label: t.badgePartial, cls: 'text-yellow-300 bg-yellow-900 bg-opacity-30 border-yellow-700 border-opacity-40' };
    } else if (status === 'CLARIFICATION' || (mode === 'CLARIFICATION' && status !== 'JOURNEY_CONTINUITY')) {
      badge = { label: t.badgeClarify, cls: 'text-blue-300 bg-blue-900 bg-opacity-30 border-blue-700 border-opacity-40' };
    }
  }

  const lines         = displayMessage.split('\n');
  const firstLine     = lines[0] || '';
  const sentenceEnd   = firstLine.search(/[.!?。]\s*/);
  const firstSentence = sentenceEnd >= 0 ? firstLine.slice(0, sentenceEnd + 1) : firstLine;
  const restOfFirst   = sentenceEnd >= 0 ? firstLine.slice(sentenceEnd + 1).trim() : '';
  const restLines     = [restOfFirst, ...lines.slice(1)].filter(Boolean).join('\n');

  const keyPoints  = (response.why_details?.[0]?.place_features || []).slice(0, 3);
  const nextAction = response.next_options?.[0] || null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--soul-card-bg)',
        border:     '1px solid var(--soul-card-border)',
        boxShadow:  '0 2px 16px rgba(110,184,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--soul-accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t.soulLabel}
          </p>
          {t.langNote && !response.message_en && (
            <span style={{ fontSize: '0.625rem', color: 'var(--soul-text-subtle)', opacity: 0.7 }}>
              ({t.langNote})
            </span>
          )}
        </div>
        {onNewQuestion && (
          <button
            onClick={onNewQuestion}
            style={{ fontSize: '0.75rem', color: 'var(--soul-text-subtle)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            {t.askAgain}
          </button>
        )}
      </div>
      <p style={{ fontSize: '0.9375rem', wordBreak: 'keep-all', color: 'var(--soul-text)', fontWeight: 500, lineHeight: 1.4 }}>
        {firstSentence}
      </p>
      {restLines && (
        <p style={{ fontSize: '0.875rem', color: 'var(--soul-text-muted)', lineHeight: 1.6, marginTop: '4px', wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>
          {restLines}
        </p>
      )}
      {badge && (
        <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium border ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      {keyPoints.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {keyPoints.map((pt, i) => (
            <span key={i} style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px', background: 'var(--soul-chip-bg)', color: 'var(--soul-chip-text)', border: '1px solid var(--soul-chip-border)' }}>
              {pt}
            </span>
          ))}
        </div>
      )}
      {nextAction && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--soul-chip-border)' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--soul-text-subtle)', marginBottom: '6px' }}>{t.nextTell}</p>
          {nextAction === TIME_QUESTION && onTimeSelect ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => onTimeSelect(opt.message)}
                  disabled={isLoading}
                  style={{
                    padding:      '8px 10px',
                    borderRadius: '10px',
                    border:       '1px solid var(--soul-chip-border)',
                    background:   'var(--soul-chip-bg)',
                    color:        isLoading ? 'var(--soul-text-subtle)' : 'var(--soul-chip-text)',
                    fontSize:     '0.8125rem',
                    cursor:       isLoading ? 'default' : 'pointer',
                    wordBreak:    'keep-all',
                    textAlign:    'center',
                    minHeight:    '36px',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.75rem', color: 'var(--soul-text-muted)', lineHeight: 1.5, wordBreak: 'keep-all' }}>
              {nextAction}
            </p>
          )}
        </div>
      )}
      {isNavigable && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => navigate(`/soul/cable-car?place=${PLACE_DETAIL_CODE_MAP[resolvedCode] || resolvedCode}`)}
            style={{
              width:        '100%',
              padding:      '10px 16px',
              borderRadius: '12px',
              background:   'var(--soul-card-bg)',
              border:       '1px solid var(--soul-card-border)',
              color:        'var(--soul-accent)',
              fontSize:     '0.875rem',
              fontWeight:   600,
              cursor:       'pointer',
              textAlign:    'center',
              wordBreak:    'keep-all',
            }}
          >
            {t.viewDetail(placeNameForBtn)}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Custom Route — 소원이 직접 입력형 맞춤 항로 V0.1 ─────────────────────────
// 대표 8개: SOUL Phase 1 완료 + experience_ko Founder 승인 장소
const ROUTE_PLACES_MAIN = [
  { code: 'hamel_lighthouse',    name: '하멜등대',     stay: 30  },
  { code: 'hyangiram',           name: '향일암',       stay: 120 },
  { code: 'odongdo',             name: '오동도',       stay: 120 },
  { code: 'cablecar',            name: '케이블카',     stay: 45  },
  { code: 'lee_soon_shin_plaza', name: '이순신광장',   stay: 45  },
  { code: 'dolsan_nightscape',   name: '돌산공원',     stay: 45  },
  { code: 'dolsan_daegyo',       name: '돌산대교',     stay: 30  },
  { code: 'marine_park',         name: '종포해양공원', stay: 75  },
];
// 전체 펼치기 +4 (SOUL Phase 1 미완료 — 코스 포함 가능, 이동시간 미검증 가능성)
// 중앙시장 제외: travelGuideService TG 추천 전면 제외 상태 → 선택해도 코스 미등장
const ROUTE_PLACES_MORE = [
  { code: 'jaisan_park',         name: '자산공원',     stay: 30  },
  { code: 'romantic_pojangmacha',name: '낭만포차거리', stay: 60  },
  { code: 'sky_tower',           name: '스카이타워',   stay: 60  },
  { code: 'yeosu_expo_park',     name: '엑스포공원',   stay: 120 },
];
// 빠른 시간 선택: 명확한 분 단위로 GPT 추출 오류 방지
const ROUTE_TIME_QUICK = [
  { label: '2시간',  labelEn: '2 hrs',     minutes: 120 },
  { label: '반나절', labelEn: 'Half day',  minutes: 300 },
  { label: '하루',   labelEn: 'Full day',  minutes: 480 },
];

function buildSoulMessage(selectedPlaces, minutes) {
  const names = selectedPlaces.map(p => p.name).join(', ');
  return `${names} 가고 싶어요. ${minutes}분 코스 짜줘.`;
}

// ── i18n — lang=en 진입 시 UI 텍스트 전환 (SOUL 응답 본문은 한국어 유지) ──────
const TM = {
  ko: {
    freeTag:        '무료 여수여행정보',
    headline:       '여수가 궁금하면, 그냥 물어보세요.',
    subtext:        '여수를 잘 아는 여행친구 SOUL이 함께 찾아볼게요.',
    placeholder:    '여수에서 궁금한 건 뭐든 물어보세요',
    sectionPick:    '가고 싶은 곳 골라보기',
    mapViewBtn:     '지역별 보기',
    mapListBtn:     '목록으로 ↑',
    timeSectionLbl: '얼마나 여행하실 건가요?',
    timeInputPh:    '직접 입력',
    timeUnit:       '분',
    timeRange:      '60~540분',
    selectedLbl:    '선택',
    ctaBtn:         '소울이에게 코스 추천받기 →',
    loading:        'SOUL이 여수 여행 정보를 찾고 있어요…',
    errAuth:        '인증 정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.',
    errGeneral:     '요청 처리에 실패했어요. 다시 시도해주세요.',
    errFallback:    '일정을 확인하는 중 문제가 생겼어요. 다시 시도해주세요.',
    retryBtn:       '다시 시도',
    exploreLbl:     'SOUL과 먼저 둘러보기',
    footer:         'SOUL은 현재 알고 있는 정보를 바탕으로 답해드려요.\n최신 운영 정보는 현장에서 확인을 권장해요.',
    soulLabel:      'SOUL의 답',
    askAgain:       '다시 물어보기',
    nextTell:       '다음에 알려주세요',
    badgeGood:      '추천 가능',
    badgePartial:   '상황에 따라 달라요',
    badgeClarify:   '확인 필요',
    viewDetail:     (name) => `${name} 자세히 보기 →`,
    langNote:       null,
  },
  en: {
    freeTag:        'Free Yeosu Travel Info',
    headline:       'Curious about Yeosu? Just ask.',
    subtext:        'SOUL, your Yeosu travel guide, will help you explore.',
    placeholder:    'Ask anything about Yeosu',
    sectionPick:    'Pick Places to Visit',
    mapViewBtn:     'By Area',
    mapListBtn:     'List ↑',
    timeSectionLbl: 'How long will you travel?',
    timeInputPh:    'Enter minutes',
    timeUnit:       'min',
    timeRange:      '60–540 min',
    selectedLbl:    'Selected',
    ctaBtn:         'Get Route from SOUL →',
    loading:        'SOUL is finding travel info for you…',
    errAuth:        'Could not retrieve session. Please try again shortly.',
    errGeneral:     'Request failed. Please try again.',
    errFallback:    'Something went wrong. Please try again.',
    retryBtn:       'Try Again',
    exploreLbl:     'Explore with SOUL',
    footer:         'SOUL answers based on current knowledge.\nPlease verify latest hours and fees on-site.',
    soulLabel:      "SOUL's Answer",
    askAgain:       'Ask Again',
    nextTell:       'Tell us more',
    badgeGood:      'Recommendable',
    badgePartial:   'Depends on the situation',
    badgeClarify:   'Needs clarification',
    viewDetail:     (_name) => 'View Details →',
    langNote:       'Response in Korean',
  },
};

// ── PLACE_NAME_EN — 영문 진입 시 place 버튼 표시용 ──────────────────────────
const PLACE_NAME_EN = {
  cablecar:              'Cable Car',
  odongdo:               'Odongdo Island',
  hyangiram:             'Hyangiram Temple',
  dolsan_nightscape:     'Dolsan Park',
  dolsan_daegyo:         'Dolsan Bridge',
  lee_soon_shin_plaza:   'Yi Sun-sin Plaza',
  hamel_lighthouse:      'Hamel Lighthouse',
  marine_park:           'Marine Park',
  jaisan_park:           'Jaisan Park',
  romantic_pojangmacha:  'Pojangmacha St.',
  sky_tower:             'Sky Tower',
  yeosu_expo_park:       'Expo Park',
};

// ── Suggestion chips — Founder directive canonical 4, 2-col grid ──────────────
// label/labelEn: 화면 표시 / query: SOUL API 전달 질문 / ec: optional explicit_context
const SUGGESTION_CHIPS = [
  { label: '부모님과 함께', labelEn: 'With Parents', query: '부모님과 여수에서 어디 가면 좋을까?' },
  { label: '아이와 함께',   labelEn: 'With Kids',    query: '아이와 여수에서 어디 가면 좋을까?' },
  { label: '차량으로',      labelEn: 'By Car',        query: '여수에서 차로 가기 좋은 곳과 주차 정보를 알려줘.', ec: { has_car: true } },
  { label: '여행코스',      labelEn: 'Travel Route',  query: '여수 여행코스를 짜줘.' },
];

// ── Place entries — per-place routing via ?place= URL param ───────────────────
// SoulCableCarPage.entryPlaceCode reads this to start the correct Living Detail view.
const PLACE_ENTRIES = [
  {
    code:    'cablecar',
    name:    '여수해상케이블카',
    desc:    '자산 ↔ 돌산 · 편도 약 13분',
    heroSrc: '/images/soul/place-hero/cablecar.png',
    path:    '/soul/cable-car?place=cablecar',
  },
  {
    code:    'odongdo',
    name:    '오동도',
    desc:    '방파제 길 · 동백꽃 · 동백열차',
    heroSrc: '/images/soul/place-hero/odongdo.png',
    path:    '/soul/cable-car?place=odongdo',
  },
  {
    code:    'hyangiram',
    name:    '향일암',
    desc:    '절벽 암자 · 해돋이 · 두 갈래 길',
    heroSrc: '/images/soul/place-hero/hyangiram.png',
    path:    '/soul/cable-car?place=hyangiram',
  },
];

// ── Main page ────────────────────────────────────────────────────────────────
export default function MuyojeongHomePage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { pref, resolvedTheme, setPref } = useSoulTheme();
  const [searchParams] = useSearchParams();
  // 케니호텔 전용 진입 감지 — ?from=kenny 파라미터
  const fromKenny = searchParams.get('from') === 'kenny';
  const kennyLang = (searchParams.get('lang') === 'en') ? 'en' : 'ko';

  const t = TM[kennyLang] || TM.ko;

  const [inputValue,     setInputValue]     = useState('');
  const [sessionId,      setSessionId]      = useState(null);
  const [isLoading,      setIsLoading]      = useState(false);
  const [soulResponse,   setSoulResponse]   = useState(null);
  const [errorMsg,       setErrorMsg]       = useState(null);
  const [heroLoaded,     setHeroLoaded]     = useState(false);
  // Custom Route state — V0.1
  const [routePlaces,    setRoutePlaces]    = useState([]); // { code, name } array (순서 보존)
  const [routeMinutes,   setRouteMinutes]   = useState(''); // string '60'~'540'
  const [showMorePlaces, setShowMorePlaces] = useState(false);
  // Map mode — 지역별 탐색 V0.1 (routePlaces 공유)
  const [mapMode,        setMapMode]        = useState(false);

  async function _callSOUL(text, explicitCtx) {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const cred = await getOrEnsureGuestCredential();
      if (!cred?.guest_token) throw new Error(t.errAuth);

      const res = await fetch('/api/dt/travel/input/text', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${cred.guest_token}`,
        },
        body: JSON.stringify({
          message:    text,
          session_id: sessionId,
          lang:       kennyLang,
          // NO place_code — main home is traveler context only
          ...(explicitCtx ? { explicit_context: explicitCtx } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === 'string' ? body.error : t.errGeneral);
      }

      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);
      setSoulResponse(data);
    } catch (err) {
      setErrorMsg(err.message || t.errFallback);
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const raw = inputValue.trim();
    if (!raw || isLoading) return;
    _callSOUL(raw);
  }

  function handleChipClick(query, ec) {
    if (isLoading) return;
    _callSOUL(query, ec);
  }

  function handleReset() {
    setSoulResponse(null);
    setErrorMsg(null);
    setInputValue('');
    setSessionId(null); // session carry-over 차단: 새 질문은 새 세션으로 시작
    setRoutePlaces([]);
    setRouteMinutes('');
    setShowMorePlaces(false);
    setMapMode(false);
    inputRef.current?.focus();
  }

  function toggleRoutePlace(place) {
    setRoutePlaces(prev =>
      prev.some(p => p.code === place.code)
        ? prev.filter(p => p.code !== place.code)
        : [...prev, place]
    );
  }

  function handleRouteTimeQuick(minutes) {
    setRouteMinutes(String(minutes));
  }

  function handleRouteMinutesInput(e) {
    const v = e.target.value.replace(/[^0-9]/g, '');
    setRouteMinutes(v);
  }

  function handleRouteSubmit() {
    const mins = parseInt(routeMinutes, 10);
    if (routePlaces.length === 0 || !mins || mins < 60 || mins > 540 || isLoading) return;
    _callSOUL(buildSoulMessage(routePlaces, mins));
  }

  return (
    // overflow-x:hidden — primary horizontal overflow guard (preserved from V1.1)
    // soul-scope: SOUL 테마 CSS 변수 적용 범위 (DreamTown 다른 페이지 영향 없음)
    <div
      className="soul-scope min-h-screen pb-24"
      data-soul-theme={resolvedTheme}
      style={{ overflowX: 'hidden', background: 'var(--soul-bg)', color: 'var(--soul-text)' }}
    >

      {/* ── HERO IMAGE ─────────────────────────────────────────────────────── */}
      {/* ── 케니호텔 복귀 배너 — ?from=kenny 진입 시만 표시 ── */}
      {fromKenny && (
        <div
          style={{
            position:       'sticky',
            top:            0,
            zIndex:         20,
            background:     'rgba(13,27,42,0.92)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display:        'flex',
            alignItems:     'center',
            padding:        '8px 14px',
            borderBottom:   '1px solid rgba(255,214,122,0.18)',
          }}
        >
          <button
            onClick={() => { window.location.href = `https://hotel-kenny-yeosu-starlight-route.sejinlee.chatgpt.site/?lang=${kennyLang}`; }}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '4px',
              background: 'none',
              border:     'none',
              color:      '#FFD67A',
              fontSize:   '0.8125rem',
              fontWeight: 600,
              cursor:     'pointer',
              padding:    0,
            }}
          >
            ← {kennyLang === 'en' ? 'Back to Hotel Kenny' : '케니호텔로 돌아가기'}
          </button>
        </div>
      )}

      {/*
          Approved Founder artwork: MUYOJEONG_MOBILE_HOME_HERO_V1.png (941×1671px, ratio 1.776)
          Composition: Lumi viewpoint → Sowon-i (back, dark hair) + SOUL (blue character) → Yeosu sunset harbor

          V1.3 object-position fix:
            Image: 941×1671px. At 375px wide → natural height 666px.
            Container 340px → overflow 326px.
            objectPosition 50% 78% → Y-offset = 78% × 326 = 254px rendered = 38% from image top.
            Visible range: 38-89% of original image.
              38-45%: warm orange sunset sky base ← emotional hook
              45-55%: cable car cables and gondolas
              55-70%: Yeosu harbor with evening city lights
              70-82%: Sowon-i + SOUL on stone wall ← FULLY VISIBLE
              82-89%: stone wall edge (covered by 30px gradient)

          Previous bug (V1.2):
            - objectPosition 50% 70% with 250px container → showed 43-81% of image
            - 120px bottom gradient covered image 63-81% → erased Sowon-i + SOUL
            - Result: only dark harbor band (52-63%) visible → appeared as dark gradient area

          Bottom gradient: 30px only (readability at page edge, NOT covering characters)
          No top vignette: removed — was obscuring cable car area at this object-position
      */}
      <div
        style={{
          position:   'relative',
          width:      '100%',
          height:     '340px',
          overflow:   'hidden',
          background: 'var(--soul-hero-bg)',
        }}
      >
        <img
          src="/images/muyojeong/muyojeong-mobile-home-hero-v1.png"
          alt="Sowon-i와 SOUL이 여수 노을 아래 바라보고 있어요"
          onLoad={() => setHeroLoaded(true)}
          style={{
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            objectPosition: '50% 78%',
            display:        'block',
            opacity:        heroLoaded ? 1 : 0,
            transition:     'opacity 0.4s ease',
          }}
        />
        {/* Bottom fade: hero 하단 → 페이지 배경색으로 자연스럽게 이어짐 */}
        <div
          style={{
            position:   'absolute',
            bottom:     0,
            left:       0,
            right:      0,
            height:     '30px',
            background: 'linear-gradient(to bottom, transparent 0%, var(--soul-bg) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* ── 테마 토글 — hero 우상단 ── */}
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
              aria-label={key === 'auto' ? '자동 전환' : key === 'sunshine' ? '햇살 SOUL' : '별빛 SOUL'}
              style={{
                padding:      '5px 10px',
                borderRadius: '16px',
                border:       'none',
                fontSize:     key === 'sunshine' ? '1rem' : '0.75rem',
                fontWeight:   pref === key ? 700 : 400,
                background:   pref === key ? 'rgba(255,255,255,0.28)' : 'transparent',
                color:        '#fff',
                cursor:       'pointer',
                minHeight:    '32px',
                minWidth:     '36px',
                transition:   'background 0.15s',
                lineHeight:   1,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BRAND + PROMISE — below hero, clear of gradient zone ── */}
      <div
        className="max-w-md mx-auto text-center"
        style={{ padding: '0.875rem 1rem 0.75rem' }}
      >
        <p
          style={{
            fontSize:      '0.6875rem',
            color:         'var(--soul-text-subtle)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom:  '0.25rem',
          }}
        >
          {t.freeTag}
        </p>
        <h1
          style={{
            fontWeight:    800,
            fontSize:      '1.875rem',
            letterSpacing: '0.04em',
            color:         '#FFD67A',
            lineHeight:    1.1,
            marginBottom:  '0.75rem',
          }}
        >
          무여정
        </h1>
        <h2
          style={{
            fontWeight:    600,
            fontSize:      '1.0625rem',
            color:         'var(--soul-text)',
            lineHeight:    1.5,
            wordBreak:     'keep-all',
            marginBottom:  '0.375rem',
          }}
        >
          {t.headline}
        </h2>
        <p
          style={{
            fontSize:   '0.875rem',
            color:      'var(--soul-text-muted)',
            lineHeight: 1.55,
            wordBreak:  'keep-all',
          }}
        >
          {t.subtext}
        </p>
      </div>

      {/* ── CONTENT ── */}
      <div
        className="max-w-md mx-auto px-4"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
      >

        {/* ── SOUL INPUT — PRIMARY ACTION, pill style ── */}
        <div
          style={{
            borderRadius: '999px',
            background:   'var(--soul-input-bg)',
            border:       '1.5px solid var(--soul-input-border)',
            boxShadow:    '0 2px 20px rgba(110,184,255,0.10)',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', alignItems: 'center', padding: '4px 6px 4px 20px' }}
          >
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.placeholder}
              disabled={isLoading}
              // min-width:0 prevents flex child overflow in Samsung/Chrome mobile
              style={{
                flex:       '1 1 0',
                minWidth:   0,
                background: 'transparent',
                color:      'var(--soul-text)',
                fontSize:   '0.9375rem',
                outline:    'none',
                border:     'none',
                padding:    '10px 0',
                wordBreak:  'keep-all',
              }}
              className="placeholder-white placeholder-opacity-35"
            />
            {/* Circular send button */}
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              aria-label="전달"
              style={{
                width:          '40px',
                height:         '40px',
                borderRadius:   '50%',
                flexShrink:     0,
                background:     isLoading || !inputValue.trim()
                  ? 'var(--soul-send-inactive)'
                  : 'var(--soul-send-active)',
                border:         'none',
                cursor:         isLoading || !inputValue.trim() ? 'default' : 'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '1.125rem',
                marginLeft:     '8px',
                transition:     'background 0.15s',
                color:          '#fff',
              }}
            >
              {isLoading ? <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>…</span> : '→'}
            </button>
          </form>
        </div>

        {/* ── SUGGESTION CHIPS — 2-col grid, hidden after SOUL answers ── */}
        {!soulResponse && !isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip.query, chip.ec)}
                style={{
                  padding:      '10px 12px',
                  borderRadius: '12px',
                  border:       '1px solid var(--soul-chip-border)',
                  background:   'var(--soul-chip-bg)',
                  color:        'var(--soul-chip-text)',
                  fontSize:     '0.8125rem',
                  textAlign:    'left',
                  lineHeight:   1.4,
                  cursor:       'pointer',
                  minHeight:    '44px',
                  wordBreak:    'keep-all',
                  transition:   'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--soul-input-border)';
                  e.currentTarget.style.background  = 'var(--soul-card-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--soul-chip-border)';
                  e.currentTarget.style.background  = 'var(--soul-chip-bg)';
                }}
              >
                {kennyLang === 'en' ? chip.labelEn : chip.label}
              </button>
            ))}
          </div>
        )}

        {/* ── CUSTOM ROUTE — 소원이 직접 입력형 맞춤 항로 V0.1 ── */}
        {!soulResponse && !isLoading && (() => {
          const routeMins = parseInt(routeMinutes, 10);
          const isValid   = routePlaces.length > 0 && routeMins >= 60 && routeMins <= 540;

          const chipBase = {
            padding: '8px 14px', borderRadius: '20px', fontSize: '0.8125rem',
            cursor: 'pointer', border: '1px solid', wordBreak: 'keep-all',
            transition: 'background 0.15s, border-color 0.15s', minHeight: '36px',
            background: 'none',
          };

          return (
            <div
              style={{
                borderRadius: '16px',
                border: '1px solid rgba(255,214,122,0.20)',
                background: 'rgba(255,214,122,0.04)',
                padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '14px',
              }}
            >
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.6875rem', color: '#FFD67A', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  {t.sectionPick}
                </p>
                <button
                  onClick={() => setMapMode(v => !v)}
                  aria-label={mapMode ? '목록으로 보기' : '지역별로 보기'}
                  style={{
                    background: mapMode ? 'var(--soul-card-bg)' : 'none',
                    border: '1px solid',
                    borderColor: mapMode ? 'var(--soul-card-border)' : 'var(--soul-chip-border)',
                    borderRadius: '20px',
                    color: mapMode ? 'var(--soul-accent)' : 'var(--soul-text-subtle)',
                    fontSize: '0.6875rem',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {mapMode ? t.mapListBtn : t.mapViewBtn}
                </button>
              </div>

              {/* 지역별 탐색 — mapMode 활성 시 표시 */}
              {mapMode && (
                <YeosuMapSelector
                  selectedPlaces={routePlaces}
                  onTogglePlace={toggleRoutePlace}
                  onClose={() => setMapMode(false)}
                />
              )}

              {/* 장소 칩 — 대표 8개 (mapMode 비활성 시 표시) */}
              {!mapMode && (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ROUTE_PLACES_MAIN.map(place => {
                    const active = routePlaces.some(p => p.code === place.code);
                    const chipLabel = (kennyLang === 'en' && PLACE_NAME_EN[place.code]) ? PLACE_NAME_EN[place.code] : place.name;
                    return (
                      <button
                        key={place.code}
                        onClick={() => toggleRoutePlace(place)}
                        disabled={isLoading}
                        style={{
                          ...chipBase,
                          color:       active ? '#130b1e' : 'var(--soul-chip-text)',
                          background:  active ? '#FFD67A' : 'var(--soul-chip-bg)',
                          borderColor: active ? '#FFD67A' : 'var(--soul-chip-border)',
                          fontWeight:  active ? 600 : 400,
                        }}
                      >
                        {chipLabel}
                      </button>
                    );
                  })}
                </div>

                {/* 더 보기 토글 */}
                <button
                  onClick={() => setShowMorePlaces(v => !v)}
                  style={{
                    marginTop: '8px', background: 'none', border: 'none', padding: '2px 0',
                    color: 'var(--soul-text-subtle)', fontSize: '0.75rem', cursor: 'pointer',
                  }}
                >
                  {showMorePlaces
                    ? (kennyLang === 'en' ? 'Collapse ▲' : '접기 ▲')
                    : (kennyLang === 'en' ? '+ Show More ▼' : '+ 더 보기 ▼')
                  }
                </button>

                {/* 전체 장소 +4 */}
                {showMorePlaces && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {ROUTE_PLACES_MORE.map(place => {
                      const active = routePlaces.some(p => p.code === place.code);
                      const chipLabel = (kennyLang === 'en' && PLACE_NAME_EN[place.code]) ? PLACE_NAME_EN[place.code] : place.name;
                      return (
                        <button
                          key={place.code}
                          onClick={() => toggleRoutePlace(place)}
                          disabled={isLoading}
                          style={{
                            ...chipBase,
                            color:       active ? '#130b1e' : 'var(--soul-text-muted)',
                            background:  active ? '#FFD67A' : 'var(--soul-chip-bg)',
                            borderColor: active ? '#FFD67A' : 'var(--soul-chip-border)',
                            fontWeight:  active ? 600 : 400,
                          }}
                        >
                          {chipLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              )}

              {/* 시간 선택 */}
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--soul-text-subtle)', marginBottom: '8px', margin: '0 0 8px' }}>
                  {t.timeSectionLbl}
                </p>
                {/* 빠른 선택 */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {ROUTE_TIME_QUICK.map(opt => {
                    const active = routeMinutes === String(opt.minutes);
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleRouteTimeQuick(opt.minutes)}
                        disabled={isLoading}
                        style={{
                          ...chipBase,
                          color:       active ? '#fff' : 'var(--soul-chip-text)',
                          background:  active ? 'var(--soul-accent)' : 'var(--soul-chip-bg)',
                          borderColor: active ? 'var(--soul-accent)' : 'var(--soul-chip-border)',
                          fontWeight:  active ? 600 : 400,
                        }}
                      >
                        {kennyLang === 'en' ? opt.labelEn : opt.label}
                      </button>
                    );
                  })}
                </div>
                {/* 직접 입력 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min={60}
                    max={540}
                    value={routeMinutes}
                    onChange={handleRouteMinutesInput}
                    placeholder={t.timeInputPh}
                    disabled={isLoading}
                    aria-label="여행 시간 (분 단위)"
                    style={{
                      width: '100px', padding: '8px 12px', borderRadius: '10px',
                      border: '1px solid var(--soul-chip-border)',
                      background: 'var(--soul-input-bg)',
                      color: 'var(--soul-text)', fontSize: '0.875rem', outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--soul-text-subtle)' }}>{t.timeUnit}</span>
                  {routeMinutes && (parseInt(routeMinutes, 10) < 60 || parseInt(routeMinutes, 10) > 540) && (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,100,100,0.80)' }}>{t.timeRange}</span>
                  )}
                </div>
              </div>

              {/* 선택 요약 */}
              {routePlaces.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--soul-text-subtle)', margin: 0, wordBreak: 'keep-all' }}>
                  {t.selectedLbl}: {routePlaces.map(p => p.name).join(' · ')}
                  {isValid && ` · ${routeMinutes}${t.timeUnit}`}
                </p>
              )}

              {/* CTA */}
              <button
                onClick={handleRouteSubmit}
                disabled={!isValid || isLoading}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: '12px',
                  background: isValid ? 'var(--soul-send-active)' : 'var(--soul-send-inactive)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.9375rem', fontWeight: 600, cursor: isValid ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
              >
                {t.ctaBtn}
              </button>
            </div>
          );
        })()}

        {/* ── LOADING ── */}
        {isLoading && (
          <div
            className="rounded-2xl text-center py-4"
            style={{ background: 'var(--soul-card-bg)', border: '1px solid var(--soul-card-border)' }}
          >
            <p style={{ fontSize: '0.875rem', color: 'var(--soul-text-muted)' }}>
              {t.loading}
            </p>
          </div>
        )}

        {/* ── ERROR ── */}
        {errorMsg && !isLoading && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--soul-chip-bg)', border: '1px solid var(--soul-chip-border)' }}
          >
            <p style={{ fontSize: '0.875rem', color: 'var(--soul-text-muted)', wordBreak: 'keep-all', marginBottom: '8px' }}>
              {errorMsg}
            </p>
            <button
              onClick={handleReset}
              style={{ color: '#FFD67A', opacity: 0.72, fontSize: '0.8125rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {t.retryBtn}
            </button>
          </div>
        )}

        {/* ── SOUL ANSWER ── */}
        {soulResponse && !isLoading && (
          <SoulAnswerSummary
            response={soulResponse}
            onNewQuestion={handleReset}
            onTimeSelect={(msg) => _callSOUL(msg)}
            isLoading={isLoading}
            lang={kennyLang}
          />
        )}

        {/* ── COURSE DISPLAY ── renders only when SOUL returns course.blocks */}
        {soulResponse?.course?.blocks?.length > 0 && !isLoading && (
          <div style={{ marginTop: '16px' }}>
            <CourseDisplay course={soulResponse.course} lang={kennyLang} />
          </div>
        )}

        {/* ── PLACE CARDS: SOUL과 먼저 둘러보기 ── */}
        {/* These are Place Hero cards — NOT the Home Hero. Unchanged from V1.1. */}
        <section style={{ marginTop: '4px' }}>
          <p
            style={{
              fontSize:      '0.6875rem',
              color:         'var(--soul-text-subtle)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom:  '10px',
            }}
          >
            {t.exploreLbl}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PLACE_ENTRIES.map((place) => (
              <button
                key={place.code}
                onClick={() => navigate(place.path)}
                style={{
                  width:        '100%',
                  display:      'block',
                  borderRadius: '16px',
                  overflow:     'hidden',
                  textAlign:    'left',
                  cursor:       'pointer',
                  background:   'none',
                  padding:      0,
                  border:       '1px solid var(--soul-chip-border)',
                }}
              >
                <div
                  style={{
                    position:   'relative',
                    height:     '112px',
                    background: 'rgba(6,24,40,0.9)',
                    overflow:   'hidden',
                  }}
                >
                  <img
                    src={place.heroSrc}
                    alt={place.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div
                    style={{
                      position:   'absolute',
                      inset:      0,
                      background: 'linear-gradient(to top, rgba(3,12,24,0.72) 0%, rgba(3,12,24,0.18) 60%, transparent 100%)',
                    }}
                  />
                  <div
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 12px' }}
                  >
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#fff', wordBreak: 'keep-all', lineHeight: 1.3 }}>
                      {place.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.52)', marginTop: '2px', wordBreak: 'keep-all' }}>
                      {place.desc}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── FOOTER NOTE ── */}
        <div style={{ textAlign: 'center', paddingTop: '4px', paddingBottom: '1.5rem' }}>
          <p
            style={{
              fontSize:   '0.6875rem',
              color:      'var(--soul-text-subtle)',
              lineHeight: 1.6,
              wordBreak:  'keep-all',
              whiteSpace: 'pre-line',
            }}
          >
            {t.footer}
          </p>
        </div>

      </div>
    </div>
  );
}
