/**
 * SOUL Cable Car Detail Page V0.1
 * 여수해상케이블카 — Living Travel Detail Page
 * Route: /soul/cable-car
 *
 * Evidence sources:
 *   PU-CC-001~005 (케이블카 기본 정보)
 *   PU-REL-001~004 (오동도 연계 관계 지식)
 *   PU-OD-001~006 (오동도 기본 정보)
 * All uncertain items marked [실시간 확인 필요] or [예시]
 * DB / Schema / Runtime / Production: NO CHANGE
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Canonical evidence (PU series) ────────────────────────────────────────────

const SOUL_DISCOVERY = {
  default:
    '자산(시내)↔돌산 두 정류장. 차량 여행자는 탑승 방향이 다음 목적지를 바꿉니다.',
  vehicle:
    '차량은 자산정류장 주차장에. 오동도를 함께 가신다면 자산에서 타고 돌산에서 내리세요. 반대 방향은 30분+ 우회입니다.',
  odongdo:
    '케이블카 + 오동도 합산 약 3~4시간. 돌산정류장 → 오동도 이동은 차량 없이 복잡합니다. 자산 출발을 권장합니다.',
  parents:
    '크리스탈 캐빈은 바닥이 투명합니다. 고소 불편이 있으신 분이라면 일반 캐빈이 더 편할 수 있습니다.',
};

// ── Context parser — keyword-based, no LLM ────────────────────────────────────

function parseContext(input, current) {
  const lower = input.toLowerCase();
  const next = { ...current };
  if (lower.includes('차') || lower.includes('자차') || lower.includes('드라이브') || lower.includes('렌트')) {
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
  if (lower.includes('아이') || lower.includes('아기') || lower.includes('유모차') || lower.includes('어린이')) {
    next.companion = 'family';
  }
  return next;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ContextChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-dream-purple bg-opacity-30 text-white border border-dream-purple border-opacity-50">
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 opacity-60 hover:opacity-100 text-xs">
          ×
        </button>
      )}
    </span>
  );
}

function SectionCard({ children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 p-4 ${className}`}>
      {children}
    </div>
  );
}

function ExpandableCard({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <SectionCard>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-white">
          <span>{icon}</span>
          <span>{title}</span>
        </span>
        <span className="text-white opacity-50 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </SectionCard>
  );
}

function InfoRow({ label, value, live = false }) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-white opacity-60 whitespace-nowrap">{label}</span>
      <span className={`text-right ${live ? 'text-yellow-300' : 'text-white opacity-90'}`}>{value}</span>
    </div>
  );
}

function PrototypeBadge({ label = '연결 예정' }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 border border-gray-600">
      {label}
    </span>
  );
}

// ── Journey Flow visual ────────────────────────────────────────────────────────

function JourneyFlow({ ctx }) {
  const showVehicle = ctx.hasVehicle;
  const showOdongdo = ctx.nextPlace === 'odongdo';

  return (
    /* COMPOSE: journey flow based on travelerContext */
    <SectionCard>
      <p className="text-xs text-white opacity-50 mb-3 font-medium uppercase tracking-wider">여정 흐름</p>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {/* Start node */}
        <div className="flex-shrink-0 text-center">
          <div className="text-2xl">{showVehicle ? '🚗' : '🚶'}</div>
          <div className="text-xs text-white opacity-70 mt-1">
            자산정류장
            {showVehicle && <div className="text-star-gold text-xs">주차 후 탑승</div>}
          </div>
        </div>

        {/* Cable car segment */}
        <div className="flex-1 flex flex-col items-center min-w-0 px-1">
          <div className="w-full h-0.5 bg-gradient-to-r from-dream-purple to-star-gold relative">
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-3 text-lg">🚡</span>
          </div>
          {/* PREPARED: cable car facts from PU-CC series */}
          <div className="text-xs text-white opacity-50 mt-4">편도 약 15분</div>
        </div>

        {/* End node */}
        <div className="flex-shrink-0 text-center">
          <div className="text-2xl">🏔️</div>
          <div className="text-xs text-white opacity-70 mt-1">돌산정류장</div>
        </div>

        {/* Odongdo extension — PU-REL-002 */}
        {showOdongdo && (
          <>
            <div className="flex-shrink-0 text-white opacity-30 text-lg px-1">→</div>
            <div className="flex-shrink-0 text-center">
              <div className="text-2xl">🌿</div>
              <div className="text-xs text-white opacity-70 mt-1">
                오동도
                <div className="text-yellow-300 text-xs">자산 하차 권장</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* NEGATIVE KNOWLEDGE warning — PU-REL-002 */}
      {showOdongdo && (
        <div className="mt-3 p-3 rounded-xl bg-yellow-900 bg-opacity-30 border border-yellow-700 border-opacity-40 text-xs text-yellow-200">
          ⚠️ 돌산정류장 하차 후 오동도로 이동하려면 돌산대교를 건너야 합니다 (도보 불가, 차량 또는 택시 필요).
          오동도를 함께 가실 계획이라면 <strong>자산정류장 출발</strong>을 권장합니다.
        </div>
      )}
    </SectionCard>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SoulCableCarPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [travelerContext, setTravelerContext] = useState({
    hasVehicle: false,
    nextPlace: null,
    companion: null,
  });
  const [inputValue, setInputValue] = useState('');
  const [operationOpen, setOperationOpen] = useState(false);

  // Derive current state index for UX label
  const stateIndex =
    travelerContext.companion
      ? 3
      : travelerContext.nextPlace
      ? 2
      : travelerContext.hasVehicle
      ? 1
      : 0;

  const stateLabels = ['공개 정보', '자차 여행', '오동도 연계', '부모님 동반'];

  // Determine active SOUL Discovery content
  const soulDiscovery =
    stateIndex === 3
      ? SOUL_DISCOVERY.parents
      : stateIndex === 2
      ? SOUL_DISCOVERY.odongdo
      : stateIndex === 1
      ? SOUL_DISCOVERY.vehicle
      : SOUL_DISCOVERY.default;

  function handleSubmit(e) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const updated = parseContext(inputValue, travelerContext);
    setTravelerContext(updated);
    setInputValue('');
  }

  function removeVehicle() {
    setTravelerContext((c) => ({ ...c, hasVehicle: false }));
  }
  function removeOdongdo() {
    setTravelerContext((c) => ({ ...c, nextPlace: null }));
  }
  function removeParents() {
    setTravelerContext((c) => ({ ...c, companion: null }));
  }

  const hasContext =
    travelerContext.hasVehicle || travelerContext.nextPlace || travelerContext.companion;

  return (
    <div className="min-h-screen bg-night-sky text-white pb-24">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-night-sky bg-opacity-95 backdrop-blur-sm border-b border-white border-opacity-10">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white opacity-70 hover:opacity-100 text-sm flex items-center gap-1"
          >
            ← 뒤로
          </button>
          <h1 className="text-sm font-semibold text-white truncate mx-2">여수해상케이블카</h1>
          <div className="flex items-center gap-3 text-white opacity-50 text-sm">
            <span title="저장 — 준비 중">🔖</span>
            <span title="공유 — 준비 중">↗</span>
          </div>
        </div>
        {/* State indicator */}
        <div className="max-w-md mx-auto px-4 pb-2">
          <span className="text-xs text-white opacity-40">
            STATE {stateIndex}: {stateLabels[stateIndex]}
          </span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 space-y-4 pt-4">

        {/* ── SOUL QUESTION BAR ── */}
        <SectionCard>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="케이블카에 대해 뭐든 물어보세요"
              className="flex-1 bg-transparent text-white placeholder-white placeholder-opacity-40 text-sm outline-none"
            />
            <button
              type="submit"
              className="text-star-gold text-sm font-semibold whitespace-nowrap hover:opacity-80"
            >
              전달
            </button>
          </form>
          <p className="text-xs text-white opacity-30 mt-2">
            예: "차가 있어요" · "오동도도 갈 거예요" · "부모님도 같이 가요"
          </p>
        </SectionCard>

        {/* ── TRAVELER CONTEXT CHIPS ── */}
        {hasContext && (
          <div className="flex flex-wrap gap-2">
            {travelerContext.hasVehicle && (
              <ContextChip label="🚗 자차" onRemove={removeVehicle} />
            )}
            {travelerContext.nextPlace === 'odongdo' && (
              <ContextChip label="🌿 오동도" onRemove={removeOdongdo} />
            )}
            {travelerContext.companion === 'parents' && (
              <ContextChip label="👨‍👩‍👧 부모님" onRemove={removeParents} />
            )}
            {travelerContext.companion === 'family' && (
              <ContextChip label="👨‍👩‍👦 가족" onRemove={() => setTravelerContext((c) => ({ ...c, companion: null }))} />
            )}
          </div>
        )}

        {/* ── PLACE HERO ── */}
        {/* REUSE: static hero — no external image to avoid invented content */}
        <SectionCard className="relative overflow-hidden">
          <div
            className="absolute inset-0 rounded-2xl opacity-20"
            style={{
              background:
                'linear-gradient(135deg, #2E5BFF 0%, #9B87F5 50%, #FFD76A 100%)',
            }}
          />
          <div className="relative z-10">
            <div className="text-5xl mb-3 text-center">🚡</div>
            <h2 className="text-xl font-bold text-center text-white">여수해상케이블카</h2>
            <p className="text-center text-sm text-white opacity-60 mt-1">
              SOUL이 알고 있는 것 · 운영 정보
            </p>
            <div className="flex justify-center gap-4 mt-3 text-xs text-white opacity-50">
              {/* PREPARED: PU-CC-001 */}
              <span>자산정류장 ↔ 돌산정류장</span>
              <span>•</span>
              <span>왕복 운행</span>
            </div>
          </div>
        </SectionCard>

        {/* ── SOUL DISCOVERY ── */}
        {/* COMPOSE: discovery content changes with context state */}
        <SectionCard>
          <p className="text-xs text-dream-purple font-semibold mb-2 uppercase tracking-wider">
            SOUL Discovery
          </p>
          <p className="text-sm text-white leading-relaxed">{soulDiscovery}</p>
          {stateIndex > 0 && (
            <p className="text-xs text-white opacity-30 mt-2">
              * 출처: 현지 증거 기반 Prepared Knowledge (PU-CC / PU-REL 시리즈)
            </p>
          )}
        </SectionCard>

        {/* ── JOURNEY FLOW ── */}
        <JourneyFlow ctx={travelerContext} />

        {/* ── MODULE A: 운영 정보 ── */}
        <ExpandableCard title="운영 정보" icon="ℹ️" defaultOpen={false}>
          {/* LIVE: operating hours — requires live verification */}
          <InfoRow label="운영 시간" value="09:30~21:30 (토요일 연장)" live={false} />
          <p className="text-xs text-yellow-300 opacity-80">⚡ 운영 시간은 SEMI_STABLE — 현장/공식 사이트에서 확인 권장</p>
          {/* PREPARED: PU-CC-004 cabin types */}
          <div className="mt-3 border-t border-white border-opacity-10 pt-3 space-y-1">
            <InfoRow label="일반 캐빈 (8인승)" value="왕복 ₩17,000 · 편도 ₩14,000" />
            <InfoRow label="크리스탈 캐빈 (6인승)" value="왕복 ₩24,000 · 편도 ₩19,000" />
            <p className="text-xs text-yellow-300 opacity-80">⚡ 요금은 연간 조정 가능 — 현장 확인 권장</p>
          </div>
          {/* PREPARED: PU-CC-005 weather policy */}
          <div className="mt-3 border-t border-white border-opacity-10 pt-3">
            <InfoRow
              label="기상 중단"
              value="강풍주의보/경보 시 운행 중단"
            />
            {/* LIVE: current operation status */}
            <InfoRow label="현재 운행 여부" value="실시간 확인 필요" live={true} />
            <InfoRow label="문의" value="☎ 061-664-7301" />
          </div>
          <div className="mt-3 border-t border-white border-opacity-10 pt-3">
            <InfoRow label="정기 점검" value="수요일 패턴 (방문 전 확인 권장)" />
          </div>
        </ExpandableCard>

        {/* ── MODULE B: 크리스탈 캐빈 ── */}
        {/* PREPARED: PU-CC-004 */}
        <SectionCard>
          <p className="text-xs text-star-gold font-semibold mb-2 uppercase tracking-wider">
            크리스탈 캐빈
          </p>
          <p className="text-sm text-white leading-relaxed">
            6인승. 바닥이 투명하여 아래 바다를 볼 수 있습니다.
          </p>
          {travelerContext.companion === 'parents' && (
            <div className="mt-2 p-2 rounded-xl bg-dream-purple bg-opacity-20 border border-dream-purple border-opacity-30 text-xs text-white">
              👨‍👩‍👧 고소 불편이 있으신 분께는 일반 캐빈이 더 편할 수 있습니다.
            </div>
          )}
          {(travelerContext.companion === 'family') && (
            <div className="mt-2 p-2 rounded-xl bg-dream-purple bg-opacity-20 border border-dream-purple border-opacity-30 text-xs text-white">
              어린이 반응은 개인차가 있습니다 — 바닥 투명함을 사전에 알려주시면 좋습니다.
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-white opacity-40">예약/현장 구매 안내</p>
            <PrototypeBadge label="예약 연결 예정" />
          </div>
        </SectionCard>

        {/* ── MODULE C: 연계 여정 (contextual) ── */}
        {/* COMPOSE: appears when context suggests multi-place journey */}
        {(travelerContext.nextPlace === 'odongdo' || travelerContext.hasVehicle) && (
          <SectionCard>
            <p className="text-xs text-green-400 font-semibold mb-2 uppercase tracking-wider">
              연계 여정
            </p>
            {travelerContext.nextPlace === 'odongdo' && (
              <div className="space-y-2 text-sm text-white">
                {/* PREPARED: PU-REL-004 combined time */}
                <p>🌿 오동도 포함 시 합산 약 <strong>3~4시간</strong> 여유 필요.</p>
                {/* PREPARED: PU-REL-003 recommended direction */}
                <p>돌산정류장에서 오동도로 이동 = 돌산대교 우회 (차량/택시 필요). <strong>자산 출발 권장.</strong></p>
                {/* PREPARED: PU-REL-002 자산 → 오동도 도보 5분 */}
                <p>자산정류장 하차 후 오동도 방파제 입구까지 도보 약 5분.</p>
              </div>
            )}
            {travelerContext.hasVehicle && !travelerContext.nextPlace && (
              <div className="space-y-2 text-sm text-white">
                {/* PREPARED: PU-CC-003 vehicle parking */}
                <p>🚗 자산정류장 측 주차 합계 1,000+대 (복합 구역).</p>
                <p>성수기 주말 오전 10시 이후 혼잡 가능 — 조기 도착 권장.</p>
                {/* PREPARED: PU-REL-003 vehicle direction */}
                <p>자산 주차 후 탑승 → 돌산 하차 → 택시 복귀가 일반적 패턴.</p>
              </div>
            )}
          </SectionCard>
        )}

        {/* ── MODULE D: 소원이 경험 ── */}
        <SectionCard className="opacity-70">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white opacity-60 font-semibold uppercase tracking-wider">
              소원이 이야기
            </p>
            <PrototypeBadge label="연결 예정" />
          </div>
          <p className="text-sm text-white opacity-50">
            "비슷한 여행을 한 소원이의 이야기" — 실제 소원 데이터 연결 예정
          </p>
        </SectionCard>

        {/* ── MODULE E: 현지 전문가 목소리 ── */}
        <SectionCard className="opacity-70">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white opacity-60 font-semibold uppercase tracking-wider">
              현지 전문가
            </p>
            <PrototypeBadge label="연결 예정" />
          </div>
          <p className="text-sm text-white opacity-50">
            "지역 전문가 코멘트" — Evidence 연결 예정
          </p>
        </SectionCard>

        {/* ── MODULE F: 소원그림 ── */}
        <SectionCard className="opacity-70">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white opacity-60 font-semibold uppercase tracking-wider">
              이 여행의 장면
            </p>
            <PrototypeBadge label="소원그림 예정" />
          </div>
          <p className="text-sm text-white opacity-50">
            "이 여행에서 만나게 될 장면" — 소원그림(WishArt) 연결 예정
          </p>
        </SectionCard>

        {/* ── MODULE G: 상거래 ── */}
        <SectionCard className="opacity-70">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white opacity-60 font-semibold uppercase tracking-wider">
              여행 준비
            </p>
            <PrototypeBadge label="비활성화" />
          </div>
          <p className="text-sm text-white opacity-50 mb-2">이제 여행을 준비할까요?</p>
          <button
            disabled
            className="w-full py-2 rounded-xl bg-white bg-opacity-10 text-white opacity-40 text-sm cursor-not-allowed"
          >
            예약 / 이용권 확인 →
          </button>
        </SectionCard>

        {/* ── Quick context shortcuts ── */}
        {!hasContext && (
          <div>
            <p className="text-xs text-white opacity-40 mb-2 text-center">빠른 맥락 입력</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: '🚗 자차로 가요', query: '차가 있어요' },
                { label: '🌿 오동도도요', query: '오동도도 갈 거예요' },
                { label: '👨‍👩‍👧 부모님과요', query: '부모님도 같이 가요' },
              ].map((s) => (
                <button
                  key={s.query}
                  onClick={() => {
                    const updated = parseContext(s.query, travelerContext);
                    setTravelerContext(updated);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs border border-white border-opacity-20 text-white opacity-70 hover:opacity-100 hover:border-dream-purple transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-night-sky bg-opacity-95 backdrop-blur-sm border-t border-white border-opacity-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <button
            disabled
            className="w-full py-3 rounded-2xl bg-dream-purple bg-opacity-30 text-white text-sm font-semibold border border-dream-purple border-opacity-40 cursor-not-allowed opacity-60"
          >
            내 여정에 담기 <PrototypeBadge label="준비 중" />
          </button>
        </div>
      </div>
    </div>
  );
}
