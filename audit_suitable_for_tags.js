/**
 * Audit suitable_for tags in production database
 * Purpose: Understand existing vocabulary before implementing traveler fit scoring
 * Constraint: Read-only, no modifications
 */

require('dotenv').config();
const db = require('./database/db');

async function auditSuitableFor() {
  console.log('PHASE 1B AUDIT: SUITABLE_FOR VOCABULARY\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Fetch all places with their suitable_for tags
    const query = `
      SELECT code, name_ko, suitable_for
      FROM travel_places
      WHERE country_code = 'KR' AND city_code = 'YEOSU'
      ORDER BY code
    `;

    const result = await db.query(query);
    const places = result.rows;

    console.log('SUITABLE_FOR AUDIT (12 places):\n');
    console.log('CODE | NAME | SUITABLE_FOR (raw)');
    console.log('-'.repeat(80));

    const allTags = new Set();
    places.forEach(place => {
      const tags = place.suitable_for || [];
      tags.forEach(tag => allTags.add(tag));

      const tagsStr = tags.length > 0 ? tags.join(', ') : '(empty)';
      console.log(`${place.code.padEnd(15)} | ${place.name_ko.padEnd(15)} | ${tagsStr}`);
    });

    console.log('\n' + '='.repeat(80) + '\n');
    console.log('DISTINCT SUITABLE_FOR TAGS FOUND:\n');

    const sortedTags = Array.from(allTags).sort();
    sortedTags.forEach((tag, i) => {
      const count = places.filter(p => (p.suitable_for || []).includes(tag)).length;
      console.log(`${i+1}. "${tag}" (used in ${count}/12 places)`);
    });

    console.log('\n' + '='.repeat(80) + '\n');
    console.log('NORMALIZED TAG ANALYSIS:\n');

    // Analyze potential groupings
    const groups = {
      family: [],
      couple: [],
      solo: [],
      elderly: [],
      accessibility: [],
      other: []
    };

    sortedTags.forEach(tag => {
      const lower = tag.toLowerCase();
      if (lower.includes('family') || lower.includes('kid') || lower.includes('children')) {
        groups.family.push(tag);
      } else if (lower.includes('couple') || lower.includes('romantic') || lower.includes('romantic')) {
        groups.couple.push(tag);
      } else if (lower.includes('solo') || lower.includes('single')) {
        groups.solo.push(tag);
      } else if (lower.includes('elderly') || lower.includes('senior') || lower.includes('aged')) {
        groups.elderly.push(tag);
      } else if (lower.includes('wheelchair') || lower.includes('accessible') || lower.includes('stroller')) {
        groups.accessibility.push(tag);
      } else {
        groups.other.push(tag);
      }
    });

    console.log('Potential groupings:\n');
    Object.entries(groups).forEach(([category, tags]) => {
      if (tags.length > 0) {
        console.log(`${category.toUpperCase()}:`);
        tags.forEach(tag => console.log(`  - "${tag}"`));
        console.log('');
      }
    });

    console.log('='.repeat(80) + '\n');
    console.log('MATRIX: PLACE × SUITABLE_FOR\n');

    // Create matrix
    const headers = sortedTags;
    console.log('PLACE'.padEnd(20) + ' | ' + headers.map(h => h.substring(0, 8).padEnd(8)).join(' | '));
    console.log('-'.repeat(20) + '-+-' + headers.map(() => '-'.repeat(8)).join('-+-'));

    places.forEach(place => {
      const row = [place.code.padEnd(20), '|'];
      headers.forEach(tag => {
        const hasTag = (place.suitable_for || []).includes(tag) ? '✓' : '—';
        row.push(hasTag.padEnd(8));
      });
      console.log(row.join(' | '));
    });

    console.log('\n' + '='.repeat(80) + '\n');

    // Summary statistics
    console.log('SUMMARY:\n');
    console.log(`Total places: ${places.length}`);
    console.log(`Distinct suitable_for tags: ${sortedTags.length}`);
    console.log(`Average tags per place: ${(places.reduce((sum, p) => sum + (p.suitable_for || []).length, 0) / places.length).toFixed(1)}`);

    const placesWithoutTags = places.filter(p => !p.suitable_for || p.suitable_for.length === 0);
    if (placesWithoutTags.length > 0) {
      console.log(`\nPlaces WITHOUT any suitable_for tags (${placesWithoutTags.length}):`);
      placesWithoutTags.forEach(p => console.log(`  - ${p.code}: ${p.name_ko}`));
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

auditSuitableFor();
