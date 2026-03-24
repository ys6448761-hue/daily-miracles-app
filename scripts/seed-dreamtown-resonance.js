/**
 * DreamTown Resonance Seed — 시드 별 공명 샘플 데이터
 *
 * 기존 13개 시드 별에 resonance 데이터를 골고루 추가
 * comfortable(relief) / courage / clarity / trust(belief) 분산
 *
 * Usage: node scripts/seed-dreamtown-resonance.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 시드 별 고정 UUID (seed-dreamtown-13stars.js와 동일 패턴)
const starId = (n) => `00000000-0000-0000-0001-${String(n).padStart(12, '0')}`;

// 익명 user_id 생성 (공명자 토큰)
const anonId = (n) => `anon-seed-${String(n).padStart(4, '0')}`;

// 별마다 공명 분산 정의 (4종 골고루, 총 19건)
const SEED_RESONANCES = [
  // 성장 은하
  { star: 1,  entries: [{ type: 'relief',  }, { type: 'clarity',  }] },   // 2건
  { star: 6,  entries: [{ type: 'courage', }, { type: 'belief',   }] },   // 2건
  { star: 12, entries: [{ type: 'belief',  }, { type: 'clarity',  }] },   // 2건

  // 도전 은하
  { star: 2,  entries: [{ type: 'courage', }, { type: 'courage',  }, { type: 'relief', }] }, // 3건
  { star: 8,  entries: [{ type: 'belief',  }, { type: 'clarity',  }] },   // 2건
  { star: 11, entries: [{ type: 'courage', }] },                            // 1건

  // 치유 은하
  { star: 3,  entries: [{ type: 'relief',  }, { type: 'clarity',  }] },   // 2건
  { star: 5,  entries: [{ type: 'relief',  }, { type: 'belief',   }] },   // 2건
  { star: 10, entries: [{ type: 'relief',  }] },                            // 1건
  { star: 13, entries: [{ type: 'clarity', }] },                            // 1건

  // 관계 은하
  { star: 4,  entries: [{ type: 'belief',  }] },                            // 1건
  { star: 7,  entries: [{ type: 'clarity', }, { type: 'courage',  }] },   // 2건
  { star: 9,  entries: [{ type: 'belief',  }, { type: 'relief',   }] },   // 2건
];
// 총합: 2+2+2+3+2+1+2+2+1+1+1+2+2 = 23건

async function run() {
  console.log('\n💫 Resonance Seed 시작...\n');

  // 기존 시드 별 공명 데이터 삭제
  const starIds = Array.from({ length: 13 }, (_, i) => starId(i + 1));
  const placeholders = starIds.map((_, i) => `$${i + 1}`).join(', ');
  const del = await pool.query(
    `DELETE FROM resonance WHERE star_id IN (${placeholders})`,
    starIds
  );
  console.log(`🗑  기존 공명 삭제: ${del.rowCount}건`);

  // 공명 데이터 INSERT
  let total = 0;
  let anonCounter = 1;

  for (const { star, entries } of SEED_RESONANCES) {
    const sid = starId(star);
    for (const { type } of entries) {
      const uid = anonId(anonCounter++);
      const daysBack = Math.floor(Math.random() * 10);
      const createdAt = new Date(Date.now() - daysBack * 86400000).toISOString();
      await pool.query(
        `INSERT INTO resonance (star_id, user_id, resonance_type, created_at)
         VALUES ($1, $2, $3, $4)`,
        [sid, uid, type, createdAt]
      );
      total++;
    }
    console.log(`  ✅ 별 #${String(star).padStart(2)} → ${entries.map(e => e.type).join(', ')}`);
  }

  // 결과 확인
  const check = await pool.query(`
    SELECT resonance_type, COUNT(*) as cnt
    FROM resonance
    WHERE star_id IN (${placeholders})
    GROUP BY resonance_type ORDER BY resonance_type
  `, starIds);

  console.log(`\n📊 타입별 공명 분포:`);
  for (const r of check.rows) {
    const labels = { relief: 'relief (편해짐)', courage: 'courage (용기)', clarity: 'clarity (정리)', belief: 'belief (믿음)' };
    console.log(`  ${labels[r.resonance_type] ?? r.resonance_type}: ${r.cnt}건`);
  }
  console.log(`\n💫 공명 시드 완료! 총 ${total}건 추가\n`);

  await pool.end();
}

run().catch(err => {
  console.error('❌ Resonance Seed 실패:', err.message);
  process.exit(1);
});
