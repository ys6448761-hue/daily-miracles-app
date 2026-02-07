#!/usr/bin/env python3
"""
BidDoc Ops Center - Main Pipeline Runner

Usage:
    python scripts/biddoc_run.py --config ops/biddoc/config.yml
    python scripts/biddoc_run.py --config ops/biddoc/config.yml --step anonymize
    python scripts/biddoc_run.py --config ops/biddoc/config.yml --dry-run
"""

import argparse
import json
import os
import re
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path

# PyYAML fallback - 간단한 YAML 파서
try:
    import yaml
except ImportError:
    # PyYAML이 없으면 간단한 파서 사용
    class SimpleYAML:
        @staticmethod
        def safe_load(content):
            """간단한 YAML 파서 (기본 구조만 지원)"""
            if isinstance(content, str):
                lines = content.split('\n')
            else:
                lines = content.read().split('\n')
            return SimpleYAML._parse_lines(lines)

        @staticmethod
        def _parse_lines(lines):
            result = {}
            current_key = None
            current_list = None
            indent_stack = [(0, result)]

            for line in lines:
                # 주석, 빈 줄 스킵
                stripped = line.strip()
                if not stripped or stripped.startswith('#'):
                    continue

                # 들여쓰기 계산
                indent = len(line) - len(line.lstrip())

                # 리스트 항목
                if stripped.startswith('- '):
                    value = stripped[2:].strip()
                    if current_list is not None:
                        if ':' in value:
                            # dict in list
                            k, v = value.split(':', 1)
                            current_list.append({k.strip(): SimpleYAML._parse_value(v.strip())})
                        else:
                            current_list.append(SimpleYAML._parse_value(value))
                    continue

                # key: value 파싱
                if ':' in stripped:
                    key, value = stripped.split(':', 1)
                    key = key.strip()
                    value = value.strip()

                    # 현재 컨텍스트 찾기
                    while indent_stack and indent <= indent_stack[-1][0] and len(indent_stack) > 1:
                        indent_stack.pop()

                    current_dict = indent_stack[-1][1]

                    if value:
                        # 값이 있는 경우
                        current_dict[key] = SimpleYAML._parse_value(value)
                        current_list = None
                    else:
                        # 중첩 구조
                        new_dict = {}
                        current_dict[key] = new_dict
                        indent_stack.append((indent + 2, new_dict))
                        # 리스트 가능성 체크
                        current_list = None
                        current_key = key

            return result

        @staticmethod
        def _parse_value(value):
            if value.startswith('"') and value.endswith('"'):
                return value[1:-1]
            if value.startswith("'") and value.endswith("'"):
                return value[1:-1]
            if value.lower() == 'true':
                return True
            if value.lower() == 'false':
                return False
            if value.isdigit():
                return int(value)
            try:
                return float(value)
            except:
                return value

    yaml = SimpleYAML()

# 스크립트 경로 설정
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

from biddoc_anonymize import anonymize_text, gate1_check
from biddoc_tone import rewrite_tone, gate2_check
from biddoc_assemble import assemble_document, gate3_check

# ===========================================================================
# 상수 정의
# ===========================================================================
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts" / "biddoc" / "runs"


def create_run_folder():
    """타임스탬프 기반 실행 폴더 생성"""
    timestamp = datetime.now().strftime("%Y%m%d-%H%M")
    run_dir = ARTIFACTS_DIR / timestamp

    # 하위 폴더 생성
    (run_dir / "inputs").mkdir(parents=True, exist_ok=True)
    (run_dir / "outputs").mkdir(parents=True, exist_ok=True)
    (run_dir / "reports").mkdir(parents=True, exist_ok=True)
    (run_dir / "logs").mkdir(parents=True, exist_ok=True)

    return run_dir, timestamp


def load_config(config_path):
    """YAML/JSON 설정 파일 로드"""
    config_path = Path(config_path)

    # JSON 우선 시도 (PyYAML 없어도 동작)
    json_path = config_path.with_suffix('.json')
    if json_path.exists():
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    # YAML 파일 로드
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def copy_input_file(config, run_dir):
    """입력 파일을 실행 폴더로 복사"""
    input_path = Path(config.get('input_file', 'inputs/business_plan.txt'))

    # 절대 경로가 아니면 프로젝트 루트 기준으로 해석
    if not input_path.is_absolute():
        input_path = PROJECT_ROOT / input_path

    if not input_path.exists():
        raise FileNotFoundError(f"입력 파일을 찾을 수 없습니다: {input_path}")

    dest_path = run_dir / "inputs" / input_path.name
    shutil.copy2(input_path, dest_path)

    return dest_path


def write_run_summary(run_dir, timestamp, steps_result, config):
    """실행 요약 로그 작성"""
    summary = {
        "run_id": timestamp,
        "config_file": str(config.get('_config_path', 'unknown')),
        "project_name": config.get('project_name', ''),
        "started_at": steps_result.get('started_at'),
        "completed_at": datetime.now().isoformat(),
        "overall_passed": all(s.get('passed', False) for s in steps_result.get('steps', [])),
        "steps": steps_result.get('steps', []),
        "gates": steps_result.get('gates', []),
        "total_duration_ms": steps_result.get('total_duration_ms', 0)
    }

    summary_path = run_dir / "logs" / "run_summary.json"
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    return summary_path


def write_gate_results(run_dir, gate_results):
    """Gate 결과 리포트 작성"""
    report_path = run_dir / "reports" / "gate_results.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(gate_results, f, ensure_ascii=False, indent=2)
    return report_path


def print_banner():
    """배너 출력"""
    print("""
===========================================================================
 BidDoc Ops Center v1
 BidDoc Pipeline
===========================================================================
""")


def print_step(step_num, step_name, status="running"):
    """단계 상태 출력"""
    icons = {
        "running": "...",
        "passed": "PASS",
        "failed": "FAIL"
    }
    print(f"  [{icons[status]}] Step {step_num}: {step_name}")


def print_gate(gate_name, passed, details=""):
    """Gate 결과 출력"""
    icon = "PASS" if passed else "FAIL"
    print(f"  [{icon}] {gate_name} {details}")


def run_pipeline(config, run_dir, steps_to_run=None, dry_run=False, verbose=False):
    """파이프라인 실행"""
    started_at = datetime.now().isoformat()
    start_time = time.time()

    steps_result = {
        "started_at": started_at,
        "steps": [],
        "gates": []
    }

    all_steps = ["anonymize", "tone", "assemble", "export"]
    if steps_to_run:
        # 특정 단계만 실행
        all_steps = [s for s in all_steps if s in steps_to_run]

    print(f"\n  Run ID: {run_dir.name}")
    print(f"  Output: {run_dir}\n")

    # ---------------------------------------------------------------------
    # Step 1: 익명화
    # ---------------------------------------------------------------------
    if "anonymize" in all_steps:
        print_step(1, "Anonymize", "running")
        step_start = time.time()

        input_path = run_dir / "inputs" / "business_plan.txt"
        output_path = run_dir / "outputs" / "business_plan_anon.txt"
        report_path = run_dir / "reports" / "qa_report.json"

        if not dry_run:
            with open(input_path, 'r', encoding='utf-8') as f:
                original_text = f.read()

            anon_text, anon_report = anonymize_text(original_text, config.get('anonymize', {}))

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(anon_text)

            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(anon_report, f, ensure_ascii=False, indent=2)

            # Gate 1 검증
            gate1_result = gate1_check(anon_text, config)
            steps_result['gates'].append(gate1_result)

            step_duration = int((time.time() - step_start) * 1000)
            steps_result['steps'].append({
                "step": "anonymize",
                "passed": gate1_result['passed'],
                "duration_ms": step_duration,
                "output": str(output_path)
            })

            print_step(1, "Anonymize", "passed" if gate1_result['passed'] else "failed")
            print_gate("Gate1", gate1_result['passed'],
                      f"(잔여 식별요소: {gate1_result.get('count', 0)}건)")

            if not gate1_result['passed']:
                print(f"\n  [FAIL] Gate1 실패: 식별 요소 잔여")
                for item in gate1_result.get('remaining', []):
                    print(f"         - {item}")
                print("\n  파이프라인 중단됨. config.yml 확인 후 재실행하세요.")
                steps_result['total_duration_ms'] = int((time.time() - start_time) * 1000)
                return steps_result
        else:
            print_step(1, "Anonymize [DRY-RUN]", "passed")

    # ---------------------------------------------------------------------
    # Step 2: 톤 리라이트
    # ---------------------------------------------------------------------
    if "tone" in all_steps:
        print_step(2, "Tone Rewrite", "running")
        step_start = time.time()

        input_path = run_dir / "outputs" / "business_plan_anon.txt"
        output_path = run_dir / "outputs" / "business_plan_tone.txt"

        if not dry_run:
            with open(input_path, 'r', encoding='utf-8') as f:
                anon_text = f.read()

            toned_text = rewrite_tone(anon_text, config.get('tone', {}))

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(toned_text)

            # Gate 2 검증
            gate2_result = gate2_check(anon_text, toned_text, config)
            steps_result['gates'].append(gate2_result)

            step_duration = int((time.time() - step_start) * 1000)
            steps_result['steps'].append({
                "step": "tone",
                "passed": gate2_result['passed'],
                "duration_ms": step_duration,
                "output": str(output_path)
            })

            print_step(2, "Tone Rewrite", "passed" if gate2_result['passed'] else "failed")
            print_gate("Gate2", gate2_result['passed'])

            if not gate2_result['passed']:
                print(f"\n  [FAIL] Gate2 실패")
                print("\n  파이프라인 중단됨.")
                steps_result['total_duration_ms'] = int((time.time() - start_time) * 1000)
                return steps_result
        else:
            print_step(2, "Tone Rewrite [DRY-RUN]", "passed")

    # ---------------------------------------------------------------------
    # Step 3: 9장 조립
    # ---------------------------------------------------------------------
    if "assemble" in all_steps:
        print_step(3, "Assemble 9-Pages", "running")
        step_start = time.time()

        input_path = run_dir / "outputs" / "business_plan_tone.txt"
        output_path = run_dir / "outputs" / "business_plan_final.md"

        if not dry_run:
            with open(input_path, 'r', encoding='utf-8') as f:
                toned_text = f.read()

            assembled_text = assemble_document(toned_text, config.get('assemble', {}))

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(assembled_text)

            # Gate 3 검증
            gate3_result = gate3_check(assembled_text, config)
            steps_result['gates'].append(gate3_result)

            step_duration = int((time.time() - step_start) * 1000)
            steps_result['steps'].append({
                "step": "assemble",
                "passed": gate3_result['passed'],
                "duration_ms": step_duration,
                "output": str(output_path)
            })

            print_step(3, "Assemble 9-Pages", "passed" if gate3_result['passed'] else "failed")
            print_gate("Gate3", gate3_result['passed'],
                      f"({gate3_result.get('found', 0)}/{gate3_result.get('total_required', 9)}장)")

            if not gate3_result['passed']:
                print(f"\n  [FAIL] Gate3 실패: 누락 페이지")
                for page in gate3_result.get('missing', []):
                    print(f"         - {page}")
                steps_result['total_duration_ms'] = int((time.time() - start_time) * 1000)
                return steps_result
        else:
            print_step(3, "Assemble 9-Pages [DRY-RUN]", "passed")

    # ---------------------------------------------------------------------
    # Step 4: PDF 출력 (선택적)
    # ---------------------------------------------------------------------
    if "export" in all_steps:
        print_step(4, "Export PDF", "running")
        step_start = time.time()

        input_path = run_dir / "outputs" / "business_plan_final.md"
        output_path = run_dir / "outputs" / "business_plan_final.pdf"

        if not dry_run:
            try:
                from biddoc_export_pdf import export_to_pdf
                export_to_pdf(input_path, output_path, config.get('export', {}))
                step_duration = int((time.time() - step_start) * 1000)
                steps_result['steps'].append({
                    "step": "export",
                    "passed": True,
                    "duration_ms": step_duration,
                    "output": str(output_path)
                })
                print_step(4, "Export PDF", "passed")
            except ImportError:
                print_step(4, "Export PDF [SKIPPED - 의존성 없음]", "passed")
                steps_result['steps'].append({
                    "step": "export",
                    "passed": True,
                    "skipped": True,
                    "reason": "PDF 라이브러리 미설치"
                })
            except Exception as e:
                print_step(4, f"Export PDF [ERROR: {e}]", "failed")
                steps_result['steps'].append({
                    "step": "export",
                    "passed": False,
                    "error": str(e)
                })
        else:
            print_step(4, "Export PDF [DRY-RUN]", "passed")

    steps_result['total_duration_ms'] = int((time.time() - start_time) * 1000)
    return steps_result


def main():
    parser = argparse.ArgumentParser(description='BidDoc Ops Center - 입찰 문서 자동화 파이프라인')
    parser.add_argument('--config', required=True, help='설정 파일 경로 (YAML)')
    parser.add_argument('--step', help='특정 단계만 실행 (anonymize, tone, assemble, export)')
    parser.add_argument('--dry-run', action='store_true', help='실제 실행 없이 검증만')
    parser.add_argument('--verbose', '-v', action='store_true', help='상세 로그 출력')

    args = parser.parse_args()

    print_banner()

    # 설정 로드
    config_path = Path(args.config)
    if not config_path.is_absolute():
        config_path = PROJECT_ROOT / config_path

    if not config_path.exists():
        print(f"  [ERROR] 설정 파일을 찾을 수 없습니다: {config_path}")
        return 1

    config = load_config(config_path)
    config['_config_path'] = str(config_path)

    print(f"  Project: {config.get('project_name', 'Unknown')}")

    # 실행 폴더 생성
    run_dir, timestamp = create_run_folder()

    # 입력 파일 복사
    try:
        input_file = copy_input_file(config, run_dir)
        print(f"  Input: {input_file.name}")
    except FileNotFoundError as e:
        print(f"  [ERROR] {e}")
        return 1

    # 파이프라인 실행
    steps_to_run = [args.step] if args.step else None
    steps_result = run_pipeline(
        config,
        run_dir,
        steps_to_run=steps_to_run,
        dry_run=args.dry_run,
        verbose=args.verbose
    )

    # 결과 저장
    summary_path = write_run_summary(run_dir, timestamp, steps_result, config)
    gate_results = {
        "run_id": timestamp,
        "overall_passed": all(g.get('passed', False) for g in steps_result.get('gates', [])),
        "gates": steps_result.get('gates', []),
        "completed_at": datetime.now().isoformat()
    }
    write_gate_results(run_dir, gate_results)

    # 최종 결과 출력
    print("\n" + "-" * 60)
    overall_passed = all(s.get('passed', True) for s in steps_result.get('steps', []))

    if overall_passed:
        print(f"  [PASS] Pipeline Complete")
        print(f"  Output: {run_dir / 'outputs'}")
    else:
        print(f"  [FAIL] Pipeline Failed")

    print(f"  Duration: {steps_result.get('total_duration_ms', 0)}ms")
    print("=" * 60 + "\n")

    return 0 if overall_passed else 1


if __name__ == "__main__":
    sys.exit(main())
