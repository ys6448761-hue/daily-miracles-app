'use strict';

const path = require('path');

// Base type → star anchor ratios (x/y as fraction of image dimensions)
const TYPE_POSITIONS = {
  anchor:  { xRatio: 0.50, yRatio: 0.22 },
  left:    { xRatio: 0.32, yRatio: 0.25 },
  right:   { xRatio: 0.68, yRatio: 0.25 },
  low:     { xRatio: 0.50, yRatio: 0.32 },
  wide:    { xRatio: 0.50, yRatio: 0.18 },
  default: { xRatio: 0.50, yRatio: 0.22 },
};

// Predefined base ID → type (for explicit baseId-based positioning)
const baseMap = {
  base01: { type: 'anchor', ...TYPE_POSITIONS.anchor },
  base02: { type: 'left',   ...TYPE_POSITIONS.left },
  base03: { type: 'right',  ...TYPE_POSITIONS.right },
  base04: { type: 'low',    ...TYPE_POSITIONS.low },
  base05: { type: 'wide',   ...TYPE_POSITIONS.wide },
};

// Small random offset to avoid mechanical center placement
function jitter(value, range) {
  return value + (Math.random() - 0.5) * 2 * range;
}

// Detect type from filename (e.g. hamel_base_02_left.png → 'left')
function detectType(filename) {
  const n = path.basename(filename).toLowerCase();
  for (const type of ['anchor', 'left', 'right', 'low', 'wide']) {
    if (n.includes(type)) return type;
  }
  return 'default';
}

// Position by predefined base ID
function getStarPositionByBase(baseId, w, h) {
  const anchor = baseMap[baseId] || { type: 'default', ...TYPE_POSITIONS.default };
  return {
    x:    Math.round(jitter(anchor.xRatio * w, w * 0.03)),
    y:    Math.round(jitter(anchor.yRatio * h, h * 0.02)),
    type: anchor.type,
  };
}

// Position by filename (auto-detects type from embedded keyword)
function getStarPositionByFilename(filename, w, h) {
  const type   = detectType(filename);
  const anchor = TYPE_POSITIONS[type] || TYPE_POSITIONS.default;
  return {
    x:    Math.round(jitter(anchor.xRatio * w, w * 0.03)),
    y:    Math.round(jitter(anchor.yRatio * h, h * 0.02)),
    type,
  };
}

module.exports = {
  getStarPositionByBase,
  getStarPositionByFilename,
  jitter,
  detectType,
  TYPE_POSITIONS,
  baseMap,
};
