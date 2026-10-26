/**
 * YeosuMapSelector — 여수 지역별 장소 탐색 V0.1
 *
 * V0.1 구현: 이미지 바인딩 + Phase A 마커 (오동도 PROVISIONAL)
 *   - 7개 권역 카드 → 권역 장소 목록 → 장소 선택
 *   - overview 이미지: 전체 권역 시각 참조 (마커 미표시)
 *   - oldtown 이미지: 원도심 권역(hasDetailMap=true) 진입 시 표시
 *     + Phase A 마커: HIGH confidence 장소만 (오동도 1개, PROVISIONAL)
 *     + padding-top 비율 컨테이너: 종횡비 보존 → 마커 위치 정확도 확보
 *   - 이미지 로딩 실패 시 기존 카드 UI로 자동 대체
 *   - MEDIUM/NONE 마커: Phase B (Founder 확인 후 추가)
 *
 * 선택 가능 상태:
 *   TG_READY     — 선택 가능 (routePlaces 공유)
 *   EXPLORER     — 표시만 (SOUL 추천 자동 승격 금지: OI-MAP-2)
 *   VERIFY_NEEDED— 표시만 (정보 수집 중)
 *   FERRY        — 배편 배지 표시, 선택 불가 (OI-MAP-5)
 *
 * Props:
 *   selectedPlaces — { code, name } array (routePlaces와 공유)
 *   onTogglePlace  — (place) => void (toggleRoutePlace와 동일)
 *   onClose        — () => void (지역별 보기 닫기)
 */

import React, { useState } from 'react';
import {
  YEOSU_ZONES,
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

function ZoneOverview({ onSelectZone, isQAPreview }) {
  const [imgError, setImgError] = useState(false);
  // hoveredZoneId: 데스크탑 hover / 포커스 시 해당 권역 경계 미리보기 (VERIFIED 상태만 표시)
  const [hoveredZoneId, setHoveredZoneId] = useState(null);

  // VERIFIED + points 존재 시에만 SVG 렌더 — QA Preview 시 PROVISIONAL도 표시
  const boundary = hoveredZoneId ? getZoneBoundary(hoveredZoneId) : null;
  const showBoundary =
    (boundary?.status === 'VERIFIED' || (isQAPreview && boundary?.status === 'PROVISIONAL')) &&
    Array.isArray(boundary.points) &&
    boundary.points.length >= 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 여수 전역 지도 — padding-top 비율 컨테이너(108.13%) + SVG 경계 오버레이 */}
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
          {/* SVG 경계 오버레이 — VERIFIED boundary만 렌더 (현재 전체 UNVERIFIED) */}
          {/* viewBox="0 0 1 1" + preserveAspectRatio="none" → objectFit:fill과 좌표 정합 */}
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
  // Zone 3~7 overview 미리보기용 — Zone 1·2(hasDetailMap)는 oldtown 사용
  const zoneBoundary = !zone?.hasDetailMap ? getZoneBoundary(zoneId) : null;
  const showZoneBoundary =
    (zoneBoundary?.status === 'VERIFIED' || (isQAPreview && zoneBoundary?.status === 'PROVISIONAL')) &&
    Array.isArray(zoneBoundary.points) &&
    zoneBoundary.points.length >= 3;
  // QA Preview: oldtown 이미지의 Zone 1·2 PROVISIONAL 경계 + 장소 마커
  const oldtownBoundary = isQAPreview && zone?.hasDetailMap ? getZoneBoundary(zoneId) : null;
  const showOldtownBoundary =
    oldtownBoundary?.status === 'PROVISIONAL' &&
    Array.isArray(oldtownBoundary.points) &&
    oldtownBoundary.points.length >= 3;
  const qaPlaces = isQAPreview && zone?.hasDetailMap
    ? Object.entries(QA_OLDTOWN_POSITIONS).filter(([, p]) => p.zone === zoneId)
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
        /* Zone 1·2 — oldtown 확대 지도 + Phase A 마커 (기존 유지) + QA Preview 경계 */
        !imgError && (() => {
          const markers = getMarkersForImage('oldtown');
          return (
            <>
              {/* QA Preview 배너 — DEV 환경 전용, 사용자 화면 미표시 */}
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
              <div style={{ position: 'relative', width: '100%', paddingTop: '64.32%', borderRadius: '10px', overflow: 'hidden' }}>
                <img
                  src={OLDTOWN_IMG}
                  alt={`${zone.name_ko} 지도`}
                  onError={() => setImgError(true)}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    objectFit: 'fill',
                    display: 'block',
                  }}
                />
                {/* QA Preview: PROVISIONAL 경계 SVG (DEV 전용 — 프로덕션 빌드에서 dead code) */}
                {showOldtownBoundary && (
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
                    <polygon
                      points={oldtownBoundary.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill={`${zone.color}18`}
                      stroke={zone.color}
                      strokeWidth="0.007"
                      strokeDasharray="0.020 0.010"
                      strokeLinejoin="round"
                      opacity="0.90"
                    />
                  </svg>
                )}
                {/* Phase A 마커 (기존 유지) */}
                {markers.filter(m => m.zone === zone.id).map(m => {
                  const mp = m.markerPos.oldtown;
                  const selected = selectedPlaces.some(p => p.code === m.code);
                  const selectable = isSelectablePlace(m);
                  return (
                    <div
                      key={m.code}
                      onClick={() => selectable && onTogglePlace({ code: m.code, name: m.name_ko })}
                      role={selectable ? 'button' : undefined}
                      aria-label={selectable ? `${m.name_ko} 선택` : m.name_ko}
                      aria-pressed={selectable ? selected : undefined}
                      title={m.name_ko}
                      style={{
                        position: 'absolute',
                        left: `${mp.x * 100}%`,
                        top: `${mp.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        padding: '8px',
                        cursor: selectable ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: selected ? '#FFD67A' : 'rgba(255,255,255,0.92)',
                        border: `2px solid ${selected ? '#b8900a' : 'rgba(0,0,0,0.32)'}`,
                        boxShadow: '0 1px 5px rgba(0,0,0,0.45)',
                        transition: 'background 0.15s, border-color 0.15s',
                      }} />
                    </div>
                  );
                })}
                {/* QA Preview: 장소 기준점 마커 (DEV 전용) */}
                {qaPlaces.map(([code, p]) => (
                  <div
                    key={`qa-${code}`}
                    title={`[QA] ${code}`}
                    style={{
                      position: 'absolute',
                      left: `${p.x * 100}%`,
                      top: `${p.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
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
                    }} />
                  </div>
                ))}
              </div>
            </>
          );
        })()
      ) : (
        /* Zone 2~7 — overview 지도 미리보기 + VERIFIED 경계선 (현재 전체 UNVERIFIED) */
        /* height:200px + aspectRatio → width 자동 계산(≈185px) → 비율 보존·크롭 없음 */
        /* objectFit:fill + SVG viewBox="0 0 1 1" → 동일 좌표계 보장 */
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
              {/* SVG 경계선 — VERIFIED + points >= 3 시에만 표시 */}
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

      {/* 장소 목록 */}
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

            // 비선택 장소 (EXPLORER / VERIFY_NEEDED / FERRY)
            return (
              <div
                key={place.code}
                title={place.status === MAP_STATUS.FERRY ? '배편 예약 후 방문 권장' : '코스 추천 준비 중이에요'}
                style={{
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: badge ? badge.bg : 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  cursor: 'default',
                }}
              >
                <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', wordBreak: 'keep-all' }}>
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
  // QA Preview — import.meta.env.DEV에서만 활성화. 프로덕션 빌드에서 false로 dead-code 제거됨.
  // 로컬: ?qa_preview=boundary 파라미터 추가 시 PROVISIONAL 경계 표시.
  const isQAPreview = import.meta.env.DEV &&
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
