'use strict';
/**
 * Founder Review Quote Generator
 * Generates HTML review artifacts for Individual (A) and Group (B) quotes.
 * Run: node generate-founder-quotes.js
 */

const qe = require('./services/quoteEngine');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'founder-review');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ─── Quote A: Individual, Ramada, 3인, 토요일 (2026-10-17) ───────────────────
const rawA = qe.calculateQuote({
  guestCount: 3, hotel: 'ramada', leisure: 'cable',
  travelDate: '2026-10-17', region: 'yeosu'
});
const cleanA = qe.sanitizeForCustomer(rawA);

console.log('\n=== PDF A — Individual, Ramada, 3인, 토요일 (2026-10-17) ===');
console.log('dayType:', rawA.dayType);
console.log('[INTERNAL] cost breakdown:');
rawA.breakdown.forEach(b => console.log(` ${b.category}: cost=${b.cost} sell=${b.sell} list=${b.list}`));
console.log('[INTERNAL] totalCost:', rawA.pricing.totalCost, '| margin:', rawA.pricing.totalMargin);
console.log('[CUSTOMER] totalSell:', cleanA.pricing.totalSell, '| totalList:', cleanA.pricing.totalList, '| savings:', cleanA.pricing.totalSavings);
console.log('[SECURITY] costInCustomer:', cleanA.breakdown.some(b => 'cost' in b) ? '⛔ LEAK' : '✅ CLEAN');

// ─── Quote B: Group, 10인, cable group_oneway, 토요일 (2026-10-17) ────────────
const rawB = qe.calculateQuote({
  guestCount: 10, hotel: null, leisure: 'cable', cableCarType: 'group_oneway',
  travelDate: '2026-10-17', region: 'yeosu'
});
const cleanB = qe.sanitizeForCustomer(rawB);

console.log('\n=== PDF B — Group, 10인, cable group_oneway, 토요일 (2026-10-17) ===');
console.log('dayType:', rawB.dayType);
console.log('[INTERNAL] cost breakdown:');
rawB.breakdown.forEach(b => console.log(` ${b.category}: cost=${b.cost} sell=${b.sell} list=${b.list}`));
console.log('[INTERNAL] totalCost:', rawB.pricing.totalCost, '| margin:', rawB.pricing.totalMargin);
console.log('[CUSTOMER] totalSell:', cleanB.pricing.totalSell, '| totalList:', cleanB.pricing.totalList, '| savings:', cleanB.pricing.totalSavings);
console.log('[SECURITY] costInCustomer:', cleanB.breakdown.some(b => 'cost' in b) ? '⛔ LEAK' : '✅ CLEAN');

console.log('\n── Founder Review Files ──────────────────────────────────────────');
console.log('A:', path.join(outDir, 'quote-individual-A.html'));
console.log('B:', path.join(outDir, 'quote-group-B.html'));
console.log('\nOpen in browser to review.');
