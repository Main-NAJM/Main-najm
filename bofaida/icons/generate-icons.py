#!/usr/bin/env python3
"""توليد أيقونات «BOFAIDA ADS».

الرمز: مثلّث تشغيل داخل إطار، وشرارة إلى جانبه — فيديو صُنع بالذكاء
الاصطناعي، بلا نصّ حتى يبقى واضحاً في الأحجام الصغيرة، وبألوان الموقع نفسها.

    pip install pillow
    python3 bofaida/icons/generate-icons.py

يكتب: icon-192.png و icon-512.png و icon-maskable-512.png و apple-touch-icon.png
"""

from pathlib import Path

from PIL import Image, ImageDraw

INK = (20, 16, 13)  # ‎#14100D — حبر الموقع، خلفية الأيقونة
FLAME = (240, 78, 35)  # ‎#F04E23 — البرتقالي المميّز
CREAM = (251, 248, 245)  # ‎#FBF8F5 — جسم المكبّر

OUT_DIR = Path(__file__).resolve().parent
SUPERSAMPLE = 4  # نرسم بأربعة أضعاف الحجم ثم نصغّر، فتخرج الحواف ناعمة


def draw_icon(size: int, padding: float) -> Image.Image:
    """يرسم الأيقونة بحجم size بكسل. padding نسبة الهامش حول الرمز."""
    s = size * SUPERSAMPLE
    img = Image.new("RGB", (s, s), INK)
    draw = ImageDraw.Draw(img)

    pad = s * padding
    box = s - pad * 2

    # إطار الفيديو: مربّع بزوايا ناعمة، وداخله مثلّث التشغيل.
    frame = box * 0.86
    fx = pad
    fy = pad + (box - frame) / 2
    stroke = max(int(box * 0.085), 2)
    draw.rounded_rectangle(
        [fx, fy, fx + frame, fy + frame],
        radius=frame * 0.22,
        outline=CREAM,
        width=stroke,
    )

    # مثلّث التشغيل، متوازن بصرياً لا حسابياً: يُزاح قليلاً نحو اليمين لأن
    # العين تراه أثقل من جهة القاعدة.
    cx = fx + frame / 2 + frame * 0.04
    cy = fy + frame / 2
    h = frame * 0.40
    w = h * 0.88
    draw.polygon(
        [(cx - w * 0.5, cy - h / 2), (cx - w * 0.5, cy + h / 2), (cx + w * 0.62, cy)],
        fill=FLAME,
    )

    # الشرارة: أربع نقاط نجمية في الزاوية العليا — إشارة الذكاء الاصطناعي.
    sx = fx + frame * 0.94
    sy = fy - frame * 0.02
    r = box * 0.13
    draw.polygon(
        [(sx, sy - r), (sx + r * 0.3, sy - r * 0.3), (sx + r, sy),
         (sx + r * 0.3, sy + r * 0.3), (sx, sy + r),
         (sx - r * 0.3, sy + r * 0.3), (sx - r, sy),
         (sx - r * 0.3, sy - r * 0.3)],
        fill=FLAME,
    )

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    outputs = [
        ("icon-192.png", 192, 0.20),
        ("icon-512.png", 512, 0.20),
        # نسخة maskable: هامش أوسع لأن أندرويد يقصّ الأيقونة بأشكال مختلفة.
        ("icon-maskable-512.png", 512, 0.28),
        ("apple-touch-icon.png", 180, 0.20),
    ]

    for name, size, padding in outputs:
        draw_icon(size, padding).save(OUT_DIR / name, "PNG", optimize=True)
        print(f"كُتبت {name} ({size}×{size})")


if __name__ == "__main__":
    main()
