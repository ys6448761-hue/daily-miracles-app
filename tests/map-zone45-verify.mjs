import { YEOSU_PLACES } from '../dreamtown-frontend/src/constants/yeosuMapData.js';

const targets = [
  { id: 'dolsan_got_market',    x: 0.702, y: 0.660, zone: 4 },
  { id: 'hyangiram',            x: 0.751, y: 0.804, zone: 4 },
  { id: 'nk_submarine',         x: 0.726, y: 0.772, zone: 4 },
  { id: 'bonghwangsan',         x: 0.678, y: 0.743, zone: 4 },
  { id: 'yworld_luge',          x: 0.461, y: 0.460, zone: 5 },
  { id: 'jangdo',               x: 0.525, y: 0.503, zone: 5 },
  { id: 'soho_yacht',           x: 0.478, y: 0.509, zone: 5 },
  { id: 'soho_bridge',          x: 0.496, y: 0.471, zone: 5 },
  { id: 'lee_soon_shin_marina', x: 0.547, y: 0.504, zone: 5 },
  { id: 'settler_cactus',       x: 0.406, y: 0.459, zone: 5 },
];

let pass = 0, fail = 0;
for (const t of targets) {
  const p = YEOSU_PLACES.find(p => p.code === t.id);
  if (!p) { console.log('FAIL [NOT FOUND]', t.id); fail++; continue; }
  const mp = p.markerPos?.overview;
  if (!mp) { console.log('FAIL [NO markerPos.overview]', t.id); fail++; continue; }
  const ok = mp.x === t.x && mp.y === t.y && mp.confidence === 'PROVISIONAL' && mp.status === 'PROVISIONAL' && p.zone === t.zone;
  if (ok) { console.log('PASS', t.id, `x=${mp.x} y=${mp.y} zone=${p.zone}`); pass++; }
  else { console.log('FAIL', t.id, `got x=${mp.x} y=${mp.y} zone=${p.zone} expected x=${t.x} y=${t.y} zone=${t.zone}`); fail++; }
}
console.log(`\n${pass}/10 PASS${fail ? ' — ' + fail + ' FAIL' : ' ✅'}`);
