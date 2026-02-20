"""
Business Ops MCP Server

Aurora 5 UBOS - 비즈니스 운영 시스템
"""

import asyncio
import json
import time
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
    CallToolResult,
)

from .tools import TOOLS, get_tool_prompt
from .utils import setup_logger, log_request, log_response, get_server_status


# 서버 설정
SERVER_NAME = "business-ops-mcp"
SERVER_VERSION = "0.1.0"

# 로거 설정
logger = setup_logger(SERVER_NAME)

# 서버 인스턴스 생성
server = Server(SERVER_NAME)


# check_status 도구 정의
STATUS_TOOL = {
    "name": "check_status",
    "description": "서버 상태 확인 (헬스체크)",
    "inputSchema": {
        "type": "object",
        "properties": {}
    }
}


@server.list_tools()
async def list_tools() -> list[Tool]:
    """사용 가능한 도구 목록을 반환합니다."""
    all_tools = TOOLS + [STATUS_TOOL]
    return [
        Tool(
            name=tool["name"],
            description=tool["description"],
            inputSchema=tool["inputSchema"],
        )
        for tool in all_tools
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> CallToolResult:
    """도구를 호출하고 결과를 반환합니다."""
    start_time = time.time()
    log_request(logger, name, arguments or {})

    try:
        if name == "check_status":
            status = get_server_status(
                server_name=SERVER_NAME,
                version=SERVER_VERSION,
                tools_count=len(TOOLS) + 1
            )
            duration_ms = (time.time() - start_time) * 1000
            log_response(logger, name, True, duration_ms)

            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(status, ensure_ascii=False, indent=2)
                    )
                ]
            )

        prompt = get_tool_prompt(name, arguments or {})
        duration_ms = (time.time() - start_time) * 1000
        log_response(logger, name, True, duration_ms)

        return CallToolResult(
            content=[
                TextContent(
                    type="text",
                    text=prompt
                )
            ]
        )

    except ValueError as e:
        duration_ms = (time.time() - start_time) * 1000
        log_response(logger, name, False, duration_ms, str(e))

        return CallToolResult(
            content=[
                TextContent(
                    type="text",
                    text=f"Error: {str(e)}"
                )
            ],
            isError=True
        )
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        log_response(logger, name, False, duration_ms, str(e))

        return CallToolResult(
            content=[
                TextContent(
                    type="text",
                    text=f"Unexpected error: {str(e)}"
                )
            ],
            isError=True
        )


async def run_server():
    """MCP 서버를 실행합니다."""
    logger.info(f"Starting {SERVER_NAME} v{SERVER_VERSION}")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


def main():
    """엔트리포인트"""
    asyncio.run(run_server())


if __name__ == "__main__":
    main()
    
