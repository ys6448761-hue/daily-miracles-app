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

export default function CourseDisplay({ course }) {
  if (!course || !course.blocks || course.blocks.length === 0) {
    return null;
  }

  // D2: detect if any travel segment has unverified duration — for single footer notice
  const hasTravelUnknown = course.blocks.some(
    (b) => b.type === 'travel_transition' && !b.estimated_duration_range
  );

  const getBlockDisplay = (block) => {
    switch (block.type) {
      case 'place':
        return {
          icon: '📍',
          title: block.name_ko,
          subtitle: `${block.stay_minutes}분 체류`,
          className: 'course-block-place'
        };
      case 'travel_transition':
        return {
          icon: '↓',
          title: block.message_ko || '이동',
          // D2: only show duration when verified; omit individual "확인 중" labels
          subtitle: block.estimated_duration_range
            ? `약 ${block.estimated_duration_range.min}-${block.estimated_duration_range.max}분`
            : null,
          className: 'course-block-travel'
        };
      case 'meal':
        return {
          icon: '🍽️',
          title: block.meal_context === 'lunch' ? '점심' : '식사',
          subtitle: `약 ${block.estimated_duration_minutes}분`,
          className: 'course-block-meal'
        };
      case 'cafe': {
        let subtitle = `약 ${block.estimated_duration_minutes}분`;
        if (block.cafes && block.cafes.length > 0) {
          const firstCafe = block.cafes[0];
          if (firstCafe.benefit?.display_copy) {
            subtitle = `⭐ ${firstCafe.benefit.display_copy}`;
          }
        }
        return {
          icon: '☕',
          title: '카페 휴식',
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
        <h3>📋 여행 코스 구성</h3>
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
          <span className="label">선택 장소</span>
          <span className="value">{course.actual_stop_count}곳</span>
        </div>
        {/* D4: labeled as place stay time, not total trip time */}
        <div className="summary-item">
          <span className="label">장소 체류시간 합계</span>
          <span className="value">{course.summary?.total_stay_minutes}분</span>
        </div>
        {course.summary?.estimated_total_range && (
          <div className="summary-item">
            <span className="label">총 예상 시간</span>
            <span className="value">
              {course.summary.estimated_total_range.min}-{course.summary.estimated_total_range.max}분
            </span>
          </div>
        )}
      </div>

      {/* D4: note that travel time is not included in stay total */}
      <p className="course-stay-note">※ 이동시간은 포함되지 않습니다</p>

      {/* D2: single footer notice when any travel duration is unverified */}
      {hasTravelUnknown && (
        <p className="course-travel-notice">장소 간 이동시간은 현재 안내가 어렵습니다</p>
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
