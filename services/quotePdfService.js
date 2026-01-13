/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Quote PDF Service - 견적서 PDF 생성
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * P2-1: 확정 견적 PDF 생성 + 발송/로그
 *
 * 기능:
 *   1. 예상견적(ESTIMATE) / 확정견적(CONFIRMED) PDF 생성
 *   2. 운영모드별 자동 문구 삽입
 *   3. 포함/불포함/변동 항목 표준 템플릿
 *   4. Ops 로그 + quote에 PDF URL 저장
 *
 * 작성일: 2026-01-13
 * 설계: 루미 분석 기반 (P2-1 확정본 v1)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════════════════════

const DOCUMENT_TYPES = {
  ESTIMATE: 'estimate',
  CONFIRMED: 'confirmed'
};

// 운영모드별 자동 문구 (루미 스펙)
const OPERATION_MODE_TEXTS = {
  direct: {
    label: '직영',
    description: '본 일정은 당사가 직접 진행하며, 결제/세금계산서 발행 주체는 당사입니다.',
    short: '당사 진행/당사 발행'
  },
  agency: {
    label: '여행사 이관',
    description: '본 일정은 제휴 여행사가 주관하며, 결제/세금계산서 발행은 여행사 기준입니다.',
    short: '여행사 주관/여행사 발행'
  },
  commission: {
    label: '수수료',
    description: '당사는 소개/기획 수수료 형태로 참여하며, 계약·대금·증빙은 제3자 주체입니다.',
    short: '당사 소개/제3자 계약'
  },
  hybrid: {
    label: '혼합',
    description: '일부는 당사, 일부는 제휴사 진행 (세부는 내역서 참조)',
    short: '혼합 진행'
  }
};

// 책임주체 레이블
const PARTY_LABELS = {
  us: '당사 (하루하루의 기적)',
  agency: '제휴 여행사'
};

// 기본 포함/불포함 항목
const DEFAULT_INCLUDED_ITEMS = [
  '전용 차량 (기사 포함)',
  '관광지 입장료',
  '식사 (일정표 기준)',
  '전문 가이드 (해당 시)'
];

const DEFAULT_EXCLUDED_ITEMS = [
  '개인 경비',
  '주류 및 음료',
  '현장 추가 요금',
  '옵션 프로그램',
  '여행자 보험 (별도 가입 권장)'
];

const DEFAULT_VARIABLE_ITEMS = [
  '성수기/비수기 요금 변동',
  '인원 변동에 따른 단가 조정',
  '현장 상황에 따른 일정 변경'
];

// ═══════════════════════════════════════════════════════════════════════════
// Handlebars 헬퍼 등록
// ═══════════════════════════════════════════════════════════════════════════

Handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
});

Handlebars.registerHelper('formatDateTime', function(date) {
  if (!date) return '-';
  const d = new Date(date);
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
});

Handlebars.registerHelper('formatCurrency', function(amount) {
  if (amount === null || amount === undefined) return '-';
  return Number(amount).toLocaleString('ko-KR') + '원';
});

Handlebars.registerHelper('maskPhone', function(phone) {
  if (!phone) return '-';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`;
  }
  return phone;
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// ═══════════════════════════════════════════════════════════════════════════
// PDF 템플릿 (인라인 HTML)
// ═══════════════════════════════════════════════════════════════════════════

const PDF_TEMPLATE = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
    }
    .page {
      page-break-after: always;
      padding: 10mm;
    }
    .page:last-child {
      page-break-after: avoid;
    }

    /* 헤더 */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 18pt;
      font-weight: bold;
      color: #2563eb;
    }
    .doc-info {
      text-align: right;
    }
    .doc-type {
      font-size: 16pt;
      font-weight: bold;
      color: {{#if (eq documentType 'confirmed')}}#16a34a{{else}}#ea580c{{/if}};
    }
    .doc-type-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 10pt;
      color: white;
      background-color: {{#if (eq documentType 'confirmed')}}#16a34a{{else}}#ea580c{{/if}};
      margin-bottom: 8px;
    }
    .quote-id {
      font-size: 10pt;
      color: #666;
    }

    /* 섹션 */
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1e40af;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }

    /* 정보 그리드 */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .info-row {
      display: flex;
    }
    .info-label {
      width: 100px;
      color: #666;
      font-size: 10pt;
    }
    .info-value {
      flex: 1;
      font-weight: 500;
    }

    /* 금액 박스 */
    .amount-box {
      background-color: #f8fafc;
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      margin: 15px 0;
    }
    .amount-label {
      font-size: 10pt;
      color: #666;
    }
    .amount-value {
      font-size: 24pt;
      font-weight: bold;
      color: #2563eb;
    }
    .amount-per-person {
      font-size: 11pt;
      color: #666;
      margin-top: 5px;
    }
    .amount-type-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      color: white;
      background-color: {{#if (eq documentType 'confirmed')}}#16a34a{{else}}#ea580c{{/if}};
      margin-top: 8px;
    }

    /* 운영모드 박스 */
    .operation-box {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 12px;
      margin: 15px 0;
    }
    .operation-title {
      font-weight: bold;
      color: #b45309;
      margin-bottom: 5px;
    }
    .operation-desc {
      font-size: 10pt;
      color: #78350f;
    }

    /* 책임주체 테이블 */
    .responsibility-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin: 10px 0;
    }
    .responsibility-table th,
    .responsibility-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .responsibility-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      width: 30%;
    }

    /* 포함/불포함 */
    .items-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .items-box {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
    }
    .items-box.included {
      border-color: #16a34a;
      background-color: #f0fdf4;
    }
    .items-box.excluded {
      border-color: #dc2626;
      background-color: #fef2f2;
    }
    .items-box.variable {
      border-color: #f59e0b;
      background-color: #fffbeb;
    }
    .items-title {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .items-title.included { color: #16a34a; }
    .items-title.excluded { color: #dc2626; }
    .items-title.variable { color: #f59e0b; }
    .items-list {
      list-style: none;
      font-size: 10pt;
    }
    .items-list li {
      padding: 3px 0;
    }
    .items-list li::before {
      content: '• ';
      color: #999;
    }

    /* 결제 안내 */
    .payment-box {
      background-color: #eff6ff;
      border: 1px solid #2563eb;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .payment-title {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }

    /* 취소/환불 */
    .refund-notice {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 12px;
      font-size: 10pt;
      color: #64748b;
      margin-top: 15px;
    }

    /* 푸터 */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }

    /* 일정표 (2페이지) */
    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin: 10px 0;
    }
    .schedule-table th,
    .schedule-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    .schedule-table th {
      background-color: #2563eb;
      color: white;
      font-weight: bold;
    }
    .schedule-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* 비용 상세 테이블 */
    .cost-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin: 10px 0;
    }
    .cost-table th,
    .cost-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: right;
    }
    .cost-table th {
      background-color: #f1f5f9;
      text-align: center;
      font-weight: bold;
    }
    .cost-table td:first-child,
    .cost-table td:nth-child(2) {
      text-align: left;
    }
    .cost-table .total-row {
      background-color: #2563eb;
      color: white;
      font-weight: bold;
    }

    /* 인센티브/MICE 섹션 */
    .incentive-box {
      background-color: #f5f3ff;
      border: 1px solid #8b5cf6;
      border-radius: 8px;
      padding: 12px;
      margin: 15px 0;
    }
    .incentive-title {
      font-weight: bold;
      color: #6d28d9;
      margin-bottom: 8px;
    }
    .checklist-item {
      display: flex;
      align-items: center;
      padding: 4px 0;
      font-size: 10pt;
    }
    .checklist-checkbox {
      width: 14px;
      height: 14px;
      border: 1px solid #8b5cf6;
      border-radius: 2px;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <!-- 1페이지: 고객용 요약 -->
  <div class="page">
    <!-- 헤더 -->
    <div class="header">
      <div>
        <div class="brand">하루하루의 기적</div>
        <div style="font-size: 10pt; color: #666;">Daily Miracles</div>
      </div>
      <div class="doc-info">
        <div class="doc-type-badge">
          {{#if (eq documentType 'confirmed')}}확정 견적서{{else}}예상 견적서{{/if}}
        </div>
        <div class="quote-id">{{quoteId}}</div>
        <div style="font-size: 9pt; color: #999;">발행일: {{formatDateTime issuedAt}}</div>
      </div>
    </div>

    <!-- 고객/일정 정보 -->
    <div class="section">
      <div class="section-title">고객 및 일정 정보</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">고객명</span>
          <span class="info-value">{{customerName}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">연락처</span>
          <span class="info-value">{{maskPhone customerPhone}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">여행일</span>
          <span class="info-value">{{formatDate travelDate}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">여행 유형</span>
          <span class="info-value">{{tripTypeLabel}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">인원</span>
          <span class="info-value">{{paxTotal}}명</span>
        </div>
        <div class="info-row">
          <span class="info-label">출발지</span>
          <span class="info-value">{{origin}}</span>
        </div>
      </div>
    </div>

    <!-- 코스 요약 -->
    {{#if courseTitle}}
    <div class="section">
      <div class="section-title">코스 정보</div>
      <div class="info-row">
        <span class="info-label">코스명</span>
        <span class="info-value">{{courseTitle}}</span>
      </div>
      {{#if scheduleSummary}}
      <div style="margin-top: 8px; font-size: 10pt; color: #666;">
        {{scheduleSummary}}
      </div>
      {{/if}}
    </div>
    {{/if}}

    <!-- 금액 요약 -->
    <div class="section">
      <div class="section-title">금액 정보</div>
      <div class="amount-box">
        <div class="amount-label">총 금액</div>
        <div class="amount-value">{{formatCurrency totalAmount}}</div>
        <div class="amount-per-person">1인당 {{formatCurrency perPersonAmount}}</div>
        <div class="amount-type-badge">
          {{#if (eq documentType 'confirmed')}}확정가{{else}}예상가 (변동 가능){{/if}}
        </div>
        {{#if priceValidUntil}}
        <div style="font-size: 9pt; color: #999; margin-top: 8px;">
          견적 유효기간: {{formatDate priceValidUntil}}까지
        </div>
        {{/if}}
      </div>
    </div>

    <!-- 운영/책임 정보 -->
    <div class="section">
      <div class="section-title">운영 및 책임 안내</div>
      <div class="operation-box">
        <div class="operation-title">운영 방식: {{operationModeLabel}}</div>
        <div class="operation-desc">{{operationModeDescription}}</div>
      </div>
      <table class="responsibility-table">
        <tr>
          <th>결제 수령</th>
          <td>{{paymentReceiverLabel}}</td>
        </tr>
        <tr>
          <th>세금계산서 발행</th>
          <td>{{taxInvoiceIssuerLabel}}</td>
        </tr>
        <tr>
          <th>계약 주체</th>
          <td>{{contractPartyLabel}}</td>
        </tr>
        <tr>
          <th>취소/환불 책임</th>
          <td>{{refundLiabilityLabel}}</td>
        </tr>
      </table>
    </div>

    <!-- 포함/불포함 -->
    <div class="section">
      <div class="section-title">포함/불포함 안내</div>
      <div class="items-container">
        <div class="items-box included">
          <div class="items-title included">포함 사항</div>
          <ul class="items-list">
            {{#each includedItems}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
        </div>
        <div class="items-box excluded">
          <div class="items-title excluded">불포함 사항</div>
          <ul class="items-list">
            {{#each excludedItems}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
        </div>
      </div>
      {{#if variableItems.length}}
      <div class="items-box variable" style="margin-top: 10px;">
        <div class="items-title variable">변동 가능 사항</div>
        <ul class="items-list">
          {{#each variableItems}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
      </div>
      {{/if}}
    </div>

    <!-- 결제 안내 (확정일 때만) -->
    {{#if (eq documentType 'confirmed')}}
    {{#if paymentLink}}
    <div class="section">
      <div class="section-title">결제 안내</div>
      <div class="payment-box">
        <div class="payment-title">결제 정보</div>
        {{#if depositAmount}}
        <div class="info-row">
          <span class="info-label">예약금</span>
          <span class="info-value">{{formatCurrency depositAmount}} ({{formatDate depositDueAt}}까지)</span>
        </div>
        <div class="info-row">
          <span class="info-label">잔금</span>
          <span class="info-value">{{formatCurrency balanceAmount}} ({{formatDate balanceDueAt}}까지)</span>
        </div>
        {{else}}
        <div class="info-row">
          <span class="info-label">결제 금액</span>
          <span class="info-value">{{formatCurrency totalAmount}}</span>
        </div>
        {{/if}}
        <div style="margin-top: 10px; font-size: 10pt; color: #1e40af;">
          결제 링크: {{paymentLink}}
        </div>
      </div>
    </div>
    {{/if}}
    {{/if}}

    <!-- 취소/환불 규정 -->
    <div class="refund-notice">
      <strong>취소/환불 규정</strong><br>
      • 출발 7일 전: 전액 환불<br>
      • 출발 3~6일 전: 50% 환불<br>
      • 출발 2일 전 이후: 환불 불가<br>
      ※ 상세 규정은 별도 약관을 참조해 주세요.
    </div>

    <!-- 푸터 -->
    <div class="footer">
      하루하루의 기적 | Daily Miracles<br>
      문의: @dailymiracles (카카오톡) | contact@dailymiracles.co.kr
    </div>
  </div>

  <!-- 2페이지: 상세 내역 (비용 상세가 있을 때만) -->
  {{#if costBreakdown.length}}
  <div class="page">
    <div class="header">
      <div>
        <div class="brand">하루하루의 기적</div>
        <div style="font-size: 10pt; color: #666;">상세 내역서</div>
      </div>
      <div class="doc-info">
        <div class="quote-id">{{quoteId}}</div>
      </div>
    </div>

    <!-- 일정표 -->
    {{#if dayPlans.length}}
    <div class="section">
      <div class="section-title">일정표</div>
      <table class="schedule-table">
        <thead>
          <tr>
            <th style="width: 15%;">일차</th>
            <th style="width: 20%;">시간</th>
            <th style="width: 35%;">장소/활동</th>
            <th style="width: 30%;">비고</th>
          </tr>
        </thead>
        <tbody>
          {{#each dayPlans}}
          <tr>
            <td>{{day}}</td>
            <td>{{timeRange}}</td>
            <td>{{spot}}</td>
            <td>{{notes}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
    {{/if}}

    <!-- 비용 상세 -->
    <div class="section">
      <div class="section-title">비용 상세</div>
      <table class="cost-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>항목</th>
            <th>단가</th>
            <th>수량</th>
            <th>금액</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          {{#each costBreakdown}}
          <tr>
            <td>{{categoryLabel}}</td>
            <td>{{itemName}}</td>
            <td>{{formatCurrency unitPrice}}</td>
            <td>{{qty}}</td>
            <td>{{formatCurrency amount}}</td>
            <td>{{notes}}</td>
          </tr>
          {{/each}}
          <tr class="total-row">
            <td colspan="4" style="text-align: right;">합계</td>
            <td>{{formatCurrency totalAmount}}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 인센티브/MICE 안내 -->
    {{#if incentiveRequired}}
    <div class="section">
      <div class="section-title">인센티브 안내</div>
      <div class="incentive-box">
        <div class="incentive-title">필요 서류 체크리스트</div>
        {{#each incentiveChecklist}}
        <div class="checklist-item">
          <div class="checklist-checkbox"></div>
          {{name}} {{#if required}}(필수){{/if}}
        </div>
        {{/each}}
        {{#if incentiveTimeline.length}}
        <div style="margin-top: 12px;">
          <div class="incentive-title">주요 일정</div>
          {{#each incentiveTimeline}}
          <div style="font-size: 10pt; padding: 4px 0;">
            • {{label}}: {{date}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      </div>
    </div>
    {{/if}}

    {{#if isMice}}
    <div class="section">
      <div class="section-title">MICE 안내</div>
      <div class="incentive-box">
        <div class="incentive-title">필요 서류 체크리스트</div>
        {{#each miceChecklist}}
        <div class="checklist-item">
          <div class="checklist-checkbox"></div>
          {{name}} {{#if required}}(필수){{/if}}
        </div>
        {{/each}}
        {{#if miceTimeline.length}}
        <div style="margin-top: 12px;">
          <div class="incentive-title">주요 일정</div>
          {{#each miceTimeline}}
          <div style="font-size: 10pt; padding: 4px 0;">
            • {{label}}: {{date}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      </div>
    </div>
    {{/if}}

    <div class="footer">
      하루하루의 기적 | Daily Miracles<br>
      본 문서는 참고용이며, 실제 계약 조건은 계약서를 기준으로 합니다.
    </div>
  </div>
  {{/if}}
</body>
</html>
`;

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 여행 유형 레이블 변환
 */
function getTripTypeLabel(tripType) {
  const labels = {
    'day': '당일 여행',
    '1n2d': '1박 2일',
    '2n3d': '2박 3일',
    '3n4d': '3박 4일'
  };
  return labels[tripType] || tripType || '당일 여행';
}

/**
 * 비용 카테고리 레이블 변환
 */
function getCategoryLabel(category) {
  const labels = {
    'vehicle': '차량',
    'admission': '입장료',
    'meals': '식사',
    'lodging': '숙박',
    'guide': '가이드',
    'misc': '기타'
  };
  return labels[category] || category || '기타';
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF 생성 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 견적 PDF 생성
 * @param {Object} quoteData - 견적 데이터
 * @param {Object} options - 추가 옵션
 * @returns {Promise<Buffer>} PDF 버퍼
 */
async function generateQuotePdf(quoteData, options = {}) {
  const {
    documentType = DOCUMENT_TYPES.ESTIMATE,
    includeCostBreakdown = true
  } = options;

  // 운영모드 텍스트
  const operationMode = quoteData.operation_mode || 'direct';
  const modeText = OPERATION_MODE_TEXTS[operationMode] || OPERATION_MODE_TEXTS.direct;

  // 템플릿 데이터 준비
  const templateData = {
    // 문서 유형
    documentType,

    // 헤더
    quoteId: quoteData.quote_id,
    issuedAt: new Date(),

    // 고객/일정
    customerName: quoteData.customer_name || '고객',
    customerPhone: quoteData.customer_phone,
    travelDate: quoteData.travel_date,
    tripTypeLabel: getTripTypeLabel(quoteData.day_type || quoteData.trip_type),
    paxTotal: quoteData.guest_count || quoteData.pax_total || 2,
    origin: quoteData.origin || '미지정',

    // 코스
    courseTitle: quoteData.course_title || quoteData.preset_name,
    scheduleSummary: quoteData.schedule_summary,

    // 금액
    totalAmount: quoteData.total_sell || quoteData.total_amount || 0,
    perPersonAmount: Math.round((quoteData.total_sell || 0) / (quoteData.guest_count || 1)),
    priceValidUntil: quoteData.price_valid_until,

    // 운영모드
    operationModeLabel: modeText.label,
    operationModeDescription: modeText.description,

    // 책임주체
    paymentReceiverLabel: PARTY_LABELS[quoteData.payment_receiver] || PARTY_LABELS.us,
    taxInvoiceIssuerLabel: PARTY_LABELS[quoteData.tax_invoice_issuer] || PARTY_LABELS.us,
    contractPartyLabel: PARTY_LABELS[quoteData.contract_party] || PARTY_LABELS.us,
    refundLiabilityLabel: PARTY_LABELS[quoteData.refund_liability] || PARTY_LABELS.us,

    // 포함/불포함
    includedItems: quoteData.included_items || DEFAULT_INCLUDED_ITEMS,
    excludedItems: quoteData.excluded_items || DEFAULT_EXCLUDED_ITEMS,
    variableItems: quoteData.variable_items || DEFAULT_VARIABLE_ITEMS,

    // 결제
    paymentLink: documentType === DOCUMENT_TYPES.CONFIRMED ? quoteData.payment_link : null,
    depositAmount: quoteData.deposit_amount,
    depositDueAt: quoteData.deposit_due_at,
    balanceAmount: quoteData.balance_amount,
    balanceDueAt: quoteData.balance_due_at,

    // 일정표 (2페이지)
    dayPlans: quoteData.day_plans || [],

    // 비용 상세 (2페이지)
    costBreakdown: includeCostBreakdown && quoteData.cost_breakdown
      ? quoteData.cost_breakdown.map(item => ({
          ...item,
          categoryLabel: getCategoryLabel(item.category)
        }))
      : [],

    // 인센티브/MICE
    incentiveRequired: quoteData.incentive_required,
    incentiveChecklist: quoteData.incentive_checklist || [],
    incentiveTimeline: quoteData.incentive_timeline || [],
    isMice: quoteData.is_mice,
    miceChecklist: quoteData.mice_checklist || [],
    miceTimeline: quoteData.mice_timeline || []
  };

  // HTML 생성
  const template = Handlebars.compile(PDF_TEMPLATE);
  const html = template(templateData);

  // Puppeteer로 PDF 생성
  let browser;
  try {
    // @sparticuz/chromium for serverless/cloud environments
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * PDF를 파일로 저장
 * @param {Buffer} pdfBuffer - PDF 버퍼
 * @param {string} quoteId - 견적 ID
 * @param {string} documentType - 문서 유형
 * @returns {Promise<string>} 저장된 파일 경로
 */
async function savePdfToFile(pdfBuffer, quoteId, documentType) {
  const pdfDir = path.join(__dirname, '..', 'public', 'pdfs');

  // 디렉토리 생성
  try {
    await fs.mkdir(pdfDir, { recursive: true });
  } catch (err) {
    // 이미 존재하면 무시
  }

  const filename = `${quoteId}_${documentType}_${Date.now()}.pdf`;
  const filepath = path.join(pdfDir, filename);

  await fs.writeFile(filepath, pdfBuffer);

  return `/pdfs/${filename}`;
}

/**
 * 확정 견적 PDF 생성 및 저장 (통합 함수)
 * @param {Object} quoteData - 견적 데이터
 * @returns {Promise<Object>} { success, pdfUrl, pdfPath }
 */
async function generateAndSaveConfirmedPdf(quoteData) {
  try {
    const pdfBuffer = await generateQuotePdf(quoteData, {
      documentType: DOCUMENT_TYPES.CONFIRMED,
      includeCostBreakdown: true
    });

    const pdfUrl = await savePdfToFile(
      pdfBuffer,
      quoteData.quote_id,
      DOCUMENT_TYPES.CONFIRMED
    );

    return {
      success: true,
      pdfUrl,
      pdfGeneratedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[PDF] 생성 실패:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 예상 견적 PDF 생성 및 저장
 * @param {Object} quoteData - 견적 데이터
 * @returns {Promise<Object>} { success, pdfUrl, pdfPath }
 */
async function generateAndSaveEstimatePdf(quoteData) {
  try {
    const pdfBuffer = await generateQuotePdf(quoteData, {
      documentType: DOCUMENT_TYPES.ESTIMATE,
      includeCostBreakdown: false
    });

    const pdfUrl = await savePdfToFile(
      pdfBuffer,
      quoteData.quote_id,
      DOCUMENT_TYPES.ESTIMATE
    );

    return {
      success: true,
      pdfUrl,
      pdfGeneratedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[PDF] 예상 견적 생성 실패:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  DOCUMENT_TYPES,
  OPERATION_MODE_TEXTS,
  generateQuotePdf,
  savePdfToFile,
  generateAndSaveConfirmedPdf,
  generateAndSaveEstimatePdf
};
