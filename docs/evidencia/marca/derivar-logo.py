"""
Every brand file comes from Tamara's logo (logo-closetai.jpg, chosen on Oct 29, 2026).

  · The square icon (browser tab, Google results, phone home screen, the chat's
    avatar) is the "AI" with its network, cropped from the logo: at 16 to 48
    pixels the whole wordmark can't be read.
  · The link preview (WhatsApp, iMessage, social) is the logo without its
    tagline, which is headline A of the homepage experiment.

Usage (repo root): python3 docs/evidencia/marca/derivar-logo.py
"""
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parents[3]
logo = Image.open(Path(__file__).with_name("logo-closetai.jpg")).convert("RGB")

# The "AI" and its network, without the T before it or "pocket" below it.
icono = logo.crop((912, 255, 1092, 435))
# Browsers and Next.js read the .ico layers as RGBA.
icono_rgba = icono.convert("RGBA")

app = RAIZ / "src/app"
icono.resize((256, 256), Image.LANCZOS).save(app / "icon.png")
icono.resize((180, 180), Image.LANCZOS).save(app / "apple-icon.png")
icono_rgba.save(app / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

publico = RAIZ / "public/marca"
publico.mkdir(exist_ok=True)
icono.resize((96, 96), Image.LANCZOS).save(publico / "icono-96.png")
logo.save(publico / "logo-closetai.jpg", quality=90)

# 1200×630 for link previews, WITHOUT the tagline. "Your stylist in your pocket"
# is headline A of the homepage experiment: in every shared link it would show
# variant A to people who then land in group B. Tamara chose this version on
# Oct 29, 2026. The band with the tagline (rows 448–512) is cut out and the seam
# blended; the phrase can come back when the experiment ends.
W, H = logo.size
corte_arriba, corte_abajo, mezcla = 448, 512, 24
sin_frase = Image.new("RGB", (W, corte_arriba + (H - corte_abajo) - mezcla))
sin_frase.paste(logo.crop((0, 0, W, corte_arriba)), (0, 0))
for i in range(mezcla):
    a = logo.crop((0, corte_arriba - mezcla + i, W, corte_arriba - mezcla + i + 1))
    b = logo.crop((0, corte_abajo + i, W, corte_abajo + i + 1))
    sin_frase.paste(Image.blend(a, b, i / mezcla), (0, corte_arriba - mezcla + i))
sin_frase.paste(logo.crop((0, corte_abajo + mezcla, W, H)), (0, corte_arriba))
w, h = sin_frase.size
ancho = round(h * 1200 / 630)
x = (w - ancho) // 2
sin_frase.crop((x, 0, x + ancho, h)).resize((1200, 630), Image.LANCZOS).save(
    app / "opengraph-image.jpg", quality=88
)
print("icon, apple-icon, favicon, opengraph-image, public/marca")
