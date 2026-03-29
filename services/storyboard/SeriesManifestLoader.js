/**
 * SeriesManifestLoader.js
 * storyboard/manifests/{seriesId}.json 을 로드해 반환
 */

const fs   = require('fs');
const path = require('path');

/**
 * @param {string} seriesId - e.g. "dt-global-001"
 * @returns {Object} manifest JSON
 * @throws {Error} 파일 없음 / JSON 파싱 실패
 */
function loadSeriesManifest(seriesId) {
  const filePath = path.join(
    process.cwd(),
    'storyboard',
    'manifests',
    `${seriesId}.json`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Manifest not found: ${seriesId} (경로: ${filePath})`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Manifest JSON 파싱 실패: ${seriesId} — ${e.message}`);
  }
}

module.exports = { loadSeriesManifest };
