'use strict';
/**
 * worldCanvasService.js — miracle 전용 world-canvas 이미지 라우팅
 *
 * storybook → star-cache  (감정 클로즈업)
 * miracle   → world-canvas (세계 와이드샷)
 *
 * SSOT: config/world-canvas/routing.json
 *       config/world-canvas/prompt-ssot.json
 */

const fs   = require('fs');
const path = require('path');

const ROOT         = path.join(__dirname, '..');
const ROUTING_FILE = path.join(ROOT, 'config', 'world-canvas', 'routing.json');
const CANVAS_BASE  = path.join(ROOT, 'public', 'images', 'world-canvas', 'miracle');

let _routing = null;
function getRouting() {
  if (!_routing) _routing = JSON.parse(fs.readFileSync(ROUTING_FILE, 'utf8'));
  return _routing;
}

/**
 * wish_type 또는 gravity → world-canvas 이미지 URL 반환
 * 파일이 없으면 null (생성 전 상태)
 *
 * @param {string} wishType  e.g. '위로형'
 * @param {string} gravity   e.g. 'calm' (fallback)
 * @returns {{ url: string|null, scene: string, exists: boolean }}
 */
function getWorldCanvasUrl(wishType, gravity) {
  const routing = getRouting();
  const pattern = routing.filename_pattern;

  // wish_type → scene → gravity fallback 순서
  const scene =
    routing.wish_type_to_scene[wishType] ||
    routing.gravity_to_scene[gravity]   ||
    routing.scene_fallback_order[0];

  const filename = pattern.replace('{scene_id}', scene);
  const filePath = path.join(CANVAS_BASE, scene, filename);
  const exists   = fs.existsSync(filePath);
  const url      = exists ? `/images/world-canvas/miracle/${scene}/${filename}` : null;

  return { url, scene, exists, filename, filePath };
}

/**
 * 사용 가능한 세계 캔버스 씬 목록 반환
 * @returns {{ scene: string, url: string, exists: boolean }[]}
 */
function listWorldCanvasScenes() {
  const routing = getRouting();
  return routing.scene_fallback_order.map(scene => {
    const filename = routing.filename_pattern.replace('{scene_id}', scene);
    const filePath = path.join(CANVAS_BASE, scene, filename);
    const exists   = fs.existsSync(filePath);
    return {
      scene,
      url:    exists ? `/images/world-canvas/miracle/${scene}/${filename}` : null,
      exists,
      filePath,
    };
  });
}

/**
 * miracle F1 프레임 이미지 경로 반환 (assemble-miracle-video.js 전용)
 * 이미지가 없으면 null → 호출자가 wish-render-prototype fallback 처리
 *
 * @param {string} wishType
 * @param {string} gravity
 * @param {string} relativeFrom  sequence.json 기준 상대경로 prefix
 * @returns {string|null}
 */
function getMiracleF1Image(wishType, gravity, relativeFrom = '../../../') {
  const { url, exists } = getWorldCanvasUrl(wishType, gravity);
  if (!exists) return null;
  // sequence.json에서 참조하는 상대 경로로 변환
  return `${relativeFrom}public${url}`;
}

module.exports = { getWorldCanvasUrl, listWorldCanvasScenes, getMiracleF1Image };
