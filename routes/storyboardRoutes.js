/**
 * storyboardRoutes.js
 * POST /api/storyboard/run — 시리즈 manifest → Hero8 배치 실행
 */

const express = require('express');
const router  = express.Router();

let runStoryboardBatch = null;
try {
  ({ runStoryboardBatch } = require('../services/storyboard/StoryboardBatchRunner'));
  console.log('✅ StoryboardBatchRunner 로드 완료');
} catch (err) {
  console.error('❌ StoryboardBatchRunner 로드 실패:', err.message);
}

/**
 * POST /api/storyboard/run
 * Body: { seriesId: "dt-global-001" }
 */
router.post('/run', async (req, res) => {
  if (!runStoryboardBatch) {
    return res.status(503).json({ success: false, error: 'storyboard_unavailable' });
  }

  const { seriesId } = req.body;
  if (!seriesId || typeof seriesId !== 'string') {
    return res.status(400).json({ success: false, error: 'seriesId_required' });
  }

  try {
    const result = await runStoryboardBatch(seriesId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('❌ StoryboardBatch 실패:', err.message);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

module.exports = router;
