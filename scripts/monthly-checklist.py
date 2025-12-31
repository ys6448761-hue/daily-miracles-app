#!/usr/bin/env python3
"""
Monthly Checklist Generator for CEO (푸르미르)

Aurora 5 UBOS - 월간 체크리스트 자동 생성
"""

import asyncio
import json
from datetime import datetime
from typing import Any


class MonthlyChecklistGenerator:
    """월간 체크리스트 생성기"""

    def __init__(self):
        self.today = datetime.now()
        self.month = self.today.month
        self.year = self.today.year
        self.month_name = self.today.strftime("%B")

    async def generate(self) -> dict[str, Any]:
        """월간 체크리스트 생성"""
        checklist = {
            "title": f"📋 {self.year}년 {self.month}월 푸르미르님 월간 체크리스트",
            "period": f"{self.year}년 {self.month}월",
            "generated_at": datetime.now().isoformat(),
            "sections": [
                {
                    "category": "🎯 월간 목표 설정",
                    "timing": "1일",
                    "items": [
                        {
                            "id": "goal_1",
                            "task": "월간 매출 목표 설정",
                            "description": "전월 대비 성장률 고려",
                            "status": "pending"
                        },
                        {
                            "id": "goal_2",
                            "task": "신규 소원이 목표 설정",
                            "description": "마케팅 채널별 목표 수립",
                            "status": "pending"
                        },
                        {
                            "id": "goal_3",
                            "task": "핵심 개선 과제 선정",
                            "description": "이번 달 집중할 개선 영역",
                            "status": "pending"
                        }
                    ]
                },
                {
                    "category": "📊 중간 점검",
                    "timing": "15일",
                    "items": [
                        {
                            "id": "mid_1",
                            "task": "목표 달성률 점검",
                            "description": "월간 목표 대비 진행 상황",
                            "status": "pending"
                        },
                        {
                            "id": "mid_2",
                            "task": "마케팅 효과 분석",
                            "description": "채널별 인입 효율 분석",
                            "status": "pending"
                        },
                        {
                            "id": "mid_3",
                            "task": "비용 집행 현황",
                            "description": "예산 대비 지출 확인",
                            "status": "pending"
                        },
                        {
                            "id": "mid_4",
                            "task": "조정 필요 사항 결정",
                            "description": "후반기 전략 수정",
                            "status": "pending"
                        }
                    ]
                },
                {
                    "category": "📝 월간 마감",
                    "timing": "말일",
                    "items": [
                        {
                            "id": "close_1",
                            "task": "월간 실적 집계",
                            "description": "전체 KPI 달성률 확인",
                            "status": "pending"
                        },
                        {
                            "id": "close_2",
                            "task": "월간 리포트 작성",
                            "description": "루미와 함께 분석 리포트",
                            "status": "pending"
                        },
                        {
                            "id": "close_3",
                            "task": "코호트 분석",
                            "description": "이번 달 인입 소원이 특성",
                            "status": "pending"
                        },
                        {
                            "id": "close_4",
                            "task": "다음 달 계획 수립",
                            "description": "목표 및 주요 일정 확정",
                            "status": "pending"
                        }
                    ]
                },
                {
                    "category": "💼 운영 관리",
                    "timing": "수시",
                    "items": [
                        {
                            "id": "ops_1",
                            "task": "협력사 관계 점검",
                            "description": "Solapi, OpenAI 등 상태 확인",
                            "status": "pending"
                        },
                        {
                            "id": "ops_2",
                            "task": "시스템 업그레이드 검토",
                            "description": "필요한 기능 개선 요청",
                            "status": "pending"
                        },
                        {
                            "id": "ops_3",
                            "task": "팀 피드백 수집",
                            "description": "Aurora 5 팀 의견 청취",
                            "status": "pending"
                        }
                    ]
                }
            ],
            "monthly_kpis": {
                "revenue": {"target": 3000000, "unit": "원", "description": "월 매출"},
                "new_wishes": {"target": 300, "unit": "건", "description": "신규 소원"},
                "paid_conversion": {"target": 30, "unit": "%", "description": "유료 전환율"},
                "retention": {"target": 70, "unit": "%", "description": "재방문율"},
                "nps": {"target": 50, "unit": "점", "description": "NPS (순추천지수)"}
            },
            "summary": {
                "total_tasks": 14,
                "categories": 4,
                "key_dates": ["1일 (목표 설정)", "15일 (중간 점검)", "말일 (마감)"]
            }
        }

        return checklist

    def format_markdown(self, checklist: dict[str, Any]) -> str:
        """마크다운 형식으로 변환"""
        md = f"# {checklist['title']}\n\n"
        md += f"기간: {checklist['period']}\n"
        md += f"생성: {checklist['generated_at']}\n\n"
        md += "---\n\n"

        md += "## 📈 월간 KPI 목표\n\n"
        md += "| 지표 | 목표 | 단위 |\n"
        md += "|------|------|------|\n"
        for key, kpi in checklist["monthly_kpis"].items():
            md += f"| {kpi['description']} | {kpi['target']:,} | {kpi['unit']} |\n"
        md += "\n---\n\n"

        md += "## 📅 핵심 일정\n\n"
        for date in checklist["summary"]["key_dates"]:
            md += f"- {date}\n"
        md += "\n---\n\n"

        for section in checklist["sections"]:
            md += f"## {section['category']}\n"
            md += f"*{section['timing']}*\n\n"

            for item in section["items"]:
                status = "⬜"
                md += f"- [{status}] **{item['task']}**\n"
                md += f"  - {item['description']}\n"
                md += "\n"

        return md


async def main():
    """메인 실행"""
    generator = MonthlyChecklistGenerator()
    checklist = await generator.generate()

    print("=== 월간 체크리스트 ===")
    print(generator.format_markdown(checklist))


if __name__ == "__main__":
    asyncio.run(main())
