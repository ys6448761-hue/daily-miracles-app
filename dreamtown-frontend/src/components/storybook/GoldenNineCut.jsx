/**
 * GoldenNineCut.jsx
 *
 * Renders the canonical 3×3 Golden 9-Cut Storybook grid.
 * - Canonical order: jinamgwan → cablecar → jongpo (rows)
 * - Canonical slots: real_a → real_b → story_art (columns)
 * - Immutable layout (locked C1)
 *
 * Props:
 *   journeyId: UUID
 *   assets: Array of { location, slot, object_key, mime_type }
 *   status: storybook_complete | star_planted
 *   loading?: boolean
 *
 * Usage:
 *   <GoldenNineCut journeyId={id} assets={assets} status="storybook_complete" />
 */

import React, { useState, useEffect } from 'react';
import './GoldenNineCut.css';

const LOCATIONS = {
  jinamgwan: { emoji: '❤️', korean: '품다', order: 0 },
  cablecar: { emoji: '🌬️', korean: '보내다', order: 1 },
  jongpo: { emoji: '⭐', korean: '심다', order: 2 }
};

const SLOTS = {
  real_a: { order: 0, label: 'REAL A' },
  real_b: { order: 1, label: 'REAL B' },
  story_art: { order: 2, label: 'Story Art' }
};

const LOCATIONS_ORDERED = ['jinamgwan', 'cablecar', 'jongpo'];
const SLOTS_ORDERED = ['real_a', 'real_b', 'story_art'];

function GoldenNineCut({ journeyId, assets = [], status = 'storybook_complete', loading = false }) {
  const [assetMap, setAssetMap] = useState({});
  const [imageError, setImageError] = useState({});

  useEffect(() => {
    // Build asset map: location-slot → asset
    const map = {};
    if (Array.isArray(assets)) {
      assets.forEach(asset => {
        const key = `${asset.location}-${asset.slot}`;
        map[key] = asset;
      });
    }
    setAssetMap(map);
  }, [assets]);

  const handleImageError = (location, slot) => {
    setImageError(prev => ({
      ...prev,
      [`${location}-${slot}`]: true
    }));
  };

  const renderAssetCell = (location, slot, index) => {
    const key = `${location}-${slot}`;
    const asset = assetMap[key];
    const hasError = imageError[key];

    return (
      <div key={`${key}-${index}`} className="golden-nine-cell">
        {asset ? (
          <>
            <img
              src={asset.signed_url || `/images/storybook/${asset.object_key}`}
              alt={`${location} ${slot}`}
              className="cell-image"
              onError={() => handleImageError(location, slot)}
            />
            {!hasError && <div className="cell-overlay" />}
          </>
        ) : (
          <div className="cell-placeholder">
            <div className="placeholder-icon">📸</div>
            <div className="placeholder-text">{slot}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="golden-nine-container">
      {/* Header */}
      <div className="golden-nine-header">
        <h2 className="golden-nine-title">내 별의 이야기</h2>
        <div className="golden-nine-status">
          {status === 'star_planted' && (
            <span className="status-badge planted">⭐ 별이 심어졌습니다</span>
          )}
          {status === 'storybook_complete' && (
            <span className="status-badge complete">✨ 스토리북 완성</span>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className={`golden-nine-grid ${loading ? 'loading' : ''}`}>
        {loading && <div className="grid-loading-spinner" />}

        {/* Render 3×3 grid */}
        {LOCATIONS_ORDERED.map((location, locIdx) => (
          <div key={`row-${locIdx}`} className="grid-row">
            {/* Row Label */}
            <div className="row-label">
              <div className="location-emoji">{LOCATIONS[location].emoji}</div>
              <div className="location-korean">{LOCATIONS[location].korean}</div>
            </div>

            {/* 3 Cells per row */}
            <div className="row-cells">
              {SLOTS_ORDERED.map((slot, slotIdx) => (
                renderAssetCell(location, slot, locIdx * 3 + slotIdx)
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Chapter Legend */}
      <div className="golden-nine-legend">
        <div className="legend-item">
          <span className="legend-emoji">❤️</span>
          <span className="legend-text">진남관: 소원을 품다</span>
        </div>
        <div className="legend-item">
          <span className="legend-emoji">🌬️</span>
          <span className="legend-text">케이블카: 소원을 보내다</span>
        </div>
        <div className="legend-item">
          <span className="legend-emoji">⭐</span>
          <span className="legend-text">종포: 별을 심다</span>
        </div>
      </div>
    </div>
  );
}

export default GoldenNineCut;
