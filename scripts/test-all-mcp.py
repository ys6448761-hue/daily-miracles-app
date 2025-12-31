#!/usr/bin/env python3
"""
Aurora 5 UBOS - MCP Server Integration Test

모든 MCP 서버의 통합 테스트를 수행합니다.
"""

import asyncio
import subprocess
import sys
from pathlib import Path
from typing import Any


class MCPServerTester:
    """MCP 서버 통합 테스트"""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.mcp_servers = [
            {
                "name": "WishMaker Hub",
                "path": "mcp-servers/wishmaker-hub-mcp",
                "module": "wishmaker_hub",
                "command": "wishmaker-hub-mcp",
                "tools_count": 14
            },
            {
                "name": "Business Ops",
                "path": "mcp-servers/business-ops-mcp",
                "module": "business_ops",
                "command": "business-ops-mcp",
                "tools_count": 4
            },
            {
                "name": "Infrastructure Monitor",
                "path": "mcp-servers/infra-monitor-mcp",
                "module": "infra_monitor",
                "command": "infra-monitor-mcp",
                "tools_count": 4
            }
        ]
        self.results: list[dict[str, Any]] = []

    def test_server(self, server: dict[str, Any]) -> dict[str, Any]:
        """개별 서버 테스트"""
        result = {
            "name": server["name"],
            "path": server["path"],
            "status": "unknown",
            "tools_loaded": 0,
            "errors": []
        }

        server_path = self.project_root / server["path"]

        # 1. 디렉토리 존재 확인
        if not server_path.exists():
            result["status"] = "FAILED"
            result["errors"].append(f"Directory not found: {server_path}")
            return result

        # 2. 모듈 로드 테스트
        try:
            test_code = f"""
import sys
sys.path.insert(0, '{server_path / "src"}')
from {server['module']}.tools import TOOLS
from {server['module']}.server import server, list_tools
import asyncio

async def test():
    tools = await list_tools()
    print(f"SERVER_NAME:{{server.name}}")
    print(f"TOOLS_COUNT:{{len(tools)}}")
    for t in tools:
        print(f"TOOL:{{t.name}}")

asyncio.run(test())
"""
            proc = subprocess.run(
                [sys.executable, "-c", test_code],
                capture_output=True,
                text=True,
                cwd=server_path,
                timeout=30
            )

            if proc.returncode == 0:
                output = proc.stdout
                for line in output.split('\n'):
                    if line.startswith("TOOLS_COUNT:"):
                        result["tools_loaded"] = int(line.split(":")[1])
                    elif line.startswith("TOOL:"):
                        if "tools" not in result:
                            result["tools"] = []
                        result["tools"].append(line.split(":")[1])

                if result["tools_loaded"] == server["tools_count"]:
                    result["status"] = "PASSED"
                else:
                    result["status"] = "WARNING"
                    result["errors"].append(
                        f"Expected {server['tools_count']} tools, got {result['tools_loaded']}"
                    )
            else:
                result["status"] = "FAILED"
                result["errors"].append(proc.stderr[:500])

        except subprocess.TimeoutExpired:
            result["status"] = "TIMEOUT"
            result["errors"].append("Test timed out after 30 seconds")
        except Exception as e:
            result["status"] = "ERROR"
            result["errors"].append(str(e))

        return result

    def run_all_tests(self) -> list[dict[str, Any]]:
        """모든 서버 테스트 실행"""
        print("=" * 60)
        print("Aurora 5 UBOS - MCP Server Integration Test")
        print("=" * 60)
        print()

        for server in self.mcp_servers:
            print(f"Testing: {server['name']}...")
            result = self.test_server(server)
            self.results.append(result)

            status_icon = {
                "PASSED": "[OK]",
                "WARNING": "[WARN]",
                "FAILED": "[FAIL]",
                "ERROR": "[ERR]",
                "TIMEOUT": "[TIMEOUT]"
            }.get(result["status"], "[?]")

            print(f"  {status_icon} {result['status']} - {result['tools_loaded']} tools loaded")
            if result["errors"]:
                for error in result["errors"]:
                    print(f"      Error: {error[:100]}")
            print()

        return self.results

    def print_summary(self):
        """테스트 요약 출력"""
        print("=" * 60)
        print("Summary")
        print("=" * 60)

        passed = sum(1 for r in self.results if r["status"] == "PASSED")
        total = len(self.results)
        total_tools = sum(r["tools_loaded"] for r in self.results)

        print(f"Servers: {passed}/{total} passed")
        print(f"Total tools: {total_tools}")
        print()

        print("Server Status:")
        for result in self.results:
            status = result["status"]
            icon = "[OK]" if status == "PASSED" else "[FAIL]"
            print(f"  {icon} {result['name']}: {result['tools_loaded']} tools")

        print()
        if passed == total:
            print("All tests PASSED!")
        else:
            print(f"FAILED: {total - passed} server(s) need attention")


def main():
    """메인 실행"""
    # 프로젝트 루트 찾기
    script_path = Path(__file__).resolve()
    project_root = script_path.parent.parent

    tester = MCPServerTester(project_root)
    tester.run_all_tests()
    tester.print_summary()


if __name__ == "__main__":
    main()
