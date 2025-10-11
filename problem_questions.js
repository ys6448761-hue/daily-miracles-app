// 하루하루의 기적 - 문제해결 5단계 질문 시스템
// Version 1.0 - 2025.10.11

const problemQuestions = {
  
  // 1. 직장/업무 관계
  "직장": {
    category: "직장/업무",
    level1: {
      question: "직장에서 어떤 문제가 생겼나요?",
      placeholder: "예: 상사가 나를 무시해요, 동료와 갈등이 있어요"
    },
    level2: {
      question: "구체적으로 어떤 상황인가요?",
      placeholder: "언제, 어디서, 어떻게 일어났는지 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 상사/팀장이 나를 무시하거나 의견을 무시함",
        "B. 동료와 의견 충돌이나 소통 문제가 계속됨",
        "C. 업무 과부하나 번아웃으로 힘듦",
        "D. 평가/승진/처우가 불공정하다고 느낌"
      ]
    },
    level4: {
      question: "그때 당신은 어떻게 반응했나요?",
      placeholder: "당신의 행동이나 말, 감정 반응을 말씀해주세요"
    },
    level5: {
      question: "이 문제가 해결되면 무엇이 달라지나요?",
      placeholder: "해결 후 원하는 상황이나 목표를 말씀해주세요"
    }
  },

  // 2. 대인 관계
  "관계": {
    category: "대인관계",
    level1: {
      question: "어떤 관계에서 문제가 생겼나요?",
      placeholder: "예: 친구, 지인, 이웃 등"
    },
    level2: {
      question: "구체적으로 어떤 일이 있었나요?",
      placeholder: "상황을 자세히 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 상대방이 나를 무시하거나 피하는 것 같음",
        "B. 의견이나 가치관 차이로 자주 충돌함",
        "C. 소통이 단절되고 관계가 멀어짐",
        "D. 배신감이나 신뢰 문제가 생김"
      ]
    },
    level4: {
      question: "지금까지 어떻게 대응하셨나요?",
      placeholder: "당신이 시도했던 방법들을 말씀해주세요"
    },
    level5: {
      question: "이 관계가 회복되면 어떤 모습이길 바라나요?",
      placeholder: "원하는 관계의 모습을 말씀해주세요"
    }
  },

  // 3. 가족 문제
  "가족": {
    category: "가족",
    level1: {
      question: "가족 중 누구와의 문제인가요?",
      placeholder: "예: 부모님, 배우자, 형제자매, 자녀 등"
    },
    level2: {
      question: "어떤 상황에서 문제가 생기나요?",
      placeholder: "구체적인 상황을 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 서로의 생각이나 선택을 존중하지 않음",
        "B. 감정적 대립이나 말다툼이 잦음",
        "C. 무관심하거나 소통이 끊김",
        "D. 과거의 상처나 오해가 계속 영향을 줌"
      ]
    },
    level4: {
      question: "이 문제가 얼마나 오래 지속됐나요?",
      placeholder: "기간과 빈도를 말씀해주세요"
    },
    level5: {
      question: "가족 관계가 회복되면 무엇을 하고 싶으신가요?",
      placeholder: "해결 후 기대하는 모습을 말씀해주세요"
    }
  },

  // 4. 연애/부부
  "연애": {
    category: "연애/부부",
    level1: {
      question: "연애나 부부 관계에서 어떤 문제인가요?",
      placeholder: "예: 소통 문제, 신뢰 문제, 갈등 등"
    },
    level2: {
      question: "구체적으로 어떤 상황인가요?",
      placeholder: "언제부터, 어떤 일로 시작됐는지 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 소통이 안 되고 서로를 이해 못함",
        "B. 신뢰가 깨지거나 의심이 생김",
        "C. 애정이 식거나 무관심해짐",
        "D. 가치관이나 미래 계획의 차이"
      ]
    },
    level4: {
      question: "이 문제에 대해 상대방과 대화해본 적 있나요?",
      placeholder: "대화 여부와 그때의 반응을 말씀해주세요"
    },
    level5: {
      question: "이 관계에서 진짜로 원하는 건 무엇인가요?",
      placeholder: "관계 회복? 변화? 결정? 솔직히 말씀해주세요"
    }
  },

  // 5. 진로/커리어
  "진로": {
    category: "진로/커리어",
    level1: {
      question: "진로나 커리어에서 어떤 고민이 있나요?",
      placeholder: "예: 이직, 전직, 창업, 방향성 등"
    },
    level2: {
      question: "지금 어떤 상황에 있나요?",
      placeholder: "현재 직업, 경력, 고민의 배경을 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 현재 일에 불만족하지만 무엇을 해야 할지 모름",
        "B. 하고 싶은 일은 있지만 현실적 제약이 많음",
        "C. 여러 선택지 중 결정을 못하겠음",
        "D. 시작했지만 성과가 안 나와 불안함"
      ]
    },
    level4: {
      question: "지금까지 어떤 시도를 해보셨나요?",
      placeholder: "시도한 것과 결과를 말씀해주세요"
    },
    level5: {
      question: "3년 후 어떤 모습이고 싶으신가요?",
      placeholder: "구체적인 목표나 이상적 모습을 말씀해주세요"
    }
  },

  // 6. 건강/심리
  "건강": {
    category: "건강/심리",
    level1: {
      question: "어떤 건강이나 심리적 문제인가요?",
      placeholder: "예: 불안, 우울, 스트레스, 수면, 신체 증상 등"
    },
    level2: {
      question: "언제부터 이런 증상이 나타났나요?",
      placeholder: "시작 시기와 심해지는 상황을 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 불안하거나 초조하고 걱정이 많음",
        "B. 우울하거나 무기력하고 의욕이 없음",
        "C. 만성 피로나 신체 증상이 계속됨",
        "D. 수면 장애나 식욕 변화가 심함"
      ]
    },
    level4: {
      question: "일상생활에 어떤 영향을 주나요?",
      placeholder: "일, 관계, 활동에 미치는 영향을 말씀해주세요"
    },
    level5: {
      question: "전문가 상담이나 치료를 받아보신 적 있나요?",
      placeholder: "있다면 언제, 어떤 도움을 받으셨는지 말씀해주세요"
    }
  },

  // 7. 재정/경제
  "재정": {
    category: "재정/경제",
    level1: {
      question: "재정이나 경제적으로 어떤 문제가 있나요?",
      placeholder: "예: 빚, 지출 관리, 수입 부족 등"
    },
    level2: {
      question: "구체적으로 어떤 상황인가요?",
      placeholder: "금액이나 상황을 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 빚이나 대출 상환이 부담스러움",
        "B. 수입은 있지만 지출 관리가 안 됨",
        "C. 수입 자체가 부족하거나 불안정함",
        "D. 미래를 위한 저축이나 투자를 못하고 있음"
      ]
    },
    level4: {
      question: "지금까지 어떤 방법을 시도해보셨나요?",
      placeholder: "시도한 해결책과 결과를 말씀해주세요"
    },
    level5: {
      question: "재정 문제가 해결되면 무엇을 하고 싶으신가요?",
      placeholder: "해결 후 목표를 말씀해주세요"
    }
  },

  // 8. 학업/성적
  "학업": {
    category: "학업/성적",
    level1: {
      question: "학업에서 어떤 문제가 있나요?",
      placeholder: "예: 성적, 집중력, 학습 방법, 동기 부족 등"
    },
    level2: {
      question: "구체적으로 어떤 상황인가요?",
      placeholder: "과목, 시험, 공부 시간 등을 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 공부 방법을 모르겠거나 효율이 안 남",
        "B. 집중력이나 동기부여가 안 됨",
        "C. 노력하는데 성적이 안 오름",
        "D. 특정 과목이나 분야만 계속 어려움"
      ]
    },
    level4: {
      question: "하루에 몇 시간 정도 공부하시나요?",
      placeholder: "실제 집중하는 시간을 말씀해주세요"
    },
    level5: {
      question: "학업 목표나 진학 계획은 무엇인가요?",
      placeholder: "구체적인 목표를 말씀해주세요"
    }
  },

  // 9. 자존감/정체성
  "자존감": {
    category: "자존감/정체성",
    level1: {
      question: "자존감이나 정체성에 대해 어떤 고민이 있나요?",
      placeholder: "예: 자신감 부족, 열등감, 나다움 등"
    },
    level2: {
      question: "언제 가장 그런 감정이 드나요?",
      placeholder: "구체적인 상황을 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 다른 사람과 비교하며 열등감을 느낌",
        "B. 내가 누군지, 무엇을 원하는지 모르겠음",
        "C. 실패나 거절이 두려워 시도를 못함",
        "D. 나를 사랑하거나 인정하기 어려움"
      ]
    },
    level4: {
      question: "과거에 자존감에 영향을 준 사건이 있나요?",
      placeholder: "있다면 간단히 말씀해주세요"
    },
    level5: {
      question: "어떤 모습의 자신이 되고 싶으신가요?",
      placeholder: "이상적인 자신의 모습을 말씀해주세요"
    }
  },

  // 10. 습관/중독
  "습관": {
    category: "습관/중독",
    level1: {
      question: "어떤 습관이나 중독 문제가 있나요?",
      placeholder: "예: 게임, 스마트폰, 음주, 흡연, 쇼핑 등"
    },
    level2: {
      question: "하루에 얼마나 자주 하시나요?",
      placeholder: "빈도와 시간을 말씀해주세요"
    },
    level3: {
      question: "이 중 어느 쪽에 가까운가요?",
      options: [
        "A. 끊고 싶지만 의지가 약해서 못 끊음",
        "B. 스트레스나 감정 때문에 계속 함",
        "C. 일상생활에 지장이 있는데도 못 멈춤",
        "D. 끊으려 하면 금단 증상이나 불안이 심함"
      ]
    },
    level4: {
      question: "끊으려고 시도해본 적 있나요?",
      placeholder: "시도한 방법과 결과를 말씀해주세요"
    },
    level5: {
      question: "이 습관이 없어지면 무엇을 하고 싶으신가요?",
      placeholder: "해결 후 목표를 말씀해주세요"
    }
  }

};

// 카테고리 자동 감지 함수
function detectCategory(userInput) {
  const keywords = {
    "직장": ["직장", "회사", "상사", "동료", "팀장", "업무", "야근", "퇴사", "이직"],
    "관계": ["친구", "사람", "관계", "지인", "모임", "소통"],
    "가족": ["부모", "엄마", "아빠", "남편", "아내", "자녀", "가족", "형제", "자매"],
    "연애": ["남자친구", "여자친구", "연애", "사랑", "이별", "배우자", "결혼"],
    "진로": ["진로", "커리어", "이직", "전직", "창업", "취업", "면접"],
    "건강": ["우울", "불안", "스트레스", "피로", "아프", "잠", "건강", "통증"],
    "재정": ["돈", "빚", "대출", "저축", "월급", "재정", "카드", "지출"],
    "학업": ["공부", "성적", "시험", "학교", "학원", "수험", "입시"],
    "자존감": ["자신감", "열등감", "자존감", "정체성", "나다움"],
    "습관": ["게임", "술", "담배", "중독", "습관", "폰", "쇼핑"]
  };
  
  for (let category in keywords) {
    for (let keyword of keywords[category]) {
      if (userInput.includes(keyword)) {
        return category;
      }
    }
  }
  
  return "관계"; // 기본값
}

// 사용 예시
// const category = detectCategory("상사가 저를 무시해요");
// const questions = problemQuestions[category];

module.exports = {
  problemQuestions,
  detectCategory
};