/**
 * CourseDisplay
 * Displays Journey Composer V0 course blocks in visual sequence
 * Shows: places → travel transitions → meals → cafes
 * P0: Cafe blocks show partner benefits when available
 */

import React, { useState, useEffect } from 'react';

export default function CourseDisplay({ course }) {
  if (!course || !course.blocks || course.blocks.length === 0) {
    return null;
  }

  const getBlockIcon = (type) => {
    switch (type) {
      case 'place':
        return '📍';
      case 'travel_transition':
        return '→';
      case 'meal':
        return '🍽️';
      case 'cafe':
        return '☕';
      default:
        return '•';
    }
  };

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
          subtitle: block.estimated_duration_range
            ? `약 ${block.estimated_duration_range.min}-${block.estimated_duration_range.max}분`
            : '이동시간 확인 중',
          className: 'course-block-travel'
        };
      case 'meal':
        return {
          icon: '🍽️',
          title: block.meal_context === 'lunch' ? '점심' : '식사',
          subtitle: `약 ${block.estimated_duration_minutes}분`,
          className: 'course-block-meal'
        };
      case 'cafe':
        // Build subtitle with benefit if available
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
          subtitle: subtitle,
          className: 'course-block-cafe'
        };
      default:
        return {
          icon: '•',
          title: block.type,
          subtitle: '',
          className: 'course-block-default'
        };
    }
  };

  return (
    <section className="course-display">
      <div className="course-header">
        <h3>📋 여행 코스 구성</h3>
        <div className="course-meta">
          <span className="course-time">{course.available_minutes}분 코스</span>
          <span className="course-fit" data-status={course.summary?.fit_status}>
            {course.summary?.fit_status === 'travel_time_unverified' ? '⏱️ 이동시간 확인 중' : '⭐ 여유 있음'}
          </span>
        </div>
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
                {block.warnings && block.warnings.length > 0 && (
                  <div className="block-warnings">
                    {block.warnings.map((w, i) => (
                      <span key={i} className="warning-tag">
                        ⚠️ {w.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
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
        <div className="summary-item">
          <span className="label">체류 시간</span>
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
