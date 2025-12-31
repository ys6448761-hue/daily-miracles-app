#!/usr/bin/env python3
"""
Daily Checklist Generator for CEO (푸르미르)

Aurora 5 UBOS - 일일 체크리스트 자동 생성
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Any

import httpx


class DailyChecklistGenerator:
    """일일 체크리스트 생성기"""

    def __init__(self, app_url: str = "https://daily-miracles-app.onrender.com"):
        self.app_url = app_url
        self.today = datetime.now().strftime("%Y-%m-%d")
        self.weekday = datetime.now().strftime("%A")
        self.weekday_kr = ["월", "화", "수", "목", "금", "토", "일"][datetime.now().weekday()]

    async def get_morning_dashboard(self) -> dict[str, Any]:
        """아침 대시보드 데이터 조회"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.app_url}/api/notify/status")
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            return {"error": str(e)}
        return {"error": "Failed to fetch dashboard"}

    async def get_today_wishes(self) -> dict[str, Any]:
        """오늘 인입 소원 현황"""
        # 실제로는 Airtable API나 DB에서 조회
        return {
            "count": 0,
            "red_alerts": 0,
            "yellow_alerts": 0,
            "green": 0
        }

    async def generate(self) -> dict[str, Any]:
        """일일 체크리스트 생성"""
        dashboard = await self.get_morning_dashboard()
        wishes = await self.get_today_wishes()

        checklist = {
            "title": f"📋 {self.today} ({self.weekday_kr}) 푸르미르님 일일 체크리스트",
            "generated_at": datetime.now().isoformat(),
            "sections": [
                {
                    "category": "🌅 아침 루틴 (5분)",
                    "time": "07:00-08:00",
                    "items": [
                        {
                            "id": "morning_1",
                            "task": "중앙 관제탑 확인",
                            "description": "전체 시스템 상태 한눈에 확인",
                            "auto": True,
                            "result": dashboard,
                            "status": "pending"
                        },
                        {
                            "id": "morning_2",
                            "task": "Airtable '오늘 인입' 확인",
                            "description": "신규 소원이 현황 파악",
                            "auto": False,
                            "link": "https://airtable.com/...",
                            "status": "pending"
                        }
                    ]
                },
                {
                    "category": "👥 소원이 관리 (10분)",
                    "time": "09:00-12:00",
                    "items": [
                        {
                            "id": "wish_1",
                            "task": "RED 신호 확인",
                            "description": "긴급 대응이 필요한 소원이 체크",
                            "auto": True,
                            "result": {"red_count": wishes.get("red_alerts", 0)},
                            "alert": wishes.get("red_alerts", 0) > 0,
                            "status": "pending"
                        },
                        {
                            "id": "wish_2",
                            "task": "YELLOW 신호 검토",
                            "description": "재미(CRO)에게 전달할 주의 소원이",
                            "auto": False,
                            "status": "pending"
                        },
                        {
                            "id": "wish_3",
                            "task": "7일 메시지 발송 현황",
                            "description": "오늘 발송될 아침/저녁 메시지 확인",
                            "auto": False,
                            "status": "pending"
                        }
                    ]
                },
                {
                    "category": "💰 비즈니스 (5분)",
                    "time": "12:00-13:00",
                    "items": [
                        {
                            "id": "biz_1",
                            "task": "오늘 매출 확인",
                            "description": "결제 현황 및 전환율 체크",
                            "auto": False,
                            "status": "pending"
                        },
                        {
                            "id": "biz_2",
                            "task": "결제 실패 알림 확인",
                            "description": "이상 징후 있으면 즉시 대응",
                            "auto": False,
                            "status": "pending"
                        }
                    ]
                },
                {
                    "category": "🔧 시스템 (2분)",
                    "time": "18:00-19:00",
                    "items": [
                        {
                            "id": "sys_1",
                            "task": "저녁 메시지 발송 확인",
                            "description": "저녁 응원 메시지 정상 발송 여부",
                            "auto": False,
                            "status": "pending"
                        },
                        {
                            "id": "sys_2",
                            "task": "일일 에러 로그 확인",
                            "description": "심각한 에러 없는지 점검",
                            "auto": False,
                            "status": "pending"
                        }
                    ]
                },
                {
                    "category": "📝 마감 (5분)",
                    "time": "21:00-22:00",
                    "items": [
                        {
                            "id": "close_1",
                            "task": "루미 일일 리포트 확인",
                            "description": "데이터 분석 리포트 검토",
                            "auto": False,
                            "status": "pending"
                        },
                        {
                            "id": "close_2",
                            "task": "내일 준비사항 확인",
                            "description": "특별 이벤트나 일정 체크",
                            "auto": False,
                            "status": "pending"
                        }
                    ]
                }
            ],
            "estimated_time": "27분",
            "summary": {
                "total_tasks": 11,
                "auto_tasks": 2,
                "manual_tasks": 9
            }
        }

        # 요일별 추가 항목
        if self.weekday_kr == "월":
            checklist["sections"].append({
                "category": "📅 주간 시작 (월요일)",
                "time": "09:00",
                "items": [
                    {
                        "id": "weekly_1",
                        "task": "주간 목표 설정",
                        "description": "이번 주 핵심 목표 3가지 정하기",
                        "auto": False,
                        "status": "pending"
                    }
                ]
            })
        elif self.weekday_kr == "금":
            checklist["sections"].append({
                "category": "📅 주간 마감 (금요일)",
                "time": "17:00",
                "items": [
                    {
                        "id": "weekly_2",
                        "task": "주간 리뷰 & 개선점 도출",
                        "description": "이번 주 성과 및 개선사항 정리",
                        "auto": False,
                        "status": "pending"
                    }
                ]
            })

        return checklist

    def format_markdown(self, checklist: dict[str, Any]) -> str:
        """마크다운 형식으로 변환"""
        md = f"# {checklist['title']}\n\n"
        md += f"생성 시각: {checklist['generated_at']}\n"
        md += f"예상 소요 시간: {checklist['estimated_time']}\n\n"
        md += "---\n\n"

        for section in checklist["sections"]:
            md += f"## {section['category']}\n"
            md += f"*{section['time']}*\n\n"

            for item in section["items"]:
                status = "⬜" if item["status"] == "pending" else "✅"
                alert = "🚨 " if item.get("alert") else ""
                md += f"- [{status}] {alert}**{item['task']}**\n"
                md += f"  - {item['description']}\n"
                if item.get("auto"):
                    md += f"  - _(자동 수집)_\n"
                if item.get("link"):
                    md += f"  - [바로가기]({item['link']})\n"
                md += "\n"

        md += "---\n\n"
        md += f"총 {checklist['summary']['total_tasks']}개 항목 "
        md += f"(자동: {checklist['summary']['auto_tasks']}, "
        md += f"수동: {checklist['summary']['manual_tasks']})\n"

        return md


async def main():
    """메인 실행"""
    generator = DailyChecklistGenerator()
    checklist = await generator.generate()

    # JSON 출력
    print("=== JSON 출력 ===")
    print(json.dumps(checklist, ensure_ascii=False, indent=2))

    # 마크다운 출력
    print("\n=== 마크다운 출력 ===")
    print(generator.format_markdown(checklist))


if __name__ == "__main__":
    asyncio.run(main())
