"""
WishMaker Hub MCP Server

Aurora 5 UBOS - 소원이 통합 관리 시스템
"""

import asyncio
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
    CallToolResult,
)

from .tools import TOOLS, get_tool_prompt


# 서버 인스턴스 생성
server = Server("wishmaker-hub-mcp")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """사용 가능한 도구 목록을 반환합니다."""
    return [
        Tool(
            name=tool["name"],
            description=tool["description"],
            inputSchema=tool["inputSchema"],
        )
        for tool in TOOLS
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> CallToolResult:
    """
    도구를 호출하고 결과를 반환합니다.

    이 MCP 서버는 프롬프트를 생성하며,
    실제 AI 처리는 Claude가 수행합니다.
    """
    try:
        # 도구에 해당하는 프롬프트 생성
        prompt = get_tool_prompt(name, arguments)

        return CallToolResult(
            content=[
                TextContent(
                    type="text",
                    text=prompt
                )
            ]
        )

    except ValueError as e:
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
