/**
 * MVP 1차 폼 API 라우트
 * - 60초 컷 간편 접수
 * - 내부 태그 자동 분류 (PASS/SINGLE/RECOMMEND)
 *
 * @version 1.0 - 2025.12.13
 */

const express = require('express');
const router = express.Router();
const {
  INQUIRY_QUESTIONS,
  getTagFromProductType,
  generateInquiryId,
  validateInquiryForm
} = require('../config/inquiryForm');

// 접수 데이터 임시 저장소 (MVP용, 추후 DB 연동)
const inquiryStore = new Map();

/**
 * GET /api/inquiry/form
 * 1차 폼 질문 목록 조회 (프론트엔드 렌더링용)
 */
router.get('/form', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        title: "여수 여행 간편 접수",
        description: "60초면 충분해요! 간단한 정보만 알려주세요.",
        questions: INQUIRY_QUESTIONS,
        version: "1.0"
      }
    });
  } catch (error) {
    console.error('폼 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '폼 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /api/inquiry/submit
 * 1차 폼 접수
 *
 * Request Body:
 * {
 *   productType: "PASS" | "SINGLE" | "RECOMMEND" | "투어패스..." | "단품..." | "모르겠어요...",
 *   region: "seoul" | "gyeonggi" | "chungcheong" | "gyeongsang" | "other",
 *   schedule: "this_month" | "next_month" | "undecided",
 *   preferredDate?: "2025-01-15" (선택),
 *   groupSize: "1" | "2" | "3-4" | "5+",
 *   contact: "카카오ID 또는 휴대폰",
 *   request?: "추가 요청사항" (선택)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     inquiryId: "INQ-20251213-abc123",
 *     tag: "PASS",
 *     message: "접수 완료 메시지",
 *     nextStep: "다음 단계 안내"
 *   }
 * }
 */
router.post('/submit', async (req, res) => {
  const startTime = Date.now();

  try {
    const formData = req.body;

    // 1. 입력 검증
    const validation = validateInquiryForm(formData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: '입력 정보를 확인해주세요.',
        details: validation.errors
      });
    }

    // 2. 내부 태그 추출
    const tag = getTagFromProductType(formData.productType);

    // 3. 접수번호 생성
    const inquiryId = generateInquiryId();

    // 4. 접수 데이터 구성
    const inquiryData = {
      inquiryId,
      tag,
      productType: formData.productType,
      region: formData.region,
      schedule: formData.schedule,
      preferredDate: formData.preferredDate || null,
      groupSize: formData.groupSize,
      contact: formData.contact,
      request: formData.request || null,
      status: 'received', // received → contacted → confirmed → completed
      createdAt: new Date().toISOString(),
      processingTime: Date.now() - startTime
    };

    // 5. 저장 (MVP: in-memory, 추후 DB)
    inquiryStore.set(inquiryId, inquiryData);

    console.log(`✅ 새 접수: ${inquiryId} [${tag}] - ${formData.contact}`);

    // 6. 응답 메시지 생성
    const responseMessage = generateResponseMessage(tag, inquiryId);

    // 7. 응답 반환
    res.status(201).json({
      success: true,
      data: {
        inquiryId,
        tag,
        message: responseMessage.main,
        nextStep: responseMessage.nextStep,
        estimatedResponse: "영업시간 기준 1시간 이내",
        timestamp: inquiryData.createdAt
      }
    });

    // TODO: 알림 발송 (카카오톡/이메일)
    // await sendNotification(inquiryData);

  } catch (error) {
    console.error('접수 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '접수 처리 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

/**
 * GET /api/inquiry/:inquiryId
 * 접수 상태 조회
 */
router.get('/:inquiryId', (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inquiry = inquiryStore.get(inquiryId);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: '접수 정보를 찾을 수 없습니다.',
        hint: '접수번호를 다시 확인해주세요.'
      });
    }

    res.json({
      success: true,
      data: {
        inquiryId: inquiry.inquiryId,
        status: inquiry.status,
        statusLabel: getStatusLabel(inquiry.status),
        tag: inquiry.tag,
        createdAt: inquiry.createdAt
      }
    });

  } catch (error) {
    console.error('접수 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '접수 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/inquiry/list/all (관리자용)
 * 전체 접수 목록 조회
 */
router.get('/list/all', (req, res) => {
  try {
    const inquiries = Array.from(inquiryStore.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        total: inquiries.length,
        inquiries: inquiries.map(inq => ({
          inquiryId: inq.inquiryId,
          tag: inq.tag,
          region: inq.region,
          schedule: inq.schedule,
          groupSize: inq.groupSize,
          contact: inq.contact,
          status: inq.status,
          createdAt: inq.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '접수 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * 태그별 응답 메시지 생성
 */
function generateResponseMessage(tag, inquiryId) {
  const messages = {
    PASS: {
      main: "투어패스 문의가 접수되었습니다! 여수의 다양한 매력을 한 번에 즐기실 수 있도록 맞춤 패키지를 준비해 드릴게요.",
      nextStep: "담당자가 곧 연락드려 세부 일정과 포함 내역을 안내해 드립니다."
    },
    SINGLE: {
      main: "단품 예약 문의가 접수되었습니다! 원하시는 체험이나 장소를 정확히 안내해 드릴게요.",
      nextStep: "담당자가 곧 연락드려 예약 가능 여부와 상세 정보를 안내해 드립니다."
    },
    RECOMMEND: {
      main: "추천 요청이 접수되었습니다! 고객님께 딱 맞는 여수 여행을 찾아드릴게요.",
      nextStep: "담당자가 곧 연락드려 몇 가지 질문 후 최적의 여행을 추천해 드립니다."
    }
  };

  return messages[tag] || messages.RECOMMEND;
}

/**
 * 상태 라벨 반환
 */
function getStatusLabel(status) {
  const labels = {
    received: "접수 완료",
    contacted: "연락 완료",
    confirmed: "예약 확정",
    completed: "여행 완료"
  };
  return labels[status] || "확인 중";
}

module.exports = router;
