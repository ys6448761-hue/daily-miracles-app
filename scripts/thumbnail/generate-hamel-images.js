'use strict';
// [deprecated] → node scripts/thumbnail/generate-thumbnail.js --location hamel
console.warn('⚠️  [deprecated] use: node scripts/thumbnail/generate-thumbnail.js --location hamel');

const path = require('path');
const { runGenerate } = require('./utils');

const ROOT = path.join(__dirname, '..', '..');

runGenerate({
  promptDir: path.join(ROOT, 'outputs', 'prompts', 'thumbnail', 'hamel'),
  outputDir: path.join(ROOT, 'public', 'images', 'thumbnails', 'hamel', 'generated'),
  dryRun:    process.argv.includes('--dry-run'),
}).catch(err => { console.error('❌ FAILED:', err.message); process.exit(1); });
