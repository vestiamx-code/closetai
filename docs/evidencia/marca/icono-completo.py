"""
The square icon with the whole wordmark, from Tamara's logo (Oct 29, 2026).

She asked for "CLOSET AI" in the tab, not only "AI". The letters are cut out of
her logo (only the brown-to-orange ink, no background); the pink network, which
in the logo is a glow that can't be cut out cleanly, is redrawn in its color
behind the "AI". Called from derivar-logo.py.
"""
import colorsys
import math

from PIL import Image, ImageDraw, ImageFilter

CREMA = (246, 238, 230, 255)
ROSA = (236, 132, 210)


def _letras(logo: Image.Image, caja) -> Image.Image:
    im = logo.crop(caja)
    px = im.load()
    alfa = Image.new("L", im.size, 0)
    a = alfa.load()
    for x in range(im.width):
        for y in range(im.height):
            r, g, b = px[x, y]
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            if l < 0.55 and s > 0.25 and (h < 0.14 or h > 0.97):  # the brown and orange letters
                a[x, y] = 255
    # Without isolated specks (bits of the closet behind the letters).
    alfa = alfa.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(0.6))
    im = im.convert("RGBA")
    im.putalpha(alfa)
    return im


def _red(tam: int) -> Image.Image:
    """The network around the "AI": an outer ring of nodes, a few inside, joined."""
    capa = Image.new("RGBA", (tam, tam), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    cx = cy = tam / 2
    afuera = [(cx + tam * 0.46 * math.cos(math.radians(-90 + i * 45)), cy + tam * 0.46 * math.sin(math.radians(-90 + i * 45))) for i in range(8)]
    adentro = [(cx + tam * 0.22 * math.cos(math.radians(-60 + i * 72)), cy + tam * 0.22 * math.sin(math.radians(-60 + i * 72))) for i in range(5)]
    # Light on purpose: behind the letters, a busy network makes them harder to read.
    lineas = [(afuera[i], afuera[(i + 1) % 8]) for i in range(8)]
    lineas += [(afuera[i], adentro[(i * 5) // 8]) for i in range(0, 8, 2)]
    lineas += [(adentro[i], adentro[(i + 1) % 5]) for i in range(5)]
    grosor = max(2, tam // 110)
    for p, q in lineas:
        d.line([p, q], fill=ROSA + (120,), width=grosor)
    for x, y in afuera + adentro:
        r = tam * 0.028
        d.ellipse((x - r, y - r, x + r, y + r), fill=(250, 220, 242, 255), outline=ROSA + (230,), width=grosor)
    # The glow is pink light, not a shadow: a solid pink layer whose opacity is
    # the blurred shape (blurring the transparent layer itself would darken it).
    sombra = capa.getchannel("A").filter(ImageFilter.GaussianBlur(tam / 30)).point(lambda v: int(v * 0.55))
    brillo = Image.new("RGBA", capa.size, ROSA + (0,))
    brillo.putalpha(sombra)
    return Image.alpha_composite(brillo, capa)


def icono_completo(logo: Image.Image) -> Image.Image:
    lienzo = Image.new("RGBA", (512, 512), CREMA)
    closet = _letras(logo, (322, 300, 908, 430))
    ai = _letras(logo, (930, 300, 1090, 425))  # the "AI" letters only; the network is drawn
    c = closet.resize((470, round(470 * closet.height / closet.width)), Image.LANCZOS)
    a = ai.resize((round(200 * ai.width / ai.height), 200), Image.LANCZOS)
    red = _red(290)
    y = 70
    lienzo.alpha_composite(c, ((512 - c.width) // 2, y))
    y_ai = y + c.height + 40
    lienzo.alpha_composite(red, ((512 - red.width) // 2, y_ai + a.height // 2 - red.height // 2))
    lienzo.alpha_composite(a, ((512 - a.width) // 2, y_ai))
    return lienzo
