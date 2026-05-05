'use strict';

const path = require('path');
const { runGenerate } = require('./utils');

const ROOT = path.join(__dirname, '..', '..');

runGenerate({
  promptDir: path.join(ROOT, 'outputs', 'prompts', 'thumbnail', 'hotel'),
  outputDir: path.join(ROOT, 'public', 'images', 'thumbnails', 'hotel', 'generated'),
  dryRun:    process.argv.includes('--dry-run'),
}).catch(err => { console.error('❌ FAILED:', err.message); process.exit(1); });
