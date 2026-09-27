#!/usr/bin/env python3
"""توليد أيقونات «BOFAIDA ADS» من شعار الوكالة.

المصدر `source-logo.png` صورة عرض (mockup): الشعار على هاتف. فتُقصّ منها
مربّعة الشعار وحدها، ثم تُبنى منها مقاسات التطبيق.

    pip install pillow
    python3 bofaida/icons/generate-icons.py

يكتب: icon-192.png و icon-512.png و icon-maskable-512.png و apple-touch-icon.png
ومعها logo-mark.png — الطائر وحده لرأس الصفحة.
"""

from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "source-logo.png"

# حدود مربّعة الشعار داخل صورة العرض، بالبكسل.
CROP = (496, 174, 912, 592)

# زوايا الشعار مستديرة، وخلفها في صورة العرض رماديٌّ فاتح. لو بقي كما هو
# لظهرت أربع بقع فاتحة في زوايا الأيقونة على الشاشة. فتُملأ الزوايا بلون
# مأخوذ من حافّة الشعار نفسه — لا بلون مخترع — فلا يُرى وصلٌ بينهما.
CORNER_RADIUS = 0.185  # نسبة من ضلع المربّع، مقدّرة من الشعار

# النسخة الـmaskable يقصّها أندرويد بأشكال مختلفة (دائرة، مربّع، قطرة)،
# فيُصغَّر الشعار داخلها ويُحاط بلونه حتى لا يُقصّ من التصميم شيء.
MASKABLE_SCALE = 0.70


def tile() -> Image.Image:
    """يقصّ مربّعة الشعار ويملأ زواياها بلون حافّتها."""
    source = Image.open(SOURCE).convert("RGB")
    cut = source.crop(CROP)
    size = min(cut.size)
    cut = cut.resize((size, size), Image.LANCZOS)

    # لون الحافّة: من منتصف الضلع الأيسر، داخل الشعار بقليل.
    edge = cut.getpixel((int(size * 0.02), size // 2))

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=int(size * CORNER_RADIUS), fill=255
    )
    return Image.composite(cut, Image.new("RGB", (size, size), edge), mask)


# في رأس الصفحة يظهر الشعار عند 38 بكسل، وفيه سطران من النصّ يصيران عندها
# لطخة. فيُقصّ الطائر وحده: يُعرف من بعيد ويبقى نظيفًا في الحجم الصغير.
BIRD = (0.07, 0.07, 0.95, 0.565)  # نسب من ضلع المربّعة


def bird_mark(base: Image.Image, size: int) -> Image.Image:
    side = base.width
    box = tuple(int(side * r) for r in BIRD)
    bird = base.crop(box)
    edge = base.getpixel((int(side * 0.02), side // 2))
    canvas_side = max(bird.size)
    canvas = Image.new("RGB", (canvas_side, canvas_side), edge)
    canvas.paste(bird, ((canvas_side - bird.width) // 2, (canvas_side - bird.height) // 2))
    mask = Image.new("L", (canvas_side, canvas_side), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, canvas_side - 1, canvas_side - 1], radius=int(canvas_side * 0.22), fill=255
    )
    flat = Image.composite(canvas, Image.new("RGB", (canvas_side, canvas_side), edge), mask)
    return flat.resize((size, size), Image.LANCZOS)


def maskable(base: Image.Image, size: int) -> Image.Image:
    inner = int(size * MASKABLE_SCALE)
    edge = base.getpixel((int(base.width * 0.02), base.height // 2))
    canvas = Image.new("RGB", (size, size), edge)
    canvas.paste(base.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2,) * 2)
    return canvas


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"لم يُعثر على {SOURCE.name} بجانب هذا السكربت.")

    base = tile()
    print(f"قُصّت مربّعة الشعار: {base.width}×{base.height}")

    for name, size in [("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)]:
        base.resize((size, size), Image.LANCZOS).save(HERE / name, "PNG", optimize=True)
        print(f"كُتبت {name} ({size}×{size})")

    maskable(base, 512).save(HERE / "icon-maskable-512.png", "PNG", optimize=True)
    print("كُتبت icon-maskable-512.png (512×512، بهامش القصّ)")

    bird_mark(base, 152).save(HERE / "logo-mark.png", "PNG", optimize=True)
    print("كُتبت logo-mark.png (152×152، الطائر وحده لرأس الصفحة)")


if __name__ == "__main__":
    main()
