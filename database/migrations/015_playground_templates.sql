-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 015: 소원놀이터 템플릿 (Playground Templates)
-- AIL-501: 첫 제작 완료율 상승을 위한 템플릿 10개
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. 템플릿 테이블
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playground_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(50) UNIQUE NOT NULL,    -- T01, T02, ...
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,               -- start, anxiety, rest, self, relationship, weekly, calm
    heart_line VARCHAR(300) NOT NULL,
    reality_hint VARCHAR(300) NOT NULL,
    one_step VARCHAR(300) NOT NULL,              -- 반드시 "오늘은:" 접두어
    blessing_line VARCHAR(300) NOT NULL,         -- 타인 지향
    reality_tag VARCHAR(50) DEFAULT 'self',      -- artifacts와 연결
    tone VARCHAR(20) DEFAULT 'warm',
    sort_order INTEGER DEFAULT 0,                -- 추천 순서
    is_active BOOLEAN DEFAULT TRUE,
    use_count INTEGER DEFAULT 0,                 -- 사용 횟수 (분석용)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON playground_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON playground_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_sort ON playground_templates(sort_order);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. 템플릿 사용 로그 (분석용)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playground_template_usage (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES playground_templates(id),
    user_id INTEGER REFERENCES playground_users(user_id),
    artifact_id INTEGER REFERENCES artifacts(artifact_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_template_usage_template ON playground_template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_created ON playground_template_usage(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: 템플릿 10개
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO playground_templates (template_key, title, category, heart_line, reality_hint, one_step, blessing_line, reality_tag, sort_order)
VALUES
-- T01. 시작이 버거운 날
('T01', '시작이 버거운 날', 'start',
 '지금도 충분히 잘하고 있어',
 '시작 앞에서는 마음이 무거울 수 있어',
 '오늘은: 숨 한 번 천천히 고르기',
 '오늘을 시작하는 모두에게',
 'anxiety', 1),

-- T02. 생각이 많아질 때
('T02', '생각이 많아질 때', 'anxiety',
 '완벽하지 않아도 괜찮아',
 '생각이 많아지면 마음이 지칠 수 있어',
 '오늘은: 할 일 하나만 적어보기',
 '각자의 속도를 걷는 우리에게',
 'anxiety', 2),

-- T03. 지친 하루의 중간
('T03', '지친 하루의 중간', 'rest',
 '잠시 쉬어가도 괜찮아',
 '중간쯤 오면 힘이 빠질 수 있어',
 '오늘은: 따뜻한 물 한 잔 마시기',
 '오늘도 애쓰는 모두에게',
 'health', 3),

-- T04. 마음이 흔들릴 때
('T04', '마음이 흔들릴 때', 'anxiety',
 '흔들려도 괜찮아',
 '예측이 어려우면 불안해질 수 있어',
 '오늘은: 몸을 가볍게 늘려보기',
 '불안한 순간을 지나가는 우리에게',
 'anxiety', 4),

-- T05. 나를 다그치고 있을 때
('T05', '나를 다그치고 있을 때', 'self',
 '나를 다그치지 않아도 돼',
 '잘하려다 보면 스스로를 몰아칠 수 있어',
 '오늘은: 스스로에게 한마디 고마워하기',
 '애쓰는 마음을 가진 모두에게',
 'self', 5),

-- T06. 비교가 올라올 때
('T06', '비교가 올라올 때', 'self',
 '각자의 속도가 있어',
 '비교는 마음을 조급하게 만들 수 있어',
 '오늘은: 나만의 리듬을 하나 지켜보기',
 '자기 자리에서 걷는 우리에게',
 'self', 6),

-- T07. 관계로 지칠 때
('T07', '관계로 지칠 때', 'relationship',
 '마음을 다 쓰지 않아도 괜찮아',
 '사람 사이에서는 에너지가 빠질 수 있어',
 '오늘은: 혼자만의 시간 10분 갖기',
 '관계 속에서 애쓰는 모두에게',
 'relationship', 7),

-- T08. 쉬는 날에도 마음이 바쁠 때
('T08', '쉬는 날에도 마음이 바쁠 때', 'rest',
 '쉬는 날에도 쉬지 못할 수 있어',
 '멈추면 불안해질 때도 있어',
 '오늘은: 휴대폰 내려두고 잠깐 쉬기',
 '각자의 휴식이 존중받기를',
 'health', 8),

-- T09. 한 주의 끝에서
('T09', '한 주의 끝에서', 'weekly',
 '여기까지 온 것도 충분해',
 '끝자락에서는 마음이 헐거워질 수 있어',
 '오늘은: 이번 주를 한 문장으로 적기',
 '한 주를 버텨낸 우리에게',
 'time', 9),

-- T10. 아무 말도 떠오르지 않을 때
('T10', '아무 말도 떠오르지 않을 때', 'calm',
 '말이 없을 때도 괜찮아',
 '감정이 정리되지 않을 수 있어',
 '오늘은: 조용히 주변을 바라보기',
 '말없이 하루를 보내는 모두에게',
 'self', 10)

ON CONFLICT (template_key) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    heart_line = EXCLUDED.heart_line,
    reality_hint = EXCLUDED.reality_hint,
    one_step = EXCLUDED.one_step,
    blessing_line = EXCLUDED.blessing_line,
    reality_tag = EXCLUDED.reality_tag,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════════════
-- 완료 로그
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 015 완료: 소원놀이터 템플릿
-- 테이블: playground_templates, playground_template_usage
-- Seed: 템플릿 10개 (T01~T10)
