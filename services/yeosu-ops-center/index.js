/**
 * 여수여행센터 운영 컨트롤타워 OS v0 - 서비스 인덱스
 *
 * 목적: SSOT 기반 행사/축제 운영 관리 시스템
 * 비개입 영역: 개인정보(민감정보), 결제/정산
 */

const eventService = require('./eventService');
const memberService = require('./memberService');
const ssotService = require('./ssotService');
const approvalService = require('./approvalService');
const auditService = require('./auditService');
const triggerService = require('./triggerService');
const reportService = require('./reportService');
const partnerService = require('./partnerService');

module.exports = {
  eventService,
  memberService,
  ssotService,
  approvalService,
  auditService,
  triggerService,
  reportService,
  partnerService
};
