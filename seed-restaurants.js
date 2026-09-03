// Day-1 MVP: Seed 12 curated Yeosu restaurants
const db = require('./database/db');

const RESTAURANTS = [
  { code: 'kkotdol_gamjang', name: '꽃돌게장', cuisine: '게장', meal: ['lunch','dinner'], suitable: ['groups','family'] },
  { code: 'dolsan_gamjang_myeongga', name: '돌산게장명가', cuisine: '게장', meal: ['lunch','dinner'], suitable: ['groups','family'] },
  { code: 'baekcheon_suneo', name: '백천선어마을', cuisine: '생선구이정식 / 게장', meal: ['lunch','dinner'], suitable: ['family','groups'] },
  { code: 'han_il_gwan', name: '한일관', cuisine: '회한정식', meal: ['lunch','dinner'], suitable: ['groups'] },
  { code: 'jin_mo_sikdang', name: '진모식당', cuisine: '백반', meal: ['lunch','dinner'], suitable: ['family','solo'] },
  { code: 'huimang_suneo', name: '희망선어', cuisine: '삼치선어', meal: ['lunch','dinner'], suitable: ['groups'] },
  { code: 'sommaul_suneo', name: '섬마을선어', cuisine: '삼치선어', meal: ['lunch','dinner'], suitable: ['groups'] },
  { code: 'gubaek_sikdang', name: '구백식당', cuisine: '장어탕 / 서대회', meal: ['lunch','dinner'], suitable: ['groups'] },
  { code: 'pungsan_sikdang', name: '풍산식당', cuisine: '장어탕 / 서대회', meal: ['lunch','dinner'], suitable: ['groups'] },
  { code: 'gungjeon_hoejip', name: '궁전횟집', cuisine: '생선회', meal: ['lunch','dinner'], suitable: ['groups'] },
  { code: 'janggundc_hoejip', name: '장군도횟집', cuisine: '생선회', meal: ['lunch','dinner'], suitable: ['groups'] },
  { code: 'sangah_sikdang', name: '상아식당', cuisine: '통장어탕', meal: ['lunch','dinner'], suitable: ['groups'] },
];

async function seed() {
  try {
    console.log('Seeding 12 curated restaurants...\n');

    for (const rest of RESTAURANTS) {
      await db.query(
        `INSERT INTO travel_restaurants (
          code, country_code, city_code, name, cuisine_type,
          meal_context, suitable_for, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (code) DO NOTHING`,
        [
          rest.code,
          'KR',
          'YEOSU',
          rest.name,
          rest.cuisine,
          rest.meal,
          rest.suitable,
          'local_curated'
        ]
      );
      console.log(`  ✓ ${rest.name}`);
    }

    // Verify
    const result = await db.query(
      `SELECT COUNT(*) as count FROM travel_restaurants
       WHERE country_code='KR' AND city_code='YEOSU' AND source='local_curated'`
    );
    console.log(`\n✅ Seeded: ${result.rows[0].count}/12 restaurants`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();
