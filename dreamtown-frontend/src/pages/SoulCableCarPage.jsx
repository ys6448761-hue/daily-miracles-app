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

// ── Canonical judgment texts ─────────────────────────────────────────────────
const SOUL_DISCOVERY = {
  default:
    '자산과 돌산, 어느 쪽에서도 이용할 수 있어요. 어디서 출발하고 케이블카 다음에 어디로 가실지 알려주시면, 여행 동선에 맞는 쪽을 같이 볼게요.',
  vehicle:
    '자산정류장 주차장에 차를 두고 타시면 편해요. 왕복 운행이라 원하는 방향으로 타고 내리실 수 있어요.',
  odongdo:
    '오동도까지 이어가신다면 자산 쪽을 동선 후보로 먼저 볼 만해요. 다만 차를 어디에 둘지와 케이블카를 왕복할지에 따라 더 편한 동선은 달라질 수 있어요.',
  parents:
    '크리스탈 캐빈은 바닥이 투명해요. 고소 불편이 있으신 분이라면 일반 캐빈이 더 편하실 수 있어요. 탑승 전 현장에서 선택하실 수 있습니다.',
};

// ── place hero asset map ──────────────────────────────────────────────────────
// Legacy Yeosu Origin OG images deleted (Founder decision 2026-10-04).
// heroSrc resolves to null → gradient background shown (safe fallback).
const PLACE_HERO_MAP = {};

// ── FOR ME texts ─────────────────────────────────────────────────────────────
const FOR_ME = {
  vehicle: '자산정류장 주차장(1,000+대)을 이용하세요. 성수기 주말엔 오전 일찍 도착하면 여유 있습니다.',
  odongdo: '자산 하차 후 오동도 입구까지 도보 약 5분. 케이블카 + 오동도 합산 반나절(3~4시간) 코스입니다.',
  parents: '일반/크리스탈 캐빈은 당일 매표소에서 선택하시면 돼요. 미리 예약하실 필요 없습니다.',
};

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

function JourneyFlow({ ctx }) {
  const showOdongdo = ctx.nextPlace === 'odongdo';
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      <div className="flex-shrink-0 text-center min-w-0">
        <div className="w-9 h-9 rounded-full bg-dream-purple bg-opacity-40 border border-dream-purple border-opacity-60 flex items-center justify-center mx-auto text-base">
          {ctx.hasVehicle ? '🚗' : '🚶'}
        </div>
        <div className="text-xs text-white opacity-70 mt-1">자산</div>
        {ctx.hasVehicle && (
          <div className="text-xs text-star-gold mt-0.5">주차</div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center min-w-[56px]">
        <div className="w-full flex items-center gap-0.5">
          <div className="flex-1 h-px bg-dream-purple opacity-40" />
          <span className="text-base flex-shrink-0">🚡</span>
          <div className="flex-1 h-px bg-dream-purple opacity-40" />
        </div>
        <div className="text-xs text-white opacity-30 mt-1">편도 약 10분</div>
      </div>

      <div className="flex-shrink-0 text-center min-w-0">
        <div className="w-9 h-9 rounded-full bg-white bg-opacity-10 border border-white border-opacity-20 flex items-center justify-center mx-auto text-base">
          🏔️
        </div>
        <div className="text-xs text-white opacity-70 mt-1">돌산</div>
      </div>

      {showOdongdo && (
        <>
          <div className="flex-shrink-0 flex flex-col items-center min-w-[40px]">
            <div className="w-full flex items-center gap-0.5">
              <div className="flex-1 h-px border-t border-dashed border-white border-opacity-20" />
            </div>
            <div className="text-xs text-white opacity-20 mt-1">···</div>
          </div>
          <div className="flex-shrink-0 text-center min-w-0">
            <div className="w-9 h-9 rounded-full bg-green-900 bg-opacity-50 border border-green-600 border-opacity-40 flex items-center justify-center mx-auto text-base">
              🌿
            </div>
            <div className="text-xs text-white opacity-70 mt-1">오동도</div>
            <div className="text-xs text-white opacity-25 mt-0.5">동선 확인 중</div>
          </div>
        </>
      )}

      {ctx.companion === 'parents' && (
        <div className="flex-shrink-0 text-center min-w-0 ml-1">
          <div className="w-9 h-9 rounded-full bg-dream-purple bg-opacity-20 border border-dream-purple border-opacity-30 flex items-center justify-center mx-auto text-base">
            👨‍👩‍👧
          </div>
          <div className="text-xs text-white opacity-50 mt-1">캐빈 선택</div>
        </div>
      )}
    </div>
  );
}

function ForMeSection({ ctx, stateIndex, prevJourneyNote }) {
  if (stateIndex === 0) return null;
  const primaryText =
    stateIndex === 3
      ? FOR_ME.parents
      : stateIndex === 2
      ? FOR_ME.odongdo
      : FOR_ME.vehicle;
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

  const prevJourneyNote =
    stateIndex === 3
      ? travelerContext.nextPlace === 'odongdo'
        ? '오동도 연계 · 자산 출발 · 3~4시간 코스'
        : travelerContext.hasVehicle
        ? '자차 · 자산정류장 주차 후 탑승'
        : null
      : null;

  const primaryDiscovery =
    stateIndex === 3
      ? SOUL_DISCOVERY.parents
      : stateIndex === 2
      ? SOUL_DISCOVERY.odongdo
      : stateIndex === 1
      ? SOUL_DISCOVERY.vehicle
      : SOUL_DISCOVERY.default;

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
                  도시와 섬 사이 · 바다 위 10분
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
              <FactRow label="탑승 구조" value="자산(시내) ↔ 돌산(섬) 왕복" />
              <FactRow label="소요시간" value="편도 약 10분" note="현장 확인 권장" />
              <FactRow label="캐빈" value="일반 / 크리스탈" note="탑승 전 현장 선택 · 예약 불필요" />
              <FactRow label="요금" value="일반 · 크리스탈 캐빈 구분" note="현장·공식 확인" />
              <FactRow label="운영 시간" value="09:30~21:30 · 강풍 시 중단" note="당일 변경 가능" />
              <FactRow label="주차" value="자산정류장 측 주차장" />
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
            ctx={travelerContext}
            stateIndex={stateIndex}
            prevJourneyNote={prevJourneyNote}
          />
        )}

        {/* ── SOUL JUDGMENT ── */}
        <Card>
          <p className="text-xs text-dream-purple font-semibold mb-3 uppercase tracking-wider">
            SOUL
          </p>
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
              여정
            </p>
            <JourneyFlow ctx={travelerContext} />
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

        {/* ── DEPTH (expandable) — cable-car specific ── */}
        {(isCableCarView || !isPlaceKnowledge) && (
          <ExpandableSection title="더 알고 싶을 때">
            <div className="space-y-3 text-sm text-white opacity-80 leading-relaxed">
              <p>
                <span className="text-white opacity-50 text-xs block mb-0.5">크리스탈 캐빈</span>
                6인승. 바닥과 측면 일부가 투명해 아래 바다를 내려다볼 수 있어요. 일반 캐빈보다 요금이 높습니다. 탑승 전 현장에서 선택하실 수 있어요.
              </p>
              {travelerContext.nextPlace === 'odongdo' && (
                <p>
                  <span className="text-white opacity-50 text-xs block mb-0.5">오동도 연계 동선</span>
                  자산 하차 후 오동도 방파제 입구까지 도보 약 5분. 케이블카 + 오동도 합산 약 3~4시간. 돌산 하차 후 오동도 이동은 도보 불가(차량/택시 필요).
                </p>
              )}
              <p className="text-white opacity-40 text-xs">
                ☎ 운행 문의: 061-664-7301
              </p>
            </div>
          </ExpandableSection>
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
