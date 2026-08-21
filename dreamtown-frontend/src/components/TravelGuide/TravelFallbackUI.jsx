/**
 * TravelFallbackUI
 * Display fallback when primary recommendation unavailable
 */

import React from 'react';

function TravelFallbackUI({ fallback, onSelectFallback }) {
  if (!fallback) return null;

  const handleSelectFallback = () => {
    console.log('[FALLBACK_CLICK]', {
      place_code: fallback.place_code,
      place_name: fallback.name_ko
    });
    if (onSelectFallback) {
      onSelectFallback(fallback);
    }
  };

  return (
    <div className="fallback-section">
      <div className="fallback-message">
        <p>지금 조건에서 이용하기 좋은 다른 장소예요</p>
      </div>

      <div className="fallback-alternative">
        <h3>추천</h3>
        <div className="alternative-place">
          <h4>{fallback.name_ko}</h4>
          <p className="fallback-detail">
            {fallback.reason && `💡 ${fallback.reason}`}
          </p>
          <button onClick={handleSelectFallback} className="fallback-cta">
            이 장소로 변경
          </button>
        </div>
      </div>
    </div>
  );
}

export default TravelFallbackUI;
