/**
 * TravelFallbackUI
 * Display fallback when primary recommendation unavailable
 */

import React from 'react';

function TravelFallbackUI({ fallback }) {
  if (!fallback) return null;

  return (
    <div className="fallback-section">
      <div className="fallback-message">
        <p>⚠️ 지금은 이 장소 이용이 어려워요</p>
        <p className="fallback-reason">이유: 미확인 상태</p>
      </div>

      <div className="fallback-alternative">
        <h3>대신 이 장소는 어떨까요?</h3>
        <div className="alternative-place">
          <h4>{fallback.name_ko}</h4>
          <p>이유: {fallback.reason}</p>
          <button>이 장소로 변경</button>
        </div>
      </div>
    </div>
  );
}

export default TravelFallbackUI;
