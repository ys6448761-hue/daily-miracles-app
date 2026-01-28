/**
 * 날짜 포맷 유틸리티
 *
 * 하루하루의 기적 서비스에서 사용되는 날짜 포맷 함수들
 *
 * @module utils/dateFormatter
 * @version 1.0.0 - 2025.01.29
 */

/**
 * 한국어 날짜 포맷 (YYYY년 MM월 DD일)
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷된 날짜
 */
function formatKoreanDate(date) {
  try {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      console.warn('[dateFormatter] 유효하지 않은 날짜:', date);
      return '날짜 오류';
    }

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    return `${year}년 ${month}월 ${day}일`;
  } catch (error) {
    console.error('[dateFormatter] formatKoreanDate 에러:', error.message);
    return '날짜 오류';
  }
}

/**
 * 한국어 날짜 + 요일 포맷 (YYYY년 MM월 DD일 (요일))
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷된 날짜
 */
function formatKoreanDateWithDay(date) {
  try {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      return '날짜 오류';
    }

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[d.getDay()];

    return `${formatKoreanDate(d)} (${dayName})`;
  } catch (error) {
    console.error('[dateFormatter] formatKoreanDateWithDay 에러:', error.message);
    return '날짜 오류';
  }
}

/**
 * ISO 날짜 포맷 (YYYY-MM-DD)
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} ISO 포맷 날짜
 */
function formatISODate(date) {
  try {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      return null;
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('[dateFormatter] formatISODate 에러:', error.message);
    return null;
  }
}

/**
 * 상대적 시간 포맷 (방금 전, 5분 전, 1시간 전 등)
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 상대적 시간
 */
function formatRelativeTime(date) {
  try {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      return '알 수 없음';
    }

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return '방금 전';
    } else if (diffMin < 60) {
      return `${diffMin}분 전`;
    } else if (diffHour < 24) {
      return `${diffHour}시간 전`;
    } else if (diffDay < 7) {
      return `${diffDay}일 전`;
    } else {
      return formatKoreanDate(d);
    }
  } catch (error) {
    console.error('[dateFormatter] formatRelativeTime 에러:', error.message);
    return '알 수 없음';
  }
}

/**
 * 여정 일차 계산 (Day 1, Day 2, ...)
 * @param {Date|string} startDate - 시작 날짜
 * @param {Date|string} currentDate - 현재 날짜 (기본: 오늘)
 * @returns {number} 일차 (1부터 시작)
 */
function calculateJourneyDay(startDate, currentDate = new Date()) {
  try {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const current = currentDate instanceof Date ? currentDate : new Date(currentDate);

    if (isNaN(start.getTime()) || isNaN(current.getTime())) {
      return 1;
    }

    // 날짜만 비교 (시간 제거)
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const currentDay = new Date(current.getFullYear(), current.getMonth(), current.getDate());

    const diffMs = currentDay.getTime() - startDay.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(1, diffDays + 1);  // 최소 1일
  } catch (error) {
    console.error('[dateFormatter] calculateJourneyDay 에러:', error.message);
    return 1;
  }
}

/**
 * 남은 일수 계산
 * @param {Date|string} endDate - 종료 날짜
 * @param {Date|string} fromDate - 기준 날짜 (기본: 오늘)
 * @returns {number} 남은 일수 (음수면 지남)
 */
function calculateDaysRemaining(endDate, fromDate = new Date()) {
  try {
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const from = fromDate instanceof Date ? fromDate : new Date(fromDate);

    if (isNaN(end.getTime()) || isNaN(from.getTime())) {
      return 0;
    }

    const diffMs = end.getTime() - from.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('[dateFormatter] calculateDaysRemaining 에러:', error.message);
    return 0;
  }
}

/**
 * 응원 메시지 발송 시간 포맷 (오전/오후 H시)
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 시간 포맷
 */
function formatMessageTime(date) {
  try {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      return '시간 오류';
    }

    const hours = d.getHours();
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours % 12 || 12;

    return `${period} ${displayHour}시`;
  } catch (error) {
    console.error('[dateFormatter] formatMessageTime 에러:', error.message);
    return '시간 오류';
  }
}

module.exports = {
  formatKoreanDate,
  formatKoreanDateWithDay,
  formatISODate,
  formatRelativeTime,
  calculateJourneyDay,
  calculateDaysRemaining,
  formatMessageTime
};
