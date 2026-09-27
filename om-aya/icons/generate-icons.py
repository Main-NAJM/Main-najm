#!/usr/bin/env python3
"""توليد أيقونات متجر «أم عمر» ولوحة تحكّمه.

أيقونتان مختلفتان عمداً، لتُميَّزا على الشاشة الرئيسية بلمحة:

  المتجر  — صورة صاحبة المتجر (‎source-store.png‎): بيجامة مطويّة على تدرّج
            خوخي، وتحتها اسم المتجر بالعربية والإنجليزية.
  اللوحة  — ثلاثة مقابض ضبط على تدرّج فيروزي ← بنفسجي، وهو تدرّج ترويسة
            اللوحة نفسه. مرسومة هنا بلا نصّ، فالحروف تختفي في الأحجام الصغيرة.

    pip install pillow
    python3 om-aya/icons/generate-icons.py

يكتب لكلٍّ منهما أربعة ملفّات، ولكلٍّ منها قاعدته:

  ‎icon-192/512.png‎        زوايا مدوّرة وشفافة خارجها — للويب وأندرويد.
  ‎icon-maskable-512.png‎   النظام يقصّ منها دائرة، فالمحتوى داخل ٧٤٪ الوسطى
                            وإلّا قُصّ النصّ أسفل الصورة.
  ‎apple-touch-icon.png‎     ١٨٠ بكسل، مربّعة بلا شفافية: الآيفون يدوّر الزوايا
                            بنفسه، والشفافية تصير عنده سواداً.
"""

from pathlib import Path

from PIL import Image, ImageDraw

OUT_DIR = Path(__file__).resolve().parent
SUPERSAMPLE = 4  # نرسم بأربعة أضعاف الحجم ثم نصغّر، فتخرج الحواف ناعمة

SOURCE_STORE = OUT_DIR / "source-store.png"
# إطار المربّع المدوّر داخل الصورة الأصليّة (523×579): فوقه وتحته هامش أبيض.
# الفارق بين ضلعيه أقلّ من ٥٪، فيُضبط بالتحجيم لا بالقصّ حفاظاً على النصّ أسفله.
SOURCE_BOX = (0, 13, 523, 561)

COOL = ((34, 211, 238), (109, 40, 217))  # ‎--grad-cool‎ في ‎index.html‎


# ---------------------------------------------------------------- أدوات عامّة

def rounded(img: Image.Image, radius: float) -> Image.Image:
    """يُلبس الصورةَ قناعاً بزوايا مدوّرة، وما خارجها شفّاف."""
    s = img.size[0]
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * radius), fill=255)
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    out.paste(img.convert("RGB"), mask=mask)
    return out


def vertical_gradient(size: int, top, bottom) -> Image.Image:
    img = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(size - 1, 1)
        draw.line([(0, y), (size, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    return img


def diagonal_gradient(size: int, colors) -> Image.Image:
    """تدرّج قطري كتدرّجات الصفحة (‎linear-gradient(135deg…)‎)."""
    start, end = colors
    img = Image.new("RGB", (size, size))
    pixels = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1)) if size > 1 else 0
            pixels[x, y] = tuple(round(s + (e - s) * t) for s, e in zip(start, end))
    return img


def write(name: str, image: Image.Image) -> None:
    path = OUT_DIR / name
    image.save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(OUT_DIR.parents[1])}  {image.size[0]}×{image.size[1]}")


# ------------------------------------------------------- أيقونة المتجر (صورة)

def store_art(size: int) -> Image.Image:
    art = Image.open(SOURCE_STORE).convert("RGB").crop(SOURCE_BOX)
    return art.resize((size, size), Image.LANCZOS)


def store_edges(art: Image.Image):
    """لونا أعلى الصورة وأسفلها — تُملأ بهما خلفية الأيقونة المقنَّعة."""
    w, h = art.size
    return art.getpixel((w // 2, int(h * 0.06))), art.getpixel((w // 2, int(h * 0.94)))


def build_store() -> None:
    print("المتجر (من الصورة):")
    big = store_art(512 * 2)

    write("icon-192.png", rounded(big.resize((192, 192), Image.LANCZOS), 0.22))
    write("icon-512.png", rounded(big.resize((512, 512), Image.LANCZOS), 0.22))

    # المقنَّعة: الدائرة التي يقصّها النظام تبتلع النصّ أسفل الصورة، فتُصغَّر
    # الصورة إلى ٧٤٪ وتُوضع على خلفية من لونَي حافّتيها فتمتدّ إلى الحوافّ.
    inner = 512 * SUPERSAMPLE
    art = big.resize((int(inner * 0.74),) * 2, Image.LANCZOS)
    canvas = vertical_gradient(inner, *store_edges(big))
    offset = (inner - art.size[0]) // 2
    canvas.paste(rounded(art, 0.16), (offset, offset), rounded(art, 0.16))
    write("icon-maskable-512.png", canvas.resize((512, 512), Image.LANCZOS))

    # الآيفون: مربّعة بملء الإطار وبلا شفافية، وهو يدوّرها بنفسه.
    write("apple-touch-icon.png", big.resize((180, 180), Image.LANCZOS))


# ------------------------------------------------------ أيقونة اللوحة (مرسومة)

def draw_sliders(draw: ImageDraw.ImageDraw, s: int, pad: float) -> None:
    """ثلاثة مقابض ضبط — الرمز المتعارف عليه للتحكّم والإعدادات."""
    box = s * (1 - 2 * pad)
    x0, y0 = s * pad, s * pad
    w = int(max(box * 0.058, 2))
    knob = box * 0.105

    def p(u, v):
        return (x0 + u * box, y0 + v * box)

    for row, knob_u in ((0.16, 0.68), (0.50, 0.34), (0.84, 0.62)):
        draw.line([p(0.03, row), p(0.97, row)], fill=(255, 255, 255), width=w)
        cx, cy = p(knob_u, row)
        draw.ellipse([cx - knob, cy - knob, cx + knob, cy + knob], fill=(255, 255, 255))


def build_admin_icon(size: int, pad: float, radius: float | None) -> Image.Image:
    s = size * SUPERSAMPLE
    img = diagonal_gradient(s, COOL)
    draw_sliders(ImageDraw.Draw(img), s, pad)
    if radius is not None:
        img = rounded(img, radius)
    return img.resize((size, size), Image.LANCZOS)


def build_admin() -> None:
    print("لوحة التحكّم (مرسومة):")
    write("admin-icon-192.png", build_admin_icon(192, 0.20, 0.22))
    write("admin-icon-512.png", build_admin_icon(512, 0.20, 0.22))
    write("admin-icon-maskable-512.png", build_admin_icon(512, 0.28, None))
    write("admin-apple-touch-icon.png", build_admin_icon(180, 0.20, None))


def main() -> None:
    if not SOURCE_STORE.exists():
        raise SystemExit(f"لم توجد صورة المتجر: {SOURCE_STORE}")
    build_store()
    build_admin()


if __name__ == "__main__":
    main()
