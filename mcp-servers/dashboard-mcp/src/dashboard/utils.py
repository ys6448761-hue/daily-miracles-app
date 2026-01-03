"""
MCP 서버 공통 유틸리티

로깅, 알림, 헬스체크 기능 제공
"""

import logging
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


def setup_logger(name: str) -> logging.Logger:
    """표준 로거 설정"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # 이미 핸들러가 있으면 추가하지 않음
    if logger.handlers:
        return logger

    # 로그 디렉토리 확인
    log_dir = Path(__file__).parent.parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)

    # 파일 핸들러
    log_file = log_dir / f"{name}.log"
    fh = logging.FileHandler(log_file, encoding='utf-8')
    fh.setLevel(logging.INFO)

    # 콘솔 핸들러 (디버그용)
    ch = logging.StreamHandler()
    ch.setLevel(logging.WARNING)

    # 포맷터
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)

    logger.addHandler(fh)
    logger.addHandler(ch)

    return logger


def log_request(logger: logging.Logger, tool_name: str, arguments: dict):
    """요청 로깅"""
    logger.info(json.dumps({
        "type": "request",
        "tool": tool_name,
        "args": arguments or {},
        "timestamp": datetime.now().isoformat()
    }, ensure_ascii=False))


def log_response(
    logger: logging.Logger,
    tool_name: str,
    success: bool,
    duration_ms: Optional[float] = None,
    error: Optional[str] = None
):
    """응답 로깅"""
    logger.info(json.dumps({
        "type": "response",
        "tool": tool_name,
        "success": success,
        "duration_ms": duration_ms,
        "error": error if not success else None,
        "timestamp": datetime.now().isoformat()
    }, ensure_ascii=False))


def get_server_status(
    server_name: str,
    version: str,
    tools_count: int
) -> dict:
    """서버 상태 정보 반환"""
    return {
        "status": "healthy",
        "server": server_name,
        "version": version,
        "timestamp": datetime.now().isoformat(),
        "tools_count": tools_count,
        "uptime": "running"
    }


def send_alert(
    message: str,
    priority: str = "P1",
    logger: Optional[logging.Logger] = None
) -> bool:
    """
    알림 발송 (폴백 포함)

    현재는 로깅만 수행
    추후 카카오/이메일 연동 가능
    """
    alert_data = {
        "type": "alert",
        "priority": priority,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }

    if logger:
        if priority == "P0":
            logger.critical(json.dumps(alert_data, ensure_ascii=False))
        elif priority == "P1":
            logger.warning(json.dumps(alert_data, ensure_ascii=False))
        else:
            logger.info(json.dumps(alert_data, ensure_ascii=False))

    return True
