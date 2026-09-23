'use strict';
/**
 * Session Context Deserialization Fix V0.1 — Unit tests
 *
 * Root cause: pg auto-deserializes JSONB → JS object.
 * JSON.parse("[object Object]") throws SyntaxError at sessionService.getSession:95.
 * Fix: _parseJsonbContext normalizes object | string | null safely.
 */

const assert = require('assert');
const { runInNewContext } = require('vm');
const fs   = require('fs');
const path = require('path');

// Extract _parseJsonbContext from sessionService source
const svcSrc = fs.readFileSync(
  path.join(__dirname, '../../services/sessionService.js'), 'utf8'
);

function extractFn(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`Function ${name} not found in source`);
  let depth = 0, i = start;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
    i++;
  }
  return src.slice(start, i + 1);
}

const sandbox = {};
runInNewContext(`
  ${extractFn(svcSrc, '_parseJsonbContext')}
  parseCtx = _parseJsonbContext;
`, sandbox);
const parseCtx = sandbox.parseCtx;

describe('_parseJsonbContext — session JSONB deserialization', () => {
  test('T1: pg returns context as JS object → returned as-is, journey_ctx preserved', () => {
    const input = {
      entry_point: 'YEOSU_GENERAL',
      source: 'lumi',
      journey_ctx: { preferred_leisure: 'cable', guest_count: 2 },
    };
    const result = parseCtx(input);
    expect(result).toBe(input);
    expect(result.journey_ctx.preferred_leisure).toBe('cable');
    expect(result.journey_ctx.guest_count).toBe(2);
  });

  test('T2: pg returns context as JSON string → parsed correctly', () => {
    const input = JSON.stringify({
      entry_point: 'YEOSU_GENERAL',
      source: 'lumi',
      journey_ctx: { preferred_leisure: 'cable', nights: 1 },
    });
    const result = parseCtx(input);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('object');
    expect(result.journey_ctx.preferred_leisure).toBe('cable');
    expect(result.journey_ctx.nights).toBe(1);
  });

  test('T3: context null/undefined → returns null safely', () => {
    expect(parseCtx(null)).toBeNull();
    expect(parseCtx(undefined)).toBeNull();
  });

  test('T4: malformed JSON string → throws SyntaxError (pg object path T1 bypasses this)', () => {
    expect(() => parseCtx('[object Object]')).toThrow();
  });

  test('T5: full continuity flow — pg JSONB object → preferred_leisure → cablecar in skeleton', () => {
    // Simulate what pg returns for JSONB: a plain JS object
    const pgRow = {
      context: {
        entry_point: 'YEOSU_GENERAL',
        source: 'lumi',
        journey_ctx: { preferred_leisure: 'cable', guest_count: 2 },
      },
    };

    const ctx = parseCtx(pgRow.context);
    expect(ctx).not.toBeNull();
    expect(ctx.journey_ctx).toBeDefined();
    expect(ctx.journey_ctx.preferred_leisure).toBe('cable');

    // Simulate skeleton gate resolution in soyeowoolService
    const journeyCtx = ctx.journey_ctx;
    const quoteCtxLeisure = null; // "1박2일 일정 짜줘" has no leisure keyword
    const resolvedLeisure = quoteCtxLeisure || (journeyCtx && journeyCtx.preferred_leisure) || null;
    const leisureSource   = quoteCtxLeisure ? 'USER_SELECTED' : (resolvedLeisure ? 'TRAVELER_REQUESTED' : null);

    expect(resolvedLeisure).toBe('cable');
    expect(leisureSource).toBe('TRAVELER_REQUESTED');

    // Build skeleton — verify cablecar present with correct status
    const { buildSkeleton } = require('../../services/routeSkeletonService');
    const skeleton = buildSkeleton({
      start_date: null, nights: 1, guest_count: 2,
      hotel_code: null,
      leisure_code: resolvedLeisure,
      leisure_source: leisureSource,
      candidates: [],
    });

    const day1Items = skeleton.days[0].items;
    const cableItem = day1Items.find(i => i.commerce_code === 'cable');
    expect(cableItem).toBeDefined();
    expect(cableItem.selection_status).toBe('TRAVELER_REQUESTED');
    expect(cableItem.source).toBe('TRAVELER_PREFERENCE');
  });
});
