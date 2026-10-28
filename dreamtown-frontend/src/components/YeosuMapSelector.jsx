/**
 * YeosuMapSelector — 여수 지역별 장소 탐색 V0.1
 *
 * V0.1 구현: 이미지 바인딩 + Phase A 마커 (PROVISIONAL)
 *   - 7개 권역 카드 → 권역 장소 목록 → 장소 선택
 *   - overview 이미지: 전체 권역 시각 참조 (마커 미표시)
 *   - oldtown 이미지: 원도심 권역(hasDetailMap=true) 진입 시 표시
 *     + Phase A 마커: HIGH confidence 장소만 (PROVISIONAL)
 *     + padding-top 비율 컨테이너: 종횡비 보존 → 마커 위치 정확도 확보
 *   - 이미지 로딩 실패 시 기존 카드 UI로 자동 대체
 *
 * QA Preview (localhost + ?qa_preview=boundary):
 *   - PROVISIONAL 마커 표시 + 토글 테스트 허용
 *   - 마커 위치 지정 모드: 지도 클릭 → normalized x/y 후보 좌표 수집
 *     → Founder 승인 전 PROVISIONAL 유지, 서버 DB 저장 없음
 *
 * Props:
 *   selectedPlaces — { code, name } array (routePlaces와 공유)
 *   onTogglePlace  — (place) => void (toggleRoutePlace와 동일)
 *   onClose        — () => void (지역별 보기 닫기)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  YEOSU_ZONES,
  YEOSU_PLACES,
  MAP_STATUS,
  getPlacesByZone,
  getMarkersForImage,
  isSelectablePlace,
  countTgReadyByZone,
  getZoneBoundary,
  QA_OLDTOWN_POSITIONS,
} from '../constants/yeosuMapData';

// overview 이미지 aspect ratio: 1206×1304 → padding-top 108.13%
// objectFit:fill + SVG viewBox="0 0 1 1" + preserveAspectRatio="none" 조합으로 좌표 정합
const OVERVIEW_IMG_RATIO_PCT = ((1304 / 1206) * 100).toFixed(2); // "108.13"

// 상태별 배지 표시 정의
const STATUS_BADGE = {
  [MAP_STATUS.EXPLORER]:      { label: '탐색 가능', color: 'rgba(110,184,255,0.70)', bg: 'rgba(110,184,255,0.12)' },
  [MAP_STATUS.VERIFY_NEEDED]: { label: '정보 수집 중', color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.06)' },
  [MAP_STATUS.FERRY]:         { label: '⛴ 배편 필요', color: 'rgba(200,200,220,0.70)', bg: 'rgba(200,200,220,0.08)' },
};

const OVERVIEW_IMG  = '/images/muyojeong/map/yeosu-overview-v01.png';
const OLDTOWN_IMG   = '/images/muyojeong/map/yeosu-oldtown-v01.png';

// 로컬 초안 저장 키 — imageId=oldtown, 데이터버전=v02
// CLEAN_RESTART_V02 (2026-10-27): v01 초안 격리, 새 좌표 작업 시작
// 이미지·데이터 버전이 바뀌면 키를 변경해 오래된 초안 자동 무효화
const DRAFT_KEY = 'yeosu_map_draft_v02_oldtown';

// 마커 위치 지정 대상 장소 — Zone 1·2 모두 oldtown 이미지를 공유하므로 한 화면에서 연속 지정 가능
const PLACEMENT_TARGETS = [
  // Zone 1 — 원도심 해안권
  { code: 'lee_soon_shin_plaza',  name_ko: '이순신광장',   zone: 1 },
  { code: 'marine_park',          name_ko: '종포해양공원', zone: 1 },
  { code: 'romantic_pojangmacha', name_ko: '낭만포차거리', zone: 1 },
  { code: 'hamel_lighthouse',     name_ko: '하멜등대',     zone: 1 },
  // Zone 1 추가: Founder Final Completion 2026-10-27
  { code: 'opodae',               name_ko: '오포대',       zone: 1 },
  { code: 'jinamgwan',            name_ko: '진남관',       zone: 1 },
  // Zone 2 — 오동도·엑스포권
  { code: 'odongdo',              name_ko: '오동도',       zone: 2 },
  { code: 'cablecar',             name_ko: '케이블카',     zone: 2 },
  { code: 'yeosu_expo_park',      name_ko: '엑스포공원',   zone: 2 },
  { code: 'sky_tower',            name_ko: '스카이타워',   zone: 2 },
  { code: 'jaisan_park',          name_ko: '자산공원',     zone: 2 },
  // Zone 2 추가: Founder Final Completion 2026-10-27
  { code: 'aquaplanet',           name_ko: '아쿠아플라넷', zone: 2 },
  { code: 'big_o_show',           name_ko: '빅오쇼',       zone: 2 },
  // 낭만요트·블루요트: Founder Decision 2026-10-27 — 유탑마리나호텔 앞 선착장
  { code: 'nangman_yacht',        name_ko: '낭만요트',     zone: 2 },
  { code: 'blue_yacht',           name_ko: '블루요트',     zone: 2 },
];

function ZoneOverview({ onSelectZone, isQAPreview }) {
  const [imgError, setImgError] = useState(false);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);

  const boundary = hoveredZoneId ? getZoneBoundary(hoveredZoneId) : null;
  const showBoundary =
    (boundary?.status === 'VERIFIED' || (isQAPreview && boundary?.status === 'PROVISIONAL')) &&
    boundary?.imageId === 'yeosu-overview-v01' &&
    Array.isArray(boundary.points) &&
    boundary.points.length >= 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {!imgError ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: `${OVERVIEW_IMG_RATIO_PCT}%`,
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <img
            src={OVERVIEW_IMG}
            alt="여수 전역 지도"
            onError={() => setImgError(true)}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'fill',
              display: 'block',
            }}
          />
          <svg
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none',
            }}
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {showBoundary && (() => {
              const zone = YEOSU_ZONES.find(z => z.id === hoveredZoneId);
              if (!zone) return null;
              return (
                <polygon
                  points={boundary.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={`${zone.color}18`}
                  stroke={zone.color}
                  strokeWidth="0.006"
                  strokeDasharray="0.016 0.008"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              );
            })()}
          </svg>
        </div>
      ) : (
        <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.28)', textAlign: 'center', padding: '4px 0 8px' }}>
          지도 이미지를 불러올 수 없어요 — 권역 카드로 탐색하세요
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {YEOSU_ZONES.map(zone => {
          const count = countTgReadyByZone(zone.id);
          const isHovered = hoveredZoneId === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              onMouseEnter={() => setHoveredZoneId(zone.id)}
              onMouseLeave={() => setHoveredZoneId(null)}
              onFocus={() => setHoveredZoneId(zone.id)}
              onBlur={() => setHoveredZoneId(null)}
              aria-label={`${zone.name_ko} — 추천 가능 장소 ${count}곳`}
              style={{
                padding: '14px 12px',
                borderRadius: '12px',
                background: isHovered ? `${zone.color}20` : `${zone.color}14`,
                border: `1px solid ${isHovered ? zone.color + '55' : zone.color + '30'}`,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                minHeight: '72px',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: zone.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.88)', fontWeight: 600, wordBreak: 'keep-all', lineHeight: 1.3 }}>
                {zone.name_ko}
              </span>
              {count > 0 && (
                <span style={{ fontSize: '0.6875rem', color: zone.color, opacity: 0.85 }}>
                  코스 추천 {count}곳
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ZoneDetail({ zoneId, selectedPlaces, onTogglePlace, onBack, isQAPreview }) {
  const zone   = YEOSU_ZONES.find(z => z.id === zoneId);
  const places = getPlacesByZone(zoneId);
  const [imgError, setImgError] = useState(false);
  const [overviewImgError, setOverviewImgError] = useState(false);

  // 위치 지정 모드 state (QA Preview 전용)
  const [placementMode, setPlacementMode] = useState(false);
  const [placementTarget, setPlacementTarget] = useState(null);
  // candidates: { [code]: { x, y } } — 장소별 독립 후보 좌표
  const [candidates, setCandidates] = useState({});
  const [copied, setCopied] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  // 드래그 state
  const [draggingCode, setDraggingCode] = useState(null);
  // explorer 장소 탐색 하이라이트 — SOUL 추가 없음, 지도 마커만 강조
  const [activeExplorerPlace, setActiveExplorerPlace] = useState(null);
  const mapWrapperRef = useRef(null);

  // 마운트 시 로컬 초안 복원 (QA Preview + hasDetailMap 전용)
  useEffect(() => {
    if (!isQAPreview || !zone?.hasDetailMap) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setCandidates(parsed);
          setDraftRestored(true);
        }
      }
    } catch {}
  }, []); // mount-only — 의도적 빈 deps

  // candidates 변경 시 로컬 초안 저장
  useEffect(() => {
    if (!isQAPreview || !zone?.hasDetailMap) return;
    if (Object.keys(candidates).length === 0) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(candidates));
    } catch {}
  }, [candidates]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zone 1·2 모두 oldtown 이미지를 공유 → hasDetailMap인 경우 전 장소 선택 가능
  const zoneTargets = isQAPreview && zone?.hasDetailMap
    ? PLACEMENT_TARGETS
    : [];

  // 위치 지정 모드 토글 — 모드 끄면 placementTarget·dragging 초기화
  const togglePlacementMode = () => {
    setPlacementMode(prev => {
      if (prev) { setPlacementTarget(null); setDraggingCode(null); }
      return !prev;
    });
  };

  // normalized x/y 계산 헬퍼 (mapWrapperRef 기준)
  const calcNorm = (clientX, clientY) => {
    const rect = mapWrapperRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: parseFloat(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)).toFixed(3)),
      y: parseFloat(Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)).toFixed(3)),
    };
  };

  // 지도 클릭 → 선택된 장소 위치 지정 (드래그 중에는 무시)
  const handleMapClick = (e) => {
    if (!placementMode || !placementTarget || draggingCode) return;
    const n = calcNorm(e.clientX, e.clientY);
    if (!n) return;
    setCandidates(prev => ({ ...prev, [placementTarget]: n }));
    setCopied(false);
  };

  // touch fallback (Pointer Events가 지원되지 않는 구형 브라우저용)
  const handleMapTouch = (e) => {
    if (!placementMode || !placementTarget || draggingCode) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const n = calcNorm(touch.clientX, touch.clientY);
    if (!n) return;
    setCandidates(prev => ({ ...prev, [placementTarget]: n }));
    setCopied(false);
  };

  // 후보 마커 드래그 — Pointer Events + pointer capture
  const handleCandidatePointerDown = (e, code) => {
    if (!placementMode) return;
    e.stopPropagation();
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    setDraggingCode(code);
    setPlacementTarget(code); // 드래그 시작 시 해당 장소 자동 선택
    setCopied(false);
  };

  const handleCandidatePointerMove = (e, code) => {
    if (draggingCode !== code) return;
    const n = calcNorm(e.clientX, e.clientY);
    if (!n) return;
    setCandidates(prev => ({ ...prev, [code]: n }));
  };

  const handleCandidatePointerUp = (e, code) => {
    if (draggingCode !== code) return;
    setDraggingCode(null);
    setCopied(false);
  };

  // 미세 조정 (1px 단위 = 이미지 1564 기준 ≈ 0.001)
  const nudge = (code, axis, delta) => {
    setCandidates(prev => {
      const c = prev[code];
      if (!c) return prev;
      return { ...prev, [code]: { ...c, [axis]: parseFloat(Math.min(1, Math.max(0, c[axis] + delta)).toFixed(3)) } };
    });
    setCopied(false);
  };

  // 후보 좌표 재설정
  const resetCandidate = (code) => {
    setCandidates(prev => { const n = { ...prev }; delete n[code]; return n; });
    if (draggingCode === code) setDraggingCode(null);
  };

  // 단일 장소 좌표 복사
  const copyCandidate = (code) => {
    const c = candidates[code];
    if (!c) return;
    const text = `{ code: '${code}', x: ${c.x}, y: ${c.y} }`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 전체 후보 좌표 복사 (yeosuMapData.js 붙여넣기 형식)
  const copyAllCandidates = () => {
    if (Object.keys(candidates).length === 0) return;
    const lines = Object.entries(candidates)
      .map(([code, { x, y }]) => `  // ${code}\n  markerPos: { oldtown: { x: ${x}, y: ${y}, confidence: 'HIGH', status: 'PROVISIONAL' } }`)
      .join('\n\n');
    navigator.clipboard.writeText(lines).then(() => {
      setCopied('all');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const zoneBoundary = !zone?.hasDetailMap ? getZoneBoundary(zoneId) : null;
  const showZoneBoundary =
    (zoneBoundary?.status === 'VERIFIED' || (isQAPreview && zoneBoundary?.status === 'PROVISIONAL')) &&
    Array.isArray(zoneBoundary?.points) &&
    zoneBoundary.points.length >= 3;
  const oldtownBoundary = isQAPreview && zone?.hasDetailMap ? getZoneBoundary(zoneId) : null;
  const showOldtownBoundary =
    oldtownBoundary?.status === 'PROVISIONAL' &&
    Array.isArray(oldtownBoundary?.points) &&
    oldtownBoundary.points.length >= 3;
  // oldtown 이미지: Zone 1·2 중 markerPos 미반영 장소만 QA 기준점 표시
  // markerPos가 있는 장소는 markers 경로에서 이미 렌더링 → QA 참조점 중복 제거
  const qaPlaces = isQAPreview && zone?.hasDetailMap
    ? Object.entries(QA_OLDTOWN_POSITIONS).filter(([code, p]) =>
        p.zone === zoneId &&
        !YEOSU_PLACES.find(pl => pl.code === code)?.markerPos?.oldtown
      )
    : [];

  if (!zone) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onBack}
          aria-label="권역 목록으로 돌아가기"
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.50)',
            cursor: 'pointer', fontSize: '0.875rem', padding: '4px 0',
          }}
        >
          ← 뒤로
        </button>
        <span
          style={{
            display: 'inline-block', width: '8px', height: '8px',
            borderRadius: '50%', background: zone.color,
          }}
        />
        <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>
          {zone.name_ko}
        </span>
      </div>

      {zone.note && (
        <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', margin: 0, wordBreak: 'keep-all' }}>
          {zone.note}
        </p>
      )}

      {zone.hasDetailMap ? (
        !imgError && (() => {
          const markers = getMarkersForImage('oldtown');
          return (
            <>
              {/* QA Preview 배너 */}
              {isQAPreview && (
                <div style={{
                  padding: '6px 10px', borderRadius: '8px',
                  background: 'rgba(255,160,0,0.15)', border: '1px solid rgba(255,160,0,0.40)',
                  fontSize: '0.6875rem', color: 'rgba(255,200,80,0.90)',
                  wordBreak: 'keep-all', lineHeight: 1.5,
                }}>
                  ⚠ 검수용 미확정 경계 — 로컬 개발환경 전용 / Founder 검수 전 미공개 / PROVISIONAL
                </div>
              )}

              {/* 마커 위치 지정 UI (QA Preview + hasDetailMap 전용) */}
              {isQAPreview && zoneTargets.length > 0 && (
                <div style={{
                  padding: '10px 12px', borderRadius: '10px',
                  background: placementMode ? 'rgba(80,220,120,0.10)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${placementMode ? 'rgba(80,220,120,0.40)' : 'rgba(255,255,255,0.12)'}`,
                  display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                  {/* 모드 토글 버튼 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: placementMode ? 'rgba(80,220,120,0.90)' : 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                      📍 마커 위치 지정 모드
                      {draftRestored && placementMode && (
                        <span style={{ marginLeft: '6px', fontSize: '0.5625rem', color: 'rgba(120,200,255,0.80)', fontWeight: 400 }}>
                          초안 복원됨
                        </span>
                      )}
                    </span>
                    <button
                      onClick={togglePlacementMode}
                      style={{
                        padding: '4px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontSize: '0.6875rem', fontWeight: 600,
                        background: placementMode ? 'rgba(80,220,120,0.25)' : 'rgba(255,255,255,0.10)',
                        color: placementMode ? 'rgba(80,220,120,0.95)' : 'rgba(255,255,255,0.60)',
                      }}
                    >
                      {placementMode ? '종료' : '시작'}
                    </button>
                  </div>

                  {placementMode && (
                    <>
                      {/* 장소 선택 — Zone 1·2 구분 표시 */}
                      {[1, 2].map(zn => {
                        const targets = zoneTargets.filter(t => t.zone === zn);
                        if (targets.length === 0) return null;
                        return (
                          <div key={zn}>
                            <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.30)', marginBottom: '4px', letterSpacing: '0.04em' }}>
                              Zone {zn}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {targets.map(t => (
                                <button
                                  key={t.code}
                                  onClick={() => { setPlacementTarget(t.code); setCopied(false); }}
                                  style={{
                                    padding: '4px 10px', borderRadius: '14px', border: '1px solid',
                                    cursor: 'pointer', fontSize: '0.6875rem',
                                    background: placementTarget === t.code ? 'rgba(80,220,120,0.20)' : 'rgba(255,255,255,0.06)',
                                    borderColor: placementTarget === t.code ? 'rgba(80,220,120,0.55)' : 'rgba(255,255,255,0.15)',
                                    color: placementTarget === t.code ? 'rgba(80,220,120,0.95)' : 'rgba(255,255,255,0.65)',
                                    fontWeight: placementTarget === t.code ? 600 : 400,
                                  }}
                                >
                                  {t.name_ko}
                                  {candidates[t.code] && (
                                    <span style={{ marginLeft: '4px', opacity: 0.7 }}>✓</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* 선택 장소 현재 좌표 + 상태 — 항상 표시 */}
                      {placementTarget && (() => {
                        const targetName = zoneTargets.find(t => t.code === placementTarget)?.name_ko;
                        const cand = candidates[placementTarget];
                        const codedPlace = YEOSU_PLACES.find(p => p.code === placementTarget);
                        const codedPos = codedPlace?.markerPos?.oldtown;
                        const isCodeReflected = cand && codedPos && cand.x === codedPos.x && cand.y === codedPos.y;
                        const statusLabel = isCodeReflected
                          ? '코드 반영'
                          : cand
                            ? (copied === placementTarget || copied === 'all' ? '내보내기 완료 · 코드 반영 전' : '후보 좌표 있음')
                            : '미지정';
                        const statusColor = isCodeReflected
                          ? 'rgba(120,200,255,0.90)'
                          : cand
                            ? (copied === placementTarget || copied === 'all' ? 'rgba(80,220,120,0.90)' : 'rgba(255,200,80,0.85)')
                            : 'rgba(255,255,255,0.35)';
                        return (
                          <div style={{
                            padding: '6px 10px', borderRadius: '8px',
                            background: 'rgba(0,0,0,0.35)',
                            display: 'flex', flexDirection: 'column', gap: '3px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>
                                {targetName}
                              </span>
                              <span style={{ fontSize: '0.5625rem', color: statusColor }}>
                                {statusLabel}
                              </span>
                            </div>
                            {cand ? (
                              <span style={{ fontSize: '0.625rem', color: 'rgba(80,220,120,0.85)', fontFamily: 'monospace' }}>
                                x={cand.x}, y={cand.y}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.30)' }}>
                                지도를 클릭하거나 마커를 드래그해 위치를 지정하세요
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      {!placementTarget && (
                        <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.5 }}>
                          장소를 선택한 후 지도를 클릭하세요.
                        </p>
                      )}

                      {/* 후보 좌표 출력 + 미세 조정 */}
                      {Object.entries(candidates).filter(([code]) => zoneTargets.some(t => t.code === code)).length > 0 && (
                        <div style={{
                          background: 'rgba(0,0,0,0.30)', borderRadius: '8px',
                          padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px',
                        }}>
                          {zoneTargets.filter(t => candidates[t.code]).map(t => (
                            <div key={t.code} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {/* 좌표 + 복사·재설정 버튼 */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                <span style={{ fontSize: '0.6875rem', color: 'rgba(80,220,120,0.85)', fontFamily: 'monospace', letterSpacing: '0.02em', flexShrink: 1, minWidth: 0 }}>
                                  {t.name_ko}: x={candidates[t.code].x}, y={candidates[t.code].y}
                                </span>
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                  <button
                                    onClick={() => resetCandidate(t.code)}
                                    style={{
                                      padding: '2px 6px', borderRadius: '8px', border: '1px solid rgba(255,80,80,0.30)',
                                      cursor: 'pointer', fontSize: '0.5625rem', background: 'rgba(255,80,80,0.10)',
                                      color: 'rgba(255,120,120,0.80)',
                                    }}
                                  >✕</button>
                                  <button
                                    onClick={() => copyCandidate(t.code)}
                                style={{
                                  padding: '2px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                  fontSize: '0.625rem', flexShrink: 0,
                                  background: copied === t.code ? 'rgba(80,220,120,0.25)' : 'rgba(255,255,255,0.10)',
                                  color: copied === t.code ? 'rgba(80,220,120,0.95)' : 'rgba(255,255,255,0.55)',
                                }}
                              >
                                    {copied === t.code ? '내보내기 완료' : '좌표 내보내기'}
                                  </button>
                                </div>
                              </div>
                              {/* 미세 조정 버튼 (선택된 장소만) */}
                              {placementTarget === t.code && (
                                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginLeft: '2px' }}>
                                  {[['←', 'x', -0.001], ['→', 'x', 0.001], ['↑', 'y', -0.001], ['↓', 'y', 0.001]].map(([label, axis, delta]) => (
                                    <button
                                      key={label}
                                      onClick={() => nudge(t.code, axis, delta)}
                                      style={{
                                        padding: '2px 7px', borderRadius: '6px', border: '1px solid rgba(80,180,255,0.30)',
                                        cursor: 'pointer', fontSize: '0.625rem',
                                        background: 'rgba(80,180,255,0.10)', color: 'rgba(120,200,255,0.85)',
                                        fontFamily: 'monospace',
                                      }}
                                    >{label}</button>
                                  ))}
                                  <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginLeft: '2px' }}>±0.001</span>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* 전체 복사 버튼 */}
                          {Object.keys(candidates).filter(c => zoneTargets.some(t => t.code === c)).length > 1 && (
                            <button
                              onClick={copyAllCandidates}
                              style={{
                                marginTop: '4px', padding: '4px 0', borderRadius: '8px', border: '1px solid rgba(80,220,120,0.30)',
                                cursor: 'pointer', fontSize: '0.625rem', width: '100%',
                                background: copied === 'all' ? 'rgba(80,220,120,0.15)' : 'transparent',
                                color: copied === 'all' ? 'rgba(80,220,120,0.95)' : 'rgba(80,220,120,0.60)',
                              }}
                            >
                              {copied === 'all' ? '전체 내보내기 완료 (코드 반영 전)' : '전체 좌표 내보내기 (yeosuMapData.js 형식)'}
                            </button>
                          )}
                          {/* 초안 삭제 — localStorage + state 초기화 */}
                          <button
                            onClick={() => {
                              setCandidates({});
                              setDraftRestored(false);
                              setCopied(false);
                              try { localStorage.removeItem(DRAFT_KEY); } catch {}
                            }}
                            style={{
                              marginTop: '2px', padding: '3px 0', borderRadius: '8px',
                              border: '1px solid rgba(255,80,80,0.20)', cursor: 'pointer',
                              fontSize: '0.5625rem', width: '100%',
                              background: 'transparent', color: 'rgba(255,120,120,0.50)',
                            }}
                          >
                            초안 삭제 (전체 초기화)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 지도 이미지 — 클릭·드래그 핸들러 포함 */}
              <div
                ref={mapWrapperRef}
                style={{
                  position: 'relative', width: '100%', paddingTop: '64.32%',
                  borderRadius: '10px', overflow: 'hidden',
                  cursor: draggingCode ? 'grabbing' : (placementMode && placementTarget ? 'crosshair' : 'default'),
                  touchAction: placementMode ? 'none' : 'auto',
                }}
                onClick={handleMapClick}
                onTouchEnd={handleMapTouch}
              >
                <img
                  src={OLDTOWN_IMG}
                  alt={`${zone.name_ko} 지도`}
                  onError={() => setImgError(true)}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    objectFit: 'fill',
                    display: 'block',
                    // 위치 지정 모드 중 이미지 드래그 방지
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />

                {/* QA Preview SVG 오버레이 — pointer-events:none (클릭 투과) */}
                {isQAPreview && (
                  <svg
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '100%', height: '100%',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                    viewBox="0 0 1 1"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {/* SVG 렌더링 확인용 테스트 사각형 — 편집 모드 시 숨김 */}
                    {!placementMode && (
                      <rect
                        x="0.05" y="0.05" width="0.90" height="0.90"
                        fill="none"
                        stroke="rgba(255,80,80,0.7)"
                        strokeWidth="0.008"
                        strokeDasharray="0.025 0.012"
                      />
                    )}
                    {/* PROVISIONAL 경계 — 편집 모드 시 숨김 */}
                    {!placementMode && showOldtownBoundary && (
                      <polygon
                        points={oldtownBoundary.points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={`${zone.color}18`}
                        stroke={zone.color}
                        strokeWidth="0.007"
                        strokeDasharray="0.020 0.010"
                        strokeLinejoin="round"
                        opacity="0.90"
                      />
                    )}
                  </svg>
                )}

                {/* 기존 마커 렌더링
                    일반 화면: VERIFIED만 표시, PROVISIONAL 숨김.
                    QA Preview: PROVISIONAL도 표시. 위치 지정 모드 중 토글 비활성.
                    Zone 1 → Zone 1 마커 6개만 / Zone 2 → Zone 2 마커 9개만 (권역 분리) */}
                {markers.filter(m => m.zone === zone.id).map(m => {
                  const mp = m.markerPos.oldtown;
                  const isVerified = mp.status === 'VERIFIED';
                  if (!isVerified && !isQAPreview) return null;
                  // 편집 모드 시 기존 마커 숨김 — 후보 마커가 대신 표시됨
                  if (placementMode) return null;
                  const selected = selectedPlaces.some(p => p.code === m.code);
                  const selectable = isSelectablePlace(m) && (isVerified || isQAPreview);
                  const isExplorer = m.status === MAP_STATUS.EXPLORER;
                  const isExplorerActive = isExplorer && activeExplorerPlace === m.code;
                  // 위치 지정 모드 중 기존 마커 토글 비활성화
                  const handleToggle = () => {
                    if (placementMode) return;
                    if (selectable) {
                      onTogglePlace({ code: m.code, name: m.name_ko });
                    } else if (isExplorer) {
                      // Explorer: 탐색 하이라이트만 토글 — SOUL 일정 추가 없음
                      setActiveExplorerPlace(prev => prev === m.code ? null : m.code);
                    }
                  };
                  const interactive = !placementMode && (selectable || isExplorer);
                  return (
                    <div
                      key={m.code}
                      onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } } : undefined}
                      role={interactive ? 'button' : undefined}
                      tabIndex={interactive ? 0 : undefined}
                      aria-label={
                        selectable && !placementMode
                          ? `${m.name_ko} ${selected ? '선택 해제' : '선택'}${!isVerified ? ' (QA)' : ''}`
                          : isExplorer
                          ? `${m.name_ko} — 탐색 가능 (코스 추가 준비 중)`
                          : `${m.name_ko} (위치 미검증)`
                      }
                      aria-pressed={selectable ? selected : isExplorer ? isExplorerActive : undefined}
                      title={isVerified ? m.name_ko : `${m.name_ko} · 위치 검수 중`}
                      style={{
                        position: 'absolute',
                        left: `${mp.x * 100}%`,
                        top: `${mp.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        padding: '8px',
                        cursor: interactive ? 'pointer' : 'default',
                        outline: 'none',
                        pointerEvents: (isVerified || isQAPreview) ? undefined : 'none',
                        zIndex: 20,
                      }}
                    >
                      <div style={{
                        width: isVerified ? (selected ? '14px' : '12px') : (selected ? '12px' : '10px'),
                        height: isVerified ? (selected ? '14px' : '12px') : (selected ? '12px' : '10px'),
                        borderRadius: '50%',
                        background: !isVerified
                          ? (selected ? 'rgba(255,160,0,0.85)' : 'rgba(255,160,0,0.45)')
                          : (selected ? '#FFD67A' : 'rgba(255,255,255,0.92)'),
                        border: `2px solid ${!isVerified ? (selected ? 'rgba(200,100,0,0.90)' : 'rgba(200,100,0,0.55)') : (selected ? '#b8900a' : 'rgba(0,0,0,0.32)')}`,
                        boxShadow: isExplorerActive
                          ? '0 0 0 4px rgba(110,184,255,0.45), 0 1px 5px rgba(0,0,0,0.45)'
                          : selected
                          ? '0 0 0 3px rgba(255,214,122,0.35), 0 1px 5px rgba(0,0,0,0.45)'
                          : '0 1px 5px rgba(0,0,0,0.45)',
                        transition: 'all 0.15s',
                        opacity: placementMode ? 0.4 : 1,
                      }} />
                    </div>
                  );
                })}

                {/* QA Preview: 장소 기준점 마커 (DEV 전용) — 편집 모드 시 숨김 */}
                {!placementMode && qaPlaces.map(([code, p]) => (
                  <div
                    key={`qa-${code}`}
                    title={`[QA] ${code}`}
                    style={{
                      position: 'absolute',
                      left: `${p.x * 100}%`,
                      top: `${p.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      zIndex: 15,
                    }}
                  >
                    <div style={{
                      width: p.anchor ? '16px' : '10px',
                      height: p.anchor ? '16px' : '10px',
                      borderRadius: '50%',
                      background: p.anchor
                        ? 'rgba(255,215,0,0.9)'
                        : p.conflict
                        ? 'rgba(255,160,0,0.85)'
                        : p.confirmed
                        ? 'rgba(80,200,255,0.80)'
                        : 'rgba(200,200,200,0.60)',
                      border: `2px solid ${p.anchor ? '#b8900a' : p.conflict ? '#cc6000' : p.confirmed ? '#0060aa' : '#888'}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      opacity: placementMode ? 0.4 : 1,
                    }} />
                  </div>
                ))}

                {/* 후보 마커 — 드래그 가능 (Pointer Events + capture) */}
                {placementMode && zoneTargets.filter(t => candidates[t.code]).map(t => {
                  const c = candidates[t.code];
                  const isActive = placementTarget === t.code;
                  const isDragging = draggingCode === t.code;
                  return (
                    <div
                      key={`cand-${t.code}`}
                      title={`[후보] ${t.name_ko}: (${c.x}, ${c.y}) — 드래그해 위치 조정`}
                      onPointerDown={(e) => handleCandidatePointerDown(e, t.code)}
                      onPointerMove={(e) => handleCandidatePointerMove(e, t.code)}
                      onPointerUp={(e) => handleCandidatePointerUp(e, t.code)}
                      onPointerCancel={(e) => handleCandidatePointerUp(e, t.code)}
                      style={{
                        position: 'absolute',
                        left: `${c.x * 100}%`,
                        top: `${c.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        zIndex: isDragging ? 40 : 30,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        touchAction: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                      }}
                    >
                      {/* 후보 마커 원 */}
                      <div style={{
                        width: isDragging ? '20px' : (isActive ? '16px' : '12px'),
                        height: isDragging ? '20px' : (isActive ? '16px' : '12px'),
                        borderRadius: '50%',
                        background: isDragging ? 'rgba(80,220,120,1.0)' : (isActive ? 'rgba(80,220,120,0.90)' : 'rgba(80,220,120,0.55)'),
                        border: `2px solid ${isDragging ? 'rgba(0,120,50,1.0)' : (isActive ? 'rgba(0,140,60,0.95)' : 'rgba(0,140,60,0.65)')}`,
                        boxShadow: isDragging
                          ? '0 0 0 5px rgba(80,220,120,0.25), 0 2px 10px rgba(0,0,0,0.65)'
                          : (isActive ? '0 0 0 3px rgba(80,220,120,0.30), 0 1px 6px rgba(0,0,0,0.55)' : '0 1px 4px rgba(0,0,0,0.45)'),
                        transition: isDragging ? 'none' : 'all 0.15s',
                      }} />
                      {/* 장소명 라벨 */}
                      <div style={{
                        background: 'rgba(0,0,0,0.75)', borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '0.5625rem',
                        color: isDragging ? 'rgba(80,220,120,1.0)' : (isActive ? 'rgba(80,220,120,0.95)' : 'rgba(200,255,210,0.75)'),
                        whiteSpace: 'nowrap',
                        fontWeight: (isDragging || isActive) ? 600 : 400,
                        lineHeight: 1.4,
                      }}>
                        {t.name_ko}{isDragging ? ` (${c.x}, ${c.y})` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()
      ) : (
        !overviewImgError && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              position: 'relative',
              height: '200px',
              aspectRatio: '1206 / 1304',
              borderRadius: '10px',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <img
                src={OVERVIEW_IMG}
                alt={`여수 지도 — ${zone.name_ko}`}
                onError={() => setOverviewImgError(true)}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  objectFit: 'fill',
                  display: 'block',
                }}
              />
              <svg
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  pointerEvents: 'none',
                }}
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {showZoneBoundary && (
                  <polygon
                    points={zoneBoundary.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={`${zone.color}18`}
                    stroke={zone.color}
                    strokeWidth="0.008"
                    strokeDasharray="0.020 0.010"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                )}
              </svg>
            </div>
          </div>
        )
      )}

      {/* 배편 필수 안내 */}
      {zoneId === 7 && (
        <div
          style={{
            padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(200,200,220,0.06)', border: '1px solid rgba(200,200,220,0.14)',
            fontSize: '0.75rem', color: 'rgba(200,200,220,0.65)', wordBreak: 'keep-all', lineHeight: 1.5,
          }}
        >
          배편 운항 일정과 물때를 사전에 확인하세요. 현재 코스 추천에는 포함되지 않아요.
        </div>
      )}

      {/* 장소 목록 — 편집 모드 시 비활성화 */}
      <div style={{ opacity: placementMode ? 0.25 : 1, pointerEvents: placementMode ? 'none' : 'auto', transition: 'opacity 0.20s' }}>
      {places.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '16px 0' }}>
          장소 정보를 수집 중이에요
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {places.map(place => {
            const selectable = isSelectablePlace(place);
            const selected   = selectedPlaces.some(p => p.code === place.code);
            const badge      = STATUS_BADGE[place.status];

            if (selectable) {
              return (
                <button
                  key={place.code}
                  onClick={() => onTogglePlace({ code: place.code, name: place.name_ko })}
                  aria-pressed={selected}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: '1px solid',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    wordBreak: 'keep-all',
                    minHeight: '36px',
                    transition: 'background 0.15s, border-color 0.15s',
                    color:       selected ? '#130b1e' : 'rgba(255,255,255,0.80)',
                    background:  selected ? '#FFD67A' : 'rgba(255,255,255,0.06)',
                    borderColor: selected ? '#FFD67A' : 'rgba(255,255,255,0.16)',
                    fontWeight:  selected ? 600 : 400,
                  }}
                >
                  {place.name_ko}
                </button>
              );
            }

            if (place.status === MAP_STATUS.EXPLORER) {
              const isActive = activeExplorerPlace === place.code;
              return (
                <button
                  key={place.code}
                  onClick={() => setActiveExplorerPlace(prev => prev === place.code ? null : place.code)}
                  aria-pressed={isActive}
                  title={`${place.name_ko} — 탐색 가능한 장소예요. 여행 코스 직접 추가는 준비 중이에요.`}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: `1px solid ${isActive ? 'rgba(110,184,255,0.50)' : 'rgba(255,255,255,0.12)'}`,
                    background: isActive ? 'rgba(110,184,255,0.18)' : (badge ? badge.bg : 'rgba(255,255,255,0.04)'),
                    display: 'flex', alignItems: 'center', gap: '6px',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: isActive ? 'rgba(110,184,255,0.95)' : 'rgba(255,255,255,0.60)', wordBreak: 'keep-all' }}>
                    {place.name_ko}
                  </span>
                  {badge && (
                    <span style={{ fontSize: '0.625rem', color: badge.color, background: badge.bg, padding: '2px 6px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                      {badge.label}
                    </span>
                  )}
                </button>
              );
            }

            return (
              <div
                key={place.code}
                title={
                  place.status === MAP_STATUS.FERRY
                    ? '배편 예약 후 방문 권장'
                    : '정보 수집 중인 장소예요'
                }
                style={{
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: badge ? badge.bg : 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  cursor: 'default',
                  opacity: 0.50,
                }}
              >
                <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.50)', wordBreak: 'keep-all' }}>
                  {place.name_ko}
                </span>
                {badge && (
                  <span style={{ fontSize: '0.625rem', color: badge.color, background: badge.bg, padding: '2px 6px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                    {badge.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>{/* end 장소목록 편집모드 비활성화 래퍼 */}

      {/* 선택된 장소 합계 */}
      {selectedPlaces.length > 0 && (
        <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          선택됨: {selectedPlaces.map(p => p.name).join(' · ')}
        </p>
      )}
    </div>
  );
}

export default function YeosuMapSelector({ selectedPlaces, onTogglePlace, onClose }) {
  const [activeZone, setActiveZone] = useState(null);
  // QA Preview — localhost에서만 활성화.
  // Production(app.dailymiracles.kr)는 hostname이 달라 절대 활성화되지 않음.
  const isQAPreview =
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    new URLSearchParams(window.location.search).get('qa_preview') === 'boundary';

  return (
    <div
      style={{
        borderRadius: '16px',
        border: `1px solid ${isQAPreview ? 'rgba(255,160,0,0.35)' : 'rgba(110,184,255,0.18)'}`,
        background: 'rgba(110,184,255,0.04)',
        padding: '14px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.6875rem', color: '#6EB8FF', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          지역별 탐색
        </p>
        <button
          onClick={onClose}
          aria-label="지역별 탐색 닫기"
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
        >
          목록으로 ↑
        </button>
      </div>

      {/* 내용 — 권역 개요 or 권역 상세 */}
      {activeZone === null ? (
        <ZoneOverview onSelectZone={setActiveZone} isQAPreview={isQAPreview} />
      ) : (
        <ZoneDetail
          zoneId={activeZone}
          selectedPlaces={selectedPlaces}
          onTogglePlace={onTogglePlace}
          onBack={() => setActiveZone(null)}
          isQAPreview={isQAPreview}
        />
      )}
    </div>
  );
}
