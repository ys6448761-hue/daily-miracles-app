/**
 * fix-remaining-data.js
 * 남은 깨진 데이터 수정
 */

const { Client } = require('pg');

async function fix() {
  const { getConnectionConfig } = require('../database/dbConfig');
  const client = new Client(getConnectionConfig());

  await client.connect();
  console.log('Connected\n');

  // 1. null인 object_label 수정
  const r1 = await client.query(`
    UPDATE ops_audit_log
    SET object_label = '메인 일정'
    WHERE object_label IS NULL AND object_type = 'ssot_item'
  `);
  console.log(`Fixed ${r1.rowCount} null object_labels`);

  // 2. 영어 라벨 → 한글
  const labelFixes = [
    ['Main Schedule', '메인 일정'],
    ['Emergency Contact', '비상 연락처'],
    ['Venue Capacity', '수용 인원']
  ];

  for (const [eng, kor] of labelFixes) {
    await client.query(`
      UPDATE ops_audit_log SET object_label = $2 WHERE object_label = $1
    `, [eng, kor]);
    await client.query(`
      UPDATE ops_ssot_items SET label = $2 WHERE label = $1
    `, [eng, kor]);
    console.log(`Fixed: ${eng} → ${kor}`);
  }

  // 3. 3월 축제 감사로그 actor_name 수정 (Test Admin → 관리자)
  await client.query(`
    UPDATE ops_audit_log SET actor_name = '관리자' WHERE actor_name = 'Test Admin'
  `);
  await client.query(`
    UPDATE ops_ssot_history SET changed_by_name = '관리자' WHERE changed_by_name = 'Test Admin'
  `);
  console.log('Fixed: Test Admin → 관리자');

  // 4. Event Manager, Team Leader 수정
  await client.query(`
    UPDATE ops_audit_log SET actor_name = '운영팀장' WHERE actor_name = 'Event Manager'
  `);
  await client.query(`
    UPDATE ops_audit_log SET actor_name = '승인팀장' WHERE actor_name = 'Team Leader'
  `);
  await client.query(`
    UPDATE ops_ssot_history SET changed_by_name = '운영팀장' WHERE changed_by_name = 'Event Manager'
  `);
  await client.query(`
    UPDATE ops_approvals SET requested_by_name = '운영팀장' WHERE requested_by_name = 'Event Manager'
  `);
  await client.query(`
    UPDATE ops_approvals SET decided_by_name = '승인팀장' WHERE decided_by_name = 'Team Leader'
  `);
  console.log('Fixed: Event Manager → 운영팀장, Team Leader → 승인팀장');

  // 5. 전체 확인
  console.log('\n=== 감사 로그 (최근 15건) ===');
  const all = await client.query(`
    SELECT e.name as event_name, a.actor_name, a.action, a.object_label
    FROM ops_audit_log a
    JOIN ops_events e ON a.event_id = e.id
    ORDER BY a.created_at DESC
    LIMIT 15
  `);

  all.rows.forEach(r => {
    const eventShort = r.event_name.length > 20 ? r.event_name.substring(0, 20) + '...' : r.event_name;
    console.log(`  ${eventShort} | ${r.actor_name || '-'} | ${r.action} | ${r.object_label || '-'}`);
  });

  await client.end();
  console.log('\nDone');
}

fix();
