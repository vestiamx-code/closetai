"""
Every brand file comes from Tamara's logo (logo-closetai.jpg, chosen on Oct 29, 2026).

  · The square icon (browser tab, Google results, phone home screen, the chat's
    avatar) is the "AI" with its network, cropped from the logo: at 16 to 48
    pixels the whole wordmark can't be read.
  · The link preview (WhatsApp, iMessage, social) is the whole logo.

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

# 1200×630 for link previews: the logo is 1408×768, slightly taller, so a thin
# band comes off the bottom (the floor) and the top (the ceiling).
ancho, alto = logo.size
alto_nuevo = round(ancho * 630 / 1200)
arriba = (alto - alto_nuevo) // 3
logo.crop((0, arriba, ancho, arriba + alto_nuevo)).resize((1200, 630), Image.LANCZOS).save(
    app / "opengraph-image.jpg", quality=88
)
print("icon, apple-icon, favicon, opengraph-image, public/marca")
