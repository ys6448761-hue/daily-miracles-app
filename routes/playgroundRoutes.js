/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 소원놀이터 API 라우터
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 엔드포인트:
 * - POST   /api/playground/artifacts          - 아티팩트 생성
 * - GET    /api/playground/artifacts/:id      - 아티팩트 조회
 * - PATCH  /api/playground/artifacts/:id      - 아티팩트 수정
 * - GET    /api/playground/users/:id/artifacts - 사용자 아티팩트 목록
 * - POST   /api/playground/artifacts/:id/reactions - 반응 추가
 * - DELETE /api/playground/artifacts/:id/reactions/:type - 반응 제거
 * - GET    /api/playground/feed               - 피드 조회
 * - GET    /api/playground/highlights         - 하이라이트
 * - POST   /api/playground/shares             - 공유 링크 생성
 * - GET    /api/playground/s/:slug            - 공유 링크로 조회
 * - GET    /api/playground/users/:id/rewards  - 보상 현황
 */

const express = require('express');
const router = express.Router();

// 서비스 인스턴스 (server.js에서 주입)
let playground = null;

/**
 * 서비스 초기화 (server.js에서 호출)
 */
router.init = function(services) {
  playground = services.playground;
  console.log('[Playground] 라우터 초기화 완료');
};

// ═══════════════════════════════════════════════════════════════════════════
// 아티팩트 CRUD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/playground/artifacts
 * 아티팩트 생성
 */
router.post('/artifacts', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const { user_id, type, visibility, content_json, tags_json, parent_id, status } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id required' });
    }

    if (!content_json) {
      return res.status(400).json({ success: false, error: 'content_json required' });
    }

    const result = await playground.artifact.createArtifact(user_id, {
      type,
      visibility,
      content_json,
      tags_json,
      parent_id,
      status
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // 보상 처리
    if (result.score) {
      const rewards = await playground.reward.processArtifactReward(
        user_id,
        result.artifact_id,
        result.score.grade
      );
      result.rewards = rewards;
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('[Playground] 아티팩트 생성 실패:', error);
    res.status(500).json({ success: false, error: 'server_error', message: error.message });
  }
});

/**
 * GET /api/playground/artifacts/:id
 * 아티팩트 조회
 */
router.get('/artifacts/:id', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const artifactId = parseInt(req.params.id);
    const requestUserId = req.query.user_id ? parseInt(req.query.user_id) : null;

    const artifact = await playground.artifact.getArtifact(artifactId, requestUserId);

    if (!artifact) {
      return res.status(404).json({ success: false, error: 'not_found' });
    }

    if (artifact.error) {
      return res.status(403).json({ success: false, error: artifact.error, message: artifact.message });
    }

    // 노출 권한 정보 추가
    const rights = playground.score.getExposureRights(artifact.grade, artifact.gate_result);

    res.json({
      success: true,
      data: artifact,
      exposure_rights: rights
    });

  } catch (error) {
    console.error('[Playground] 아티팩트 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * PATCH /api/playground/artifacts/:id
 * 아티팩트 수정
 */
router.patch('/artifacts/:id', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const artifactId = parseInt(req.params.id);
    const { user_id, content_json, visibility, tags_json, status } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id required' });
    }

    const result = await playground.artifact.updateArtifact(artifactId, user_id, {
      content_json,
      visibility,
      tags_json,
      status
    });

    if (!result.success) {
      const statusCode = result.error === 'not_found' ? 404 : result.error === 'forbidden' ? 403 : 400;
      return res.status(statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('[Playground] 아티팩트 수정 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * GET /api/playground/users/:id/artifacts
 * 사용자 아티팩트 목록
 */
router.get('/users/:id/artifacts', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const userId = parseInt(req.params.id);
    const { type, status, limit, offset } = req.query;

    const artifacts = await playground.artifact.getUserArtifacts(userId, {
      type,
      status: status || 'active',
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    res.json({ success: true, data: artifacts });

  } catch (error) {
    console.error('[Playground] 사용자 아티팩트 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 반응
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/playground/artifacts/:id/reactions
 * 반응 추가
 */
router.post('/artifacts/:id/reactions', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const artifactId = parseInt(req.params.id);
    const { user_id, type } = req.body;

    if (!user_id || !type) {
      return res.status(400).json({ success: false, error: 'user_id and type required' });
    }

    const result = await playground.artifact.addReaction(artifactId, user_id, type);
    res.json(result);

  } catch (error) {
    console.error('[Playground] 반응 추가 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * DELETE /api/playground/artifacts/:id/reactions/:type
 * 반응 제거
 */
router.delete('/artifacts/:id/reactions/:type', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const artifactId = parseInt(req.params.id);
    const reactionType = req.params.type;
    const userId = parseInt(req.query.user_id);

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id required' });
    }

    const result = await playground.artifact.removeReaction(artifactId, userId, reactionType);
    res.json(result);

  } catch (error) {
    console.error('[Playground] 반응 제거 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 피드
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/playground/feed
 * 메인 피드
 */
router.get('/feed', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const { type, reality_tag, limit, offset } = req.query;

    const feed = await playground.feed.getFeed({
      type,
      reality_tag,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    res.json({ success: true, data: feed });

  } catch (error) {
    console.error('[Playground] 피드 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * GET /api/playground/highlights
 * 하이라이트 (S/A 등급 + 높은 help_score)
 */
router.get('/highlights', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const { limit } = req.query;
    const highlights = await playground.feed.getHighlights({ limit: parseInt(limit) || 10 });

    res.json({ success: true, data: highlights });

  } catch (error) {
    console.error('[Playground] 하이라이트 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * GET /api/playground/feed/recent
 * 최신순 피드
 */
router.get('/feed/recent', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const { limit, offset } = req.query;
    const feed = await playground.feed.getRecentFeed({
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    res.json({ success: true, data: feed });

  } catch (error) {
    console.error('[Playground] 최신 피드 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 공유
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/playground/shares
 * 공유 링크 생성
 */
router.post('/shares', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const { artifact_id, user_id } = req.body;

    if (!artifact_id) {
      return res.status(400).json({ success: false, error: 'artifact_id required' });
    }

    const result = await playground.share.createShareLink(artifact_id, user_id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('[Playground] 공유 링크 생성 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * GET /api/playground/s/:slug
 * 공유 링크로 아티팩트 조회
 */
router.get('/s/:slug', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const slug = req.params.slug;
    const viewerInfo = {
      viewer_user_id: req.query.user_id ? parseInt(req.query.user_id) : null,
      user_agent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for']
    };

    const result = await playground.share.getByShareSlug(slug, viewerInfo);

    if (!result.success) {
      const statusCode = result.error === 'share_not_found' ? 404 : 403;
      return res.status(statusCode).json(result);
    }

    // OG 메타데이터 추가
    result.og = playground.share.generateOGMeta({
      content_json: result.artifact.content_json,
      share_slug: slug
    });

    res.json(result);

  } catch (error) {
    console.error('[Playground] 공유 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 보상
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/playground/users/:id/rewards
 * 사용자 보상 현황
 */
router.get('/users/:id/rewards', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const userId = parseInt(req.params.id);
    const rewards = await playground.reward.getUserRewards(userId);

    res.json({ success: true, data: rewards });

  } catch (error) {
    console.error('[Playground] 보상 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 통계/관리
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/playground/stats
 * 피드 통계
 */
router.get('/stats', async (req, res) => {
  try {
    if (!playground) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const stats = await playground.feed.getFeedStats();
    res.json({ success: true, data: stats });

  } catch (error) {
    console.error('[Playground] 통계 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

module.exports = router;
