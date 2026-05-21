'use strict';

/**
 * build-asset-registry.js — DreamTown Asset Registry 자동 생성
 *
 * SSOT: config/storybook/asset-registry.schema.json
 * Output: config/storybook/asset-registry.json
 * Backup: config/storybook/backups/asset-registry.YYYYMMDD-HHMMSS.json
 *
 * 목적: 기존 이미지 자산을 역할별로 등록/분류. 새 이미지 생성 아님.
 *
 * 사용:
 *   node scripts/storybook/build-asset-registry.js --dry-run   # 스캔 결과만 출력
 *   node scripts/storybook/build-asset-registry.js             # registry.json 생성
 *   node scripts/storybook/build-asset-registry.js --stats     # 분류 통계 출력
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..', '..');
const OUT_FILE   = path.join(ROOT, 'config', 'storybook', 'asset-registry.json');
const BACKUP_DIR = path.join(ROOT, 'config', 'storybook', 'backups');

const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const STATS   = args.includes('--stats');

// ─── Known vocabularies ──────────────────────────────────────────────────────
const EMOTIONS     = ['fragile_hope', 'confusion', 'pause', 'calm', 'curiosity']; // longest first
const GEMS         = ['moonstone', 'sapphire', 'emerald', 'topaz', 'diamond', 'citrine', 'ruby'];
const PAGE05_TYPES = [
  'wish_signal_continuation', 'reality_reconnection', 'emotional_afterflow', 'widened_continuation'
]; // longest first

const LOCATION_ROLES = {
  cafe:     'emotional_pause',
  cablecar: 'widened_perspective',
  hamel:    'wish_signal',
  hotel:    'quiet_reset',
};

const MYTH_LAYERS = {
  hamel:    'strong',
  cablecar: 'medium',
  cafe:     'low',
  hotel:    'low',
};

// ─── Scan source definitions ─────────────────────────────────────────────────
const SOURCES = [
  // ── cablecar canonical ──────────────────────────────────────────────────────
  {
    folder:    'public/images/thumbnails/cablecar/generated/full',
    location:  'cablecar',
    page_role: 'canonical_core',
    usable_for: ['storybook', 'postcard', 'miracle_video', 'thumbnail'],
  },
  {
    folder:    'public/images/thumbnails/cablecar/base',
    location:  'cablecar',
    page_role: 'base_master',
    usable_for: ['storybook', 'thumbnail'],
  },
  // ── cafe canonical ──────────────────────────────────────────────────────────
  {
    folder:    'public/images/thumbnails/cafe/generated/full',
    location:  'cafe',
    page_role: 'canonical_core',
    usable_for: ['storybook', 'postcard', 'miracle_video', 'thumbnail'],
  },
  // ── hotel canonical ─────────────────────────────────────────────────────────
  {
    folder:    'public/images/thumbnails/hotel/generated/full',
    location:  'hotel',
    page_role: 'canonical_core',
    usable_for: ['storybook', 'postcard', 'miracle_video', 'thumbnail'],
  },
  // ── hamel generated/full → page05_afterflow_candidate (per DoD) ────────────
  {
    folder:    'public/images/thumbnails/hamel/generated/full',
    location:  'hamel',
    page_role: 'page05_afterflow_candidate',
    usable_for: ['storybook_page05_candidate', 'ambient'],
    notes: 'GATE 6+6b 처리 완료 자산. canonical은 아니나 page05 afterflow 후보.',
  },
  // ── hamel base (misc) ───────────────────────────────────────────────────────
  {
    folder:    'public/images/thumbnails/hamel/base',
    location:  'hamel',
    page_role: 'base_master',
    usable_for: ['storybook', 'thumbnail'],
    notes: 'hamel base 원천 자산 (혼합 버전)',
  },
  // ── hamel 스토리북 5PAGE bases → canonical_core (GATE 6 최종 원천) ──────────
  {
    folder:    'public/images/thumbnails/hamel/base/스토리북 5PAGE',
    location:  'hamel',
    page_role: 'base_master',
    usable_for: ['storybook', 'thumbnail'],
    notes: 'GATE 6 regenerated canonical base 5장. hamel 최상위 원천소스.',
  },
  // ── page05 continuity_connector ─────────────────────────────────────────────
  {
    folder:    'public/images/storybook/sources/page05/cafe',
    location:  'cafe',
    page_role: 'continuity_connector',
    usable_for: ['storybook_page05', 'ambient'],
  },
  {
    folder:    'public/images/storybook/sources/page05/cablecar',
    location:  'cablecar',
    page_role: 'continuity_connector',
    usable_for: ['storybook_page05', 'ambient'],
  },
  {
    folder:    'public/images/storybook/sources/page05/hamel',
    location:  'hamel',
    page_role: 'continuity_connector',
    usable_for: ['storybook_page05', 'ambient'],
  },
  {
    folder:    'public/images/storybook/sources/page05/hotel',
    location:  'hotel',
    page_role: 'continuity_connector',
    usable_for: ['storybook_page05', 'ambient'],
  },
];

// ─── Parsers ─────────────────────────────────────────────────────────────────
function extractEmotion(str) {
  for (const e of EMOTIONS) {
    if (str.includes(e)) return e;
  }
  return null;
}

function extractGem(str) {
  for (const g of GEMS) {
    if (str.includes(g)) return g;
  }
  return null;
}

function extractPage05Type(str) {
  for (const t of PAGE05_TYPES) {
    if (str.includes(t)) return t;
  }
  return null;
}

function isTextOverlay(filename) {
  return filename.endsWith('_text.png');
}

function buildId(location, emotion, gem, page_role, page05Type, filename) {
  if (page_role === 'continuity_connector') {
    return `page05_${location}_${page05Type || 'unknown'}`;
  }
  const base = path.basename(filename, '.png').replace(/_text$/, '');
  // Normalize to {location}_{emotion}_{gem}_{suffix}
  if (emotion && gem) {
    const suffix = base.replace(new RegExp(`.*${gem}`), '').replace(/^_/, '').replace(/[^a-z0-9_]/g, '') || '01';
    return `${location}_${emotion}_${gem}${suffix ? '_' + suffix : ''}`;
  }
  return `${location}_${base}`;
}

function inferTime(location, page_role) {
  if (location === 'cafe' || location === 'hotel') return 'night';
  if (location === 'cablecar') return 'night';
  if (location === 'hamel') {
    if (page_role === 'page05_afterflow_candidate') return 'late_afternoon';
    return 'night';
  }
  return 'night';
}

function inferWeather(location, page_role) {
  if (location === 'hamel' && page_role !== 'continuity_connector') return 'overcast';
  return 'night';
}

function inferContinuityType(location, page_role) {
  if (page_role === 'continuity_connector') return 'mixed';
  const map = {
    cafe:     'room_lag',
    cablecar: 'temporal_asymmetry',
    hamel:    'exterior_indifference',
    hotel:    'room_lag',
  };
  return map[location] || null;
}

// ─── Main scan ───────────────────────────────────────────────────────────────
function scanSource(src) {
  const absFolder = path.join(ROOT, src.folder);
  const assets = [];

  if (!fs.existsSync(absFolder)) {
    console.warn(`  ⚠️  폴더 없음 (skip): ${src.folder}`);
    return assets;
  }

  const files = fs.readdirSync(absFolder)
    .filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i))
    .sort();

  for (const filename of files) {
    const filePath = path.join(src.folder, filename).replace(/\\/g, '/');
    const name     = filename.toLowerCase();
    const emotion  = extractEmotion(name);
    const gem      = extractGem(name);
    const p05type  = src.page_role === 'continuity_connector' ? extractPage05Type(name) : null;
    const hasText  = isTextOverlay(filename);

    // Text overlay files → page_role overridden
    const page_role = hasText ? 'text_overlay' : src.page_role;
    const usable    = hasText ? ['thumbnail'] : src.usable_for;
    const status    = hasText ? 'text_overlay_only' : 'active';

    const id = buildId(src.location, emotion, gem, page_role, p05type, filename);

    assets.push({
      id,
      file_path:     filePath,
      location:      src.location,
      location_role: LOCATION_ROLES[src.location],
      page_role,
      emotion:       emotion || null,
      page05_type:   p05type || null,
      gem:           gem || null,
      wish_type:     null,
      weather:       inferWeather(src.location, page_role),
      time:          inferTime(src.location, page_role),
      continuity_type: inferContinuityType(src.location, page_role),
      myth_layer:    MYTH_LAYERS[src.location],
      visual_style:  'watercolor_manhwa',
      derived_from:  null,
      has_text_overlay: hasText,
      usable_for:    usable,
      status,
      notes:         src.notes || null,
    });
  }
  return assets;
}

// ─── Registry build ──────────────────────────────────────────────────────────
function buildRegistry() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  DreamTown Asset Registry Builder v1');
  console.log('═══════════════════════════════════════════════════\n');

  const allAssets = [];
  const idSeen = new Set();

  for (const src of SOURCES) {
    console.log(`📁 스캔: ${src.folder}`);
    const assets = scanSource(src);
    console.log(`   → ${assets.length}개 발견`);

    for (const a of assets) {
      // Deduplicate by id (prefer earlier source order)
      if (idSeen.has(a.id)) {
        // Make id unique with suffix
        let suffix = 2;
        let newId = `${a.id}_v${suffix}`;
        while (idSeen.has(newId)) { suffix++; newId = `${a.id}_v${suffix}`; }
        a.id = newId;
      }
      idSeen.add(a.id);
      allAssets.push(a);
    }
  }

  console.log(`\n📊 총 ${allAssets.length}개 자산 등록`);

  if (STATS || DRY_RUN) {
    const byRole = {};
    const byLoc  = {};
    for (const a of allAssets) {
      byRole[a.page_role] = (byRole[a.page_role] || 0) + 1;
      byLoc[a.location]   = (byLoc[a.location]   || 0) + 1;
    }
    console.log('\n  page_role 분포:');
    Object.entries(byRole).forEach(([k, v]) => console.log(`    ${k}: ${v}장`));
    console.log('\n  location 분포:');
    Object.entries(byLoc).forEach(([k, v]) => console.log(`    ${k}: ${v}장`));
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: registry 파일 생성 없이 종료');
    console.log('  생성 실행: node scripts/storybook/build-asset-registry.js');
    return;
  }

  // Backup existing registry
  if (fs.existsSync(OUT_FILE)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, 19);
    const backupPath = path.join(BACKUP_DIR, `asset-registry.${ts}.json`);
    fs.copyFileSync(OUT_FILE, backupPath);
    console.log(`\n  🗄  기존 registry 백업: ${path.relative(ROOT, backupPath)}`);
  }

  const registry = {
    _meta: {
      version:         'v1',
      built_at:        new Date().toISOString(),
      total_assets:    allAssets.length,
      sources_scanned: SOURCES.map(s => s.folder),
    },
    assets: allAssets,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(registry, null, 2), 'utf-8');
  console.log(`\n✅ Registry 생성 완료: ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`   총 ${allAssets.length}개 자산`);
  console.log('\n다음 단계: node scripts/storybook/assemble-storybook-test.js');
}

buildRegistry();
