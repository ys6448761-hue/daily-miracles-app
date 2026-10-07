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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrEnsureGuestCredential } from '../api/dreamtown.js';
import CourseDisplay from '../components/TravelGuide/CourseDisplay.jsx';

// ── Odongdo judgment texts ───────────────────────────────────────────────────
// Source: Phoenix Knowledge — PLACE_IDENTITY_KO, itineraryService, SSOT YS01, Route Corpus
// Coverage: 방파제 길 (PLACE_IDENTITY_KO), 동백꽃 (dtArtifactWorker+itineraryService),
//           동백열차 (itineraryService+R041), suitable_for=[family,kids_ok,elderly,groups]
// NOT covered: bamboo/fountain (E gap), physical_difficulty (NULL), specific times
const ODONGDO_SOUL_DISCOVERY = {
  default:
    '오동도는 어디까지 들어가느냐에 따라 여행의 크기가 달라지는 곳이에요. 방파제 길을 걸으며 바다를 보는 것만으로도 충분하고, 여유가 있다면 섬 안쪽까지 더 들어가볼 수 있어요.',
  parents:
    '방파제 길은 바다를 보며 천천히 걷기 좋아요. 섬 안쪽으로 얼마나 들어갈지는 체력과 그날 상황에 따라 조절하면 돼요. 동백열차로 안쪽까지 이동하는 방법도 있어요.',
  family:
    '방파제 길을 따라 바다를 보고, 동백꽃이 피는 시즌이라면 섬 안쪽까지 함께 걷기 좋아요. 동백열차를 이용하면 섬 안까지 쉽게 들어갈 수도 있어요.',
  vehicle:
    '오동도는 방파제 길을 통해 걸어 들어가는 섬이에요. 차는 오동도 주변 주차장을 이용하게 돼요. 방문 전 주차 상황을 확인하는 것을 권장해요.',
};

// ── Odongdo FOR ME texts ──────────────────────────────────────────────────────
const ODONGDO_FOR_ME = {
  parents: '방파제까지는 부담 없이 걸을 수 있어요. 섬 안쪽으로 얼마나 들어갈지는 현장에서 체력에 따라 조절하세요.',
  family:  '동백꽃 시즌이라면 섬 안쪽까지 함께 걷기 좋아요. 동백열차로 편하게 들어가는 방법도 있어요.',
  vehicle: '오동도 주변 주차 상황은 방문 전 확인을 권장해요.',
};

// ── Odongdo variant key ───────────────────────────────────────────────────────
function getOdongdoVariantKey(ctx) {
  if (ctx.companion === 'parents') return 'parents';
  if (ctx.companion === 'family') return 'family';
  if (ctx.hasVehicle) return 'vehicle';
  return 'default';
}

// ── Hyangiram judgment texts ─────────────────────────────────────────────────
// Source: physical_difficulty=high (BATCH_01 CONFIRMED), suitable_for=[family,elderly,kids_ok,pilgrimage]
// emotion=serenity, tags=[dawn,faith,historical]. Two paths known (Prepared Knowledge — no path names verified).
// Route Corpus: 향일암→케이블카 occurrence=3 (OFFICIAL×1, WEB×1). avg_stay=90 (seed).
// NOT covered: exact step count, fixed climb time, accessibility claims, specific path names.
const HYANGIRAM_SOUL_DISCOVERY = {
  default:
    '향일암은 누구와 어떤 길로 어디까지 올라갈지를 먼저 생각하면 더 좋은 곳이에요. 올라가는 길이 두 가지라, 같은 향일암이라도 선택에 따라 경험이 달라져요.',
  parents:
    '향일암은 체력과 페이스가 먼저예요. 올라가는 길이 두 가지라 경사 차이가 있어요. 어디까지 갈지는 올라가면서 현장에서 함께 조율해도 돼요.',
  family:
    '향일암은 아이들과 함께라면 어디까지 올라갈지를 미리 이야기하고 가는 게 좋아요. 올라가는 길 선택이 경험의 크기를 결정해요.',
  vehicle:
    '차로 오신다면 공영주차장에서 출발하게 돼요. 오르기 전 주차 상황과 시간 여유를 먼저 확인하는 걸 권장해요.',
};

// ── Hyangiram FOR ME texts ────────────────────────────────────────────────────
// NOT included: accessibility claims, stroller/wheelchair totals — NOT verified by Phoenix
const HYANGIRAM_FOR_ME = {
  parents: '오르는 길 선택과 페이스 조절이 중요해요. 중간에 쉬어가며 어디까지 갈지는 현장에서 정해도 돼요.',
  family:  '아이 체력을 기준으로 어디까지 올라갈지 미리 이야기하고 가세요.',
  vehicle: '공영주차장 2시간 무료. 오르는 시간을 고려해 여유 있게 주차하세요.',
};

// ── Hyangiram variant key ─────────────────────────────────────────────────────
function getHyangiramVariantKey(ctx) {
  if (ctx.companion === 'parents') return 'parents';
  if (ctx.companion === 'family') return 'family';
  if (ctx.hasVehicle) return 'vehicle';
  return 'default';
}

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
const PLACE_HERO_MAP = {
  cablecar:  '/images/soul/place-hero/cablecar.png',
  odongdo:   '/images/soul/place-hero/odongdo.png',
  hyangiram: '/images/soul/place-hero/hyangiram.png',
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

// ── SOUL Answer Summary V0.1 ─────────────────────────────────────────────────
// Presentation layer only — no new judgment. Derives from existing soulResponse fields.
// Recomposes (replaces) on every new response — never accumulates.
function SoulAnswerSummary({ response }) {
  if (!response || !response.message_ko) return null;

  const mode = response.presentation_mode;
  const status = response.status;

  let badge = null;
  if (status !== 'JOURNEY_CONTINUITY') {
    if (mode === 'DISCOVERING' || (status === 'PLACE_LOOKUP' && response.places?.length > 0)) {
      badge = { label: '추천 가능', cls: 'text-green-300 bg-green-900 bg-opacity-40 border-green-700 border-opacity-40' };
    } else if (mode === 'PARTIAL') {
      badge = { label: '상황에 따라 달라요', cls: 'text-yellow-300 bg-yellow-900 bg-opacity-30 border-yellow-700 border-opacity-40' };
    } else if (status === 'CLARIFICATION' || (mode === 'CLARIFICATION' && status !== 'JOURNEY_CONTINUITY')) {
      badge = { label: '확인 필요', cls: 'text-blue-300 bg-blue-900 bg-opacity-30 border-blue-700 border-opacity-40' };
    }
  }

  // Copy hierarchy: first sentence = conclusion, rest = short Why
  const lines = response.message_ko.split('\n');
  const firstLine = lines[0] || '';
  const sentenceEnd = firstLine.search(/[.!?。]\s*/);
  const firstSentence = sentenceEnd >= 0 ? firstLine.slice(0, sentenceEnd + 1) : firstLine;
  const restOfFirst = sentenceEnd >= 0 ? firstLine.slice(sentenceEnd + 1).trim() : '';
  const restLines = [restOfFirst, ...lines.slice(1)].filter(Boolean).join('\n');

  const keyPoints = (response.why_details?.[0]?.place_features || []).slice(0, 3);
  const nextAction = response.next_options?.[0] || null;

  return (
    <Card>
      <p className="text-xs text-dream-purple font-semibold mb-2 uppercase tracking-wider">SOUL의 답</p>
      <p className="text-sm font-medium text-white leading-snug">{firstSentence}</p>
      {restLines && (
        <p className="text-sm text-white opacity-70 leading-relaxed mt-1 whitespace-pre-line">{restLines}</p>
      )}
      {badge && (
        <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium border ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      {keyPoints.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {keyPoints.map((pt, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-10 text-white opacity-70">
              {pt}
            </span>
          ))}
        </div>
      )}
      {nextAction && (
        <div className="mt-3 pt-3 border-t border-white border-opacity-10">
          <p className="text-xs text-white opacity-40 mb-1">다음에 알려주세요</p>
          <p className="text-xs text-white opacity-70 leading-snug">{nextAction}</p>
        </div>
      )}
    </Card>
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

// ── Odongdo 3-stage Experience Journey ───────────────────────────────────────
// Stage model: 방파제 진입 → 섬 내부 경험 → 귀환
// Source: PLACE_IDENTITY_KO "방파제 길", itineraryService "동백열차", Route Corpus R033 "등대"
// NOT included: specific durations (avg_stay CONFLICT 120↔30~60), physical difficulty (NULL)
function OdongdoJourneyFlow({ ctx }) {
  const hasParents = ctx.companion === 'parents';
  const hasFamily  = ctx.companion === 'family';
  const hasVehicle = ctx.hasVehicle;

  const JOURNEY_NOTES = {
    default:  '방파제 길을 걷는 것만으로도 충분하고, 여유가 있다면 안쪽까지 더 들어가볼 수 있어요.',
    parents:  '방파제 길은 천천히 걷기 좋아요. 섬 안쪽으로 얼마나 들어갈지는 현장에서 상황 봐가며 결정하세요.',
    family:   '동백열차를 이용하면 섬 안까지 쉽게 들어갈 수 있어요.',
    vehicle:  '오동도 주변 주차 상황은 방문 전 확인을 권장해요.',
  };
  const noteKey = hasParents ? 'parents' : hasFamily ? 'family' : hasVehicle ? 'vehicle' : 'default';
  const journeyNote = JOURNEY_NOTES[noteKey];

  return (
    <div>
      <div className="flex items-center gap-2 overflow-x-auto py-1">

        {/* Stage 1 — 방파제 진입 */}
        <div className="flex-shrink-0 text-center min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-900 bg-opacity-50 border border-blue-500 border-opacity-40 flex items-center justify-center mx-auto text-base">
            {hasVehicle ? '🅿️' : '🚶'}
          </div>
          <div className="text-xs text-white opacity-70 mt-1">방파제</div>
          {hasVehicle && (
            <div className="text-xs text-white opacity-30 mt-0.5">주차 확인</div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center min-w-[40px]">
          <div className="w-full flex items-center">
            <div className="flex-1 h-px bg-blue-400 opacity-30" />
          </div>
          <div className="text-xs text-white opacity-20 mt-1">입장</div>
        </div>

        {/* Stage 2 — 섬 내부 경험 */}
        <div className="flex-shrink-0 text-center min-w-0">
          <div className="w-9 h-9 rounded-full bg-green-900 bg-opacity-50 border border-green-500 border-opacity-40 flex items-center justify-center mx-auto text-base">
            🌸
          </div>
          <div className="text-xs text-white opacity-70 mt-1">섬 내부</div>
          {(hasFamily || hasParents) && (
            <div className="text-xs text-white opacity-30 mt-0.5">동백열차↗</div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center min-w-[40px]">
          <div className="w-full flex items-center">
            <div className="flex-1 h-px border-t border-dashed border-white border-opacity-20" />
          </div>
          <div className="text-xs text-white opacity-20 mt-1">↔</div>
        </div>

        {/* Stage 3 — 귀환 */}
        <div className="flex-shrink-0 text-center min-w-0">
          <div className="w-9 h-9 rounded-full bg-white bg-opacity-10 border border-white border-opacity-20 flex items-center justify-center mx-auto text-base">
            ↩
          </div>
          <div className="text-xs text-white opacity-50 mt-1">귀환</div>
        </div>
      </div>

      {journeyNote && (
        <p className="text-xs text-dream-purple opacity-70 mt-2 leading-relaxed">{journeyNote}</p>
      )}
    </div>
  );
}

// ── Odongdo Next Journey — where to go after ─────────────────────────────────
// Source: Route Corpus patterns (오동도→이순신광장/낭만포차/케이블카)
// Travel times: ALL UNKNOWN — no numbers invented
function OdongdoNextJourney() {
  return (
    <div className="space-y-2 text-sm text-white opacity-70 leading-relaxed">
      <p>오동도를 나온 뒤 도심 방향으로 이어가거나, 케이블카와 연결하는 여정도 있어요.</p>
      <p className="text-xs text-white opacity-40">이순신광장·낭만포차거리, 또는 케이블카 방면 동선이 자주 등장해요. 이동시간은 방문 시 확인하세요.</p>
    </div>
  );
}

// ── Odongdo Question Discovery ────────────────────────────────────────────────
// ── Hyangiram JourneyFlow ─────────────────────────────────────────────────────
// Source: physical_difficulty=high (BATCH_01), seed outdoor, Route Corpus FULL_DAY.
// Two paths: gently-sloped vs steeper — Prepared Knowledge. NO path names verified.
// NOT claimed: exact step count, fixed climb time, complete accessibility, path names
function HyangiramJourneyFlow({ ctx }) {
  const hasParents = ctx.companion === 'parents';
  const hasFamily  = ctx.companion === 'family';
  const hasVehicle = ctx.hasVehicle;

  const journeyNotes = hasParents
    ? '페이스를 낮추고 중간에 쉬어가며 올라가세요. 어디까지 갈지는 현장에서 조율해도 돼요.'
    : hasFamily
    ? '아이와 함께라면 중간 쉬는 지점을 미리 이야기해두면 좋아요.'
    : hasVehicle
    ? '공영주차장 2시간 무료. 오르는 시간을 고려해 여유 있게 주차하세요.'
    : '오르는 길 선택이 먼저예요. 한 방향으로 오르고 다른 방향으로 내려오는 방법도 있어요.';

  const steps = [
    {
      label: hasVehicle ? '🅿️ 도착 — 공영주차장' : '🚶 도착 — 현장',
      note: hasVehicle ? '공영주차장 2시간 무료 (현장 혼잡 확인 권장)' : null,
    },
    {
      label: '🗺️ 길 선택',
      note: '두 경로 있음 — 경사 차이가 있어요. 체력과 동행자 상황에 맞게 선택하세요.',
    },
    {
      label: '⛰️ 오르기',
      note: journeyNotes,
    },
    {
      label: '🏛️ 향일암 경험',
      note: '절벽 암자 · 바위 통로 · 높은 곳의 바다 전망',
    },
    {
      label: '↩ 내려오기',
      note: '올라온 길 또는 다른 경로로 내려갈 수 있어요. 하산 체력을 남겨두세요.',
    },
  ];

  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'rgba(155,135,245,0.7)' }} />
            {i < steps.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(155,135,245,0.2)', minHeight: '16px' }} />}
          </div>
          <div className="pb-2">
            <p className="text-sm text-white font-medium">{s.label}</p>
            {s.note && <p className="text-xs text-white opacity-50 mt-0.5">{s.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Hyangiram NextJourney ─────────────────────────────────────────────────────
// Source: Route Corpus 향일암→케이블카 occurrence=3 (OFFICIAL×1, WEB×1, R035/R036/R038)
// NO verified travel time → 이동시간 숫자 없음
// NOT claimed: fixed next place, "무조건 케이블카"
function HyangiramNextJourney({ ctx }) {
  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-xs text-white opacity-40 mb-2 uppercase tracking-wider">하산 후 — 체력에 따라</p>
      <div className="space-y-2 text-sm text-white">
        <div>
          <span className="opacity-60">여유 있음</span>
          <span className="ml-2 opacity-80">여수해상케이블카 · 오동도 방향</span>
        </div>
        <div>
          <span className="opacity-60">조금 지침</span>
          <span className="ml-2 opacity-80">식사 · 카페 등 앉아서 쉬는 장소 먼저</span>
        </div>
        <div>
          <span className="opacity-60">많이 지침</span>
          <span className="ml-2 opacity-80">숙소 또는 가벼운 일정으로 전환 권장</span>
        </div>
      </div>
      <p className="text-xs text-white opacity-25 mt-2">이동시간은 교통·출발지에 따라 달라요 — 현장 확인 권장</p>
    </div>
  );
}

// ── Hyangiram QuestionDiscovery ───────────────────────────────────────────────
// Source: BATCH_01 (hours=04:00~19:00), physical_difficulty=high, two paths (Prepared Knowledge)
// NOT claimed: exact step count, complete accessibility, fixed sunrise time
function HyangiramQuestionDiscovery({ ctx }) {
  const [openKeys, setOpenKeys] = useState(new Set());
  function toggle(key) {
    setOpenKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const hasParents = ctx.companion === 'parents';
  const hasFamily  = ctx.companion === 'family';

  const items = [
    hasParents && {
      key: 'parents',
      icon: '👴',
      q: '부모님과 함께라면 어디까지 올라가면 좋아요?',
      a: '나이보다는 평소 계단·오르막 걷는 상태가 더 중요해요. 올라가는 길이 두 가지라 경사 차이가 있어요. 중간에 쉬어가며 어디까지 갈지는 현장에서 함께 조율하는 게 좋아요.',
    },
    hasFamily && {
      key: 'family',
      icon: '👶',
      q: '아이들과 함께 올라갈 수 있어요?',
      a: '아이들과 함께 올라갈 수 있어요. 오르는 길이 계단이 많아요. 아이 체력과 페이스를 기준으로 어디까지 갈지 미리 이야기하고 가는 걸 권장해요.',
    },
    {
      key: 'paths',
      icon: '🗺️',
      q: '올라가는 길이 두 가지라고 들었어요',
      a: '두 경로 모두 올라갈 수 있어요. 한 쪽은 더 가파르고, 다른 쪽은 상대적으로 완만해요. 두 길로 각각 오르고 내리는 방법도 있어요. 완만한 길도 계단이 없지는 않아요.',
    },
    {
      key: 'hours',
      icon: '🕐',
      q: '몇 시부터 입장할 수 있어요?',
      a: '확인된 운영시간은 04:00~19:00예요. 현장 변동이 있을 수 있어 방문 전 확인을 권장해요.',
    },
    {
      key: 'sunrise',
      icon: '🌅',
      q: '일출 보러 가려면 어떻게 해야 해요?',
      a: '향일암은 일출 명소로 알려진 곳이에요. 확인된 운영시간은 04:00~19:00이에요. 일출 시간 자체는 날짜에 따라 달라요. 일출 시즌에는 방문객이 많아 이른 도착을 권장해요. 당일 운영 여부는 방문 전 확인하세요.',
    },
    {
      key: 'next',
      icon: '➡️',
      q: '향일암 다음엔 어디가 좋아요?',
      a: '향일암 다음으로 여수해상케이블카를 연결하는 경로가 여러 코스에서 자주 나와요. 하산 후 체력과 남은 시간에 따라 정하는 게 좋아요. 이동시간은 교통 방법에 따라 달라요.',
    },
  ].filter(Boolean);

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.key} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => toggle(item.key)}
            className="w-full text-left px-4 py-3 flex items-start gap-2"
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            <span className="text-sm text-white opacity-80 leading-snug">{item.q}</span>
            <span className="ml-auto text-white opacity-30 text-xs flex-shrink-0">{openKeys.has(item.key) ? '▲' : '▼'}</span>
          </button>
          {openKeys.has(item.key) && (
            <div className="px-4 pb-3">
              <p className="text-sm text-white opacity-60 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Source: itineraryService (동백열차), Route Corpus R033 (등대), SSOT YS01 (바다), Route patterns
// NOT claimed: specific durations, fountain facts, bamboo facts, exact bloom month
function OdongdoQuestionDiscovery({ ctx }) {
  const [openKeys, setOpenKeys] = useState(new Set());
  function toggle(key) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const hasParents = ctx.companion === 'parents';
  const hasFamily  = ctx.companion === 'family';

  const contextQuestions = [
    hasParents && {
      key: 'parents_walk',
      icon: '👨‍👩‍👧',
      q: '부모님과 함께라면 어느 정도까지 걷는 게 좋아요?',
      a: '방파제 길은 걸을 수 있어요. 섬 안쪽으로 들어갈수록 길이 달라져요. 동백열차로 안쪽까지 이동하는 방법도 있어요. 체력 상태에 따라 현장에서 조절하세요.',
    },
    hasFamily && {
      key: 'family_kids',
      icon: '👨‍👩‍👦',
      q: '아이들과 어디까지 가면 좋아요?',
      a: '방파제 길을 따라 바다를 보고, 동백열차를 이용하면 섬 안쪽까지 이동할 수 있어요. 동백꽃이 피는 시즌이라면 섬 안까지 걷기 좋아요.',
    },
  ].filter(Boolean);

  const generalQuestions = [
    {
      key: 'dongbaek_train',
      icon: '🚂',
      q: '동백열차는 어떻게 이용해요?',
      a: '오동도 입구에서 섬 안쪽까지 이동하는 작은 열차예요. 운행 시간과 요금은 방문 전 확인을 권장해요.',
    },
    {
      key: 'walking',
      icon: '🚶',
      q: '걸어서 섬을 돌아볼 수 있어요?',
      a: '방파제 길과 섬 안쪽을 도보로 돌아볼 수 있어요. 여유 있게 계획하는 것을 권장해요.',
    },
    {
      key: 'next_place',
      icon: '🗺️',
      q: '오동도 다음엔 어디가 좋아요?',
      a: '오동도를 나오면 도심 방면으로 이어가기 좋아요. 이순신광장·낭만포차거리 방향이나 케이블카 방면 동선이 자주 등장해요.',
    },
    {
      key: 'camellia',
      icon: '🌸',
      q: '동백꽃은 언제 피어요?',
      a: '여수 오동도 동백꽃은 겨울부터 봄 사이에 피어요. 해마다 개화 시기가 다를 수 있어 방문 전 확인을 권장해요.',
    },
  ];

  const questions = [...contextQuestions, ...generalQuestions];

  return (
    <div className="space-y-2">
      {questions.map(({ key, icon, q, a }) => {
        const isOpen = openKeys.has(key);
        return (
          <div key={key} className="rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10 overflow-hidden">
            <button onClick={() => toggle(key)} className="w-full flex items-start gap-3 px-4 py-3 text-left">
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
const SUPPORTED_PLACE_CODES = ['cablecar', 'odongdo', 'hyangiram'];

export default function SoulCableCarPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Entry place from URL (?place=odongdo|hyangiram) — set by MuyojeongHomePage place cards.
  // Falls through the placeCode chain so the correct Living Detail view is shown on entry.
  const urlPlace = searchParams.get('place');
  const entryPlaceCode = SUPPORTED_PLACE_CODES.includes(urlPlace) ? urlPlace : null;

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
  // V0.1: navPlaceCode — override to navigate to a Living Detail from SOUL Discovery results.
  // Resets on each new user submission. Persists across response turns for smooth navigation.
  const [navPlaceCode, setNavPlaceCode] = useState(null);

  const isPlaceKnowledge =
    soulResponse?.presentation_mode === 'PLACE_KNOWLEDGE' &&
    soulResponse?.status === 'PLACE_LOOKUP' &&
    soulResponse?.resolved_code != null;
  const placeCode = navPlaceCode || (isPlaceKnowledge ? soulResponse.resolved_code : entryPlaceCode || 'cablecar');
  const placeData = isPlaceKnowledge ? (soulResponse.places?.[0] ?? null) : null;
  const isCableCarView  = placeCode === 'cablecar';
  const isOdongdoView   = placeCode === 'odongdo';
  const isHyangiramView = placeCode === 'hyangiram';
  const heroSrc = PLACE_HERO_MAP[placeCode] ?? null;

  const hasContext =
    travelerContext.hasVehicle || travelerContext.nextPlace || travelerContext.companion;
  const hasParents = travelerContext.companion === 'parents';
  const hasFamily  = travelerContext.companion === 'family';

  const stateIndex = hasParents
    ? 3
    : travelerContext.nextPlace
    ? 2
    : travelerContext.hasVehicle
    ? 1
    : 0;

  const soulVariantKey      = getSoulVariantKey(travelerContext);
  const odongdoVariantKey   = getOdongdoVariantKey(travelerContext);
  const hyangiramVariantKey = getHyangiramVariantKey(travelerContext);

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

  const primaryDiscovery = isOdongdoView
    ? (ODONGDO_SOUL_DISCOVERY[odongdoVariantKey] ?? ODONGDO_SOUL_DISCOVERY.default)
    : isHyangiramView
    ? (HYANGIRAM_SOUL_DISCOVERY[hyangiramVariantKey] ?? HYANGIRAM_SOUL_DISCOVERY.default)
    : (SOUL_DISCOVERY[soulVariantKey] ?? SOUL_DISCOVERY.default);

  async function handleSubmit(e) {
    e.preventDefault();
    const raw = inputValue.trim();
    if (!raw || isLoading) return;

    const updated = parseContext(raw, travelerContext);
    setTravelerContext(updated);

    // Gap B — UI-001 explicit_context wiring
    // Chip state → explicit_context (advisory, not commanding)
    // Rules: chip does NOT auto-submit, does NOT fabricate sentences, text place alias wins
    // V0.1: place_code sent as page-context signal (NOT chip-driven place lookup).
    // Backend uses this to: exclude current place from Discovery + context-aware message framing.
    const explicit_context = {};
    explicit_context.place_code = placeCode; // current Living Detail page context
    if (updated.hasVehicle) explicit_context.has_car = true;
    if (updated.companion === 'parents') explicit_context.people_type = 'family_elderly';
    else if (updated.companion === 'family') explicit_context.people_type = 'family_with_kids';

    setNavPlaceCode(null); // Reset Living Detail navigation override on new query
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
            {isCableCarView ? '여수해상케이블카' : isOdongdoView ? '오동도' : isHyangiramView ? '향일암' : (placeData?.name_ko || '여수해상케이블카')}
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
              placeholder={isOdongdoView ? '오동도에 대해 뭐든 물어보세요' : isHyangiramView ? '향일암에 대해 뭐든 물어보세요' : '케이블카에 대해 뭐든 물어보세요'}
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

        {/* ── SOUL ANSWER SUMMARY (V0.1) ── */}
        {/* Directly below input card, before Place Hero — normal document flow. */}
        {/* Success: structured summary. Error (bootstrap/network fail): plain message card. */}
        {soulResponse
          ? <SoulAnswerSummary response={soulResponse} />
          : soulMessage
          ? (
            <Card>
              <p className="text-xs text-dream-purple font-semibold mb-2 uppercase tracking-wider">안내</p>
              <p className="text-sm text-white leading-relaxed">{soulMessage}</p>
            </Card>
          )
          : null
        }

        {/* ── LIVING DETAIL NAVIGATION (V0.1) ─────────────────────────────────────
             When SOUL Discovery response includes places with a Living Detail page,
             show navigation buttons. Clicking switches the Living Detail view below.
             Resets on next user query. No new chat UI — additive to existing response.
        ────────────────────────────────────────────────────────────────────────── */}
        {soulResponse?.presentation_mode === 'DISCOVERING' && (() => {
          const DETAIL_NAMES = { cablecar: '여수해상케이블카', odongdo: '오동도', hyangiram: '향일암' };
          const detailPlaces = (soulResponse.places || []).filter(p => DETAIL_NAMES[p.code]);
          if (detailPlaces.length === 0) return null;
          return (
            <Card>
              <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">장소 자세히 보기</p>
              <div className="space-y-2">
                {detailPlaces.map(p => (
                  <button
                    key={p.code}
                    onClick={() => setNavPlaceCode(p.code)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-white bg-opacity-5 hover:bg-opacity-10 transition-colors"
                  >
                    <span className="text-sm text-white font-medium">{DETAIL_NAMES[p.code]}</span>
                    <span className="text-xs text-white opacity-40 ml-2">자세히 보기 →</span>
                  </button>
                ))}
              </div>
            </Card>
          );
        })()}

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
                {isCableCarView ? '여수해상케이블카' : isOdongdoView ? '오동도' : isHyangiramView ? '향일암' : (placeData?.name_ko || '')}
              </h2>
              {isCableCarView && (
                <p className="text-sm text-white opacity-60 mt-1">
                  도시와 섬 사이 · 바다 위를 건너는 여수
                </p>
              )}
              {isOdongdoView && (
                <p className="text-sm text-white opacity-60 mt-1">
                  방파제 끝에서 만나는 섬 · 바다와 동백의 여수
                </p>
              )}
              {isHyangiramView && (
                <p className="text-sm text-white opacity-60 mt-1">
                  절벽 위의 암자 · 바다와 빛의 여수
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── ESSENTIAL INFO ── */}
        {/* Cable car: prepared static facts (DB data incomplete — known, deliberate).  */}
        {/* Odongdo: curated verified facts only — DB fields (admission/hours/difficulty/parking)    */}
        {/*          are NULL or unverified; generic formatter would expose unverified runtime data. */}
        {/* Other places: PlaceBasicInfo V0.2 formatter logic + FactRow (null-tolerant). */}
        <Card>
          <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">알아야 할 것</p>
          {isHyangiramView ? (
            // Hyangiram curated — BATCH_01 verified: admission=무료, hours=04:00~19:00,
            //   physical_difficulty=high, parking=공영주차장 2시간 무료. Seed: outdoor.
            // NOT shown: exact step count, fixed climb time, accessibility totals (not verified)
            // Advisory on hours/admission: official transition date 재확인 권장 (BATCH_01 note)
            <>
              <FactRow label="환경" value="야외 / 산 암자" note="오르는 길 포함 — 계단 많음" />
              <FactRow label="입장" value="무료" />
              <FactRow label="입장시간" value="04:00~19:00" />
              <FactRow label="주차" value="공영주차장 2시간 무료" />
              <p className="text-xs text-white opacity-30 mt-2">
                입장료·운영시간·주차는 방문 전 현장 확인을 권장해요.
              </p>
            </>
          ) : isOdongdoView ? (
            // Odongdo curated — only Seed ORIGIN data + itineraryService/Route Corpus knowledge
            // NOT shown: admission_fee (unverified), opening_hours (unverified),
            //            avg_stay (CONFLICT 120↔30~60min), physical_difficulty (NULL)
            <>
              <FactRow label="환경" value="야외" note="방파제 길 걷기 또는 동백열차로 섬 입장" />
              <p className="text-xs text-white opacity-30 mt-2">
                입장료·운영시간·주차는 방문 전 확인을 권장해요.
              </p>
            </>
          ) : isCableCarView ? (
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

        {/* ── HYANGIRAM: EXPERIENCE SUNRISE — 일출·빛 장소 정체성 ── */}
        {/* Source: seed weather_suitable=['sunrise'], emotion_tags=['dawn','faith','historical'] */}
        {/* Seed: ORIGIN-002. Route Corpus R037: 06:30 일출(선택). BATCH_01: 04:00 입장 확인. */}
        {isHyangiramView && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '220px' }}>
            <img
              src="/images/soul/hyangiram/context-sunrise.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 40%' }}
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.45) 0%, transparent 55%)' }}
            />
            <div className="relative z-10 p-4 flex flex-col justify-end" style={{ minHeight: '220px' }}>
              <div className="mt-auto">
                <p className="text-xs text-white opacity-60">빛과 바다의 향일암</p>
              </div>
            </div>
          </div>
        )}

        {/* ── HYANGIRAM: FOR ME ── */}
        {isHyangiramView && hyangiramVariantKey !== 'default' && HYANGIRAM_FOR_ME[hyangiramVariantKey] && (
          <Card className="border-dream-purple border-opacity-30">
            <p className="text-xs text-dream-purple font-semibold mb-2 uppercase tracking-wider">나에게 중요한 것</p>
            <p className="text-sm text-white leading-relaxed">{HYANGIRAM_FOR_ME[hyangiramVariantKey]}</p>
          </Card>
        )}

        {/* ── HYANGIRAM: CONTEXT PARENTS REST — 부모님/어르신 동행 시각 지지 ── */}
        {/* Source: suitable_for=['elderly'], seed ORIGIN-002, physical_difficulty=high (BATCH_01) */}
        {/* NOT a claim of full accessibility — shows rest/pause context only */}
        {isHyangiramView && hasParents && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '180px' }}>
            <img
              src="/images/soul/hyangiram/context-parents-rest.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.20) 0%, transparent 40%)' }}
            />
          </div>
        )}

        {/* ── HYANGIRAM: EXPERIENCE LIGHT STEPS — 오르는 길 경험 ── */}
        {/* Source: physical_difficulty=high (BATCH_01), seed outdoor, Route Corpus FULL_DAY experience */}
        {isHyangiramView && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '200px' }}>
            <img
              src="/images/soul/hyangiram/experience-light-steps.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.18) 0%, transparent 40%)' }}
            />
          </div>
        )}

        {/* ── HYANGIRAM: EXPERIENCE JOURNEY — 도착→길선택→오르기→향일암→내려오기 ── */}
        {isHyangiramView && (
          <Card>
            <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">
              SOUL이 보는 내 여행
            </p>
            <HyangiramJourneyFlow ctx={travelerContext} />
            <HyangiramNextJourney ctx={travelerContext} />
          </Card>
        )}

        {/* ── HYANGIRAM: EXPERIENCE ROCK PASSAGE — 돌문/바위 통로 진입 경험 ── */}
        {/* Source: Phoenix directive "돌문/진입 경험" as Experience Reward */}
        {isHyangiramView && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '200px' }}>
            <img
              src="/images/soul/hyangiram/experience-rock-passage.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 50%' }}
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.18) 0%, transparent 40%)' }}
            />
          </div>
        )}

        {/* ── HYANGIRAM: EXPERIENCE SEA VIEW — 높은 곳의 바다 전망 ── */}
        {/* Source: Phoenix directive "바다", "높은 곳에서의 시야". seed emotion=serenity */}
        {isHyangiramView && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '220px' }}>
            <img
              src="/images/soul/hyangiram/experience-sea-view.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 40%' }}
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.18) 0%, transparent 40%)' }}
            />
          </div>
        )}

        {/* ── HYANGIRAM: Question Discovery ── */}
        {isHyangiramView && (
          <div>
            <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">더 알고 싶을 때</p>
            <HyangiramQuestionDiscovery ctx={travelerContext} />
          </div>
        )}

        {/* ── HYANGIRAM: Wish Scene — 바다+빛 감정 마무리 ── */}
        {/* Source: SOUL_HYANGIRAM_WISH_SCENE_SEA_LIGHT_V01.png (Founder asset). stateIndex>=1 */}
        {stateIndex >= 1 && isHyangiramView && (
          <div className="rounded-2xl overflow-hidden relative mt-2" style={{ minHeight: '260px' }}>
            <img
              src="/images/soul/hyangiram/wish-scene.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.22) 0%, transparent 45%)' }}
            />
          </div>
        )}

        {/* ── ODONGDO: EXPERIENCE CAMELLIA — 동백꽃 섬 정체성 ── */}
        {/* Source: dtArtifactWorker keywords, itineraryService "동백꽃", SSOT YS01 */}
        {isOdongdoView && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '220px' }}>
            <img
              src="/images/soul/odongdo/experience-camellia.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 40%' }}
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.50) 0%, transparent 55%)' }}
            />
            <div className="relative z-10 p-4 flex flex-col justify-end" style={{ minHeight: '220px' }}>
              <div className="mt-auto">
                <p className="text-xs text-white opacity-60">동백꽃과 함께하는 오동도</p>
              </div>
            </div>
          </div>
        )}

        {/* ── EXPERIENCE: CITY VIEW — visual transition from factual trust to experience ── */}
        {isCableCarView && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '220px' }}>
            <img
              src="/images/soul/cable-car/experience-city-view.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 40%' }}
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.55) 0%, transparent 55%)' }}
            />
            <div className="relative z-10 p-4 flex flex-col justify-end" style={{ minHeight: '220px' }}>
              <div className="mt-auto">
                <p className="text-xs text-white opacity-60">바다 위에서 만나는 여수</p>
              </div>
            </div>
          </div>
        )}

        {/* ── FOR ME — cable-car context only ── */}
        {isCableCarView && (
          <ForMeSection
            stateIndex={stateIndex}
            variantKey={soulVariantKey}
            prevJourneyNote={prevJourneyNote}
          />
        )}

        {/* ── ODONGDO: FOR ME — companion or vehicle context ── */}
        {isOdongdoView && odongdoVariantKey !== 'default' && ODONGDO_FOR_ME[odongdoVariantKey] && (
          <Card className="border-dream-purple border-opacity-30">
            <p className="text-xs text-dream-purple font-semibold mb-2 uppercase tracking-wider">나에게 중요한 것</p>
            <p className="text-sm text-white leading-relaxed">{ODONGDO_FOR_ME[odongdoVariantKey]}</p>
          </Card>
        )}

        {/* ── CONTEXT: FAMILY SUNSET — shown when family/parents context active ── */}
        {isCableCarView && (travelerContext.companion === 'family' || travelerContext.companion === 'parents') && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '180px' }}>
            <img
              src="/images/soul/cable-car/context-family-sunset.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.20) 0%, transparent 40%)' }}
            />
          </div>
        )}

        {/* ── ODONGDO: CONTEXT FAMILY WALK — 가족/부모님 동행 시각 지지 ── */}
        {/* Source: suitable_for=['family','elderly','kids_ok'], PLACE_IDENTITY_KO "방파제 길" */}
        {isOdongdoView && (hasFamily || hasParents) && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '180px' }}>
            <img
              src="/images/soul/odongdo/context-family-walk.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.20) 0%, transparent 40%)' }}
            />
          </div>
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

        {/* ── EXPERIENCE: CABIN VIEW — visual breathing moment before Journey ── */}
        {isCableCarView && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '200px' }}>
            <img
              src="/images/soul/cable-car/experience-cabin-view.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 35%' }}
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.18) 0%, transparent 40%)' }}
            />
          </div>
        )}

        {/* ── ODONGDO: EXPERIENCE SEA DISCOVERY — 바다 발견 시각 ── */}
        {/* Source: dtArtifactWorker "solitary figure gazing outward", SSOT YS01 "설렘, 시작" */}
        {isOdongdoView && (
          <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: '200px' }}>
            <img
              src="/images/soul/odongdo/experience-sea-discovery.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 35%' }}
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.18) 0%, transparent 40%)' }}
            />
          </div>
        )}

        {/* ── ODONGDO: EXPERIENCE JOURNEY — 3-stage internal + next ── */}
        {isOdongdoView && (
          <Card>
            <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">
              {hasContext ? 'SOUL이 보는 내 여행' : '여정'}
            </p>
            <OdongdoJourneyFlow ctx={travelerContext} />
            <div className="mt-4 pt-4 border-t border-white border-opacity-10">
              <p className="text-xs text-white opacity-40 mb-2 font-medium uppercase tracking-wider">오동도 이후</p>
              <OdongdoNextJourney />
            </div>
          </Card>
        )}

        {/* ── JOURNEY — suppressed for non-cablecar PLACE_LOOKUP ── */}
        {isCableCarView && (
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
        {isCableCarView && (
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
        {isCableCarView && (
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
        {isCableCarView && (
          <ExpandableSection title="운행 시간 · 날씨">
            <FactRow label="기본 운행" value="09:30~21:30" note="날짜·시기에 따라 변경 가능" />
            <p className="text-xs text-white opacity-50">강풍 또는 기상·정비 상황에서 운행이 변경되거나 중단될 수 있어요. 비 자체가 무조건 중단 기준은 아닙니다.</p>
            <p className="text-xs text-white opacity-50">방문 당일 공식 운행 여부를 확인하는 것을 권장합니다.</p>
            <p className="text-xs text-white opacity-40">일몰·주말·성수기에는 혼잡할 수 있어요. 여유 있게 시간을 계획하세요.</p>
          </ExpandableSection>
        )}

        {/* ── RICH BASIC — 정류장 & 자동차 여행 ── */}
        {isCableCarView && (
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
        {isCableCarView && (
          <div>
            <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">더 알고 싶을 때</p>
            <QuestionDiscovery ctx={travelerContext} />
            <p className="text-white opacity-30 text-xs mt-3">☎ 운행 문의: 061-664-7301</p>
          </div>
        )}

        {/* ── ODONGDO: Question Discovery ── */}
        {isOdongdoView && (
          <div>
            <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">더 알고 싶을 때</p>
            <OdongdoQuestionDiscovery ctx={travelerContext} />
          </div>
        )}

        {/* ── WISH SCENE — cable car STATE 2+ only ── */}
        {stateIndex >= 2 && isCableCarView && (
          <div className="rounded-2xl overflow-hidden relative mt-2" style={{ minHeight: '260px' }}>
            <img
              src="/images/soul/cable-car/wish-scene.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.22) 0%, transparent 45%)' }}
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
