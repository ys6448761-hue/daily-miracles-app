import React from 'react';

function formatAdmission(admission_fee_json) {
  if (!admission_fee_json || typeof admission_fee_json !== 'object') return null;
  if (admission_fee_json.adult === 0) return '무료';
  if (typeof admission_fee_json.adult === 'number') return `${admission_fee_json.adult.toLocaleString()}원`;
  return null;
}

function formatHours(operating_hours) {
  if (!operating_hours) return null;
  try {
    const parsed = typeof operating_hours === 'string' ? JSON.parse(operating_hours) : operating_hours;
    if (parsed && typeof parsed.summary === 'string' && parsed.summary.length > 0) return parsed.summary;
    return null;
  } catch (_) {
    return null;
  }
}

function formatStayTime(minutes) {
  if (!minutes || typeof minutes !== 'number' || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `약 ${m}분`;
  if (m === 0) return `약 ${h}시간`;
  return `약 ${h}시간 ${m}분`;
}

function formatDifficulty(difficulty) {
  if (!difficulty) return null;
  const MAP = { high: '경사와 계단 있음', low: '누구나 편안하게', moderate: '보통 수준', easy: '무난함' };
  return MAP[difficulty] || null;
}

function formatIndoorOutdoor(io) {
  if (!io) return null;
  const MAP = { outdoor: '야외', indoor: '실내', mixed: '실내외' };
  return MAP[io] || null;
}

function PlaceBasicInfo({ place }) {
  if (!place) return null;

  const admission = formatAdmission(place.admission_fee_json);
  const hours = formatHours(place.operating_hours);
  const stayTime = formatStayTime(place.avg_stay_minutes);
  const difficulty = formatDifficulty(place.physical_difficulty);
  const indoorOutdoor = formatIndoorOutdoor(place.indoor_outdoor);

  const hasAnyField = admission || hours || stayTime || difficulty || indoorOutdoor;
  if (!hasAnyField) return null;

  return (
    <div className="place-basic-info">
      {admission && (
        <div className="basic-info-row">
          <span className="basic-info-label">입장료</span>
          <span className="basic-info-value">{admission}</span>
        </div>
      )}
      {hours && (
        <div className="basic-info-row">
          <span className="basic-info-label">운영시간</span>
          <span className="basic-info-value">{hours}</span>
        </div>
      )}
      {stayTime && (
        <div className="basic-info-row">
          <span className="basic-info-label">평균 체류</span>
          <span className="basic-info-value">{stayTime}</span>
        </div>
      )}
      {difficulty && (
        <div className="basic-info-row">
          <span className="basic-info-label">걷기 난이도</span>
          <span className="basic-info-value">{difficulty}</span>
        </div>
      )}
      {indoorOutdoor && (
        <div className="basic-info-row">
          <span className="basic-info-label">환경</span>
          <span className="basic-info-value">{indoorOutdoor}</span>
        </div>
      )}
    </div>
  );
}

export default PlaceBasicInfo;
