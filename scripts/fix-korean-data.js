/**
 * fix-korean-data.js
 * 한글 데이터 수정 스크립트
 */

const { Client } = require('pg');

async function fixKoreanData() {
  const { getConnectionConfig } = require('../database/dbConfig');
  const client = new Client(getConnectionConfig());

  try {
    await client.connect();
    console.log('Connected to database');

    // 첫 번째 이벤트 수정
    await client.query(`
      UPDATE ops_events
      SET name = $1, description = $2, location = $3
      WHERE id = $4
    `, [
      '2026 여수 밤바다 불꽃축제',
      '여수 밤바다와 함께하는 불꽃놀이 축제',
      '여수 돌산대교 일원',
      '0aa45a09-bfef-49fe-9381-4f0df541de34'
    ]);
    console.log('Fixed event 1: 2026 여수 밤바다 불꽃축제');

    // 두 번째 이벤트 수정 (기존 데이터)
    await client.query(`
      UPDATE ops_events
      SET name = $1, description = $2, location = $3
      WHERE id = $4
    `, [
      '2026 여수 밤바다 불꽃축제',
      '여수 엑스포해양공원에서 펼쳐지는 불꽃축제',
      '여수 엑스포해양공원',
      '8a116a08-fa4b-4d5e-9445-acb926795436'
    ]);
    console.log('Fixed event 2: 2026 여수 밤바다 불꽃축제 (8월)');

    // SSOT 항목들 한글 라벨 수정
    await client.query(`
      UPDATE ops_ssot_items
      SET label = $1
      WHERE item_key = 'main_schedule' AND event_id = '0aa45a09-bfef-49fe-9381-4f0df541de34'
    `, ['메인 일정']);

    await client.query(`
      UPDATE ops_ssot_items
      SET label = $1
      WHERE item_key = 'emergency_contact' AND event_id = '0aa45a09-bfef-49fe-9381-4f0df541de34'
    `, ['비상 연락처']);

    await client.query(`
      UPDATE ops_ssot_items
      SET label = $1
      WHERE item_key = 'venue_capacity' AND event_id = '0aa45a09-bfef-49fe-9381-4f0df541de34'
    `, ['수용 인원']);

    console.log('Fixed SSOT labels');

    // 확인
    const result = await client.query(`
      SELECT id, name, location FROM ops_events ORDER BY created_at DESC
    `);
    console.log('\nUpdated events:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.location})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('\nDone');
  }
}

fixKoreanData();
