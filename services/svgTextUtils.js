'use strict';

/**
 * svgTextUtils.js — opentype.js 기반 한글 텍스트 → SVG path 공통 유틸
 *
 * 목적:
 *   SVG <text>는 시스템 폰트에 의존하여 Render.com 등 Linux 서버에서 한글이 깨짐.
 *   opentype.js로 TTF를 직접 로드해 텍스트를 bezier path data로 변환함으로써
 *   렌더러(librsvg, Chromium 등)의 폰트 환경과 완전히 독립.
 *
 * 폰트 경로:
 *   assets/fonts/NotoSansKR-Regular.ttf  (필수)
 *   assets/fonts/NotoSansKR-Bold.ttf     (선택 — 없으면 Regular 폴백)
 *
 * 사용:
 *   const { textPath } = require('./svgTextUtils');
 *   const d = textPath('안녕하세요', { size: 20, align: 'center', canvasWidth: 1024, y: 75 });
 *   // SVG: <path d="${d}" fill="white"/>
 */

const fs       = require('fs');
const path     = require('path');
const opentype = require('opentype.js');

const FONTS_DIR   = path.join(__dirname, '..', 'assets', 'fonts');
const REG_PATH    = path.join(FONTS_DIR, 'NotoSansKR-Regular.ttf');
const BOLD_PATH   = path.join(FONTS_DIR, 'NotoSansKR-Bold.ttf');

// 모듈 로드 시 한 번만 열기 (lazy)
let _reg  = null;
let _bold = null;

function _regFont() {
  if (!_reg) _reg = opentype.loadSync(REG_PATH);
  return _reg;
}

function _boldFont() {
  if (!_bold) {
    _bold = opentype.loadSync(fs.existsSync(BOLD_PATH) ? BOLD_PATH : REG_PATH);
  }
  return _bold;
}

/**
 * 텍스트 → SVG path data 변환
 *
 * @param {string} text
 * @param {{ size: number, y: number, align: 'left'|'center'|'right',
 *           x?: number, canvasWidth?: number, bold?: boolean }} opts
 * @returns {string} SVG path d attribute 값
 */
function textPath(text, { size, y, align = 'left', x = 0, canvasWidth = 1024, bold = false }) {
  const font    = bold ? _boldFont() : _regFont();
  const advance = font.getAdvanceWidth(text, size);

  let startX;
  switch (align) {
    case 'center': startX = Math.round((canvasWidth - advance) / 2); break;
    case 'right':  startX = Math.round(x - advance);                  break;
    default:       startX = Math.round(x);
  }

  return font.getPath(text, startX, y, size).toPathData(2);
}

module.exports = { textPath };
