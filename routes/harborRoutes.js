/**
 * harborRoutes.js
 * 소원항해단 v3.1-MVP API 라우터
 *
 * 엔드포인트:
 * - POST /anon/bootstrap          익명 사용자 생성/조회
 * - POST /harbor/wishes           소원 작성
 * - GET  /harbor/lighthouse       오늘의 등대 5개
 * - POST /harbor/wishes/:id/react 반응 (FIRE/ME_TOO)
 * - POST /harbor/wishes/:id/comments 댓글 작성
 * - GET  /harbor/notifications    알림 목록
 * - POST /harbor/notifications/:id/read 알림 읽음
 * - POST /harbor/report           신고
 * - GET  /harbor/temperature      내 온도 조회
 */

const express = require('express');
const router = express.Router();

// 서비스 로딩
let userService, wishService, firstWindService, reactionService;
let commentService, lighthouseService, notificationService, reportService, temperatureService;

try {
  userService = require('../services/harbor/userService');
  wishService = require('../services/harbor/wishService');
  firstWindService = require('../services/harbor/firstWindService');
  reactionService = require('../services/harbor/reactionService');
  commentService = require('../services/harbor/commentService');
  lighthouseService = require('../services/harbor/lighthouseService');
  notificationService = require('../services/harbor/notificationService');
  reportService = require('../services/harbor/reportService');
  temperatureService = require('../services/harbor/temperatureService');
  console.log('✅ Harbor 서비스 전체 로드 성공');
} catch (error) {
  console.error('❌ Harbor 서비스 로드 실패:', error.message);
}

// ═══════════════════════════════════════════════════════════
// POST /anon/bootstrap - 익명 사용자 생성/조회
// ═══════════════════════════════════════════════════════════
router.post('/anon/bootstrap', async (req, res) => {
  try {
    const { device_id } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        error: 'DEVICE_ID_REQUIRED'
      });
    }

    const result = await userService.bootstrapUser(device_id);

    // 일일 방문 온도 적용
    await temperatureService.applyDailyVisit(result.user.id);

    // 냉각 처리 (미접속 기간 반영)
    if (!result.isNew) {
      await temperatureService.applyDecay(result.user.id);
    }

    // 최신 온도 조회
    const temperature = await userService.getTemperature(result.user.id);

    res.json({
      success: true,
      user: {
        id: result.user.id,
        nickname: result.user.nickname,
        temperature: parseFloat(temperature)
      },
      isNew: result.isNew
    });

  } catch (error) {
    console.error('❌ bootstrap 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /harbor/wishes - 소원 작성
// ═══════════════════════════════════════════════════════════
router.post('/harbor/wishes', async (req, res) => {
  try {
    const { user_id, content, route, visibility } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED'
      });
    }

    // 소원 생성
    const wish = await wishService.createWish(user_id, {
      content,
      route,
      visibility
    });

    // 첫 바람 비동기 생성 (30초 SLA)
    // 응답 후 백그라운드에서 실행
    setImmediate(async () => {
      try {
        await firstWindService.generateFirstWind(wish.id, content, user_id);
      } catch (error) {
        console.error('❌ 첫 바람 생성 실패 (비동기):', error.message);
      }
    });

    // YELLOW 제한 정보
    const restrictions = wishService.getYellowRestrictions(wish.traffic_light);

    res.status(201).json({
      success: true,
      wish: {
        id: wish.id,
        content: wish.content,
        route: wish.route,
        visibility: wish.visibility,
        traffic_light: wish.traffic_light,
        status: wish.status,
        created_at: wish.created_at
      },
      restrictions,
      firstWindPending: true // 첫 바람이 곧 도착할 예정
    });

  } catch (error) {
    console.error('❌ 소원 작성 실패:', error);

    const statusCode = error.message.includes('REQUIRED') ||
                       error.message.includes('TOO_LONG') ||
                       error.message.includes('INVALID') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /harbor/lighthouse - 오늘의 등대 5개
// ═══════════════════════════════════════════════════════════
router.get('/harbor/lighthouse', async (req, res) => {
  try {
    const wishes = await lighthouseService.getTodayLighthouse();

    res.json({
      success: true,
      lighthouse: wishes.map(w => ({
        id: w.id,
        content: w.content,
        route: w.route,
        reaction_count: parseInt(w.reaction_count || 0, 10),
        created_at: w.created_at
      }))
    });

  } catch (error) {
    console.error('❌ 등대 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /harbor/wishes/:id - 소원 상세 조회
// ═══════════════════════════════════════════════════════════
router.get('/harbor/wishes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    const wish = await wishService.getWishById(id);

    if (!wish) {
      return res.status(404).json({
        success: false,
        error: 'WISH_NOT_FOUND'
      });
    }

    // 반응 정보
    const reactions = await reactionService.getReactions(id);
    const userReactions = user_id
      ? await reactionService.getUserReactions(id, user_id)
      : [];

    // 댓글 목록
    const comments = await commentService.getComments(id);

    // 첫 바람
    const firstWind = await firstWindService.getFirstWind(id);

    res.json({
      success: true,
      wish: {
        id: wish.id,
        content: wish.content,
        route: wish.route,
        visibility: wish.visibility,
        traffic_light: wish.traffic_light,
        author_nickname: wish.author_nickname || '익명',
        reaction_count: parseInt(wish.reaction_count || 0, 10),
        comment_count: parseInt(wish.comment_count || 0, 10),
        created_at: wish.created_at
      },
      reactions,
      userReactions,
      comments,
      firstWind: firstWind ? {
        message: firstWind.message,
        created_at: firstWind.created_at
      } : null
    });

  } catch (error) {
    console.error('❌ 소원 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /harbor/wishes/:id/react - 반응
// ═══════════════════════════════════════════════════════════
router.post('/harbor/wishes/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, reaction_type } = req.body;

    if (!user_id || !reaction_type) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_AND_REACTION_TYPE_REQUIRED'
      });
    }

    const reaction = await reactionService.addReaction(id, user_id, reaction_type);

    res.status(201).json({
      success: true,
      reaction: {
        id: reaction.id,
        reaction_type: reaction.reaction_type,
        created_at: reaction.created_at
      }
    });

  } catch (error) {
    console.error('❌ 반응 실패:', error);

    const statusCode = error.message.includes('INVALID') ||
                       error.message.includes('CANNOT') ||
                       error.message.includes('ALREADY') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /harbor/wishes/:id/comments - 댓글 작성
// ═══════════════════════════════════════════════════════════
router.post('/harbor/wishes/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, content, preset_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED'
      });
    }

    const comment = await commentService.createComment(id, user_id, {
      content,
      presetId: preset_id
    });

    res.status(201).json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        is_preset: comment.is_preset,
        created_at: comment.created_at
      }
    });

  } catch (error) {
    console.error('❌ 댓글 작성 실패:', error);

    const statusCode = error.message.includes('REQUIRED') ||
                       error.message.includes('TOO_LONG') ||
                       error.message.includes('BLOCKED') ||
                       error.message.includes('INVALID') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      details: error.details || null
    });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /harbor/comments/presets - 프리셋 목록
// ═══════════════════════════════════════════════════════════
router.get('/harbor/comments/presets', async (req, res) => {
  res.json({
    success: true,
    presets: commentService.getPresets()
  });
});

// ═══════════════════════════════════════════════════════════
// GET /harbor/notifications - 알림 목록
// ═══════════════════════════════════════════════════════════
router.get('/harbor/notifications', async (req, res) => {
  try {
    const { user_id, unread_only } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED'
      });
    }

    const notifications = await notificationService.getNotifications(user_id, {
      unreadOnly: unread_only === 'true'
    });

    const unreadCount = await notificationService.getUnreadCount(user_id);

    res.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error('❌ 알림 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /harbor/notifications/:id/read - 알림 읽음
// ═══════════════════════════════════════════════════════════
router.post('/harbor/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED'
      });
    }

    const notification = await notificationService.markAsRead(id, user_id);

    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('❌ 알림 읽음 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /harbor/report - 신고
// ═══════════════════════════════════════════════════════════
router.post('/harbor/report', async (req, res) => {
  try {
    const { reporter_id, target_type, target_id, reason } = req.body;

    if (!reporter_id || !target_type || !target_id || !reason) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const report = await reportService.createReport(reporter_id, {
      targetType: target_type,
      targetId: target_id,
      reason
    });

    res.status(201).json({
      success: true,
      report: {
        id: report.id,
        status: report.status,
        created_at: report.created_at
      }
    });

  } catch (error) {
    console.error('❌ 신고 실패:', error);

    const statusCode = error.message.includes('INVALID') ||
                       error.message.includes('ALREADY') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /harbor/temperature - 내 온도 조회
// ═══════════════════════════════════════════════════════════
router.get('/harbor/temperature', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED'
      });
    }

    const temperature = await userService.getTemperature(user_id);
    const logs = await temperatureService.getTemperatureLogs(user_id, 10);

    res.json({
      success: true,
      temperature: parseFloat(temperature),
      recentLogs: logs.map(l => ({
        delta: parseFloat(l.delta),
        reason: l.reason,
        created_at: l.created_at
      }))
    });

  } catch (error) {
    console.error('❌ 온도 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /harbor/metrics - 첫 바람 SLA 메트릭스
// ═══════════════════════════════════════════════════════════
router.get('/harbor/metrics', async (req, res) => {
  res.json({
    success: true,
    firstWind: firstWindService.getLatencyMetrics()
  });
});

module.exports = router;
