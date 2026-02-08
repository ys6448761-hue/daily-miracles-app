/**
 * fix-all-korean-data.js
 * 모든 깨진 한글 데이터 수정 스크립트
 */

const { Client } = require('pg');

async function fixAllKoreanData() {
  const connectionConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'dpg-d3t9gpa4d50c73d2i3gg-a.singapore-postgres.render.com',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'yeosu_miracle_travel',
        user: process.env.DB_USER || 'yeosu_user',
        password: process.env.DB_PASSWORD || 'XEVFpHtXr7CsYZSYYmDhogjbXzo32hCR',
        ssl: { rejectUnauthorized: false }
      };

  const client = new Client(connectionConfig);

  try {
    await client.connect();
    console.log('Connected to database\n');

    // ═══════════════════════════════════════════════════════════
    // 8월 축제 이벤트의 SSOT 항목 수정
    // ═══════════════════════════════════════════════════════════
    const eventId2 = '8a116a08-fa4b-4d5e-9445-acb926795436';

    // SSOT 항목 조회
    const ssotItems = await client.query(`
      SELECT id, item_key, label FROM ops_ssot_items WHERE event_id = $1
    `, [eventId2]);

    console.log('=== 8월 축제 SSOT 항목 수정 ===');

    // 한글 라벨 매핑
    const labelMap = {
      'main_schedule': '메인 일정',
      'fireworks_time': '불꽃놀이 시간',
      'venue_capacity': '수용 인원',
      'emergency_contact': '비상 연락처',
      'special_event': '특별 이벤트',
      'opening_time': '개장 시간'
    };

    for (const item of ssotItems.rows) {
      const newLabel = labelMap[item.item_key] || item.item_key;
      await client.query(`
        UPDATE ops_ssot_items SET label = $1 WHERE id = $2
      `, [newLabel, item.id]);
      console.log(`  Fixed: ${item.item_key} → ${newLabel}`);
    }

    // ═══════════════════════════════════════════════════════════
    // 감사 로그 수정 (actor_name, object_label)
    // ═══════════════════════════════════════════════════════════
    console.log('\n=== 감사 로그 수정 ===');

    // actor_name 수정
    const actorNameMap = {
      '이벤트팀': '이벤트팀',
      '박수민': '박수민',
      '김': '김철수',
      '정아현': '정아현',
      '류홍미': '류홍미'
    };

    // 모든 감사 로그 조회
    const auditLogs = await client.query(`
      SELECT id, actor_name, object_label FROM ops_audit_log
      WHERE event_id = $1
    `, [eventId2]);

    let fixedCount = 0;
    for (const log of auditLogs.rows) {
      let needsUpdate = false;
      let newActorName = log.actor_name;
      let newObjectLabel = log.object_label;

      // 깨진 한글 패턴 확인 (물음표나 이상한 문자 포함)
      if (log.actor_name && /[���]/.test(log.actor_name)) {
        // 패턴 매칭으로 추정
        if (log.actor_name.includes('�̺�')) newActorName = '이벤트팀';
        else if (log.actor_name.includes('�ڽ')) newActorName = '박수민';
        else if (log.actor_name.includes('��')) newActorName = '김철수';
        else if (log.actor_name.includes('�־�')) newActorName = '정아현';
        else if (log.actor_name.includes('��ȫ')) newActorName = '류홍미';
        else newActorName = '운영팀';
        needsUpdate = true;
      }

      if (log.object_label && /[���]/.test(log.object_label)) {
        // object_label 수정
        if (log.object_label.includes('�ð�') || log.object_label.includes('시간')) newObjectLabel = '불꽃놀이 시간';
        else if (log.object_label.includes('�ο�') || log.object_label.includes('인원')) newObjectLabel = '수용 인원';
        else if (log.object_label.includes('����ó') || log.object_label.includes('연락')) newObjectLabel = '비상 연락처';
        else if (log.object_label.includes('Ư��') || log.object_label.includes('특별')) newObjectLabel = '특별 이벤트';
        else if (log.object_label.includes('������') || log.object_label.includes('개장')) newObjectLabel = '개장 시간';
        else if (log.object_label.includes('�Ҳ�')) newObjectLabel = '불꽃놀이 시간';
        else newObjectLabel = '메인 일정';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await client.query(`
          UPDATE ops_audit_log SET actor_name = $1, object_label = $2 WHERE id = $3
        `, [newActorName, newObjectLabel, log.id]);
        fixedCount++;
      }
    }
    console.log(`  Fixed ${fixedCount} audit log entries`);

    // ═══════════════════════════════════════════════════════════
    // SSOT 이력 수정 (changed_by_name)
    // ═══════════════════════════════════════════════════════════
    console.log('\n=== SSOT 이력 수정 ===');

    const historyItems = await client.query(`
      SELECT h.id, h.changed_by_name
      FROM ops_ssot_history h
      JOIN ops_ssot_items i ON h.item_id = i.id
      WHERE i.event_id = $1
    `, [eventId2]);

    fixedCount = 0;
    for (const hist of historyItems.rows) {
      if (hist.changed_by_name && /[���]/.test(hist.changed_by_name)) {
        let newName = '운영팀';
        if (hist.changed_by_name.includes('�̺�')) newName = '이벤트팀';
        else if (hist.changed_by_name.includes('�ڽ')) newName = '박수민';
        else if (hist.changed_by_name.includes('��') && hist.changed_by_name.length < 5) newName = '김철수';
        else if (hist.changed_by_name.includes('�־�')) newName = '정아현';
        else if (hist.changed_by_name.includes('��ȫ')) newName = '류홍미';

        await client.query(`
          UPDATE ops_ssot_history SET changed_by_name = $1 WHERE id = $2
        `, [newName, hist.id]);
        fixedCount++;
      }
    }
    console.log(`  Fixed ${fixedCount} history entries`);

    // ═══════════════════════════════════════════════════════════
    // 승인 요청 수정
    // ═══════════════════════════════════════════════════════════
    console.log('\n=== 승인 요청 수정 ===');

    const approvals = await client.query(`
      SELECT id, requested_by_name, decided_by_name FROM ops_approvals
      WHERE event_id = $1
    `, [eventId2]);

    fixedCount = 0;
    for (const appr of approvals.rows) {
      let needsUpdate = false;
      let newRequestedBy = appr.requested_by_name;
      let newDecidedBy = appr.decided_by_name;

      if (appr.requested_by_name && /[���]/.test(appr.requested_by_name)) {
        newRequestedBy = '운영팀';
        needsUpdate = true;
      }
      if (appr.decided_by_name && /[���]/.test(appr.decided_by_name)) {
        newDecidedBy = '승인팀';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await client.query(`
          UPDATE ops_approvals SET requested_by_name = $1, decided_by_name = $2 WHERE id = $3
        `, [newRequestedBy, newDecidedBy, appr.id]);
        fixedCount++;
      }
    }
    console.log(`  Fixed ${fixedCount} approval entries`);

    // ═══════════════════════════════════════════════════════════
    // 검증
    // ═══════════════════════════════════════════════════════════
    console.log('\n=== 검증 ===');

    const verifyAudit = await client.query(`
      SELECT actor_name, object_label FROM ops_audit_log
      WHERE event_id = $1 ORDER BY created_at DESC LIMIT 5
    `, [eventId2]);

    console.log('최근 감사 로그:');
    verifyAudit.rows.forEach(row => {
      console.log(`  ${row.actor_name} | ${row.object_label}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
    console.log('\nDone');
  }
}

fixAllKoreanData();
