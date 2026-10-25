/**
 * YeosuMapSelector — 여수 지역별 장소 탐색 V0.1
 *
 * V0.1 구현: 지도 배경 이미지 없는 fallback div 모드
 *   - 7개 권역 카드 → 권역 장소 목록 → 장소 선택
 *   - 지도 배경(ASSET_MISSING): 권역 색상 카드로 대체
 *   - 이미지 바인딩은 Founder 이미지 제공 후 V0.2에서 추가
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
  isSelectablePlace,
  countTgReadyByZone,
} from '../constants/yeosuMapData';

// 상태별 배지 표시 정의
const STATUS_BADGE = {
  [MAP_STATUS.EXPLORER]:      { label: '탐색 가능', color: 'rgba(110,184,255,0.70)', bg: 'rgba(110,184,255,0.12)' },
  [MAP_STATUS.VERIFY_NEEDED]: { label: '정보 수집 중', color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.06)' },
  [MAP_STATUS.FERRY]:         { label: '⛴ 배편 필요', color: 'rgba(200,200,220,0.70)', bg: 'rgba(200,200,220,0.08)' },
};

function ZoneOverview({ onSelectZone }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* ASSET_MISSING 안내 */}
      <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.28)', textAlign: 'center', padding: '4px 0 8px' }}>
        지도 이미지 준비 중 — 권역 카드로 탐색하세요
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {YEOSU_ZONES.map(zone => {
          const count = countTgReadyByZone(zone.id);
          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              aria-label={`${zone.name_ko} — 추천 가능 장소 ${count}곳`}
              style={{
                padding: '14px 12px',
                borderRadius: '12px',
                background: `${zone.color}14`,
                border: `1px solid ${zone.color}30`,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                minHeight: '72px',
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

function ZoneDetail({ zoneId, selectedPlaces, onTogglePlace, onBack }) {
  const zone  = YEOSU_ZONES.find(z => z.id === zoneId);
  const places = getPlacesByZone(zoneId);

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

  return (
    <div
      style={{
        borderRadius: '16px',
        border: '1px solid rgba(110,184,255,0.18)',
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
        <ZoneOverview onSelectZone={setActiveZone} />
      ) : (
        <ZoneDetail
          zoneId={activeZone}
          selectedPlaces={selectedPlaces}
          onTogglePlace={onTogglePlace}
          onBack={() => setActiveZone(null)}
        />
      )}
    </div>
  );
}
