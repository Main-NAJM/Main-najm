#!/usr/bin/env python3
"""توليد أيقونات «BOFAIDA ADS».

الرمز: مكبّر صوت مبسّط بموجتين — إشارة مباشرة إلى الإعلان، بلا نصّ حتى يبقى
واضحاً في الأحجام الصغيرة، وبألوان الموقع نفسها.

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
    cy = s / 2

    # جسم المكبّر: مستطيل صغير (الفوهة الخلفية) يليه مثلّث مفتوح نحو اليمين.
    # يتّجه الصوت يميناً لأن الشكل يُقرأ أفقياً في كل الاتجاهات، والأيقونة
    # المربّعة لا اتجاه لها.
    back_w = box * 0.20
    back_h = box * 0.30
    back_x = pad + box * 0.06
    draw.rounded_rectangle(
        [back_x, cy - back_h / 2, back_x + back_w, cy + back_h / 2],
        radius=back_w * 0.22,
        fill=CREAM,
    )

    horn_x = back_x + back_w
    horn_w = box * 0.26
    horn_h = box * 0.62
    draw.polygon(
        [
            (horn_x - back_w * 0.1, cy - back_h / 2),
            (horn_x + horn_w, cy - horn_h / 2),
            (horn_x + horn_w, cy + horn_h / 2),
            (horn_x - back_w * 0.1, cy + back_h / 2),
        ],
        fill=CREAM,
    )

    # موجتان صوتيّتان: قوسان بالبرتقالي.
    stroke = max(int(box * 0.075), 2)
    for i, ratio in enumerate((0.34, 0.52)):
        r = box * ratio
        cx = horn_x + horn_w * 0.55
        draw.arc(
            [cx - r, cy - r, cx + r, cy + r],
            start=-52,
            end=52,
            fill=FLAME,
            width=stroke - i * int(stroke * 0.18),
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
