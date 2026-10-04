/**
 * SOUL Living Detail Page V0.5 — Production Port
 * 여수해상케이블카 / 오동도 / 향일암 — Place-switching Living Travel Detail Page
 *
 * Ported from staging/storybook-c7a @ 37031ec to main @ 1e030bf
 * Port scope: Minimal Alignment V0.1 (Vision-aligned 9 elements, Gap B wiring, PlaceBasicInfo V0.2 connection)
 *
 * Changes from staging V0.4:
 *   1. Gap B — explicit_context wired: chip state (has_car, people_type) sent to UI-001 backend contract
 *      chip selection does NOT auto-submit, does NOT fabricate sentences, does NOT force suitability
 *      text place alias wins over chip; place_code NOT sent from chips (text-driven place recognition)
 *   2. ESSENTIAL_INFO non-cablecar: PlaceBasicInfo V0.2 formatter logic + FactRow (visual consistency)
 *      Preserves: null-tolerant rendering, parking V0.2 behavior, all 6 trust fields
 *
 * V0.4 (staging): place switching driven by backend resolved_code (PLACE_LOOKUP only).
 *   Title, Hero text, Basic Info, SOUL Judgment switch per canonical place.
 *   Hero image: cable car only (odongdo/hyangiram assets not in repo — gradient fallback).
 *   Journey suppressed for non-cablecar PLACE_LOOKUP to prevent contradictory cable-car routing.
 *   V0.1 supported places: cablecar, odongdo, hyangiram.
 *
 * Product Contract: docs/product/SOUL_PRODUCT_VISION_V0_1.md
 * D2 Decision: docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md
 * DB / Schema / Migration: NO CHANGE
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrEnsureGuestCredential } from '../api/dreamtown.js';
import CourseDisplay from '../components/TravelGuide/CourseDisplay.jsx';

// ── Canonical judgment texts (8 context variants) ────────────────────────────
const SOUL_DISCOVERY = {
  default:
    '케이블카는 어디서 타느냐보다, 어디로 내려서 다음 여행을 이어갈지가 더 중요해요. 자산과 돌산 어느 쪽에서도 탈 수 있기 때문에, 차가 있는지·오동도를 갈지·그다음 어디로 갈지에 따라 더 편한 방향이 달라져요.',
  vehicle:
    '차로 가신다면 편도보다 왕복이 동선을 단순하게 만들 수 있어요. 편도 이용 시 차가 출발 정류장에 남기 때문에, 케이블카 다음 일정까지 보고 출발 정류장과 이용 방식을 정하는 게 좋아요.',
  odongdo:
    '오동도까지 이어가신다면 자산 쪽을 동선 후보로 먼저 볼 만해요. 다만 어느 쪽에서 출발할지와 편도·왕복 여부에 따라 실제 이동은 달라질 수 있어요.',
  parents:
    '크리스탈 캐빈은 바닥이 투명해 특별하지만, 높은 곳이나 투명 바닥이 불편하시면 일반 캐빈이 더 편할 수 있어요. 부모님의 선호를 먼저 확인하고 선택하는 편을 권해요.',
  vehicle_odongdo:
    '오동도까지 이어가면서 차를 이용하신다면, 자산 쪽 연결성만 보고 정하기보다 차를 어디에 두고 다시 어떻게 돌아올지까지 같이 봐야 해요. 왕복이면 차량 회수가 단순해지고, 편도라면 다음 이동까지 함께 계획해야 합니다.',
  vehicle_parents:
    '차로 이동하신다면 편도·왕복 여부를 먼저 정하는 게 좋아요. 부모님과 함께라면 탑승 편안함도 함께 보세요. 크리스탈 바닥이 부담스러우실 수 있어 일반 캐빈이 더 적합할 수 있어요.',
  odongdo_parents:
    '오동도까지 이어가신다면 자산 쪽 동선을 먼저 확인하고, 부모님과 함께라면 탑승 편안함도 같이 보세요. 크리스탈 바닥이 불편하실 수 있어 일반 캐빈이 더 편할 수 있어요.',
  all:
    '오동도까지 이어가면서 차를 이용하고 부모님도 함께라면, 결정에 중요한 것은 차량 회수와 탑승 편안함이에요. 왕복으로 이용하면 차량 회수가 단순해지고, 일반 캐빈이 부모님께 더 편할 수 있어요.',
};

// ── place hero asset map ──────────────────────────────────────────────────────
// Source: C:\DREAM TOWN\Assets\SOUL\{Place}\Place_Hero\ (Founder-designated SOUL assets)
// Hyangiram / Odongdo imported but not wired — connected when their pages ship.
const PLACE_HERO_MAP = {
  cablecar: '/images/soul/place-hero/cablecar.png',
};

// ── FOR ME texts (7 context variants) ────────────────────────────────────────
const FOR_ME = {
  vehicle:         '차로 간다면 탑승 자체보다 차량을 어디에 남기게 되는지가 중요해요.',
  odongdo:         '오동도까지 이어간다면 자산정류장과의 연결 관계를 먼저 보는 게 좋아요.',
  parents:         '부모님과 함께라면 크리스탈 여부보다 편안하게 탈 수 있는지가 먼저예요.',
  vehicle_odongdo: '오동도 동선과 차량 회수, 두 가지를 함께 보는 게 중요해요.',
  vehicle_parents: '차량 회수와 탑승 편안함, 두 가지를 함께 봐야 해요.',
  odongdo_parents: '오동도 연결 방법과 부모님의 탑승 편안함을 함께 확인하세요.',
  all:             '차량 회수와 부모님의 탑승 편안함을 우선해서 동선을 잡아야 해요.',
};

// ── Context variant selector ──────────────────────────────────────────────────
function getSoulVariantKey(ctx) {
  const v = ctx.hasVehicle;
  const o = ctx.nextPlace === 'odongdo';
  const p = ctx.companion === 'parents';
  if (v && o && p) return 'all';
  if (v && o)      return 'vehicle_odongdo';
  if (v && p)      return 'vehicle_parents';
  if (o && p)      return 'odongdo_parents';
  if (p)           return 'parents';
  if (o)           return 'odongdo';
  if (v)           return 'vehicle';
  return 'default';
}

// ── Context parser — keyword-based, zero LLM ────────────────────────────────
function parseContext(input, current) {
  const lower = input.toLowerCase();
  const next = { ...current };
  if (
    lower.includes('자차') ||
    lower.includes('드라이브') ||
    lower.includes('렌트') ||
    (lower.includes('차') && !lower.includes('주차') && !lower.includes('기차'))
  ) {
    next.hasVehicle = true;
  }
  if (lower.includes('오동도')) {
    next.nextPlace = 'odongdo';
  }
  if (
    lower.includes('부모') ||
    lower.includes('어르신') ||
    lower.includes('어머니') ||
    lower.includes('아버지') ||
    lower.includes('부모님')
  ) {
    next.companion = 'parents';
  }
  if (
    lower.includes('아이') ||
    lower.includes('아기') ||
    lower.includes('유모차') ||
    lower.includes('어린이')
  ) {
    next.companion = 'family';
  }
  return next;
}

// ── PlaceBasicInfo V0.2 formatter functions ──────────────────────────────────
// Same logic as PlaceBasicInfo.jsx — used with FactRow for visual consistency
function _fmtAdmission(admission_fee_json) {
  if (!admission_fee_json || typeof admission_fee_json !== 'object') return null;
  if (admission_fee_json.adult === 0) return '무료';
  if (typeof admission_fee_json.adult === 'number') return `${admission_fee_json.adult.toLocaleString()}원`;
  return null;
}
function _fmtHours(opening_hours_json) {
  if (!opening_hours_json) return null;
  try {
    const p = typeof opening_hours_json === 'string' ? JSON.parse(opening_hours_json) : opening_hours_json;
    return (p && typeof p.summary === 'string' && p.summary.length > 0) ? p.summary : null;
  } catch (_) { return null; }
}
function _fmtStay(minutes) {
  if (!minutes || typeof minutes !== 'number' || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `약 ${m}분`;
  if (m === 0) return `약 ${h}시간`;
  return `약 ${h}시간 ${m}분`;
}
function _fmtDifficulty(difficulty) {
  const MAP = { high: '경사와 계단 있음', low: '누구나 편안하게', moderate: '보통 수준', easy: '무난함' };
  return MAP[difficulty] || null;
}
function _fmtEnv(indoor_outdoor) {
  const MAP = { outdoor: '야외', indoor: '실내', mixed: '실내외' };
  return MAP[indoor_outdoor] || null;
}

// ── Sub-components ──────────────────────────────────────────────────────────
function ContextChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-dream-purple bg-opacity-30 text-white border border-dream-purple border-opacity-50">
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 opacity-60 hover:opacity-100 text-xs leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function ExpandableSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-white opacity-40 text-xs">{open ? '접기 ▲' : '더 보기 ▼'}</span>
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </Card>
  );
}

function FactRow({ label, value, note }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm py-2 border-b border-white border-opacity-5 last:border-0">
      <span className="text-white opacity-50 whitespace-nowrap flex-shrink-0">{label}</span>
      <div className="text-right">
        <span className="text-white opacity-90">{value}</span>
        {note && (
          <div className="text-xs text-white opacity-30 mt-0.5">{note}</div>
        )}
      </div>
    </div>
  );
}

function JourneyFlow({ ctx, variantKey }) {
  const hasVehicle = ctx.hasVehicle;
  const showOdongdo = ctx.nextPlace === 'odongdo';
  const hasParents = ctx.companion === 'parents';

  const JOURNEY_NOTES = {
    vehicle:         '왕복이면 차량 회수가 단순해요.',
    odongdo:         '오동도와 자산정류장 연결을 먼저 확인하세요.',
    parents:         '투명 바닥이 부담되면 일반 캐빈을 우선 고려하세요.',
    vehicle_odongdo: '오동도 연결 + 차량 회수, 두 가지를 함께 보세요.',
    vehicle_parents: '차량 회수와 탑승 편안함을 함께 고려하세요.',
    odongdo_parents: '자산 연결 확인 + 캐빈 편안함을 함께 보세요.',
    all:             '차량 회수와 탑승 편안함, 두 가지를 우선해서 동선을 잡으세요.',
  };
  const journeyNote = JOURNEY_NOTES[variantKey] ?? null;

  return (
    <div>
      <div className="flex items-center gap-2 overflow-x-auto py-1">

        {/* ODONGDO: 오동도 연결을 먼저 — 출발보다 목적지 연결이 핵심 */}
        {showOdongdo && (
          <>
            <div className="flex-shrink-0 text-center min-w-0">
              <div className="w-9 h-9 rounded-full bg-green-900 bg-opacity-50 border border-green-600 border-opacity-40 flex items-center justify-center mx-auto text-base">
                🌿
              </div>
              <div className="text-xs text-white opacity-70 mt-1">오동도</div>
              <div className="text-xs text-white opacity-25 mt-0.5">연결 확인</div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center min-w-[28px]">
              <div className="w-full flex items-center">
                <div className="flex-1 h-px border-t border-dashed border-white border-opacity-20" />
              </div>
              <div className="text-xs text-white opacity-20 mt-1">↔</div>
            </div>
          </>
        )}

        {/* 자산 / 출발 정류장 */}
        <div className="flex-shrink-0 text-center min-w-0">
          <div className="w-9 h-9 rounded-full bg-dream-purple bg-opacity-40 border border-dream-purple border-opacity-60 flex items-center justify-center mx-auto text-base">
            {hasVehicle ? '🚗' : '🚶'}
          </div>
          <div className="text-xs text-white opacity-70 mt-1">
            {hasVehicle ? '출발 정류장' : '자산'}
          </div>
          {hasVehicle && (
            <div className="text-xs text-star-gold mt-0.5">주차 위치 확인</div>
          )}
        </div>

        {/* 케이블카 */}
        <div className="flex-1 flex flex-col items-center min-w-[56px]">
          <div className="w-full flex items-center gap-0.5">
            <div className="flex-1 h-px bg-dream-purple opacity-40" />
            <span className="text-base flex-shrink-0">🚡</span>
            <div className="flex-1 h-px bg-dream-purple opacity-40" />
          </div>
          <div className="text-xs text-white opacity-30 mt-1">편도 약 13분</div>
        </div>

        {/* 돌산 */}
        <div className="flex-shrink-0 text-center min-w-0">
          <div className="w-9 h-9 rounded-full bg-white bg-opacity-10 border border-white border-opacity-20 flex items-center justify-center mx-auto text-base">
            🏔️
          </div>
          <div className="text-xs text-white opacity-70 mt-1">돌산</div>
        </div>

        {/* VEHICLE: 왕복 고려 — 차량 회수 판단 */}
        {hasVehicle && (
          <div className="flex-shrink-0 text-center min-w-0 ml-1">
            <div className="w-9 h-9 rounded-full bg-white bg-opacity-5 border border-white border-opacity-10 flex items-center justify-center mx-auto text-sm">
              ↩
            </div>
            <div className="text-xs text-white opacity-50 mt-1">왕복 고려</div>
          </div>
        )}

        {/* PARENTS: 캐빈 선택 — 편안함 판단 */}
        {hasParents && (
          <div className="flex-shrink-0 text-center min-w-0 ml-1">
            <div className="w-9 h-9 rounded-full bg-dream-purple bg-opacity-20 border border-dream-purple border-opacity-30 flex items-center justify-center mx-auto text-base">
              🎫
            </div>
            <div className="text-xs text-white opacity-50 mt-1">캐빈 선택</div>
            <div className="text-xs text-white opacity-25 mt-0.5">편안함 우선</div>
          </div>
        )}
      </div>

      {journeyNote && (
        <p className="text-xs text-dream-purple opacity-70 mt-2 leading-relaxed">{journeyNote}</p>
      )}
    </div>
  );
}

function ForMeSection({ stateIndex, variantKey, prevJourneyNote }) {
  if (stateIndex === 0) return null;
  const primaryText = FOR_ME[variantKey] ?? FOR_ME.vehicle;
  return (
    <Card className="border-dream-purple border-opacity-30">
      <p className="text-xs text-dream-purple font-semibold mb-2 uppercase tracking-wider">나에게 중요한 것</p>
      {stateIndex === 3 && prevJourneyNote && (
        <p className="text-xs text-white opacity-40 mb-2">{prevJourneyNote}</p>
      )}
      <p className="text-sm text-white leading-relaxed">{primaryText}</p>
    </Card>
  );
}

function QuestionDiscovery({ ctx }) {
  const [openKeys, setOpenKeys] = useState(new Set());

  function toggle(key) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const hasVehicle = ctx.hasVehicle;
  const isOdongdo = ctx.nextPlace === 'odongdo';
  const isParents = ctx.companion === 'parents';

  const contextQuestions = [
    hasVehicle && {
      key: 'vehicle',
      icon: '🚗',
      q: '차를 가져가면 뭘 먼저 봐야 해요?',
      a: '편도 이용 시 차량이 출발 정류장에 남아요. 왕복으로 이용하면 출발 정류장으로 돌아오기 때문에 차량 회수가 단순합니다. 다음 일정까지 고려해서 편도·왕복을 미리 정하는 게 좋아요.',
    },
    isOdongdo && {
      key: 'odongdo',
      icon: '🌿',
      q: '오동도와 어떻게 이어가요?',
      a: '자산정류장(해야)은 오동도 입구와 가까워 함께 이어보기 좋은 동선입니다. 구체적인 이동 방법은 방문 전 확인을 권장합니다.',
    },
    isParents && {
      key: 'parents',
      icon: '👨‍👩‍👧',
      q: '부모님과 탈 때 뭘 보면 좋을까요?',
      a: '일반 캐빈은 수동 휠체어·접은 유모차 탑승이 가능해요. 크리스탈 캐빈은 바닥이 투명해 특별하지만, 높은 곳이나 투명 바닥이 불편하시면 일반 캐빈이 더 편할 수 있어요. 전동휠체어는 탑승 제한이 있습니다.',
    },
  ].filter(Boolean);

  const generalQuestions = [
    {
      key: 'crystal',
      icon: '💎',
      q: '크리스탈 캐빈은 뭐가 달라요?',
      a: '6인승으로 일반(8인)보다 정원이 적어요. 바닥과 측면 일부가 강화유리라 아래 바다를 내려다볼 수 있어요. 요금이 일반보다 높으며, 바퀴 있는 물품 반입이 제한됩니다. 현장에서 탑승 전 선택하실 수 있어요.',
    },
    {
      key: 'dolsan',
      icon: '🏔️',
      q: '돌산에서 내리면 뭐가 있어요?',
      a: '돌산공원이 케이블카 인근에 있어요. 저녁 야경을 즐기며 이어가기 좋은 동선입니다.',
    },
    {
      key: 'next',
      icon: '🗺️',
      q: '케이블카와 함께 어디를 둘러볼까요?',
      a: '향일암을 오전에 방문한 뒤 오후에 케이블카로 이어가는 여정이 자주 등장해요.',
    },
  ];

  const questions = [...contextQuestions, ...generalQuestions];

  return (
    <div className="space-y-2">
      {questions.map(({ key, icon, q, a }) => {
        const isOpen = openKeys.has(key);
        return (
          <div
            key={key}
            className="rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10 overflow-hidden"
          >
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left"
            >
              <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
              <span className="text-sm text-white opacity-80 leading-snug flex-1">{q}</span>
              <span className="text-white opacity-30 text-xs flex-shrink-0 mt-1">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-3">
                <p className="text-sm text-white opacity-60 leading-relaxed pl-7">{a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SoulCableCarPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [travelerContext, setTravelerContext] = useState({
    hasVehicle: false,
    nextPlace: null,
    companion: null,
  });
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [soulMessage, setSoulMessage] = useState(null);
  const [soulResponse, setSoulResponse] = useState(null);

  const isPlaceKnowledge =
    soulResponse?.presentation_mode === 'PLACE_KNOWLEDGE' &&
    soulResponse?.status === 'PLACE_LOOKUP' &&
    soulResponse?.resolved_code != null;
  const placeCode = isPlaceKnowledge ? soulResponse.resolved_code : 'cablecar';
  const placeData = isPlaceKnowledge ? (soulResponse.places?.[0] ?? null) : null;
  const isCableCarView = placeCode === 'cablecar';
  const heroSrc = PLACE_HERO_MAP[placeCode] ?? null;

  const hasContext =
    travelerContext.hasVehicle || travelerContext.nextPlace || travelerContext.companion;
  const hasParents = travelerContext.companion === 'parents';

  const stateIndex = hasParents
    ? 3
    : travelerContext.nextPlace
    ? 2
    : travelerContext.hasVehicle
    ? 1
    : 0;

  const soulVariantKey = getSoulVariantKey(travelerContext);

  const prevJourneyNote =
    travelerContext.companion === 'parents'
      ? travelerContext.nextPlace === 'odongdo' && travelerContext.hasVehicle
        ? '오동도 연계 · 자동차 · 편도·왕복 함께 고려'
        : travelerContext.nextPlace === 'odongdo'
        ? '오동도 연계 · 자산 쪽 동선 함께 보기'
        : travelerContext.hasVehicle
        ? '자동차 · 편도·왕복 여부 함께 고려'
        : null
      : null;

  const primaryDiscovery = SOUL_DISCOVERY[soulVariantKey] ?? SOUL_DISCOVERY.default;

  async function handleSubmit(e) {
    e.preventDefault();
    const raw = inputValue.trim();
    if (!raw || isLoading) return;

    const updated = parseContext(raw, travelerContext);
    setTravelerContext(updated);

    // Gap B — UI-001 explicit_context wiring
    // Chip state → explicit_context (advisory, not commanding)
    // Rules: chip does NOT auto-submit, does NOT fabricate sentences, text place alias wins
    // place_code NOT sent from chips — text-driven place recognition takes precedence
    const explicit_context = {};
    if (updated.hasVehicle) explicit_context.has_car = true;
    if (updated.companion === 'parents') explicit_context.people_type = 'family_elderly';
    else if (updated.companion === 'family') explicit_context.people_type = 'family_with_kids';

    setIsLoading(true);
    setSoulMessage(null);
    try {
      const cred = await getOrEnsureGuestCredential();
      if (!cred?.guest_token) throw new Error('인증 정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.');

      const res = await fetch('/api/dt/travel/input/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cred.guest_token}`,
        },
        body: JSON.stringify({
          message: raw,
          session_id: sessionId,
          explicit_context: Object.keys(explicit_context).length > 0 ? explicit_context : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === 'string' ? body.error : '요청 처리에 실패했어요. 다시 시도해주세요.');
      }

      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);
      setSoulResponse(data);
      if (data.message_ko) setSoulMessage(data.message_ko);
    } catch (err) {
      setSoulMessage(err.message || '일정을 확인하는 중 문제가 생겼어요. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  }

  return (
    <div className="min-h-screen bg-night-sky text-white pb-24">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-night-sky bg-opacity-95 backdrop-blur-sm border-b border-white border-opacity-10">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white opacity-60 hover:opacity-100 text-sm flex items-center gap-1"
          >
            ← 뒤로
          </button>
          <h1 className="text-sm font-semibold text-white truncate mx-2">
            {isCableCarView ? '여수해상케이블카' : (placeData?.name_ko || '여수해상케이블카')}
          </h1>
          <div className="flex items-center gap-3 text-white opacity-40 text-sm">
            <span title="저장">🔖</span>
            <span title="공유">↗</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 space-y-4 pt-4">

        {/* ── QUESTION COMPOSER ── */}
        <Card>
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="케이블카에 대해 뭐든 물어보세요"
              className="flex-1 bg-transparent text-white placeholder-white placeholder-opacity-40 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="text-star-gold text-sm font-semibold whitespace-nowrap hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {isLoading ? '확인 중…' : '전달'}
            </button>
          </form>

          {hasContext && (
            <div className="flex flex-wrap gap-2 mt-3">
              {travelerContext.hasVehicle && (
                <ContextChip
                  label="🚗 자차"
                  onRemove={() => setTravelerContext((c) => ({ ...c, hasVehicle: false }))}
                />
              )}
              {travelerContext.nextPlace === 'odongdo' && (
                <ContextChip
                  label="🌿 오동도"
                  onRemove={() => setTravelerContext((c) => ({ ...c, nextPlace: null }))}
                />
              )}
              {travelerContext.companion === 'parents' && (
                <ContextChip
                  label="👨‍👩‍👧 부모님"
                  onRemove={() => setTravelerContext((c) => ({ ...c, companion: null }))}
                />
              )}
              {travelerContext.companion === 'family' && (
                <ContextChip
                  label="👨‍👩‍👦 가족"
                  onRemove={() => setTravelerContext((c) => ({ ...c, companion: null }))}
                />
              )}
            </div>
          )}

          {/* Quick Context — progressive, hides when all active */}
          {(() => {
            const allOptions = [
              { label: '🚗 자차로 가요', query: '차가 있어요', active: travelerContext.hasVehicle },
              { label: '🌿 오동도도요', query: '오동도도 갈 거예요', active: travelerContext.nextPlace === 'odongdo' },
              { label: '👨‍👩‍👧 부모님과요', query: '부모님도 같이 가요', active: travelerContext.companion === 'parents' },
            ];
            const remaining = allOptions.filter((o) => !o.active);
            if (remaining.length === 0) return null;
            return (
              <div className="mt-3 pt-3 border-t border-white border-opacity-10">
                <p className="text-xs text-white opacity-30 mb-2">내 상황을 더하면 더 정확하게 알려드려요</p>
                <div className="flex flex-wrap gap-2">
                  {remaining.map((s) => (
                    <button
                      key={s.query}
                      onClick={() => setTravelerContext((c) => parseContext(s.query, c))}
                      className="px-3 py-1.5 rounded-full text-xs border border-white border-opacity-20 text-white opacity-70 hover:opacity-100 hover:border-dream-purple transition-all"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </Card>

        {/* ── SOUL MESSAGE ── */}
        {soulMessage && (
          <Card>
            <p className="text-xs text-dream-purple font-semibold mb-2 uppercase tracking-wider">여정 안내</p>
            <p className="text-sm text-white leading-relaxed">{soulMessage}</p>
          </Card>
        )}

        {/* ── PLACE HERO ── */}
        <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '200px' }}>
          {heroSrc && (
            <img
              src={heroSrc}
              alt={placeData?.name_ko || '여수해상케이블카'}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(10,22,40,0.90) 0%, rgba(10,22,40,0.45) 50%, rgba(10,22,40,0.15) 100%)',
            }}
          />
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                'linear-gradient(160deg, #0a1628 0%, #1a2d5a 40%, #0e3a5c 70%, #153347 100%)',
            }}
          />
          <div className="relative z-10 p-5 flex flex-col justify-end" style={{ minHeight: '200px' }}>
            <div className="mt-auto">
              <p className="text-xs text-white opacity-50 mb-1 tracking-widest uppercase">
                {isCableCarView ? '여수 · 해상 케이블카' : ('여수 · ' + (placeData?.name_ko || ''))}
              </p>
              <h2 className="text-2xl font-bold text-white leading-tight">
                {isCableCarView ? '여수해상케이블카' : (placeData?.name_ko || '')}
              </h2>
              {isCableCarView && (
                <p className="text-sm text-white opacity-60 mt-1">
                  도시와 섬 사이 · 바다 위를 건너는 여수
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── ESSENTIAL INFO ── */}
        {/* Cable car: prepared static facts (DB data incomplete — known, deliberate).  */}
        {/* Other places: PlaceBasicInfo V0.2 formatter logic + FactRow (null-tolerant). */}
        <Card>
          <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">알아야 할 것</p>
          {isCableCarView ? (
            <>
              <FactRow label="탑승 구조" value="자산(해야) ↔ 돌산(놀아)" note="양쪽 모두 발권·탑승 · 편도/왕복 가능" />
              <FactRow label="탑승시간" value="편도 약 13분 전후" note="현장 확인 권장" />
              <FactRow label="캐빈" value="일반(8인) / 크리스탈(6인)" note="현장 선택 · 탑승권 구매 방식은 방문 전 공식 안내 확인" />
              <FactRow label="요금" value="일반 대인 왕복 17,000원~" note="크리스탈·소인 별도 · 자세한 요금 ▼" />
              <FactRow label="운영시간" value="09:30~21:30" note="강풍·기상·정비 시 변경 · 당일 확인 권장" />
              <FactRow label="주차" value="자산·돌산 양쪽 접근 가능" note="주차 위치·혼잡은 출발 정류장에 따라 확인" />
            </>
          ) : placeData ? (
            (() => {
              // PlaceBasicInfo V0.2 formatter logic — same formatters as PlaceBasicInfo.jsx
              const admission = _fmtAdmission(placeData.admission_fee_json);
              const hours = _fmtHours(placeData.opening_hours_json);
              const stayTime = _fmtStay(placeData.avg_stay_minutes);
              const difficulty = _fmtDifficulty(placeData.physical_difficulty);
              const indoorOutdoor = _fmtEnv(placeData.indoor_outdoor);
              const parking = placeData.parking_info || null;
              const hasAny = admission || hours || stayTime || difficulty || indoorOutdoor || parking;
              return hasAny ? (
                <>
                  {admission && <FactRow label="입장료" value={admission} />}
                  {hours && <FactRow label="운영시간" value={hours} note="현장 확인 권장" />}
                  {stayTime && <FactRow label="평균 체류" value={stayTime} />}
                  {difficulty && <FactRow label="걷기 난이도" value={difficulty} />}
                  {indoorOutdoor && <FactRow label="환경" value={indoorOutdoor} />}
                  {parking && <FactRow label="주차" value={parking} />}
                </>
              ) : (
                <p className="text-sm text-white opacity-50">현장에서 확인하세요.</p>
              );
            })()
          ) : (
            <p className="text-sm text-white opacity-50">현장에서 확인하세요.</p>
          )}
        </Card>

        {/* ── FOR ME — cable-car context only ── */}
        {(isCableCarView || !isPlaceKnowledge) && (
          <ForMeSection
            stateIndex={stateIndex}
            variantKey={soulVariantKey}
            prevJourneyNote={prevJourneyNote}
          />
        )}

        {/* ── SOUL JUDGMENT ── */}
        <Card>
          <p className="text-xs text-dream-purple font-semibold mb-3 uppercase tracking-wider">
            SOUL
          </p>
          {isCableCarView && !isPlaceKnowledge && !hasContext && (
            <p className="text-xs text-white opacity-40 mb-2 leading-relaxed">
              여수 바다 위를 가로지르는 해상 케이블카예요. 케이블카 안에서 바다와 섬·항구를 내려다볼 수 있어요.
            </p>
          )}
          <p className="text-sm text-white leading-relaxed">
            {isPlaceKnowledge && soulResponse?.place_identity_ko
              ? soulResponse.place_identity_ko
              : primaryDiscovery}
          </p>
        </Card>

        {/* ── JOURNEY — suppressed for non-cablecar PLACE_LOOKUP ── */}
        {(isCableCarView || !isPlaceKnowledge) && (
          <Card>
            <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">
              {hasContext ? 'SOUL이 보는 내 여행' : '여정'}
            </p>
            <JourneyFlow ctx={travelerContext} variantKey={soulVariantKey} />
            {soulResponse?.course?.blocks?.length > 0 ? (
              <div className="mt-4 border-t border-white border-opacity-10 pt-4">
                <CourseDisplay course={soulResponse.course} />
              </div>
            ) : soulResponse?.route?.days?.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-white border-opacity-10 pt-4">
                {soulResponse.route.days.flatMap(d => d.items || []).map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-xs text-white opacity-30 mt-0.5 shrink-0 w-12">{item.time_slot || ''}</span>
                    <div>
                      <p className={`text-sm leading-snug ${item.selection_status === 'LOCKED' ? 'text-star-gold' : 'text-white'}`}>
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── RICH BASIC — 요금 상세 ── */}
        {(isCableCarView || !isPlaceKnowledge) && (
          <ExpandableSection title="요금 상세">
            <p className="text-xs text-white opacity-40 mb-1">일반 캐빈 (8인 동승)</p>
            <FactRow label="대인 왕복" value="17,000원" note="편도 14,000원" />
            <FactRow label="소인 왕복" value="12,000원" note="편도 9,000원" />
            <p className="text-xs text-white opacity-40 pt-2">크리스탈 캐빈 (6인 동승)</p>
            <FactRow label="대인 왕복" value="24,000원" note="편도 19,000원" />
            <FactRow label="소인 왕복" value="19,000원" note="편도 14,000원" />
            <p className="text-xs text-white opacity-30 pt-1">소인: 36개월~초등학생</p>
            <p className="text-xs text-white opacity-30">경로(만 65세 이상) · 장애인 · 국가유공자 · 여수시민 할인 있음 · 할인 금액은 현장 확인</p>
          </ExpandableSection>
        )}

        {/* ── RICH BASIC — 캐빈 선택 ── */}
        {(isCableCarView || !isPlaceKnowledge) && (
          <ExpandableSection title="캐빈 선택">
            <div>
              <p className="text-xs text-white opacity-50 mb-1">일반 캐빈 (8인 동승)</p>
              <p className="text-sm text-white opacity-80 leading-relaxed">수동 휠체어, 접은 유모차 탑승 가능합니다.</p>
            </div>
            <div>
              <p className="text-xs text-white opacity-50 mb-1">크리스탈 캐빈 (6인 동승)</p>
              <p className="text-sm text-white opacity-80 leading-relaxed">강화유리 바닥으로 바다를 내려다볼 수 있어요. 요금이 일반보다 높습니다.</p>
              <p className="text-xs text-white opacity-50 mt-1.5">유모차·휠체어·캐리어 등 바퀴 있는 물품은 크리스탈 반입이 제한됩니다. 이 경우 일반 캐빈을 이용하세요.</p>
            </div>
            <p className="text-xs text-white opacity-40">전동휠체어는 탑승 제한. 웨건형·2인용 이상 유모차도 제한될 수 있습니다.</p>
            <p className="text-xs text-white opacity-30">탑승권 구매 방식은 방문 전 공식 안내를 확인하세요.</p>
          </ExpandableSection>
        )}

        {/* ── RICH BASIC — 운행 시간 · 날씨 ── */}
        {(isCableCarView || !isPlaceKnowledge) && (
          <ExpandableSection title="운행 시간 · 날씨">
            <FactRow label="기본 운행" value="09:30~21:30" note="날짜·시기에 따라 변경 가능" />
            <p className="text-xs text-white opacity-50">강풍 또는 기상·정비 상황에서 운행이 변경되거나 중단될 수 있어요. 비 자체가 무조건 중단 기준은 아닙니다.</p>
            <p className="text-xs text-white opacity-50">방문 당일 공식 운행 여부를 확인하는 것을 권장합니다.</p>
            <p className="text-xs text-white opacity-40">일몰·주말·성수기에는 혼잡할 수 있어요. 여유 있게 시간을 계획하세요.</p>
          </ExpandableSection>
        )}

        {/* ── RICH BASIC — 정류장 & 자동차 여행 ── */}
        {(isCableCarView || !isPlaceKnowledge) && (
          <ExpandableSection title="정류장 & 자동차 여행">
            <div>
              <p className="text-xs text-white opacity-50 mb-1">자산(해야정류장)</p>
              <p className="text-sm text-white opacity-80 leading-relaxed">자산공원·수정동 방면. 오동도 입구와 가까워 함께 묶기 좋아요.</p>
            </div>
            <div>
              <p className="text-xs text-white opacity-50 mb-1">돌산(놀아정류장)</p>
              <p className="text-sm text-white opacity-80 leading-relaxed">돌산도 방면. 돌산공원과 연결됩니다.</p>
            </div>
            <div>
              <p className="text-xs text-white opacity-50 mb-1">자동차 여행</p>
              <p className="text-sm text-white opacity-80 leading-relaxed">편도 이용 시 차량이 출발 정류장에 남아요. 왕복 이용하면 출발 정류장으로 돌아오기 때문에 차량 회수가 단순합니다.</p>
            </div>
          </ExpandableSection>
        )}

        {/* ── COST — shown only when CALCULATED ── */}
        {soulResponse?.quote?.status === 'CALCULATED' && (
          <Card>
            <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">예상 비용</p>
            <div className="space-y-1.5">
              {soulResponse.quote.breakdown?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white opacity-60">{item.name}</span>
                  <span className="text-white">{item.sell != null ? item.sell.toLocaleString('ko-KR') + '원' : ''}</span>
                </div>
              ))}
              {soulResponse.quote.pricing?.totalSell != null && (
                <div className="flex justify-between text-sm font-semibold border-t border-white border-opacity-10 pt-2 mt-2">
                  <span className="text-white">합계</span>
                  <span className="text-star-gold">{soulResponse.quote.pricing.totalSell.toLocaleString('ko-KR')}원</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ── DEPTH — Question Discovery ── */}
        {(isCableCarView || !isPlaceKnowledge) && (
          <div>
            <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">더 알고 싶을 때</p>
            <QuestionDiscovery ctx={travelerContext} />
            <p className="text-white opacity-30 text-xs mt-3">☎ 운행 문의: 061-664-7301</p>
          </div>
        )}

        {/* ── WISH SCENE — cable car STATE 2+ only ── */}
        {stateIndex >= 2 && (isCableCarView || !isPlaceKnowledge) && (
          <div className="rounded-2xl overflow-hidden" style={{ minHeight: '140px' }}>
            <img
              src="/dreamtown/images/soul/cable-car/wish-scene.png"
              alt=""
              className="w-full object-cover"
              style={{ minHeight: '140px', maxHeight: '200px' }}
              onError={(e) => {
                e.currentTarget.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}

      </div>

      {/* ── BOTTOM CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-night-sky bg-opacity-95 backdrop-blur-sm border-t border-white border-opacity-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <button
            disabled
            className="w-full py-3 rounded-2xl text-sm font-semibold border transition-all cursor-not-allowed"
            style={{
              background: 'rgba(155,135,245,0.15)',
              borderColor: 'rgba(155,135,245,0.3)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            내 여정에 담기
          </button>
          <p className="text-center text-xs text-white opacity-20 mt-1">소원꿈터 연결 예정</p>
        </div>
      </div>
    </div>
  );
}
