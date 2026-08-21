/**
 * TravelMapView
 * Map display with recommendations
 */

import React from 'react';

function TravelMapView({ recommendations, onBack }) {
  return (
    <div className="travel-map-view">
      <header>
        <button onClick={onBack}>← 돌아가기</button>
        <h2>여수 여행지 지도</h2>
      </header>

      <div className="map-container">
        <div className="map-placeholder">
          {/* Kakao Map will be integrated here */}
          <p>지도 로딩 중...</p>
        </div>
      </div>

      <div className="places-list">
        {recommendations.places.map((place, idx) => (
          <div key={idx} className="place-item">
            <h4>{place.name_ko}</h4>
            <p>📍 {place.place_code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TravelMapView;
