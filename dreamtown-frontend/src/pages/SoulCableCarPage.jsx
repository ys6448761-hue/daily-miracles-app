/**
 * SOUL Cable Car Detail Page V0.2
 * 여수해상케이블카 — Living Travel Detail Page
 * Route: /soul/cable-car
 *
 * Evidence sources (internal — not shown in traveler UI):
 *   PU-CC-001~005 (케이블카 기본 정보)
 *   PU-REL-001~006 (오동도 연계 관계 지식)
 * Volatile/SEMI_STABLE items tagged with freshness notes.
 * DB / Schema / Runtime / Production: NO CHANGE
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Canonical evidence — judgment-first texts ────────────────────────────────

const SOUL_DISCOVERY = {
  /* STATE 0 — no traveler context */
  default:
    '자산정류장에서 타고, 돌산정류장에서 내리는 게 일반적인 방향이에요. 타는 위치에 따라 다음 여행지 동선이 달라지니, 어디 가실지 알려주시면 더 잘 안내드릴 수 있어요.',

  /* STATE 1 — vehicle only */
  vehicle:
    '차가 있으시면 자산정류장 주차장이 편해요. 여기서 타고 돌산에서 내리면, 돌아오실 때 다시 자산까지 케이블카로 올 수 있어요.',

  /* STATE 2 — odongdo (regardless of vehicle) */
  odongdo:
    '오동도와 함께 보실 거라면 자산에서 타시는 걸 권해드려요. 돌산에서 내리면 오동도 쪽으로 다시 오는 동선이 복잡해져요. 케이블카와 오동도를 함께 보면 보통 3~4시간 정도 잡으세요.',

  /* STATE 3 — parents layer (added on top of previous judgment) */
  parents:
    '어르신과 함께하신다면 크리스탈 캐빈(바닥 투명)이 놀랍긴 하지만, 고소 불편이 있으실 경우 일반 캐빈이 더 편하실 수 있어요. 운행 전 현장에서 선택하시면 돼요.',
};

// ── Context parser — keyword-based, zero LLM ────────────────────────────────

function parseContext(input, current) {
  const lower = input.toLowerCase();
  const next = { ...current };
  if (
    lower.includes('차') ||
    lower.includes('자차') ||
    lower.includes('드라이브') ||
    lower.includes('렌트')
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

function FactRow({ label, value, freshness }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm py-2 border-b border-white border-opacity-5 last:border-0">
      <span className="text-white opacity-50 whitespace-nowrap flex-shrink-0">{label}</span>
      <div className="text-right">
        <span className="text-white opacity-90">{value}</span>
        {freshness && (
          <div className="text-xs text-yellow-400 opacity-70 mt-0.5">{freshness}</div>
        )}
      </div>
    </div>
  );
}

// ── Journey Flow ─────────────────────────────────────────────────────────────

function JourneyFlow({ ctx }) {
  /* COMPOSE: structure based on travelerContext */
  const showOdongdo = ctx.nextPlace === 'odongdo';

  return (
    <Card>
      <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">
        여정 흐름
      </p>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {/* 자산 node */}
        <div className="flex-shrink-0 text-center min-w-0">
          <div className="w-8 h-8 rounded-full bg-dream-purple bg-opacity-40 border border-dream-purple border-opacity-60 flex items-center justify-center mx-auto text-sm">
            {ctx.hasVehicle ? '🚗' : '🚶'}
          </div>
          <div className="text-xs text-white opacity-70 mt-1">자산</div>
          {ctx.hasVehicle && (
            <div className="text-xs text-star-gold mt-0.5">주차장</div>
          )}
        </div>

        {/* Cable car segment */}
        <div className="flex-1 flex flex-col items-center min-w-[60px]">
          <div className="w-full flex items-center gap-0.5">
            <div className="flex-1 h-px bg-gradient-to-r from-dream-purple to-dream-purple opacity-40" />
            <span className="text-base flex-shrink-0">🚡</span>
            <div className="flex-1 h-px bg-gradient-to-r from-dream-purple to-star-gold opacity-40" />
          </div>
          {/* PREPARED: ride duration — SEMI_STABLE */}
          <div className="text-xs text-white opacity-40 mt-1">편도 약 10분</div>
        </div>

        {/* 돌산 node */}
        <div className="flex-shrink-0 text-center min-w-0">
          <div className="w-8 h-8 rounded-full bg-white bg-opacity-10 border border-white border-opacity-20 flex items-center justify-center mx-auto text-sm">
            🏔️
          </div>
          <div className="text-xs text-white opacity-70 mt-1">돌산</div>
        </div>

        {/* Odongdo extension */}
        {showOdongdo && (
          <>
            <div className="flex-shrink-0 text-white opacity-30 text-sm">→</div>
            <div className="flex-shrink-0 text-center min-w-0">
              <div className="w-8 h-8 rounded-full bg-green-900 bg-opacity-50 border border-green-600 border-opacity-40 flex items-center justify-center mx-auto text-sm">
                🌿
              </div>
              <div className="text-xs text-white opacity-70 mt-1">오동도</div>
              <div className="text-xs text-yellow-400 mt-0.5">자산 출발 권장</div>
            </div>
          </>
        )}
      </div>

      {/* PREPARED: NEGATIVE KNOWLEDGE — PU-REL detour warning */}
      {showOdongdo && (
        <div className="mt-3 p-3 rounded-xl bg-yellow-900 bg-opacity-20 border border-yellow-700 border-opacity-30 text-xs text-yellow-200 leading-relaxed">
          돌산 하차 후 오동도로 이동하려면 돌산대교를 건너야 합니다 (도보 불가, 차량/택시). 오동도를 함께 보실 계획이라면 자산에서 출발하세요.
        </div>
      )}

      {/* Parents — cabin suggestion in Journey context */}
      {ctx.companion === 'parents' && (
        <div className="mt-3 p-3 rounded-xl bg-dream-purple bg-opacity-15 border border-dream-purple border-opacity-25 text-xs text-white opacity-80 leading-relaxed">
          어르신 동반 시: 크리스탈 캐빈(바닥 투명)과 일반 캐빈 중 현장에서 선택하실 수 있어요.
        </div>
      )}
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

  const hasContext =
    travelerContext.hasVehicle || travelerContext.nextPlace || travelerContext.companion;

  const hasParents = travelerContext.companion === 'parents';

  /* Derive state index */
  const stateIndex = hasParents
    ? 3
    : travelerContext.nextPlace
    ? 2
    : travelerContext.hasVehicle
    ? 1
    : 0;

  /* Derive previous journey judgment for STATE 3 accumulation */
  const prevJourneyNote =
    stateIndex === 3
      ? travelerContext.nextPlace === 'odongdo'
        ? '오동도 연계 — 자산 출발 권장'
        : travelerContext.hasVehicle
        ? '자차 — 자산정류장 주차 후 탑승'
        : null
      : null;

  /* Primary SOUL Discovery text */
  const primaryDiscovery =
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
          <h1 className="text-sm font-semibold text-white truncate mx-2">여수해상케이블카</h1>
          <div className="flex items-center gap-3 text-white opacity-40 text-sm">
            <span title="저장">🔖</span>
            <span title="공유">↗</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 space-y-4 pt-4">

        {/* ── SOUL QUESTION BAR ── */}
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
              className="text-star-gold text-sm font-semibold whitespace-nowrap hover:opacity-80 transition-opacity"
            >
              전달
            </button>
          </form>
          <p className="text-xs text-white opacity-30 mt-2">
            예: "차가 있어요" · "오동도도 갈 거예요" · "부모님도 같이 가요"
          </p>
        </Card>

        {/* ── CONTEXT CHIPS ── */}
        {hasContext && (
          <div className="flex flex-wrap gap-2">
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

        {/* ── PLACE HERO ── */}
        {/* REUSE: CSS gradient hero — cablecar-star-intro.png served by Express at /assets/brand/core/ */}
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(160deg, #0a1628 0%, #1a2d5a 40%, #0e3a5c 70%, #153347 100%)',
            minHeight: '160px',
          }}
        >
          {/* subtle overlay lines suggesting cable */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(155,135,245,0.3) 40px, rgba(155,135,245,0.3) 41px)',
            }}
          />
          <div className="relative z-10 p-5 flex flex-col justify-end h-full" style={{ minHeight: '160px' }}>
            <div className="mt-auto">
              <p className="text-xs text-white opacity-40 mb-1 font-medium tracking-widest uppercase">
                여수 · 해상 케이블카
              </p>
              <h2 className="text-2xl font-bold text-white leading-tight">
                여수해상케이블카
              </h2>
              {/* PREPARED: PU-CC-001 */}
              <p className="text-sm text-white opacity-60 mt-1">
                자산(시내) ↔ 돌산(섬) · 왕복 운행 · 해상 구간
              </p>
            </div>
          </div>
        </div>

        {/* ── ESSENTIAL FACTS (always visible) ── */}
        {/* PREPARED: PU-CC-001~005 */}
        <Card>
          <p className="text-xs text-white opacity-40 mb-3 font-medium uppercase tracking-wider">알아야 할 것</p>
          <FactRow
            label="탑승 구조"
            value="자산(시내) ↔ 돌산(섬) 왕복"
          />
          <FactRow
            label="소요시간"
            value="편도 약 10분"
            freshness="SEMI_STABLE — 현장 확인 권장"
          />
          <FactRow
            label="요금"
            value="일반 캐빈 / 크리스탈 캐빈 구분"
            freshness="연간 조정 가능 — 현장·공식 확인"
          />
          <FactRow
            label="운영 시간"
            value="09:30~21:30 · 강풍 시 중단"
            freshness="LIVE — 방문 전 확인 권장"
          />
          <FactRow
            label="주차"
            value="자산정류장 측 주차장 이용"
          />
        </Card>

        {/* ── SOUL DISCOVERY — judgment first ── */}
        {/* COMPOSE: text recomposes with context state */}
        <Card>
          <p className="text-xs text-dream-purple font-semibold mb-3 uppercase tracking-wider">
            SOUL Discovery
          </p>

          {/* STATE 3: show preserved previous journey judgment */}
          {stateIndex === 3 && prevJourneyNote && (
            <div className="mb-3 px-3 py-1.5 rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10">
              <p className="text-xs text-white opacity-50">이전 여정 판단</p>
              <p className="text-xs text-white opacity-80 mt-0.5">{prevJourneyNote}</p>
            </div>
          )}

          <p className="text-sm text-white leading-relaxed">{primaryDiscovery}</p>
        </Card>

        {/* ── JOURNEY FLOW ── */}
        <JourneyFlow ctx={travelerContext} />

        {/* ── LINKED JOURNEY (context-gated) ── */}
        {/* COMPOSE: visible only when multi-place or vehicle context exists */}
        {(travelerContext.nextPlace === 'odongdo' || travelerContext.hasVehicle) && (
          <Card>
            <p className="text-xs text-green-400 font-semibold mb-3 uppercase tracking-wider">
              연계 여정
            </p>
            <div className="space-y-3 text-sm text-white">
              {travelerContext.nextPlace === 'odongdo' && (
                <>
                  {/* PREPARED: PU-REL-004 */}
                  <p className="leading-relaxed">
                    케이블카 + 오동도 합산 <strong>약 3~4시간</strong>. 여유 있게 반나절 일정으로 잡으시면 됩니다.
                  </p>
                  {/* PREPARED: PU-REL-006 자산 → 오동도 도보 */}
                  <p className="text-white opacity-70 leading-relaxed">
                    자산정류장 하차 후 오동도 방파제 입구까지 도보 약 5분 거리예요.
                  </p>
                </>
              )}
              {travelerContext.hasVehicle && !travelerContext.nextPlace && (
                <>
                  {/* PREPARED: PU-CC-003 */}
                  <p className="leading-relaxed">
                    자산정류장 측 주차장(1,000+대)을 이용하시면 됩니다. 성수기 주말 오전 10시 이후 혼잡 가능성이 있으니 조기 도착을 권장해요.
                  </p>
                </>
              )}
            </div>
          </Card>
        )}

        {/* ── CRYSTAL CABIN (collapsible) ── */}
        {/* PREPARED: PU-CC-004 */}
        <ExpandableSection title="크리스탈 캐빈이 궁금하다면">
          <p className="text-sm text-white opacity-80 leading-relaxed">
            6인승. 바닥과 측면 일부가 투명하여 아래 바다를 내려다볼 수 있어요. 일반 캐빈보다 요금이 높습니다.
          </p>
          {hasParents && (
            <div className="mt-2 p-3 rounded-xl bg-dream-purple bg-opacity-15 border border-dream-purple border-opacity-25 text-xs text-white opacity-90 leading-relaxed">
              고소 불편이 있으신 어르신께는 일반 캐빈이 더 편하실 수 있어요. 탑승 전 현장에서 선택 가능합니다.
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-white border-opacity-10">
            <p className="text-xs text-white opacity-40">
              ☎ 운행 문의: 061-664-7301
            </p>
          </div>
        </ExpandableSection>

        {/* ── QUICK CONTEXT SHORTCUTS (STATE 0 only) ── */}
        {!hasContext && (
          <div className="pt-1">
            <p className="text-xs text-white opacity-30 mb-2 text-center">내 상황을 알려주세요</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: '🚗 자차로 가요', query: '차가 있어요' },
                { label: '🌿 오동도도요', query: '오동도도 갈 거예요' },
                { label: '👨‍👩‍👧 부모님과요', query: '부모님도 같이 가요' },
              ].map((s) => (
                <button
                  key={s.query}
                  onClick={() =>
                    setTravelerContext((c) => parseContext(s.query, c))
                  }
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
            className="w-full py-3 rounded-2xl text-sm font-semibold border transition-all cursor-not-allowed"
            style={{
              background: 'rgba(155,135,245,0.15)',
              borderColor: 'rgba(155,135,245,0.3)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            내 여정에 담기
          </button>
          <p className="text-center text-xs text-white opacity-20 mt-1">여정 저장 — 소원꿈터 연결 예정</p>
        </div>
      </div>
    </div>
  );
}
