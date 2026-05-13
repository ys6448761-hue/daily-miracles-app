'use strict';

const crypto = require('crypto');
const MESSAGES = require('../config/silent-response-messages.json');

// VIP 패턴 — 오랜 버팀/간절함이 느껴지는 소원 (수기 답장 후보)
const VIP_PATTERNS = [
  '버티고', '버텼', '버텨', '포기하지 않', '포기 안',
  '마지막', '기적이', '살아있', '살아가', '살아보',
  '혼자서도', '아무도 몰', '아무도 모르', '말 못 했',
  '말 못했', '3년', '5년', '10년', '오래',
];

function detectVip(wishText) {
  const text = (wishText || '').toLowerCase();
  return VIP_PATTERNS.some(p => text.includes(p));
}

/**
 * 감정 강도 분석
 * safetyLevel: 기존 classifyWish 결과 ('RED'|'YELLOW'|'GREEN')
 * @returns {'green'|'yellow'|'red'|'vip'}
 */
function analyzeEmotionalIntensity(safetyLevel, wishText) {
  if (safetyLevel === 'RED') return 'red';
  const isVip = detectVip(wishText);
  if (safetyLevel === 'YELLOW') return isVip ? 'vip' : 'yellow';
  return isVip ? 'vip' : 'green';
}

/**
 * 감정 레벨에 맞는 UI 설정 반환
 */
function getSilentConfig(level) {
  const pool = (level === 'red')                         ? MESSAGES.red
             : (level === 'yellow' || level === 'vip')   ? MESSAGES.yellow
             : null;

  const message  = pool ? pool[Math.floor(Math.random() * pool.length)] : null;
  const timing   = MESSAGES.timing;
  const ctaModes = MESSAGES.cta_modes;

  const ctaKey = level === 'red'                        ? 'hidden'
               : (level === 'yellow' || level === 'vip') ? 'soft'
               : 'normal';

  return {
    level,
    isVip:           level === 'vip',
    delayMs:         (level === 'yellow' || level === 'vip') ? timing.yellow_delay_ms : 0,
    blockAutoAdvice: level === 'red',
    ctaMode:         ctaKey,
    cta:             ctaModes[ctaKey],
    message:         message?.main   ?? null,
    subMessage:      message?.sub    ?? null,
    messageId:       message?.id     ?? null,
    fadeInMs:        timing.message_fade_in_ms,
  };
}

/**
 * requestId 생성 — 소원 생성 단위 추적용
 * 형식: req_{timestamp}_{6자리hex}
 */
function generateRequestId() {
  return `req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

module.exports = { analyzeEmotionalIntensity, getSilentConfig, generateRequestId };
