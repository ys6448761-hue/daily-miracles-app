"""
MAP V0.1 — Oldtown Boundary Overlay Generator
Founder 검수용 Zone 1·2 PROVISIONAL 경계 시각화
출력: docs/knowledge/MAP-V01-OLDTOWN-BOUNDARY-OVERLAY.png
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

SRC = r"dreamtown-frontend\public\images\muyojeong\map\yeosu-oldtown-v01.png"
OUT = r"docs\knowledge\MAP-V01-OLDTOWN-BOUNDARY-OVERLAY.png"

W, H = 1564, 1006

def to_px(x, y):
    return (int(x * W), int(y * H))

# ── 좌표 데이터 ──────────────────────────────────────────
ZONE1_POLY = [
    (0.10, 0.38), (0.57, 0.38), (0.60, 0.55),
    (0.56, 0.76), (0.28, 0.82), (0.10, 0.65),
]

ZONE2_POLY = [
    (0.57, 0.38), (0.90, 0.15), (0.95, 0.45),
    (0.80, 0.82), (0.60, 0.76), (0.60, 0.55),
]

ZONE1_PLACES = [
    {"name": "이순신광장",   "x": 0.298, "y": 0.512, "confirmed": True},
    {"name": "낭만포차거리", "x": 0.379, "y": 0.582, "confirmed": True},
    {"name": "하멜등대",     "x": 0.518, "y": 0.678, "confirmed": True},
    {"name": "고소동벽화",   "x": 0.406, "y": 0.633, "confirmed": True},
    {"name": "종포해양공원", "x": 0.526, "y": 0.468, "confirmed": True},
    # null coords
    {"name": "수산시장(UV-2)", "x": 0.25, "y": 0.50, "confirmed": False},
    {"name": "진남관",       "x": 0.28, "y": 0.58, "confirmed": False},
    {"name": "오포대",       "x": 0.38, "y": 0.67, "confirmed": False},
]

ZONE2_PLACES = [
    {"name": "오동도",       "x": 0.870, "y": 0.280, "confirmed": True,  "anchor": True},
    {"name": "케이블카(자산)", "x": 0.692, "y": 0.572, "confirmed": True},
    {"name": "자산공원",     "x": 0.650, "y": 0.483, "confirmed": True},
    {"name": "엑스포공원",   "x": 0.478, "y": 0.418, "confirmed": True,  "conflict": True},
    {"name": "스카이타워",   "x": 0.512, "y": 0.432, "confirmed": True,  "conflict": True},
    # null coords — estimated region
    {"name": "엑스포역",     "x": 0.50, "y": 0.35, "confirmed": False},
    {"name": "아쿠아플라넷", "x": 0.74, "y": 0.42, "confirmed": False},
]

# ── 점선 폴리곤 그리기 ──────────────────────────────────
def draw_dashed_polygon(draw, poly_norm, color, dash=18, gap=10, width=4):
    pts = [to_px(x, y) for x, y in poly_norm]
    pts.append(pts[0])  # 닫기
    for i in range(len(pts) - 1):
        x0, y0 = pts[i]
        x1, y1 = pts[i + 1]
        dx, dy = x1 - x0, y1 - y0
        seg_len = math.hypot(dx, dy)
        if seg_len == 0:
            continue
        ux, uy = dx / seg_len, dy / seg_len
        pos = 0
        drawing = True
        while pos < seg_len:
            end = min(pos + (dash if drawing else gap), seg_len)
            if drawing:
                sx = x0 + ux * pos
                sy = y0 + uy * pos
                ex = x0 + ux * end
                ey = y0 + uy * end
                draw.line([(sx, sy), (ex, ey)], fill=color, width=width)
            pos = end
            drawing = not drawing

# ── 마커 그리기 ──────────────────────────────────────────
def draw_marker(draw, x, y, confirmed, conflict=False, anchor=False, r=14):
    px, py = to_px(x, y)
    if anchor:
        # 오동도: 별 모양 표시 (큰 원 + X)
        draw.ellipse([px-r-4, py-r-4, px+r+4, py+r+4], fill=(255, 220, 0, 220), outline=(200, 160, 0, 255), width=3)
        draw.line([(px-r, py), (px+r, py)], fill=(100, 70, 0, 255), width=3)
        draw.line([(px, py-r), (px, py+r)], fill=(100, 70, 0, 255), width=3)
    elif conflict:
        # 충돌 가능: 노란 테두리 + 경고색
        draw.ellipse([px-r, py-r, px+r, py+r], fill=(255, 180, 0, 200), outline=(220, 100, 0, 255), width=4)
    elif confirmed:
        fill = (80, 200, 255, 220)
        draw.ellipse([px-r, py-r, px+r, py+r], fill=fill, outline=(20, 100, 180, 255), width=3)
    else:
        # 미검증: 흰색 속 + 회색 테두리 + 점선 느낌
        draw.ellipse([px-r, py-r, px+r, py+r], fill=(220, 220, 220, 160), outline=(100, 100, 100, 200), width=3)
        draw.ellipse([px-3, py-3, px+3, py+3], fill=(100, 100, 100, 200))

def draw_label(draw, text, x, y, confirmed, offset_x=16, offset_y=-8, font=None):
    px, py = to_px(x, y)
    color = (20, 20, 20, 230) if confirmed else (90, 90, 90, 180)
    shadow = (255, 255, 255, 200)
    tx, ty = px + offset_x, py + offset_y
    # 그림자
    for dx, dy in [(-1,-1),(1,-1),(-1,1),(1,1),(0,-2),(0,2),(-2,0),(2,0)]:
        draw.text((tx+dx, ty+dy), text, fill=shadow, font=font)
    draw.text((tx, ty), text, fill=color, font=font)

# ── 범례 ────────────────────────────────────────────────
def draw_legend(draw, font=None):
    x0, y0 = 28, 28
    items = [
        ("Zone 1 원도심 PROVISIONAL 경계", (30, 200, 180, 230), "z1"),
        ("Zone 2 오동도·엑스포 PROVISIONAL 경계", (255, 140, 40, 230), "z2"),
        ("확인된 장소 좌표 (GPS 기반)", (80, 200, 255, 220), "c"),
        ("⚠ 경계 충돌 가능 (Zone 오귀속 불명)", (255, 180, 0, 200), "w"),
        ("미검증 위치 추정 (null coords)", (180, 180, 180, 200), "u"),
        ("★ 기준점 오동도 (CONFIRMED)", (255, 220, 0, 220), "a"),
    ]
    bg_w, bg_h = 530, len(items) * 36 + 20
    # 반투명 배경
    overlay = Image.new("RGBA", (bg_w, bg_h), (255, 255, 255, 200))
    draw_bg = ImageDraw.Draw(overlay)
    draw_bg.rectangle([0, 0, bg_w-1, bg_h-1], outline=(180, 180, 180, 220), width=2)
    for i, (label, color, kind) in enumerate(items):
        ly = 10 + i * 36
        lx = 14
        if kind in ("z1", "z2"):
            # 점선 미니
            dash_color = color
            for d in range(0, 32, 10):
                draw_bg.line([(lx + d, ly + 10), (lx + d + 7, ly + 10)], fill=dash_color, width=3)
        elif kind == "a":
            draw_bg.ellipse([lx, ly+2, lx+18, ly+18], fill=color, outline=(180, 140, 0, 255), width=2)
            draw_bg.line([(lx+4, ly+10), (lx+14, ly+10)], fill=(100,70,0,255), width=2)
            draw_bg.line([(lx+9, ly+4), (lx+9, ly+16)], fill=(100,70,0,255), width=2)
        elif kind == "w":
            draw_bg.ellipse([lx+2, ly+2, lx+16, ly+18], fill=color, outline=(220, 100, 0, 255), width=2)
        elif kind == "c":
            draw_bg.ellipse([lx+2, ly+2, lx+16, ly+18], fill=color, outline=(20, 100, 180, 255), width=2)
        elif kind == "u":
            draw_bg.ellipse([lx+2, ly+2, lx+16, ly+18], fill=(220,220,220,160), outline=(100,100,100,200), width=2)
            draw_bg.ellipse([lx+8, ly+8, lx+10, ly+10], fill=(100,100,100,200))
        text_color = (30, 30, 30, 255)
        draw_bg.text((lx + 28, ly + 2), label, fill=text_color, font=font)
    return overlay, (x0, y0)

# ── 타이틀 배너 ──────────────────────────────────────────
def draw_title(draw, font=None):
    lines = [
        "MAP V0.1 — Zone 1·2 PROVISIONAL 경계 시안",
        "기준점: 오동도(★) x=0.87, y=0.28 단일 역산  |  불확실도 HIGH  |  Founder 검수 전 미공개",
    ]
    bx, by = 28, H - 90
    bw, bh = 900, 80
    overlay = Image.new("RGBA", (bw, bh), (20, 20, 40, 210))
    draw_bg = ImageDraw.Draw(overlay)
    draw_bg.text((14, 6), lines[0], fill=(255, 255, 255, 255), font=font)
    draw_bg.text((14, 42), lines[1], fill=(200, 200, 200, 220), font=font)
    return overlay, (bx, by)

# ── 충돌 경고 화살표 영역 ────────────────────────────────
def draw_conflict_note(img_draw, font=None):
    # 엑스포공원·스카이타워 근처에 경고 텍스트
    ex, ey = to_px(0.478, 0.418)
    note = "⚠ 경계 충돌?\n(Zone 2이지만\n경계 서쪽에 위치)"
    # 반투명 박스
    bx, by = ex + 18, ey - 60
    img_draw.rectangle([bx-4, by-4, bx+200, by+72], fill=(255, 240, 180, 200), outline=(220, 150, 0, 220), width=2)
    img_draw.text((bx+2, by+2), note, fill=(140, 80, 0, 230), font=font)
    # 화살표 선
    img_draw.line([(ex+14, ey-4), (bx-4, by+36)], fill=(200, 120, 0, 200), width=2)

# ── MAIN ────────────────────────────────────────────────
def main():
    base = Image.open(SRC).convert("RGBA")
    overlay_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay_layer)

    # Zone 1 채우기 (매우 연한 teal)
    z1_px = [to_px(x, y) for x, y in ZONE1_POLY]
    draw.polygon(z1_px, fill=(30, 200, 180, 30))

    # Zone 2 채우기 (매우 연한 orange)
    z2_px = [to_px(x, y) for x, y in ZONE2_POLY]
    draw.polygon(z2_px, fill=(255, 140, 40, 25))

    # Zone 1 경계선
    draw_dashed_polygon(draw, ZONE1_POLY, (30, 200, 180, 230), dash=22, gap=10, width=5)

    # Zone 2 경계선
    draw_dashed_polygon(draw, ZONE2_POLY, (255, 140, 40, 230), dash=22, gap=10, width=5)

    # 분리선 강조 (x≈0.58 세로선)
    bx = int(0.585 * W)
    for seg_y in range(int(0.35 * H), int(0.80 * H), 24):
        draw.line([(bx, seg_y), (bx, seg_y + 14)], fill=(180, 80, 220, 160), width=3)

    # 마커
    try:
        font_path = r"C:\Windows\Fonts\malgun.ttf"
        font_sm = ImageFont.truetype(font_path, 20)
        font_xs = ImageFont.truetype(font_path, 17)
    except Exception:
        font_sm = ImageFont.load_default()
        font_xs = font_sm

    for p in ZONE1_PLACES:
        draw_marker(draw, p["x"], p["y"], p["confirmed"])
        draw_label(draw, p["name"], p["x"], p["y"], p["confirmed"], font=font_sm)

    for p in ZONE2_PLACES:
        draw_marker(draw, p["x"], p["y"], p["confirmed"],
                    conflict=p.get("conflict", False),
                    anchor=p.get("anchor", False))
        draw_label(draw, p["name"], p["x"], p["y"], p["confirmed"], font=font_sm)

    # 충돌 경고
    draw_conflict_note(draw, font=font_xs)

    # 합성
    composite = Image.alpha_composite(base, overlay_layer)
    draw2 = ImageDraw.Draw(composite)

    # 범례
    legend_img, legend_pos = draw_legend(draw2, font=font_xs)
    composite.paste(legend_img, legend_pos, legend_img)

    # 타이틀
    title_img, title_pos = draw_title(draw2, font=font_sm)
    composite.paste(title_img, title_pos, title_img)

    composite.save(OUT, "PNG")
    print(f"✅ 저장 완료: {OUT}")
    # 크기 확인
    final = Image.open(OUT)
    print(f"   크기: {final.size}, 모드: {final.mode}")

if __name__ == "__main__":
    main()
