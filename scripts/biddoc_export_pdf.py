#!/usr/bin/env python3
"""
BidDoc Ops Center - Step 4: PDF Export
═══════════════════════════════════════════════════════════════════════════
마크다운 문서를 PDF로 변환

의존성:
    pip install markdown weasyprint
    또는
    pip install markdown pdfkit  # wkhtmltopdf 필요
"""

import os
from pathlib import Path
from typing import Dict, Any


def export_to_pdf(input_path: Path, output_path: Path, config: Dict[str, Any]) -> bool:
    """
    마크다운 파일을 PDF로 변환

    Args:
        input_path: 입력 마크다운 파일 경로
        output_path: 출력 PDF 파일 경로
        config: export 설정

    Returns:
        성공 여부
    """
    # 마크다운 읽기
    with open(input_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # ─────────────────────────────────────────────────────────────────────
    # 방법 1: weasyprint 사용 (권장)
    # ─────────────────────────────────────────────────────────────────────
    try:
        import markdown
        from weasyprint import HTML, CSS

        # 마크다운 → HTML 변환
        html_content = markdown.markdown(
            md_content,
            extensions=['tables', 'fenced_code', 'toc']
        )

        # CSS 스타일
        css = get_pdf_styles(config)

        # HTML 래핑
        full_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>{css}</style>
</head>
<body>
    {html_content}
</body>
</html>
"""

        # PDF 생성
        HTML(string=full_html).write_pdf(str(output_path))
        print(f"  PDF 생성 완료: {output_path}")
        return True

    except ImportError:
        pass

    # ─────────────────────────────────────────────────────────────────────
    # 방법 2: pdfkit 사용 (wkhtmltopdf 필요)
    # ─────────────────────────────────────────────────────────────────────
    try:
        import markdown
        import pdfkit

        html_content = markdown.markdown(
            md_content,
            extensions=['tables', 'fenced_code']
        )

        css = get_pdf_styles(config)
        full_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>{css}</style>
</head>
<body>
    {html_content}
</body>
</html>
"""

        pdfkit.from_string(full_html, str(output_path))
        print(f"  PDF 생성 완료: {output_path}")
        return True

    except ImportError:
        pass

    # ─────────────────────────────────────────────────────────────────────
    # 방법 3: 마크다운 파일만 저장 (PDF 라이브러리 없음)
    # ─────────────────────────────────────────────────────────────────────
    print("  [INFO] PDF 라이브러리가 설치되지 않았습니다.")
    print("  [INFO] 설치 방법: pip install markdown weasyprint")
    print(f"  [INFO] 마크다운 파일 사용: {input_path}")

    return False


def get_pdf_styles(config: Dict[str, Any]) -> str:
    """PDF 스타일 CSS 생성"""
    margins = config.get('margins', {})
    top = margins.get('top', 25)
    bottom = margins.get('bottom', 25)
    left = margins.get('left', 20)
    right = margins.get('right', 20)

    return f"""
@page {{
    size: A4;
    margin: {top}mm {right}mm {bottom}mm {left}mm;
}}

body {{
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #333;
}}

h1 {{
    font-size: 24pt;
    color: #1a1a1a;
    text-align: center;
    margin-bottom: 2em;
    page-break-after: avoid;
}}

h2 {{
    font-size: 16pt;
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.3em;
    margin-top: 2em;
    page-break-after: avoid;
}}

h3 {{
    font-size: 13pt;
    color: #34495e;
    margin-top: 1.5em;
    page-break-after: avoid;
}}

p {{
    text-align: justify;
    margin: 0.8em 0;
}}

table {{
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
}}

th, td {{
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}}

th {{
    background-color: #3498db;
    color: white;
}}

tr:nth-child(even) {{
    background-color: #f9f9f9;
}}

hr {{
    border: none;
    border-top: 1px solid #ddd;
    margin: 2em 0;
}}

code {{
    background-color: #f4f4f4;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Consolas', monospace;
}}

blockquote {{
    border-left: 4px solid #3498db;
    padding-left: 1em;
    margin-left: 0;
    color: #666;
    font-style: italic;
}}

/* 페이지 나누기 */
h2 {{
    page-break-before: auto;
}}

/* 표지 스타일 */
h1:first-of-type {{
    margin-top: 40%;
    text-align: center;
}}
"""


# ═══════════════════════════════════════════════════════════════════════════
# 단독 실행 지원
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python biddoc_export_pdf.py <input_md_file> [output_pdf_file]")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else input_file.with_suffix('.pdf')

    default_config = {
        'page_size': 'A4',
        'margins': {'top': 25, 'bottom': 25, 'left': 20, 'right': 20}
    }

    success = export_to_pdf(input_file, output_file, default_config)
    sys.exit(0 if success else 1)
