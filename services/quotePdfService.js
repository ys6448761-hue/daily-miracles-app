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
  CONFIRMED: 'confirmed',
  SETTLEMENT: 'settlement'  // P2-2: 정산서/수수료-only
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
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
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
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
// P2-2: 정산서 PDF 템플릿 (수수료-only / commission 모드용)
// ═══════════════════════════════════════════════════════════════════════════

const SETTLEMENT_PDF_TEMPLATE = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      padding: 10mm;
    }

    /* 헤더 */
    .header {
      text-align: center;
      border-bottom: 3px double #333;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .doc-title {
      font-size: 22pt;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 8px;
    }
    .doc-subtitle {
      font-size: 11pt;
      color: #666;
    }
    .quote-id {
      font-size: 10pt;
      color: #999;
      margin-top: 8px;
    }

    /* 발행 정보 박스 */
    .issue-info-box {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      font-size: 10pt;
    }
    .issue-info-left {
      text-align: left;
    }
    .issue-info-right {
      text-align: right;
    }

    /* 수신/발신 박스 */
    .party-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    .party-section {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
    }
    .party-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1e40af;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .party-info {
      font-size: 10pt;
    }
    .party-info-row {
      display: flex;
      padding: 4px 0;
    }
    .party-info-label {
      width: 80px;
      color: #666;
    }
    .party-info-value {
      flex: 1;
      font-weight: 500;
    }

    /* 정산 내역 테이블 */
    .settlement-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .settlement-table th,
    .settlement-table td {
      border: 1px solid #333;
      padding: 12px 15px;
      text-align: left;
    }
    .settlement-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      width: 35%;
    }
    .settlement-table td {
      width: 65%;
    }
    .settlement-table .amount-row td {
      font-size: 14pt;
      font-weight: bold;
      color: #1e40af;
    }
    .settlement-table .highlight-row {
      background-color: #eff6ff;
    }
    .settlement-table .total-row {
      background-color: #1e40af;
      color: white;
    }
    .settlement-table .total-row th,
    .settlement-table .total-row td {
      border-color: #1e40af;
    }

    /* 금액 강조 박스 */
    .amount-highlight-box {
      background-color: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 25px 0;
    }
    .amount-highlight-label {
      font-size: 11pt;
      color: #b45309;
      margin-bottom: 8px;
    }
    .amount-highlight-value {
      font-size: 28pt;
      font-weight: bold;
      color: #d97706;
    }

    /* 입금 안내 */
    .payment-section {
      background-color: #f0fdf4;
      border: 1px solid #16a34a;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .payment-title {
      font-size: 12pt;
      font-weight: bold;
      color: #16a34a;
      margin-bottom: 15px;
    }
    .bank-info {
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      font-size: 12pt;
    }
    .bank-info-row {
      display: flex;
      padding: 5px 0;
    }
    .bank-info-label {
      width: 100px;
      color: #666;
    }
    .bank-info-value {
      flex: 1;
      font-weight: bold;
      color: #333;
    }

    /* 세금계산서 안내 */
    .tax-notice {
      background-color: #fef2f2;
      border: 1px solid #dc2626;
      border-radius: 8px;
      padding: 15px;
      margin: 25px 0;
    }
    .tax-notice-title {
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 8px;
    }
    .tax-notice-content {
      font-size: 10pt;
      color: #7f1d1d;
      line-height: 1.8;
    }

    /* 참고 사항 */
    .notes-section {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin: 25px 0;
      font-size: 10pt;
      color: #64748b;
    }
    .notes-title {
      font-weight: bold;
      color: #475569;
      margin-bottom: 8px;
    }
    .notes-list {
      list-style: none;
    }
    .notes-list li {
      padding: 3px 0;
    }
    .notes-list li::before {
      content: '• ';
      color: #94a3b8;
    }

    /* 서명 영역 */
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #ddd;
    }
    .signature-box {
      text-align: center;
    }
    .signature-label {
      font-size: 10pt;
      color: #666;
      margin-bottom: 30px;
    }
    .signature-line {
      border-bottom: 1px solid #333;
      margin: 0 20px;
      padding-bottom: 5px;
    }
    .signature-name {
      font-size: 10pt;
      color: #999;
      margin-top: 5px;
    }

    /* 푸터 */
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
  </style>
</head>
<body>
  <!-- 헤더 -->
  <div class="header">
    <div class="doc-title">정 산 서</div>
    <div class="doc-subtitle">Settlement Statement</div>
    <div class="quote-id">문서번호: {{quoteId}}</div>
  </div>

  <!-- 발행 정보 -->
  <div class="issue-info-box">
    <div class="issue-info-left">
      발행일: {{formatDate issuedAt}}
    </div>
    <div class="issue-info-right">
      정산 예정일: {{formatDate settlementDueAt}}
    </div>
  </div>

  <!-- 수신/발신 -->
  <div class="party-box">
    <div class="party-section">
      <div class="party-title">수신 (갑)</div>
      <div class="party-info">
        <div class="party-info-row">
          <span class="party-info-label">상호</span>
          <span class="party-info-value">{{receiverCompany}}</span>
        </div>
        <div class="party-info-row">
          <span class="party-info-label">담당자</span>
          <span class="party-info-value">{{receiverName}}</span>
        </div>
      </div>
    </div>
    <div class="party-section">
      <div class="party-title">발신 (을)</div>
      <div class="party-info">
        <div class="party-info-row">
          <span class="party-info-label">상호</span>
          <span class="party-info-value">하루하루의 기적</span>
        </div>
        <div class="party-info-row">
          <span class="party-info-label">담당자</span>
          <span class="party-info-value">푸르미르 (이세진)</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 정산 내역 -->
  <table class="settlement-table">
    <tr>
      <th>건명</th>
      <td>{{tripTitle}}</td>
    </tr>
    <tr>
      <th>여행일</th>
      <td>{{formatDate travelDate}}</td>
    </tr>
    <tr>
      <th>고객</th>
      <td>{{maskedCustomerName}}</td>
    </tr>
    <tr>
      <th>인원</th>
      <td>{{paxTotal}}명</td>
    </tr>
    <tr class="highlight-row">
      <th>총 판매가</th>
      <td>{{formatCurrency totalSell}}</td>
    </tr>
    <tr>
      <th>수수료율</th>
      <td>{{commissionRate}}%</td>
    </tr>
    <tr class="total-row amount-row">
      <th>정산 금액 (수수료)</th>
      <td>{{formatCurrency commissionAmount}}</td>
    </tr>
  </table>

  <!-- 정산 금액 강조 -->
  <div class="amount-highlight-box">
    <div class="amount-highlight-label">정산 금액</div>
    <div class="amount-highlight-value">{{formatCurrency commissionAmount}}</div>
  </div>

  <!-- 입금 안내 -->
  <div class="payment-section">
    <div class="payment-title">입금 계좌 안내</div>
    <div class="bank-info">
      <div class="bank-info-row">
        <span class="bank-info-label">은행</span>
        <span class="bank-info-value">{{bankName}}</span>
      </div>
      <div class="bank-info-row">
        <span class="bank-info-label">계좌번호</span>
        <span class="bank-info-value">{{bankAccountNumber}}</span>
      </div>
      <div class="bank-info-row">
        <span class="bank-info-label">예금주</span>
        <span class="bank-info-value">{{bankAccountHolder}}</span>
      </div>
    </div>
  </div>

  <!-- 세금계산서 안내 -->
  <div class="tax-notice">
    <div class="tax-notice-title">세금계산서 발행 안내</div>
    <div class="tax-notice-content">
      {{taxInvoiceNotice}}
    </div>
  </div>

  <!-- 참고 사항 -->
  <div class="notes-section">
    <div class="notes-title">참고 사항</div>
    <ul class="notes-list">
      <li>본 정산서는 수수료 정산을 위한 참고 문서입니다.</li>
      <li>정산 금액은 세금계산서 발행 후 지급됩니다.</li>
      <li>실제 정산일은 상호 협의에 따라 변경될 수 있습니다.</li>
      {{#if additionalNotes}}
      <li>{{additionalNotes}}</li>
      {{/if}}
    </ul>
  </div>

  <!-- 서명 영역 -->
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-label">수신자 (갑)</div>
      <div class="signature-line"></div>
      <div class="signature-name">{{receiverCompany}}</div>
    </div>
    <div class="signature-box">
      <div class="signature-label">발신자 (을)</div>
      <div class="signature-line"></div>
      <div class="signature-name">하루하루의 기적</div>
    </div>
  </div>

  <!-- 푸터 -->
  <div class="footer">
    하루하루의 기적 | Daily Miracles<br>
    문의: @dailymiracles (카카오톡) | contact@dailymiracles.co.kr
  </div>
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

    // 폰트 로딩 대기 (한글 깨짐 방지)
    await page.evaluateHandle('document.fonts.ready');

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
// P2-2: 정산서 PDF 생성 함수 (수수료-only / commission 모드용)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 고객명 마스킹 (예: 홍길동 → 홍*동)
 */
function maskCustomerName(name) {
  if (!name || name.length < 2) return name || '-';
  if (name.length === 2) {
    return name[0] + '*';
  }
  // 첫 글자 + 마스킹 + 마지막 글자
  const middle = '*'.repeat(name.length - 2);
  return name[0] + middle + name[name.length - 1];
}

/**
 * 정산 예정일 계산 (여행 완료 후 +7일)
 */
function calculateSettlementDueDate(travelDate) {
  if (!travelDate) {
    // 기본값: 오늘 +14일
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date;
  }
  const date = new Date(travelDate);
  date.setDate(date.getDate() + 7);
  return date;
}

/**
 * 정산서 PDF 생성
 * @param {Object} quoteData - 견적 데이터
 * @param {Object} options - 추가 옵션
 * @returns {Promise<Buffer>} PDF 버퍼
 */
async function generateSettlementPdf(quoteData, options = {}) {
  // 수수료 계산
  const totalSell = quoteData.total_sell || quoteData.total_amount || 0;
  const commissionRate = quoteData.commission_rate || 10; // 기본 10%
  const commissionAmount = quoteData.commission_amount || Math.round(totalSell * commissionRate / 100);

  // 템플릿 데이터 준비
  const templateData = {
    // 문서 정보
    quoteId: quoteData.quote_id,
    issuedAt: new Date(),
    settlementDueAt: quoteData.settlement_due_at || calculateSettlementDueDate(quoteData.travel_date),

    // 수신자 (여행사/파트너)
    receiverCompany: quoteData.agency_name || quoteData.partner_name || '제휴 여행사',
    receiverName: quoteData.agency_contact || quoteData.partner_contact || '담당자',

    // 건 정보
    tripTitle: quoteData.course_title || quoteData.preset_name || `${quoteData.travel_date ? new Date(quoteData.travel_date).toLocaleDateString('ko-KR') : ''} 여행 건`,
    travelDate: quoteData.travel_date,
    maskedCustomerName: maskCustomerName(quoteData.customer_name),
    paxTotal: quoteData.guest_count || quoteData.pax_total || 2,

    // 금액 정보
    totalSell,
    commissionRate,
    commissionAmount,

    // 입금 계좌 (당사 계좌)
    bankName: options.bankName || process.env.SETTLEMENT_BANK_NAME || '국민은행',
    bankAccountNumber: options.bankAccountNumber || process.env.SETTLEMENT_BANK_ACCOUNT || '123-456-789012',
    bankAccountHolder: options.bankAccountHolder || process.env.SETTLEMENT_BANK_HOLDER || '(주)하루하루의기적',

    // 세금계산서 안내
    taxInvoiceNotice: options.taxInvoiceNotice ||
      '정산 금액 입금 전, 수수료에 대한 세금계산서를 "하루하루의 기적" 명의로 발행해 주시기 바랍니다.\n' +
      '세금계산서 수신 후 영업일 기준 3일 이내 입금 처리됩니다.\n' +
      '사업자번호: 000-00-00000 | 이메일: tax@dailymiracles.co.kr',

    // 추가 메모
    additionalNotes: quoteData.settlement_notes || options.additionalNotes || null
  };

  // HTML 생성
  const template = Handlebars.compile(SETTLEMENT_PDF_TEMPLATE);
  const html = template(templateData);

  // Puppeteer로 PDF 생성
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 폰트 로딩 대기 (한글 깨짐 방지)
    await page.evaluateHandle('document.fonts.ready');

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
 * 정산서 PDF 생성 및 저장 (통합 함수)
 * @param {Object} quoteData - 견적 데이터 (operation_mode가 'commission'인 경우 호출)
 * @param {Object} options - 추가 옵션 (bankName, bankAccountNumber 등)
 * @returns {Promise<Object>} { success, pdfUrl, settlementAmount }
 */
async function generateAndSaveSettlementPdf(quoteData, options = {}) {
  try {
    // operation_mode 확인 (commission 모드 권장)
    if (quoteData.operation_mode && quoteData.operation_mode !== 'commission') {
      console.warn(`[PDF] 정산서는 commission 모드용입니다. 현재: ${quoteData.operation_mode}`);
    }

    const pdfBuffer = await generateSettlementPdf(quoteData, options);

    const pdfUrl = await savePdfToFile(
      pdfBuffer,
      quoteData.quote_id,
      DOCUMENT_TYPES.SETTLEMENT
    );

    // 수수료 계산 (응답에 포함)
    const totalSell = quoteData.total_sell || quoteData.total_amount || 0;
    const commissionRate = quoteData.commission_rate || 10;
    const commissionAmount = quoteData.commission_amount || Math.round(totalSell * commissionRate / 100);

    console.log(`[PDF] 정산서 생성 완료: ${quoteData.quote_id}, 수수료: ${commissionAmount.toLocaleString()}원`);

    return {
      success: true,
      pdfUrl,
      settlementAmount: commissionAmount,
      commissionRate,
      pdfGeneratedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[PDF] 정산서 생성 실패:', error.message);
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
  generateAndSaveEstimatePdf,
  // P2-2: 정산서/수수료-only
  generateSettlementPdf,
  generateAndSaveSettlementPdf,
  maskCustomerName,
  calculateSettlementDueDate
};
