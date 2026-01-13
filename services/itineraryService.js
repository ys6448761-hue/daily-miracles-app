/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Itinerary Service - 4인 이하 자동 일정 생성 + PDF
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 루미 분석 기반 P0 구현:
 *   - 결제 완료 → 옵션 선택 → 즉시 일정 자동 생성 + PDF 제공
 *   - 4인 이하: 상담 없음, 자동 생성
 *   - 5인 이상: 단체 상담 플로우
 *
 * 작성일: 2026-01-13
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { OpenAI } = require('openai');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// OpenAI 클라이언트
let openai = null;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (err) {
  console.warn('[Itinerary] OpenAI 초기화 실패:', err.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════════════════════

// 여행 성향
const TRAVEL_STYLES = {
  healing: { label: '힐링', emoji: '🧘', description: '자연, 휴식, 여유로운 일정' },
  foodie: { label: '맛집', emoji: '🍽️', description: '지역 맛집, 음식 탐방' },
  activity: { label: '액티비티', emoji: '🎯', description: '체험, 레저, 활동적인 일정' },
  photo: { label: '사진', emoji: '📸', description: '포토스팟, 인스타그래머블' },
  budget: { label: '가성비', emoji: '💰', description: '알뜰하게, 실속 있는 일정' }
};

// 이동수단
const TRANSPORT_MODES = {
  car: { label: '자가용', icon: '🚗' },
  public: { label: '대중교통', icon: '🚌' },
  rental: { label: '렌터카', icon: '🚙' }
};

// 숙박 유형
const STAY_TYPES = {
  day: { label: '당일', nights: 0 },
  '1n2d': { label: '1박 2일', nights: 1 },
  '2n3d': { label: '2박 3일', nights: 2 },
  '3n4d': { label: '3박 4일', nights: 3 }
};

// 템포
const TEMPO_LEVELS = {
  relaxed: { label: '여유', description: '느긋하게, 쉬엄쉬엄' },
  normal: { label: '보통', description: '적당한 페이스' },
  packed: { label: '빡빡', description: '많이 보기, 알차게' }
};

// 여수 관광지 데이터
const YEOSU_SPOTS = {
  must_visit: [
    { name: '오동도', type: 'nature', time: '1.5h', description: '동백꽃과 해안 산책로' },
    { name: '여수 해상케이블카', type: 'activity', time: '1h', description: '바다 위 파노라마 뷰' },
    { name: '향일암', type: 'temple', time: '1.5h', description: '일출 명소, 해안 절벽 사찰' },
    { name: '돌산공원', type: 'viewpoint', time: '1h', description: '돌산대교와 야경 명소' },
    { name: '여수 밤바다', type: 'night', time: '1.5h', description: '낭만포차, 해양공원' }
  ],
  restaurants: [
    { name: '갓김밥', type: 'local', cuisine: '김밥', price: '₩', famous: '갓김밥' },
    { name: '서대회타운', type: 'seafood', cuisine: '회', price: '₩₩₩', famous: '서대회' },
    { name: '이순신광장 포장마차', type: 'street', cuisine: '해산물', price: '₩₩', famous: '조개구이' },
    { name: '중앙시장', type: 'market', cuisine: '다양', price: '₩', famous: '시장음식' }
  ],
  activities: [
    { name: '해양레일바이크', type: 'activity', duration: '40min' },
    { name: '아쿠아플라넷', type: 'aquarium', duration: '2h' },
    { name: '예술랜드', type: 'theme', duration: '2h' },
    { name: '해양수산과학관', type: 'museum', duration: '1.5h' }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// Handlebars 헬퍼 등록
// ═══════════════════════════════════════════════════════════════════════════

Handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '-';
  const d = new Date(date);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('stylePercent', function(value) {
  return Math.round(value || 0);
});

// ═══════════════════════════════════════════════════════════════════════════
// 일정 생성 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AI를 사용하여 여행 일정 생성
 * @param {Object} options - 사용자 입력 옵션
 * @returns {Promise<Object>} 생성된 일정
 */
async function generateItinerary(options) {
  const {
    // 필수 입력
    startDate,
    endDate,
    pax = 2,
    partyType = 'adults', // adults, family, couple, friends
    transport = 'car',
    stayType = 'day',

    // 취향 입력 (합계 100%)
    stylePreferences = { healing: 20, foodie: 30, activity: 20, photo: 20, budget: 10 },

    // 선택 입력
    mustVisit = [],        // 꼭 가고 싶은 곳 (최대 3개)
    avoid = [],            // 피하고 싶은 것
    tempo = 'normal',      // relaxed, normal, packed

    // 메타
    region = 'yeosu',
    quoteId = null
  } = options;

  // 일정 ID 생성
  const itineraryId = `ITN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().slice(0, 4).toUpperCase()}`;

  // 일수 계산
  const nights = STAY_TYPES[stayType]?.nights || 0;
  const days = nights + 1;

  // AI 프롬프트 생성
  const prompt = buildItineraryPrompt({
    region,
    days,
    nights,
    pax,
    partyType,
    transport,
    stylePreferences,
    mustVisit,
    avoid,
    tempo,
    startDate
  });

  let aiResponse;
  try {
    if (!openai) {
      throw new Error('OpenAI 서비스 불가');
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `당신은 여수 지역 전문 여행 플래너입니다.
JSON 형식으로만 응답하세요. 한국어로 작성하세요.
일정은 시간대별로 구성하고, 이동 시간과 팁을 포함하세요.`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    aiResponse = JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.warn('[Itinerary] AI 생성 실패, 기본 템플릿 사용:', error.message);
    aiResponse = generateDefaultItinerary({ region, days, stylePreferences, mustVisit, tempo });
  }

  // 일정 객체 구성
  const itinerary = {
    id: itineraryId,
    quote_id: quoteId,
    region,
    created_at: new Date().toISOString(),

    // 기본 정보
    trip_info: {
      start_date: startDate,
      end_date: endDate,
      nights,
      days,
      pax,
      party_type: partyType,
      transport,
      tempo
    },

    // 취향 설정
    style_preferences: stylePreferences,
    must_visit: mustVisit,
    avoid: avoid,

    // AI 생성 일정
    daily_plans: aiResponse.daily_plans || aiResponse.days || [],

    // 추천 정보
    recommendations: {
      restaurants: aiResponse.restaurants || [],
      tips: aiResponse.tips || [],
      packing_list: aiResponse.packing_list || getDefaultPackingList(stayType, stylePreferences),
      rainy_alternatives: aiResponse.rainy_alternatives || getDefaultRainyAlternatives()
    },

    // 메타
    status: 'generated',
    version: 1
  };

  return itinerary;
}

/**
 * AI 프롬프트 생성
 */
function buildItineraryPrompt(options) {
  const { region, days, nights, pax, partyType, transport, stylePreferences, mustVisit, avoid, tempo, startDate } = options;

  // 스타일 우선순위 정렬
  const sortedStyles = Object.entries(stylePreferences)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${TRAVEL_STYLES[key]?.label || key}(${value}%)`)
    .join(', ');

  const avoidText = avoid.length > 0 ? avoid.join(', ') : '없음';
  const mustVisitText = mustVisit.length > 0 ? mustVisit.join(', ') : '자유';

  return `
여수 ${days}일(${nights > 0 ? nights + '박' : '당일'}) 여행 일정을 만들어주세요.

**기본 정보**
- 인원: ${pax}명 (${partyType === 'family' ? '가족' : partyType === 'couple' ? '커플' : partyType === 'friends' ? '친구' : '성인'})
- 이동수단: ${TRANSPORT_MODES[transport]?.label || transport}
- 템포: ${TEMPO_LEVELS[tempo]?.label || tempo} (${TEMPO_LEVELS[tempo]?.description || ''})
- 출발일: ${startDate || '미정'}

**여행 성향 (중요도)**
${sortedStyles}

**꼭 가고 싶은 곳**: ${mustVisitText}
**피하고 싶은 것**: ${avoidText}

**응답 형식 (JSON)**
{
  "daily_plans": [
    {
      "day": 1,
      "date": "날짜",
      "title": "테마 제목",
      "schedule": [
        {
          "time": "09:00",
          "slot": "morning",
          "place": "장소명",
          "activity": "활동 설명",
          "duration": "1h",
          "tips": "팁",
          "travel_to_next": "다음 장소까지 이동시간"
        }
      ]
    }
  ],
  "restaurants": [
    { "name": "이름", "type": "유형", "menu": "추천메뉴", "price_range": "₩~₩₩₩" }
  ],
  "tips": ["팁1", "팁2"],
  "packing_list": ["준비물1", "준비물2"],
  "rainy_alternatives": ["우천시 대안1", "우천시 대안2"]
}`;
}

/**
 * 기본 일정 템플릿 (AI 실패 시)
 */
function generateDefaultItinerary(options) {
  const { days, stylePreferences, mustVisit, tempo } = options;

  // 일차별 장소 데이터
  const daySchedules = [
    // Day 1
    {
      title: '여수의 낭만 시작',
      morning: { place: '오동도', activity: '동백꽃 산책로 & 해안 절경 감상', tips: '편한 신발 추천, 동백열차 이용 가능' },
      lunch: { place: '중앙시장', activity: '갓김밥 + 시장 먹거리 탐방', tips: '갓김밥, 꿀빵 필수!' },
      afternoon: { place: '여수 해상케이블카', activity: '돌산↔자산 바다 위 케이블카', tips: '크리스탈캐빈 예약 추천' },
      evening: { place: '이순신광장 낭만포차', activity: '해산물 + 여수밤바다 야경', tips: '조개구이, 굴전 추천' }
    },
    // Day 2
    {
      title: '여수 동쪽 탐험',
      morning: { place: '향일암', activity: '해돋이 명소, 해안 절벽 사찰', tips: '새벽 일출 시 04:30 출발' },
      lunch: { place: '돌산 갯장어거리', activity: '갯장어 샤브샤브 점심', tips: '갯장어 코스 2인 6만원대' },
      afternoon: { place: '금오도 비렁길', activity: '해안 트레킹 (1코스 추천)', tips: '여객선 시간 미리 확인' },
      evening: { place: '돌산공원', activity: '돌산대교 야경 + 카페', tips: '일몰 30분 전 도착 추천' }
    },
    // Day 3
    {
      title: '문화와 미식의 날',
      morning: { place: '진남관', activity: '국보 제304호 조선 수군 본영', tips: '무료 입장, 해설 프로그램 있음' },
      lunch: { place: '서대회타운', activity: '서대회 정식 + 물회', tips: '점심 특선 저렴' },
      afternoon: { place: '아쿠아플라넷 여수', activity: '벨루가, 해양생물 관람', tips: '공연시간 미리 체크' },
      evening: { place: '엑스포 해양공원', activity: '빅오쇼 + 스카이타워', tips: '빅오쇼 19:00/21:00' }
    },
    // Day 4
    {
      title: '숨은 보석 발견',
      morning: { place: '거문도/백도', activity: '비경의 섬 투어 (당일 왕복)', tips: '뱃멀미약 챙기기' },
      lunch: { place: '거문도 해녀촌', activity: '신선한 해산물 점심', tips: '현지에서만 맛볼 수 있는 메뉴' },
      afternoon: { place: '해양레일바이크', activity: '바다 위 레일바이크', tips: '온라인 사전 예약 필수' },
      evening: { place: '웅천친수공원', activity: '한적한 일몰 + 포토존', tips: '로컬 숨은 명소' }
    }
  ];

  const dailyPlans = [];

  for (let day = 1; day <= days; day++) {
    const dayData = daySchedules[(day - 1) % daySchedules.length];
    const schedule = [];

    // 오전
    schedule.push({
      time: '09:00',
      slot: 'morning',
      place: dayData.morning.place,
      activity: dayData.morning.activity,
      duration: '2h',
      tips: dayData.morning.tips,
      travel_to_next: '25분'
    });

    // 점심
    schedule.push({
      time: '12:00',
      slot: 'lunch',
      place: dayData.lunch.place,
      activity: dayData.lunch.activity,
      duration: '1.5h',
      tips: dayData.lunch.tips,
      travel_to_next: '20분'
    });

    // 오후
    schedule.push({
      time: '14:30',
      slot: 'afternoon',
      place: dayData.afternoon.place,
      activity: dayData.afternoon.activity,
      duration: '2h',
      tips: dayData.afternoon.tips,
      travel_to_next: '15분'
    });

    // 저녁
    schedule.push({
      time: '18:00',
      slot: 'evening',
      place: dayData.evening.place,
      activity: dayData.evening.activity,
      duration: '2.5h',
      tips: dayData.evening.tips,
      travel_to_next: '-'
    });

    dailyPlans.push({
      day,
      date: null,
      title: dayData.title,
      schedule
    });
  }

  return {
    daily_plans: dailyPlans,
    restaurants: [
      { name: '갓김밥', type: '김밥', menu: '갓김밥', price_range: '₩' },
      { name: '서대회타운', type: '회', menu: '서대회 정식', price_range: '₩₩₩' },
      { name: '낭만포차', type: '해산물', menu: '조개구이', price_range: '₩₩' },
      { name: '돌산 갯장어', type: '샤브샤브', menu: '갯장어 코스', price_range: '₩₩₩' },
      { name: '중앙시장 꿀빵', type: '간식', menu: '크림치즈 꿀빵', price_range: '₩' }
    ],
    tips: [
      '여수는 해산물이 유명해요. 서대회, 갯장어 꼭 드셔보세요!',
      '해상케이블카는 석양 시간대가 가장 예뻐요.',
      '돌산공원 야경은 밤 8시 이후가 절정!',
      '향일암 일출은 새벽 일찍 출발해야 해요.',
      '금오도 비렁길은 트레킹화 필수!'
    ],
    packing_list: getDefaultPackingList('day', stylePreferences),
    rainy_alternatives: getDefaultRainyAlternatives()
  };
}

/**
 * 기본 준비물 목록
 */
function getDefaultPackingList(stayType, stylePreferences) {
  const basics = ['신분증', '휴대폰 충전기', '편한 신발'];
  const extras = [];

  if (stylePreferences?.photo > 20) {
    extras.push('카메라/삼각대');
  }
  if (stylePreferences?.activity > 20) {
    extras.push('운동화', '여벌 옷');
  }
  if (stayType !== 'day') {
    extras.push('세면도구', '갈아입을 옷');
  }

  return [...basics, ...extras];
}

/**
 * 기본 우천 대안
 */
function getDefaultRainyAlternatives() {
  return [
    '아쿠아플라넷 여수 (실내 수족관)',
    '여수세계박람회장 실내 전시관',
    '카페 투어 (바다 뷰 카페들)',
    '중앙시장 맛집 탐방'
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF 생성
// ═══════════════════════════════════════════════════════════════════════════

const ITINERARY_PDF_TEMPLATE = `
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
      font-size: 10pt;
      line-height: 1.5;
      color: #333;
    }
    .page {
      page-break-after: always;
      padding: 5mm;
    }
    .page:last-child {
      page-break-after: avoid;
    }

    /* 헤더 */
    .header {
      text-align: center;
      border-bottom: 3px solid #0ea5e9;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 24pt;
      font-weight: bold;
      color: #0ea5e9;
      margin-bottom: 5px;
    }
    .header-subtitle {
      font-size: 12pt;
      color: #666;
    }
    .header-id {
      font-size: 9pt;
      color: #999;
      margin-top: 5px;
    }

    /* 여행 정보 카드 */
    .trip-info-card {
      background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
      color: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .trip-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .trip-info-item {
      text-align: center;
    }
    .trip-info-label {
      font-size: 9pt;
      opacity: 0.9;
    }
    .trip-info-value {
      font-size: 14pt;
      font-weight: bold;
    }

    /* 취향 바 */
    .style-section {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .style-title {
      font-size: 11pt;
      font-weight: bold;
      color: #334155;
      margin-bottom: 10px;
    }
    .style-bars {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .style-bar {
      flex: 1;
      min-width: 80px;
    }
    .style-bar-label {
      font-size: 9pt;
      color: #64748b;
      margin-bottom: 3px;
    }
    .style-bar-track {
      height: 8px;
      background-color: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .style-bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    .style-healing { background-color: #22c55e; }
    .style-foodie { background-color: #f59e0b; }
    .style-activity { background-color: #ef4444; }
    .style-photo { background-color: #8b5cf6; }
    .style-budget { background-color: #06b6d4; }

    /* 일정 카드 */
    .day-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 15px;
      overflow: hidden;
    }
    .day-header {
      background-color: #0ea5e9;
      color: white;
      padding: 12px 15px;
    }
    .day-number {
      font-size: 14pt;
      font-weight: bold;
    }
    .day-title {
      font-size: 10pt;
      opacity: 0.9;
    }
    .day-schedule {
      padding: 15px;
    }

    /* 타임라인 */
    .timeline-item {
      display: flex;
      margin-bottom: 15px;
      position: relative;
    }
    .timeline-item:last-child {
      margin-bottom: 0;
    }
    .timeline-time {
      width: 60px;
      font-size: 11pt;
      font-weight: bold;
      color: #0ea5e9;
    }
    .timeline-content {
      flex: 1;
      padding-left: 15px;
      border-left: 2px solid #e2e8f0;
    }
    .timeline-place {
      font-size: 11pt;
      font-weight: bold;
      color: #1e293b;
    }
    .timeline-activity {
      font-size: 10pt;
      color: #64748b;
      margin: 3px 0;
    }
    .timeline-meta {
      display: flex;
      gap: 15px;
      font-size: 9pt;
      color: #94a3b8;
    }
    .timeline-tips {
      background-color: #fef3c7;
      border-radius: 4px;
      padding: 5px 8px;
      font-size: 9pt;
      color: #92400e;
      margin-top: 5px;
    }

    /* 추천 섹션 */
    .recommendation-section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1e293b;
      border-bottom: 2px solid #0ea5e9;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .restaurant-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .restaurant-card {
      background-color: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 8px;
      padding: 10px;
    }
    .restaurant-name {
      font-weight: bold;
      color: #c2410c;
    }
    .restaurant-meta {
      font-size: 9pt;
      color: #78350f;
    }

    /* 체크리스트 */
    .checklist {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px;
    }
    .checklist-item {
      display: flex;
      align-items: center;
      font-size: 10pt;
    }
    .checklist-box {
      width: 14px;
      height: 14px;
      border: 1px solid #94a3b8;
      border-radius: 3px;
      margin-right: 8px;
    }

    /* 팁 박스 */
    .tips-box {
      background-color: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 15px;
    }
    .tips-list {
      list-style: none;
    }
    .tips-list li {
      padding: 5px 0;
      padding-left: 20px;
      position: relative;
    }
    .tips-list li::before {
      content: '💡';
      position: absolute;
      left: 0;
    }

    /* 우천 대안 */
    .rainy-box {
      background-color: #eff6ff;
      border: 1px solid #93c5fd;
      border-radius: 8px;
      padding: 15px;
    }
    .rainy-title {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 8px;
    }

    /* 푸터 */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 9pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <!-- 1페이지: 요약 -->
  <div class="page">
    <div class="header">
      <div class="header-title">🌊 나만의 여수 여행</div>
      <div class="header-subtitle">{{trip_info.days}}일 완벽 일정표</div>
      <div class="header-id">{{id}}</div>
    </div>

    <!-- 여행 정보 -->
    <div class="trip-info-card">
      <div class="trip-info-grid">
        <div class="trip-info-item">
          <div class="trip-info-label">여행 기간</div>
          <div class="trip-info-value">{{#if trip_info.nights}}{{trip_info.nights}}박 {{/if}}{{trip_info.days}}일</div>
        </div>
        <div class="trip-info-item">
          <div class="trip-info-label">인원</div>
          <div class="trip-info-value">{{trip_info.pax}}명</div>
        </div>
        <div class="trip-info-item">
          <div class="trip-info-label">이동수단</div>
          <div class="trip-info-value">{{transportLabel trip_info.transport}}</div>
        </div>
      </div>
    </div>

    <!-- 취향 설정 -->
    <div class="style-section">
      <div class="style-title">🎯 나의 여행 스타일</div>
      <div class="style-bars">
        <div class="style-bar">
          <div class="style-bar-label">🧘 힐링 {{stylePercent style_preferences.healing}}%</div>
          <div class="style-bar-track">
            <div class="style-bar-fill style-healing" style="width: {{stylePercent style_preferences.healing}}%"></div>
          </div>
        </div>
        <div class="style-bar">
          <div class="style-bar-label">🍽️ 맛집 {{stylePercent style_preferences.foodie}}%</div>
          <div class="style-bar-track">
            <div class="style-bar-fill style-foodie" style="width: {{stylePercent style_preferences.foodie}}%"></div>
          </div>
        </div>
        <div class="style-bar">
          <div class="style-bar-label">🎯 액티비티 {{stylePercent style_preferences.activity}}%</div>
          <div class="style-bar-track">
            <div class="style-bar-fill style-activity" style="width: {{stylePercent style_preferences.activity}}%"></div>
          </div>
        </div>
        <div class="style-bar">
          <div class="style-bar-label">📸 사진 {{stylePercent style_preferences.photo}}%</div>
          <div class="style-bar-track">
            <div class="style-bar-fill style-photo" style="width: {{stylePercent style_preferences.photo}}%"></div>
          </div>
        </div>
        <div class="style-bar">
          <div class="style-bar-label">💰 가성비 {{stylePercent style_preferences.budget}}%</div>
          <div class="style-bar-track">
            <div class="style-bar-fill style-budget" style="width: {{stylePercent style_preferences.budget}}%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 일정 요약 -->
    {{#each daily_plans}}
    <div class="day-card">
      <div class="day-header">
        <div class="day-number">Day {{day}}</div>
        <div class="day-title">{{title}}</div>
      </div>
      <div class="day-schedule">
        {{#each schedule}}
        <div class="timeline-item">
          <div class="timeline-time">{{time}}</div>
          <div class="timeline-content">
            <div class="timeline-place">{{place}}</div>
            <div class="timeline-activity">{{activity}}</div>
            <div class="timeline-meta">
              <span>⏱ {{duration}}</span>
              {{#if travel_to_next}}<span>🚗 다음까지 {{travel_to_next}}</span>{{/if}}
            </div>
            {{#if tips}}
            <div class="timeline-tips">💡 {{tips}}</div>
            {{/if}}
          </div>
        </div>
        {{/each}}
      </div>
    </div>
    {{/each}}

    <div class="footer">
      하루하루의 기적 | Daily Miracles<br>
      이 일정표는 AI가 생성했습니다. 현지 상황에 따라 조정하세요.
    </div>
  </div>

  <!-- 2페이지: 추천 & 체크리스트 -->
  <div class="page">
    <div class="header">
      <div class="header-title">📋 여행 준비 가이드</div>
    </div>

    <!-- 맛집 추천 -->
    <div class="recommendation-section">
      <div class="section-title">🍽️ 추천 맛집</div>
      <div class="restaurant-grid">
        {{#each recommendations.restaurants}}
        <div class="restaurant-card">
          <div class="restaurant-name">{{name}}</div>
          <div class="restaurant-meta">{{type}} | {{menu}} | {{price_range}}</div>
        </div>
        {{/each}}
      </div>
    </div>

    <!-- 준비물 체크리스트 -->
    <div class="recommendation-section">
      <div class="section-title">✅ 준비물 체크리스트</div>
      <div class="checklist">
        {{#each recommendations.packing_list}}
        <div class="checklist-item">
          <div class="checklist-box"></div>
          {{this}}
        </div>
        {{/each}}
      </div>
    </div>

    <!-- 여행 팁 -->
    <div class="recommendation-section">
      <div class="section-title">💡 여행 팁</div>
      <div class="tips-box">
        <ul class="tips-list">
          {{#each recommendations.tips}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
      </div>
    </div>

    <!-- 우천 대안 -->
    <div class="recommendation-section">
      <div class="section-title">☔ 비 오는 날 대안</div>
      <div class="rainy-box">
        <ul class="tips-list">
          {{#each recommendations.rainy_alternatives}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
      </div>
    </div>

    <div class="footer">
      하루하루의 기적 | Daily Miracles<br>
      문의: @dailymiracles (카카오톡)
    </div>
  </div>
</body>
</html>
`;

// 이동수단 레이블 헬퍼
Handlebars.registerHelper('transportLabel', function(transport) {
  return TRANSPORT_MODES[transport]?.label || transport;
});

/**
 * 일정 PDF 생성
 * @param {Object} itinerary - 생성된 일정 객체
 * @returns {Promise<Buffer>} PDF 버퍼
 */
async function generateItineraryPdf(itinerary) {
  const template = Handlebars.compile(ITINERARY_PDF_TEMPLATE);
  const html = template(itinerary);

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
 * @param {string} itineraryId - 일정 ID
 * @returns {Promise<string>} 저장된 파일 경로
 */
async function savePdfToFile(pdfBuffer, itineraryId) {
  const pdfDir = path.join(__dirname, '..', 'public', 'pdfs', 'itinerary');

  try {
    await fs.mkdir(pdfDir, { recursive: true });
  } catch (err) {
    // 이미 존재하면 무시
  }

  const filename = `${itineraryId}_${Date.now()}.pdf`;
  const filepath = path.join(pdfDir, filename);

  await fs.writeFile(filepath, pdfBuffer);

  return `/pdfs/itinerary/${filename}`;
}

/**
 * 일정 생성 + PDF 저장 통합 함수
 * @param {Object} options - 사용자 입력 옵션
 * @returns {Promise<Object>} { success, itinerary, pdfUrl }
 */
async function generateAndSaveItinerary(options) {
  try {
    console.log('[Itinerary] 일정 생성 시작:', options.quoteId || 'no-quote');

    // 일정 생성
    const itinerary = await generateItinerary(options);

    // PDF 생성
    const pdfBuffer = await generateItineraryPdf(itinerary);
    const pdfUrl = await savePdfToFile(pdfBuffer, itinerary.id);

    itinerary.pdf_url = pdfUrl;
    itinerary.pdf_generated_at = new Date().toISOString();

    console.log(`[Itinerary] 생성 완료: ${itinerary.id}, PDF: ${pdfUrl}`);

    return {
      success: true,
      itinerary,
      pdfUrl
    };
  } catch (error) {
    console.error('[Itinerary] 생성 실패:', error.message);
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
  // 상수
  TRAVEL_STYLES,
  TRANSPORT_MODES,
  STAY_TYPES,
  TEMPO_LEVELS,
  YEOSU_SPOTS,

  // 함수
  generateItinerary,
  generateItineraryPdf,
  savePdfToFile,
  generateAndSaveItinerary
};
