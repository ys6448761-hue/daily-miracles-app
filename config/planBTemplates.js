/**
 * planBTemplates.js
 *
 * Plan B 결제 안내 템플릿
 * - 토스페이먼츠 장애 시 계좌이체 안내
 * - 카카오톡/SMS용 메시지 템플릿
 *
 * @version 1.0 - 2026-01-10
 */

// 환경변수에서 계좌정보 로드
const PLAN_B_CONFIG = {
    bank: process.env.PLAN_B_BANK || '농협',
    account: process.env.PLAN_B_ACCOUNT || '301-0219-5367-61',
    holder: process.env.PLAN_B_ACCOUNT_HOLDER || '여수여행센터'
};

/**
 * 계좌이체 안내 메시지 생성
 *
 * @param {Object} options
 * @param {string} options.customer_name - 고객명
 * @param {number} options.amount - 결제 금액
 * @param {string} options.product_name - 상품명
 * @param {string} options.quote_id - 견적 ID
 * @param {string} options.deadline - 입금 기한 (선택)
 * @returns {string} 메시지
 */
function generateTransferGuide(options) {
    const {
        customer_name = '고객',
        amount,
        product_name = '여수 요트투어',
        quote_id,
        deadline
    } = options;

    const formattedAmount = amount ? amount.toLocaleString() : '0';
    const deadlineText = deadline || '예약일 하루 전';

    return `안녕하세요, ${customer_name}님!

[하루하루의 기적] ${product_name} 예약 안내드립니다.

=== 결제 안내 ===

결제 금액: ${formattedAmount}원
입금 계좌: ${PLAN_B_CONFIG.bank} ${PLAN_B_CONFIG.account}
예금주: ${PLAN_B_CONFIG.holder}
${quote_id ? `예약 번호: ${quote_id}` : ''}

* 입금자명에 [${customer_name}] 기재 부탁드립니다
* 입금 확인 후 예약 확정 문자 발송됩니다
* 입금 기한: ${deadlineText}

문의사항은 카카오톡 @dailymiracles로 연락주세요!

감사합니다.
하루하루의 기적 드림`;
}

/**
 * 짧은 계좌이체 안내 (SMS용)
 */
function generateShortTransferGuide(options) {
    const { customer_name = '고객', amount } = options;
    const formattedAmount = amount ? amount.toLocaleString() : '0';

    return `[하루하루의기적] ${customer_name}님 결제안내
금액: ${formattedAmount}원
${PLAN_B_CONFIG.bank} ${PLAN_B_CONFIG.account}
예금주: ${PLAN_B_CONFIG.holder}
입금자명에 성함 기재 부탁드립니다.`;
}

/**
 * 입금 확인 완료 메시지
 */
function generatePaymentConfirmation(options) {
    const {
        customer_name = '고객',
        amount,
        product_name = '여수 요트투어',
        trip_date
    } = options;

    const formattedAmount = amount ? amount.toLocaleString() : '0';

    return `안녕하세요, ${customer_name}님!

${formattedAmount}원 입금 확인되었습니다.
${product_name} 예약이 확정되었습니다!

${trip_date ? `여행일: ${trip_date}` : ''}

여행 하루 전 상세 안내 문자 발송됩니다.
즐거운 여행 되세요!

하루하루의 기적 드림`;
}

/**
 * 토스페이먼츠 장애 시 자동 전환 안내
 */
function generatePaymentFallbackNotice(options) {
    const { customer_name = '고객', amount, quote_id } = options;
    const formattedAmount = amount ? amount.toLocaleString() : '0';

    return `안녕하세요, ${customer_name}님

현재 카드결제 시스템 점검 중입니다.
계좌이체로 결제 안내드립니다.

=== 입금 안내 ===
금액: ${formattedAmount}원
은행: ${PLAN_B_CONFIG.bank}
계좌: ${PLAN_B_CONFIG.account}
예금주: ${PLAN_B_CONFIG.holder}
${quote_id ? `예약번호: ${quote_id}` : ''}

입금 확인 후 예약 확정됩니다.
불편을 드려 죄송합니다.

하루하루의 기적 드림`;
}

/**
 * 카카오 알림톡용 버튼 데이터
 */
function getKakaoButtons() {
    return [
        {
            type: 'WL',
            name: '카카오톡 문의',
            linkMobile: 'https://pf.kakao.com/_xfxhcWn/chat',
            linkPc: 'https://pf.kakao.com/_xfxhcWn/chat'
        }
    ];
}

/**
 * 계좌 정보만 반환
 */
function getAccountInfo() {
    return {
        bank: PLAN_B_CONFIG.bank,
        account: PLAN_B_CONFIG.account,
        holder: PLAN_B_CONFIG.holder,
        formatted: `${PLAN_B_CONFIG.bank} ${PLAN_B_CONFIG.account} (${PLAN_B_CONFIG.holder})`
    };
}

module.exports = {
    generateTransferGuide,
    generateShortTransferGuide,
    generatePaymentConfirmation,
    generatePaymentFallbackNotice,
    getKakaoButtons,
    getAccountInfo,
    PLAN_B_CONFIG
};
