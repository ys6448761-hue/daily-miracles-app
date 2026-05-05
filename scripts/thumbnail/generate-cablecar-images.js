'use strict';
// [deprecated] → node scripts/thumbnail/generate-thumbnail.js --location cablecar
console.warn('⚠️  [deprecated] use: node scripts/thumbnail/generate-thumbnail.js --location cablecar');

const path = require('path');
const { runGenerate } = require('./utils');

const ROOT = path.join(__dirname, '..', '..');

runGenerate({
  promptDir: path.join(ROOT, 'outputs', 'prompts', 'thumbnail', 'cablecar'),
  outputDir: path.join(ROOT, 'public', 'images', 'thumbnails', 'cablecar', 'generated'),
  dryRun:    process.argv.includes('--dry-run'),
}).catch(err => { console.error('❌ FAILED:', err.message); process.exit(1); });
