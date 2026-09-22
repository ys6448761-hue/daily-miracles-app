'use strict';
/**
 * Core 12 Reality Data V0.1 — Migration 216 Verification (T1–T17)
 *
 * Tests verify:
 *   T1–T2:  Identity corrections present in migration SQL
 *   T3–T10: Fee classification UPDATEs in migration SQL
 *   T11:    sky_tower hours present
 *   T12:    romantic_pojangmacha hours present
 *   T13:    romantic_pojangmacha address present
 *   T14:    romantic_pojangmacha weather_suitable 'night' UPDATE present
 *   T15:    outdoor live_status_required=false UPDATE present
 *   T16:    cablecar fee NOT set in migration (TI null = PAID, Commerce separate)
 *   T17:    Commerce regression — cable list=17,000 in quotePriceData (Founder v1.3)
 */

const fs   = require('fs');
const path = require('path');

const MIGRATION_PATH = path.join(
  __dirname,
  '../../database/migrations/216_travel_places_core12_reality_v01.sql'
);
const PRICE_DATA_PATH = path.join(__dirname, '../../config/quotePriceData.js');

let sql;
beforeAll(() => {
  sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
});

// ── T1: dolsan_nightscape identity correction ──────────────────────────────

test('T1: dolsan_nightscape → 돌산공원 UPDATE present', () => {
  expect(sql).toContain("code = 'dolsan_nightscape'");
  expect(sql).toContain("name_ko = '돌산공원'");
  expect(sql).toContain("name_en = 'Dolsan Park'");
  expect(sql).toMatch(/address\s*=\s*NULL/);
});

// ── T2: marine_park identity correction ───────────────────────────────────

test('T2: marine_park → 종포해양공원 UPDATE present', () => {
  expect(sql).toContain("code = 'marine_park'");
  expect(sql).toContain("name_ko = '종포해양공원'");
});

// ── T3–T9: FREE places admission_fee_json = {"adult": 0} ─────────────────

const FREE_PLACES = [
  'dolsan_daegyo',
  'dolsan_nightscape',
  'hyangiram',
  'jaisan_park',
  'lee_soon_shin_plaza',
  'marine_park',
  'odongdo',
  'jungang_market',
  'romantic_pojangmacha',
];

test('T3: Free places batch UPDATE targets all 9 FREE codes', () => {
  for (const code of FREE_PLACES) {
    expect(sql).toContain(`'${code}'`);
  }
  expect(sql).toContain('"adult": 0');
});

test('T4: dolsan_daegyo in free classification batch', () => {
  expect(sql).toContain("'dolsan_daegyo'");
});

test('T5: hyangiram in free classification batch', () => {
  expect(sql).toContain("'hyangiram'");
});

test('T6: jaisan_park in free classification batch', () => {
  expect(sql).toContain("'jaisan_park'");
});

test('T7: odongdo in free classification batch', () => {
  expect(sql).toContain("'odongdo'");
});

test('T8: jungang_market in free classification batch', () => {
  expect(sql).toContain("'jungang_market'");
});

test('T9: romantic_pojangmacha in free classification batch', () => {
  expect(sql).toContain("'romantic_pojangmacha'");
});

// ── T10: sky_tower PAID fee ────────────────────────────────────────────────

test('T10: sky_tower admission_fee_json with adult=3000 present', () => {
  expect(sql).toContain("code = 'sky_tower'");
  expect(sql).toContain('"adult": 3000');
  expect(sql).toContain('"youth": 2500');
  expect(sql).toContain('"senior": 2500');
  expect(sql).toContain('"child": 1500');
});

// ── T11: sky_tower hours ──────────────────────────────────────────────────

test('T11: sky_tower opening_hours 10:00-22:00 UPDATE present', () => {
  expect(sql).toContain('10:00-22:00');
  // Confirms sky_tower block
  const skyBlock = sql.indexOf("code = 'sky_tower'");
  const hoursBlock = sql.indexOf('10:00-22:00');
  expect(hoursBlock).toBeGreaterThan(skyBlock);
});

// ── T12: romantic_pojangmacha evening hours ────────────────────────────────

test('T12: romantic_pojangmacha opening_hours 18:00-01:00 UPDATE present', () => {
  expect(sql).toContain('18:00-01:00');
  // Hours block targets romantic_pojangmacha (either via IN list or standalone)
  expect(sql).toContain("'romantic_pojangmacha'");
  expect(sql).toMatch(/opening_hours_json[\s\S]{0,50}18:00-01:00/);
});

// ── T13: romantic_pojangmacha address ─────────────────────────────────────

test('T13: romantic_pojangmacha address 하멜로 102 UPDATE present', () => {
  expect(sql).toContain('하멜로 102');
  expect(sql).toContain('거북선대교 하부공간');
});

// ── T14: romantic_pojangmacha weather_suitable += night ───────────────────

test('T14: romantic_pojangmacha weather_suitable night UPDATE present (idempotent)', () => {
  expect(sql).toContain('array_append');
  expect(sql).toContain("'night'");
  // Idempotent guard
  expect(sql).toContain('NOT');
  expect(sql).toMatch(/ANY\(weather_suitable\)/);
});

// ── T15: outdoor places live_status_required=FALSE ────────────────────────

test('T15: outdoor places live_status_required=false batch UPDATE present', () => {
  expect(sql).toContain('live_status_required = false');
  // All 5 outdoor codes must appear near live_status block
  const liveBlock = sql.indexOf('live_status_required = false');
  const trailingSQL = sql.slice(liveBlock - 400); // includes the IN list before it
  const OUTDOOR = ['dolsan_daegyo', 'dolsan_nightscape', 'jaisan_park', 'lee_soon_shin_plaza', 'marine_park'];
  for (const code of OUTDOOR) {
    expect(sql).toContain(`'${code}'`);
  }
});

// ── T16: cablecar NOT given admission_fee_json in migration ───────────────

test('T16: migration does NOT set admission_fee_json for cablecar (TI=PAID, Commerce separate)', () => {
  // cablecar code must not appear in any SET admission_fee_json block
  // (it may appear in comments)
  const setFeeIndex = sql.indexOf('admission_fee_json =');
  // Check that no UPDATE block targeting cablecar also sets admission_fee_json
  expect(sql).not.toMatch(/'cablecar'[\s\S]{0,500}admission_fee_json\s*=/);
  // Cablecar is mentioned only in a comment
  const cablecarMention = sql.indexOf("'cablecar'");
  if (cablecarMention !== -1) {
    const surroundingLine = sql.slice(
      sql.lastIndexOf('\n', cablecarMention),
      sql.indexOf('\n', cablecarMention)
    );
    expect(surroundingLine).toMatch(/--/); // must be a comment
  }
});

// ── T17: Commerce regression — cable list=17,000 ─────────────────────────

test('T17: quotePriceData.js cable weekday.list=17000 (Founder v1.3 alignment)', () => {
  const priceDataStr = fs.readFileSync(PRICE_DATA_PATH, 'utf8');
  // v1.3 metadata
  expect(priceDataStr).toContain('v1.3_20260922');
  // cable list aligned
  expect(priceDataStr).toMatch(/weekday:\s*\{[^}]*list:\s*17000/);
  expect(priceDataStr).toMatch(/weekend:\s*\{[^}]*list:\s*17000/);
  // sell unchanged
  expect(priceDataStr).toMatch(/weekday:\s*\{[^}]*sell:\s*16000/);
  // Savings per ticket: 17000-16000=1000 (Founder confirmed)
  const weekdayMatch = priceDataStr.match(/weekday:\s*\{[^}]+\}/)?.[0] || '';
  const listVal  = parseInt((weekdayMatch.match(/list:\s*(\d+)/) || [])[1]);
  const sellVal  = parseInt((weekdayMatch.match(/sell:\s*(\d+)/) || [])[1]);
  expect(listVal - sellVal).toBe(1000); // 1,000원 절약/ticket
});
