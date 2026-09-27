#!/usr/bin/env python3
"""توليد أيقونات «استوديو بوفايدة».

الرمز: شرارة كبيرة وشرارتان صغيرتان — أداة توليد، لا صفحة عرض. تختلف عن
أيقونة الموقع (مثلّث التشغيل) عمداً: الاثنتان تجلسان في شاشة واحدة على
هاتف ناجم، فلا بدّ أن تُفرَّقا بلمحة.

    pip install pillow
    python3 studio/icons/generate-icons.py

يكتب: icon-192.png و icon-512.png و icon-maskable-512.png و apple-touch-icon.png
"""

from pathlib import Path

from PIL import Image, ImageDraw

INK = (20, 16, 13)  # ‎#14100D
FLAME = (240, 78, 35)  # ‎#F04E23
CREAM = (251, 248, 245)  # ‎#FBF8F5

OUT_DIR = Path(__file__).resolve().parent
SUPERSAMPLE = 4


def spark(draw, cx: float, cy: float, r: float, fill) -> None:
    """شرارة رباعية: أطرافها حادّة وخصرها ضيّق، فتُقرأ لمعاناً لا نجمة."""
    w = r * 0.26
    draw.polygon(
        [
            (cx, cy - r), (cx + w, cy - w), (cx + r, cy), (cx + w, cy + w),
            (cx, cy + r), (cx - w, cy + w), (cx - r, cy), (cx - w, cy - w),
        ],
        fill=fill,
    )


def draw_icon(size: int, padding: float) -> Image.Image:
    s = size * SUPERSAMPLE
    img = Image.new("RGB", (s, s), INK)
    draw = ImageDraw.Draw(img)

    pad = s * padding
    box = s - pad * 2

    # الشرارة الكبرى مزاحة قليلاً نحو الأسفل واليسار، كي تتّسع الزاوية
    # العليا لشرارتَي البرتقالي فلا تتزاحم الأشكال.
    spark(draw, pad + box * 0.44, pad + box * 0.56, box * 0.46, CREAM)
    spark(draw, pad + box * 0.84, pad + box * 0.20, box * 0.20, FLAME)
    spark(draw, pad + box * 0.20, pad + box * 0.14, box * 0.11, FLAME)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    outputs = [
        ("icon-192.png", 192, 0.16),
        ("icon-512.png", 512, 0.16),
        # نسخة maskable: هامش أوسع لأن أندرويد يقصّ الأيقونة بأشكال مختلفة.
        ("icon-maskable-512.png", 512, 0.26),
        ("apple-touch-icon.png", 180, 0.16),
    ]
    for name, size, padding in outputs:
        draw_icon(size, padding).save(OUT_DIR / name, "PNG", optimize=True)
        print(f"كُتبت {name} ({size}×{size})")


if __name__ == "__main__":
    main()
