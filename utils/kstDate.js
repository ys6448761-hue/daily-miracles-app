/**
 * kstDate.js — KST(UTC+9) 날짜 유틸리티
 *
 * 모든 일자 판정(출석, 일일체크, 포인트 캡)은 KST 기준.
 * Render 서버(UTC)에서도 정확한 한국 날짜를 반환한다.
 *
 * @since 2026-02-16
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // +9h

/**
 * KST 기준 오늘 날짜 (YYYY-MM-DD)
 * @param {Date} [now] - 기준 시각 (테스트용)
 * @returns {string}
 */
function getKSTDateString(now = new Date()) {
  return new Date(now.getTime() + KST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * KST 기준 어제 날짜 (YYYY-MM-DD)
 * @param {Date} [now]
 * @returns {string}
 */
function getKSTYesterday(now = new Date()) {
  return new Date(now.getTime() + KST_OFFSET_MS - 86400000)
    .toISOString()
    .slice(0, 10);
}

module.exports = { getKSTDateString, getKSTYesterday, KST_OFFSET_MS };
