/**
 * fix-ssot-values.js
 * SSOT 항목 값(value_current) 한글 수정
 */

const { Client } = require('pg');

async function fix() {
  const client = new Client({
    host: 'dpg-d3t9gpa4d50c73d2i3gg-a.singapore-postgres.render.com',
    port: 5432,
    database: 'yeosu_miracle_travel',
    user: 'yeosu_user',
    password: 'XEVFpHtXr7CsYZSYYmDhogjbXzo32hCR',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected\n');

  const eventId = '8a116a08-fa4b-4d5e-9445-acb926795436';

  // SSOT 항목 값 수정
  const fixes = [
    ['weather_notice', '8월 1일 우천 예보, 우의 준비', '날씨 공지'],
    ['parking_capacity', '800대', '주차 수용'],
    ['staff_count', '50명', '운영 인원'],
    ['firework_time', '20:30 ~ 21:00', '불꽃놀이 시간'],
    ['opening_time', '19:30', '개장 시간'],
    ['emergency_contact', '061-123-4567', '비상 연락처']
  ];

  console.log('=== SSOT 항목 값 수정 ===');
  for (const [itemKey, newValue, newLabel] of fixes) {
    const result = await client.query(`
      UPDATE ops_ssot_items
      SET value_current = $1, label = $2
      WHERE event_id = $3 AND item_key = $4
      RETURNING id, item_key, label, value_current
    `, [newValue, newLabel, eventId, itemKey]);

    if (result.rows.length > 0) {
      const r = result.rows[0];
      console.log(`  ${r.label}: ${r.value_current}`);
    }
  }

  // SSOT 이력의 value_before, value_after도 수정 (JSON 형태로 저장되어 있을 수 있음)
  console.log('\n=== SSOT 이력 값 수정 ===');

  // 깨진 값 패턴 수정
  const historyFixes = [
    ['8�� 1�� ���� ����', '8월 1일 우천 예보'],
    ['���� ����', '우의 준비'],
    ['800��', '800대'],
    ['50��', '50명']
  ];

  let fixCount = 0;
  for (const [broken, fixed] of historyFixes) {
    const r1 = await client.query(`
      UPDATE ops_ssot_history
      SET value_before = REPLACE(value_before, $1, $2)
      WHERE value_before LIKE $3
    `, [broken, fixed, `%${broken}%`]);

    const r2 = await client.query(`
      UPDATE ops_ssot_history
      SET value_after = REPLACE(value_after, $1, $2)
      WHERE value_after LIKE $3
    `, [broken, fixed, `%${broken}%`]);

    fixCount += r1.rowCount + r2.rowCount;
  }
  console.log(`  Fixed ${fixCount} history values`);

  // 감사 로그의 before_value, after_value도 수정
  console.log('\n=== 감사 로그 값 수정 ===');

  // JSONB 형태로 저장된 값 수정
  const auditResult = await client.query(`
    SELECT id, before_value, after_value FROM ops_audit_log
    WHERE event_id = $1
  `, [eventId]);

  fixCount = 0;
  for (const row of auditResult.rows) {
    let needsUpdate = false;
    let newBefore = row.before_value;
    let newAfter = row.after_value;

    // before_value 수정
    if (newBefore && JSON.stringify(newBefore).includes('��')) {
      const str = JSON.stringify(newBefore);
      const fixed = str
        .replace(/8�� 1�� ���� ����, ���� ����/g, '8월 1일 우천 예보, 우의 준비')
        .replace(/800��/g, '800대')
        .replace(/50��/g, '50명');
      newBefore = JSON.parse(fixed);
      needsUpdate = true;
    }

    // after_value 수정
    if (newAfter && JSON.stringify(newAfter).includes('��')) {
      const str = JSON.stringify(newAfter);
      const fixed = str
        .replace(/8�� 1�� ���� ����, ���� ����/g, '8월 1일 우천 예보, 우의 준비')
        .replace(/800��/g, '800대')
        .replace(/50��/g, '50명');
      newAfter = JSON.parse(fixed);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await client.query(`
        UPDATE ops_audit_log
        SET before_value = $1, after_value = $2
        WHERE id = $3
      `, [newBefore, newAfter, row.id]);
      fixCount++;
    }
  }
  console.log(`  Fixed ${fixCount} audit log values`);

  // 확인
  console.log('\n=== 수정 결과 확인 ===');
  const verify = await client.query(`
    SELECT item_key, label, value_current, status
    FROM ops_ssot_items
    WHERE event_id = $1
    ORDER BY category, item_key
  `, [eventId]);

  verify.rows.forEach(r => {
    console.log(`  ${r.label} | ${r.value_current} | ${r.status}`);
  });

  await client.end();
  console.log('\nDone');
}

fix();
