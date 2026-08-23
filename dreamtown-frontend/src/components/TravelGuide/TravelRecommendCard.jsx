/**
 * TravelRecommendCard
 * Display single place recommendation
 * Phase 1: null travel times shown as "확인 중" (not as 0 or null값)
 */

import React from 'react';

function TravelRecommendCard({ place, onViewMap, onGetDirections }) {
  const getStatusLabel = () => {
    if (place.live_status === 'unknown') {
      return '현재 상태 확인 필요';
    }
    return place.live_status === 'open' ? '운영 중' : '폐쇄됨';
  };

  const getLiveStatusColor = () => {
    if (place.live_status === 'unknown') return 'gray';
    return place.live_status === 'open' ? 'green' : 'red';
  };

  const getTotalTimeLabel = () => {
    if (place.total_required_time === null || place.total_required_time === undefined) {
      return '이동시간 확인 중';
    }
    return `${place.total_required_time}분`;
  };

  return (
    <div className="recommend-card">
      <div className="card-header">
        <h3>{place.name_ko}</h3>
        <span className={`status ${getLiveStatusColor()}`}>{getStatusLabel()}</span>
      </div>

      <div className="card-body">
        <p className="reason">💡 {place.reason}</p>

        <div className="info-row">
          <span>⏱️ 장소 체류시간</span>
          <span>{place.stay_minutes}분</span>
        </div>

        <div className="info-row">
          <span>🚗 이동 가능</span>
          <span>
            {place.accessibility.car_accessible ? '✓ 차' : '✗ 차'}
            {place.accessibility.bus_accessible ? ' ✓ 버스' : ' ✗ 버스'}
          </span>
        </div>

        <div className="info-row">
          <span>🕐 총 소요 시간</span>
          <span>{getTotalTimeLabel()}</span>
        </div>
      </div>

      <div className="card-actions">
        <button onClick={onViewMap} className="btn-secondary">
          [지도에서 보기]
        </button>
        <button onClick={onGetDirections} className="btn-secondary">
          [길찾기]
        </button>
      </div>
    </div>
  );
}

export default TravelRecommendCard;
