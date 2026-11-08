/**
 * CourseDisplay
 * Displays Journey Composer V0 course blocks in visual sequence
 * Shows: places → travel transitions → meals → cafes
 * P0: Cafe blocks show partner benefits when available
 *
 * UX Honesty Rules (Founder Decision 2026-10-15):
 * - available_minutes badge not shown (may be fallback, not user-stated)
 * - travel_transition "이동시간 확인 중" shown at most once, at course footer
 * - block.warnings not exposed to UI (internal diagnostics only)
 * - total_stay_minutes labeled as place stay time, not total trip time
 */

import React from 'react';

// English place name mapping — mirrors soulI18n.js PLACE_NAME_EN
const PLACE_NAME_EN = {
  cablecar:              'Yeosu Cable Car',
  odongdo:               'Odongdo Island',
  hyangiram:             'Hyangiram Hermitage',
  dolsan_nightscape:     'Dolsan Park',
  dolsan_daegyo:         'Dolsan Bridge',
  lee_soon_shin_plaza:   'Yi Sun-sin Square',
  hamel_lighthouse:      'Hamel Lighthouse',
  marine_park:           'Jongpo Marine Park',
  jaisan_park:           'Jaisan Park',
  romantic_pojangmacha:  'Romantic Pojangmacha Street',
  sky_tower:             'Sky Tower',
  yeosu_expo_park:       'Expo Park',
  jungang_market:        'Jungang Market',
};

export default function CourseDisplay({ course, lang }) {
  if (!course || !course.blocks || course.blocks.length === 0) {
    return null;
  }
  const isEn = lang === 'en';

  // D2: detect if any travel segment has unverified duration — for single footer notice
  const hasTravelUnknown = course.blocks.some(
    (b) => b.type === 'travel_transition' && !b.estimated_duration_range
  );

  const getBlockDisplay = (block) => {
    switch (block.type) {
      case 'place': {
        const nameEn = PLACE_NAME_EN[block.place_code];
        return {
          icon: '📍',
          title: (isEn && nameEn) ? nameEn : block.name_ko,
          subtitle: block.stay_minutes != null
            ? (isEn ? `${block.stay_minutes} min stay` : `${block.stay_minutes}분 체류`)
            : null,
          className: 'course-block-place'
        };
      }
      case 'travel_transition':
        return {
          icon: '↓',
          title: isEn ? 'Transfer' : (block.message_ko || '이동'),
          // D2: only show duration when verified; omit individual "확인 중" labels
          subtitle: block.estimated_duration_range
            ? (block.estimated_duration_range.min === block.estimated_duration_range.max
              ? (isEn ? `about ${block.estimated_duration_range.min} min` : `약 ${block.estimated_duration_range.min}분`)
              : (isEn
                  ? `about ${block.estimated_duration_range.min}–${block.estimated_duration_range.max} min`
                  : `약 ${block.estimated_duration_range.min}-${block.estimated_duration_range.max}분`))
            : null,
          className: 'course-block-travel'
        };
      case 'meal':
        return {
          icon: '🍽️',
          title: isEn
            ? (block.meal_context === 'lunch' ? 'Lunch' : 'Meal')
            : (block.meal_context === 'lunch' ? '점심' : '식사'),
          subtitle: isEn
            ? `about ${block.estimated_duration_minutes} min`
            : `약 ${block.estimated_duration_minutes}분`,
          className: 'course-block-meal'
        };
      case 'cafe': {
        let subtitle = isEn
          ? `about ${block.estimated_duration_minutes} min`
          : `약 ${block.estimated_duration_minutes}분`;
        if (block.cafes && block.cafes.length > 0) {
          const firstCafe = block.cafes[0];
          if (firstCafe.benefit?.display_copy) {
            subtitle = `⭐ ${firstCafe.benefit.display_copy}`;
          }
        }
        return {
          icon: '☕',
          title: isEn ? 'Café break' : '카페 휴식',
          subtitle,
          className: 'course-block-cafe'
        };
      }
      default:
        return {
          icon: '•',
          title: block.type,
          subtitle: null,
          className: 'course-block-default'
        };
    }
  };

  return (
    <section className="course-display">
      <div className="course-header">
        {/* D1: available_minutes badge removed — value may be fallback, not user-stated */}
        <h3>{isEn ? '📋 Your Travel Course' : '📋 여행 코스 구성'}</h3>
      </div>

      <div className="course-timeline">
        {course.blocks.map((block, idx) => {
          const display = getBlockDisplay(block);
          return (
            <div key={idx} className={`course-block ${display.className}`}>
              <div className="block-icon">{display.icon}</div>
              <div className="block-content">
                <div className="block-title">{display.title}</div>
                {display.subtitle && (
                  <div className="block-subtitle">{display.subtitle}</div>
                )}
                {block.type === 'meal' && block.restaurants && (
                  <div className="block-options">
                    {block.restaurants.slice(0, 2).map((rest, i) => (
                      <span key={i} className="option-tag">
                        {rest.name}
                      </span>
                    ))}
                  </div>
                )}
                {block.type === 'cafe' && block.cafes && (
                  <div className="block-options">
                    {block.cafes.slice(0, 2).map((cafe, i) => (
                      <span key={i} className="option-tag">
                        {cafe.name}
                      </span>
                    ))}
                  </div>
                )}
                {/* D3: block.warnings not shown — internal diagnostics only */}
              </div>
              {idx < course.blocks.length - 1 && (
                <div className="block-arrow">↓</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="course-summary">
        <div className="summary-item">
          <span className="label">{isEn ? 'Places' : '선택 장소'}</span>
          <span className="value">{isEn ? `${course.actual_stop_count} stops` : `${course.actual_stop_count}곳`}</span>
        </div>
        {/* D4: labeled as place stay time, not total trip time */}
        <div className="summary-item">
          <span className="label">{isEn ? 'Time at places' : '장소 체류시간 합계'}</span>
          <span className="value">{isEn ? `${course.summary?.total_stay_minutes} min` : `${course.summary?.total_stay_minutes}분`}</span>
        </div>
        {course.summary?.estimated_total_range && (
          <div className="summary-item">
            <span className="label">{isEn ? 'Est. total time' : '총 예상 시간'}</span>
            <span className="value">
              {isEn
                ? `${course.summary.estimated_total_range.min}–${course.summary.estimated_total_range.max} min`
                : `${course.summary.estimated_total_range.min}-${course.summary.estimated_total_range.max}분`}
            </span>
          </div>
        )}
      </div>

      {/* D4: note that travel time is not included in stay total */}
      <p className="course-stay-note">
        {isEn ? '※ Transfer time not included' : '※ 이동시간은 포함되지 않습니다'}
      </p>

      {/* D2: single footer notice when any travel duration is unverified */}
      {hasTravelUnknown && (
        <p className="course-travel-notice">
          {isEn ? 'Some transfer times are still being verified.' : '장소 간 이동시간은 현재 안내가 어렵습니다'}
        </p>
      )}

      {course.message_ko && (
        <div className="course-message">
          {course.message_ko}
        </div>
      )}

      {course.notes && (
        <div className="course-notes">
          {course.notes}
        </div>
      )}
    </section>
  );
}
