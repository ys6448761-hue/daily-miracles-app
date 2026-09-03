/**
 * CRITICAL: Fix Moipin benefit data conflict
 * Current (WRONG): 아메리카노 1인 무료
 * Should be (RAMADA LAUNCH): 10% 할인
 *
 * Safe approach: Don't delete, just mark wrong one inactive and ensure correct one is active
 */

require('dotenv').config();
const db = require('./database/db');

async function fixMoipinBenefit() {
  console.log('MOIPIN BENEFIT DATA FIX\n');
  console.log('═'.repeat(100) + '\n');

  try {
    // Step 1: Get Moipin partner ID
    const partnerResult = await db.query(`
      SELECT id, name FROM dt_partners WHERE name = '모이핀' LIMIT 1
    `);

    if (partnerResult.rows.length === 0) {
      console.error('ERROR: Moipin partner not found');
      process.exit(1);
    }

    const moipinId = partnerResult.rows[0].id;
    console.log(`Moipin Partner ID: ${moipinId}\n`);

    // ════════════════════════════════════════════════════════════════════════════════

    // Step 2: Check all current benefits for Moipin
    console.log('Current benefits for Moipin:');
    const currentBenefitsResult = await db.query(`
      SELECT id, benefit_type, title, display_copy, is_active
      FROM dt_benefits
      WHERE partner_id = $1
      ORDER BY is_active DESC, created_at DESC
    `, [moipinId]);

    if (currentBenefitsResult.rows.length === 0) {
      console.log('  (no benefits found)');
    } else {
      currentBenefitsResult.rows.forEach(b => {
        console.log(`  ID: ${b.id}`);
        console.log(`    Title: ${b.title}`);
        console.log(`    Type: ${b.benefit_type}`);
        console.log(`    Display: "${b.display_copy}"`);
        console.log(`    Active: ${b.is_active}\n`);
      });
    }

    // ════════════════════════════════════════════════════════════════════════════════

    // Step 3: Find the WRONG benefit (아메리카노 1인 무료)
    console.log('Searching for wrong benefit (아메리카노 1인 무료)...');
    const wrongBenefitResult = await db.query(`
      SELECT id FROM dt_benefits
      WHERE partner_id = $1
      AND title LIKE '%아메리카노%'
      AND is_active = true
      LIMIT 1
    `, [moipinId]);

    let deactivatedCount = 0;
    if (wrongBenefitResult.rows.length > 0) {
      const wrongId = wrongBenefitResult.rows[0].id;
      console.log(`  Found: ${wrongId}`);
      console.log(`  Deactivating...\n`);

      await db.query(`
        UPDATE dt_benefits
        SET is_active = false
        WHERE id = $1
      `, [wrongId]);

      deactivatedCount = 1;
      console.log(`  ✓ Deactivated\n`);
    } else {
      console.log('  (not found or already inactive)\n');
    }

    // ════════════════════════════════════════════════════════════════════════════════

    // Step 4: Find or create the CORRECT benefit (10% 할인)
    console.log('Searching for correct benefit (10% 할인)...');
    const correctBenefitResult = await db.query(`
      SELECT id, is_active FROM dt_benefits
      WHERE partner_id = $1
      AND title LIKE '%할인%'
      AND is_active = true
      LIMIT 1
    `, [moipinId]);

    let correctBenefitId = null;
    let correctBenefitActive = false;

    if (correctBenefitResult.rows.length > 0) {
      correctBenefitId = correctBenefitResult.rows[0].id;
      correctBenefitActive = correctBenefitResult.rows[0].is_active;
      console.log(`  Found: ${correctBenefitId}`);
      console.log(`  Active: ${correctBenefitActive}\n`);
    } else {
      console.log('  Not found - creating new benefit...\n');

      const insertResult = await db.query(`
        INSERT INTO dt_benefits (
          partner_id, benefit_type, title, display_copy, is_active
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        moipinId,
        'discount',
        '10% 할인',
        'DreamTown 별빛항로의 첫 번째 쉼. 모이핀에서 편한 가격으로 경험해보세요.',
        true
      ]);

      correctBenefitId = insertResult.rows[0].id;
      correctBenefitActive = true;
      console.log(`  Created: ${correctBenefitId}`);
      console.log(`  Active: true\n`);
    }

    // ════════════════════════════════════════════════════════════════════════════════

    // Step 5: Verify final state
    console.log('FINAL STATE:');
    const finalResult = await db.query(`
      SELECT id, title, is_active
      FROM dt_benefits
      WHERE partner_id = $1
      ORDER BY is_active DESC, created_at DESC
    `, [moipinId]);

    finalResult.rows.forEach(b => {
      const status = b.is_active ? '✓ ACTIVE' : '✗ inactive';
      console.log(`  ${status}: ${b.title}`);
    });

    // ════════════════════════════════════════════════════════════════════════════════

    console.log('\n' + '═'.repeat(100));
    console.log('\nSUMMARY\n');

    console.log(`Deactivated wrong benefit: ${deactivatedCount > 0 ? '✓ YES' : '✗ NO'}`);
    console.log(`Correct benefit (10%) active: ${correctBenefitActive ? '✓ YES' : '✗ NO'}`);
    console.log(`Moipin user-visible benefit: ⭐ 10% 할인\n`);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

fixMoipinBenefit();
