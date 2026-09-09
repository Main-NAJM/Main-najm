#!/usr/bin/env python3
"""توليد أيقونات تطبيق «مؤسسة الباشة للمعادن».

الرمز: باب/نافذة بإطار مقوّس — إشارة مباشرة إلى صناعة الأبواب والنوافذ،
بلا نصّ حتى يبقى واضحاً في الأحجام الصغيرة وبألوان الموقع نفسها.

    pip install pillow
    python3 site/icons/generate-icons.py

يكتب: icon-192.png و icon-512.png و icon-maskable-512.png و apple-touch-icon.png
"""

from pathlib import Path

from PIL import Image, ImageDraw

INK = (30, 27, 23)  # ‎#1E1B17 خلفية داكنة كخلفية تذييل الموقع
GOLD = (150, 112, 60)  # ‎#96703C اللون المميّز في الموقع
GOLD_SOFT = (183, 145, 88)

OUT_DIR = Path(__file__).resolve().parent
SUPERSAMPLE = 4  # نرسم بأربعة أضعاف الحجم ثم نصغّر، فتخرج الحواف ناعمة


def draw_icon(size: int, padding: float) -> Image.Image:
    """يرسم الأيقونة بحجم size بكسل. padding نسبة الهامش حول الرمز."""
    s = size * SUPERSAMPLE
    img = Image.new("RGB", (s, s), INK)
    draw = ImageDraw.Draw(img)

    # حدود الباب داخل الهامش الآمن.
    left = s * padding
    right = s - left
    top = s * (padding * 0.92)
    bottom = s - s * (padding * 0.86)
    width = right - left
    stroke = max(int(s * 0.045), 2)
    arch_r = width / 2
    arch_base = top + arch_r  # نهاية القوس وبداية الجسم المستقيم

    # القوس العلوي. يرسم Pillow القوس إلى داخل الإطار بينما يتوسّط الخطُّ إحداثياته،
    # لذا يُوسَّع إطار القوس بنصف سماكة من كل جهة حتى يلتقي بالقائمين بلا نتوء.
    half = stroke / 2
    draw.arc(
        [left - half, top - half, right + half, top + width + half],
        start=180,
        end=360,
        fill=GOLD,
        width=stroke,
    )
    # الجانبان والقاعدة.
    draw.line([left, arch_base, left, bottom], fill=GOLD, width=stroke)
    draw.line([right, arch_base, right, bottom], fill=GOLD, width=stroke)
    draw.line([left - stroke / 2, bottom, right + stroke / 2, bottom], fill=GOLD, width=stroke)

    # القائم الأوسط: مصراعان.
    mid = (left + right) / 2
    draw.line([mid, top + width * 0.16, mid, bottom], fill=GOLD, width=stroke)

    # حاملان أفقيان يقسمان المصراعين.
    for ratio in (0.42, 0.72):
        y = arch_base + (bottom - arch_base) * ratio
        draw.line([left, y, right, y], fill=GOLD_SOFT, width=int(stroke * 0.7))

    # مقبضان صغيران على جانبي القائم.
    handle_y = arch_base + (bottom - arch_base) * 0.57
    handle_r = s * 0.016
    gap = s * 0.035
    for cx in (mid - gap, mid + gap):
        draw.ellipse(
            [cx - handle_r, handle_y - handle_r, cx + handle_r, handle_y + handle_r],
            fill=GOLD_SOFT,
        )

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    outputs = [
        ("icon-192.png", 192, 0.24),
        ("icon-512.png", 512, 0.24),
        # نسخة maskable: هامش أوسع لأن أندرويد يقصّ الأيقونة بأشكال مختلفة.
        ("icon-maskable-512.png", 512, 0.30),
        ("apple-touch-icon.png", 180, 0.24),
    ]

    for name, size, padding in outputs:
        draw_icon(size, padding).save(OUT_DIR / name, "PNG", optimize=True)
        print(f"كُتبت {name} ({size}×{size})")


if __name__ == "__main__":
    main()
