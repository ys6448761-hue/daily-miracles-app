"""
MAP V0.1 — Zone 2 Boundary Correction Before/After Comparison
출력: docs/knowledge/MAP-V01-ZONE2-BOUNDARY-CORRECTION-COMPARE.png
"""
from PIL import Image, ImageDraw, ImageFont
import math

SRC = r"dreamtown-frontend\public\images\muyojeong\map\yeosu-oldtown-v01.png"
OUT = r"docs\knowledge\MAP-V01-ZONE2-BOUNDARY-CORRECTION-COMPARE.png"

W, H = 1564, 1006

def to_px(x, y):
    return (int(x * W), int(y * H))

ZONE1_POLY = [
    (0.10, 0.38), (0.57, 0.38), (0.60, 0.55),
    (0.56, 0.76), (0.28, 0.82), (0.10, 0.65),
]

ZONE2_BEFORE = [
    (0.57, 0.38), (0.90, 0.15), (0.95, 0.45),
    (0.80, 0.82), (0.60, 0.76), (0.60, 0.55),
]

ZONE2_AFTER = [
    (0.47, 0.30), (0.90, 0.14), (0.96, 0.46),
    (0.74, 0.63), (0.57, 0.63), (0.56, 0.40),
]

def draw_dashed_polygon(draw, poly_norm, color, dash=22, gap=10, width=5):
    pts = [to_px(x, y) for x, y in poly_norm]
    pts.append(pts[0])
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
                sx, sy = x0 + ux * pos, y0 + uy * pos
                ex, ey = x0 + ux * end, y0 + uy * end
                draw.line([(sx, sy), (ex, ey)], fill=color, width=width)
            pos = end
            drawing = not drawing

def make_panel(base, zone2_poly, label, note, font_lg, font_sm):
    """단일 패널 (Zone 1 + Zone 2 경계)"""
    img = base.copy().convert("RGBA")
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(ov)

    # Zone 1 채우기 (연한 청록)
    z1_px = [to_px(x, y) for x, y in ZONE1_POLY]
    draw.polygon(z1_px, fill=(30, 200, 180, 22))
    draw_dashed_polygon(draw, ZONE1_POLY, (30, 200, 180, 200), width=4)

    # Zone 2 채우기
    z2_px = [to_px(x, y) for x, y in zone2_poly]
    draw.polygon(z2_px, fill=(184, 244, 255, 25))
    draw_dashed_polygon(draw, zone2_poly, (80, 220, 255, 220), width=5)

    # 오동도 기준점
    ox, oy = to_px(0.87, 0.28)
    draw.ellipse([ox-14, oy-14, ox+14, oy+14], fill=(255, 215, 0, 200), outline=(160, 120, 0, 255), width=3)
    draw.line([(ox-10, oy), (ox+10, oy)], fill=(80, 50, 0, 255), width=3)
    draw.line([(ox, oy-10), (ox, oy+10)], fill=(80, 50, 0, 255), width=3)

    # 엑스포역 추정 마커
    ex, ey = to_px(0.490, 0.320)
    draw.ellipse([ex-10, ey-10, ex+10, ey+10], fill=(200, 200, 200, 150), outline=(100, 100, 100, 200), width=3)

    # SE corner 표시 (돌산 침범 여부)
    se_x, se_y = to_px(zone2_poly[-3][0], zone2_poly[-3][1])
    draw.ellipse([se_x-12, se_y-12, se_x+12, se_y+12], fill=(255, 80, 80, 180), outline=(200, 0, 0, 220), width=3)

    composite = Image.alpha_composite(img, ov)
    draw2 = ImageDraw.Draw(composite)

    # 상단 라벨
    bx, by = 16, 16
    bw, bh = 720, 78
    ov2 = Image.new("RGBA", (bw, bh), (20, 20, 40, 220))
    draw3 = ImageDraw.Draw(ov2)
    draw3.text((14, 6), label, fill=(255, 255, 255, 255), font=font_lg)
    draw3.text((14, 42), note, fill=(200, 200, 200, 210), font=font_sm)
    composite.paste(ov2, (bx, by), ov2)

    return composite

def main():
    base = Image.open(SRC).convert("RGBA")
    try:
        font_lg = ImageFont.truetype(r"C:\Windows\Fonts\malgun.ttf", 26)
        font_sm = ImageFont.truetype(r"C:\Windows\Fonts\malgun.ttf", 19)
    except Exception:
        font_lg = ImageFont.load_default()
        font_sm = font_lg

    before = make_panel(base, ZONE2_BEFORE,
        "BEFORE — Zone 2 경계 (수정 전)",
        "SE(0.80,0.82) 돌산 방향 침범 / 여수엑스포역 미포함",
        font_lg, font_sm)

    after = make_panel(base, ZONE2_AFTER,
        "AFTER — Zone 2 경계 (수정 후, PROVISIONAL)",
        "SE(0.74,0.63) 돌산 제외 / 엑스포역 추정 포함(NW 확장) / 회색점=엑스포역 / 빨간점=SE corner",
        font_lg, font_sm)

    # 나란히 합치기 (세로 2장)
    combined = Image.new("RGBA", (W, H * 2 + 12), (15, 15, 25, 255))
    combined.paste(before, (0, 0))
    combined.paste(after, (0, H + 12))

    # 구분선
    draw_sep = ImageDraw.Draw(combined)
    draw_sep.line([(0, H + 6), (W, H + 6)], fill=(100, 100, 120, 255), width=12)

    combined.save(OUT, "PNG")
    print(f"✅ 비교 이미지 저장: {OUT}")
    print(f"   크기: {combined.size}")

if __name__ == "__main__":
    main()
