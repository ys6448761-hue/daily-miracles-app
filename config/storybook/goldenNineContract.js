/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Golden 9-Cut Canonical Contract (C3A RAMADA)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Defines the immutable 3×3 grid layout for RAMADA storybook journeys.
 * Locked by design (C1 approval). No changes without design review.
 *
 * Canonical Structure:
 *   Row 1 (jinamgwan ❤️ 품다): [REAL A, REAL B, Story Art]
 *   Row 2 (cablecar 🌬️ 보내다): [REAL A, REAL B, Story Art]
 *   Row 3 (jongpo ⭐ 심다):     [REAL A, REAL B, Story Art]
 *
 * C3A Scope: Customer uploads 6 REAL slots (real_a, real_b only)
 * Story Art (3 slots) uploaded by operator in C3B
 *
 * @since 2026-08-29 (C1 locked)
 * @locked true — Do not modify without design approval
 */

/**
 * Location metadata
 * Maps location code → display name + emoji
 */
const LOCATIONS = {
  jinamgwan: {
    code: 'jinamgwan',
    displayName: '진남관 ❤️ 품다',
    emoji: '❤️',
    korean: '품다',
    order: 0
  },
  cablecar: {
    code: 'cablecar',
    displayName: '케이블카 🌬️ 보내다',
    emoji: '🌬️',
    korean: '보내다',
    order: 1
  },
  jongpo: {
    code: 'jongpo',
    displayName: '종포 ⭐ 심다',
    emoji: '⭐',
    korean: '심다',
    order: 2
  }
};

/**
 * Slot metadata
 * Maps slot code → column position in grid
 */
const SLOTS = {
  real_a: {
    code: 'real_a',
    displayName: 'REAL A',
    columnOrder: 0,
    isReal: true,
    isCanonicalC3A: true
  },
  real_b: {
    code: 'real_b',
    displayName: 'REAL B',
    columnOrder: 1,
    isReal: true,
    isCanonicalC3A: true
  },
  story_art: {
    code: 'story_art',
    displayName: 'Story Art',
    columnOrder: 2,
    isReal: false,
    isCanonicalC3A: false // Operator-only in C3A
  }
};

/**
 * Canonical 6 REAL Slots (C3A Customer Upload Target)
 * Locked order: jinamgwan first, then cablecar, then jongpo
 * Each location: real_a, then real_b
 *
 * This is the immutable blueprint for C3A validation.
 */
const CANONICAL_REAL_SLOTS = [
  {
    index: 0,
    location: 'jinamgwan',
    slot: 'real_a',
    displayName: '진남관 REAL A',
    gridPosition: [0, 0]
  },
  {
    index: 1,
    location: 'jinamgwan',
    slot: 'real_b',
    displayName: '진남관 REAL B',
    gridPosition: [0, 1]
  },
  {
    index: 2,
    location: 'cablecar',
    slot: 'real_a',
    displayName: '케이블카 REAL A',
    gridPosition: [1, 0]
  },
  {
    index: 3,
    location: 'cablecar',
    slot: 'real_b',
    displayName: '케이블카 REAL B',
    gridPosition: [1, 1]
  },
  {
    index: 4,
    location: 'jongpo',
    slot: 'real_a',
    displayName: '종포 REAL A',
    gridPosition: [2, 0]
  },
  {
    index: 5,
    location: 'jongpo',
    slot: 'real_b',
    displayName: '종포 REAL B',
    gridPosition: [2, 1]
  }
];

/**
 * All 9 slots (including Story Art for reference)
 * Used by frontend grid rendering
 */
const CANONICAL_ALL_SLOTS = [
  ...CANONICAL_REAL_SLOTS,
  {
    index: 6,
    location: 'jinamgwan',
    slot: 'story_art',
    displayName: '진남관 Story Art',
    gridPosition: [0, 2]
  },
  {
    index: 7,
    location: 'cablecar',
    slot: 'story_art',
    displayName: '케이블카 Story Art',
    gridPosition: [1, 2]
  },
  {
    index: 8,
    location: 'jongpo',
    slot: 'story_art',
    displayName: '종포 Story Art',
    gridPosition: [2, 2]
  }
];

/**
 * Validate if location is in canonical locations
 * @param {string} location - Location code
 * @returns {boolean} true if valid
 */
function isValidLocation(location) {
  return location in LOCATIONS;
}

/**
 * Validate if slot is valid (any slot)
 * @param {string} slot - Slot code
 * @returns {boolean} true if valid
 */
function isValidSlot(slot) {
  return slot in SLOTS;
}

/**
 * Validate if (location, slot) is a canonical REAL slot
 * Used in C3A upload validation — only REAL slots allowed
 *
 * @param {string} location - Location code (jinamgwan|cablecar|jongpo)
 * @param {string} slot - Slot code (real_a|real_b)
 * @returns {boolean} true if canonical C3A REAL slot
 */
function isCanonicalRealSlot(location, slot) {
  if (!isValidLocation(location) || !isValidSlot(slot)) {
    return false;
  }

  // Only real_a and real_b are allowed in C3A
  if (slot !== 'real_a' && slot !== 'real_b') {
    return false;
  }

  // Verify it's in the canonical list
  return CANONICAL_REAL_SLOTS.some(
    canonical => canonical.location === location && canonical.slot === slot
  );
}

/**
 * Check if all 6 canonical REAL slots have been uploaded
 * Used for status transition: photos_in_progress → photos_complete
 *
 * @param {Array} assets - Array of dt_storybook_assets records
 * @returns {boolean} true if all 6 REALs present with status='pending' or 'approved'
 */
function allCanonicalRealsUploaded(assets) {
  if (!Array.isArray(assets) || assets.length === 0) {
    return false;
  }

  return CANONICAL_REAL_SLOTS.every(canonical => {
    return assets.some(
      asset =>
        asset.location === canonical.location &&
        asset.slot === canonical.slot &&
        (asset.status === 'pending' || asset.status === 'approved')
    );
  });
}

/**
 * Count uploaded REAL slots
 * @param {Array} assets - Array of dt_storybook_assets records
 * @returns {number} Count of uploaded REAL slots (0-6)
 */
function countUploadedReals(assets) {
  if (!Array.isArray(assets)) {
    return 0;
  }

  return assets.filter(asset => {
    return (
      asset.slot === 'real_a' || asset.slot === 'real_b'
    ) && (asset.status === 'pending' || asset.status === 'approved');
  }).length;
}

/**
 * Canonical 3 Story Art Slots (C3B Operator Upload Target)
 * Locked order: jinamgwan first, then cablecar, then jongpo
 * Each location: one story_art slot only
 *
 * This is the immutable blueprint for C3B validation.
 * @since 2026-08-29 (C3B Operator Phase)
 */
const CANONICAL_STORY_ART_SLOTS = [
  {
    index: 6,
    location: 'jinamgwan',
    slot: 'story_art',
    displayName: '진남관 Story Art',
    gridPosition: [0, 2]
  },
  {
    index: 7,
    location: 'cablecar',
    slot: 'story_art',
    displayName: '케이블카 Story Art',
    gridPosition: [1, 2]
  },
  {
    index: 8,
    location: 'jongpo',
    slot: 'story_art',
    displayName: '종포 Story Art',
    gridPosition: [2, 2]
  }
];

/**
 * Validate if (location, slot) is a canonical story_art slot
 * Used in C3B upload validation — only story_art slots allowed
 *
 * @param {string} location - Location code (jinamgwan|cablecar|jongpo)
 * @param {string} slot - Slot code (must be 'story_art')
 * @returns {boolean} true if canonical C3B story_art slot
 */
function isCanonicalStoryArtSlot(location, slot) {
  if (!isValidLocation(location)) {
    return false;
  }

  // Only story_art is allowed in C3B
  if (slot !== 'story_art') {
    return false;
  }

  // Verify it's in the canonical list
  return CANONICAL_STORY_ART_SLOTS.some(
    canonical => canonical.location === location && canonical.slot === slot
  );
}

/**
 * Check if all 3 canonical story_art slots have been uploaded
 * Used for status transition: art_in_progress → storybook_complete
 *
 * @param {Array} assets - Array of dt_storybook_assets records
 * @returns {boolean} true if all 3 story_arts present with status='pending' or 'approved'
 */
function allCanonicalStoryArtsUploaded(assets) {
  if (!Array.isArray(assets) || assets.length === 0) {
    return false;
  }

  return CANONICAL_STORY_ART_SLOTS.every(canonical => {
    return assets.some(
      asset =>
        asset.location === canonical.location &&
        asset.slot === canonical.slot &&
        (asset.status === 'pending' || asset.status === 'approved')
    );
  });
}

/**
 * Count uploaded story_art slots
 * @param {Array} assets - Array of dt_storybook_assets records
 * @returns {number} Count of uploaded story_art slots (0-3)
 */
function countUploadedStoryArts(assets) {
  if (!Array.isArray(assets)) {
    return 0;
  }

  return assets.filter(asset => {
    return asset.slot === 'story_art' &&
      (asset.status === 'pending' || asset.status === 'approved');
  }).length;
}

/**
 * Get next story_art location to upload
 * Returns the location that hasn't been uploaded yet
 *
 * @param {Array} assets - Array of dt_storybook_assets records
 * @returns {string|null} Location code (jinamgwan|cablecar|jongpo) or null if all done
 */
function getNextStoryArtLocation(assets) {
  if (!Array.isArray(assets)) {
    return 'jinamgwan'; // Start with first location
  }

  for (const canonical of CANONICAL_STORY_ART_SLOTS) {
    const hasAsset = assets.some(
      asset =>
        asset.location === canonical.location &&
        asset.slot === canonical.slot &&
        (asset.status === 'pending' || asset.status === 'approved')
    );
    if (!hasAsset) {
      return canonical.location;
    }
  }

  return null; // All done
}

/**
 * Get grid position from location and slot
 * Used for rendering Golden 9-Cut grid
 *
 * @param {string} location - Location code
 * @param {string} slot - Slot code
 * @returns {[number, number]} [row, col] or null if invalid
 */
function getGridPosition(location, slot) {
  const entry = CANONICAL_ALL_SLOTS.find(
    c => c.location === location && c.slot === slot
  );
  return entry ? entry.gridPosition : null;
}

/**
 * Check if all canonical 9 slots (6 REAL + 3 Story Art) have been uploaded
 * Used for C4 star planting precondition validation
 *
 * @param {Array} assets - Array of dt_storybook_assets records
 * @returns {boolean} true if all 9 canonical slots present with status='pending' or 'approved'
 */
function allCanonicalAssetsPresent(assets) {
  if (!Array.isArray(assets) || assets.length === 0) {
    return false;
  }

  return CANONICAL_ALL_SLOTS.every(canonical => {
    return assets.some(
      asset =>
        asset.location === canonical.location &&
        asset.slot === canonical.slot &&
        (asset.status === 'pending' || asset.status === 'approved')
    );
  });
}

/**
 * Export contract
 */
module.exports = {
  // Metadata
  LOCATIONS,
  SLOTS,

  // Canonical lists
  CANONICAL_REAL_SLOTS,
  CANONICAL_STORY_ART_SLOTS,
  CANONICAL_ALL_SLOTS,

  // Validation functions (C3A REAL)
  isValidLocation,
  isValidSlot,
  isCanonicalRealSlot,
  allCanonicalRealsUploaded,
  countUploadedReals,

  // Validation functions (C3B Story Art)
  isCanonicalStoryArtSlot,
  allCanonicalStoryArtsUploaded,
  countUploadedStoryArts,
  getNextStoryArtLocation,

  // Validation functions (C4 Star Planting)
  allCanonicalAssetsPresent,

  // Grid rendering
  getGridPosition
};
