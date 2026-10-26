"""
Turns the approved Week 4 content into the SQL that seeds it.

The source of truth is docs/evidencia/MARKETING-SEMANA-4.md, the document Tamara
approved (translated into English on Oct 26, 2026). The SQL is generated from it,
never written by hand: what reaches the database is exactly what was approved, and
if the document changes, the SQL is regenerated instead of being edited in two
places.

Usage:  python3 scripts/contenido-semana-4.py > /tmp/contenido.sql
"""

import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MD = (RAIZ / "docs/evidencia/MARKETING-SEMANA-4.md").read_text(encoding="utf-8")

APROBADO_POR = "Tamara Muñoz Delgadillo"
APROBADO_EL = "2026-10-21"

# Formats as written in the document → the code stored in the database.
FORMATO = {"carousel": "carrusel", "post": "post", "video": "video"}


def seccion(titulo: str) -> str:
    for p in re.split(r"^## ", MD, flags=re.M):
        if p.startswith(titulo):
            return p[len(titulo):]
    sys.exit(f"section not found: «{titulo}»")


def limpio(s: str) -> str:
    """Strips markdown markup: the database gets text, not asterisks."""
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"\*(.+?)\*", r"\1", s)
    return s.strip()


def sql(texto: str) -> str:
    assert "$c$" not in texto
    return f"$c${texto}$c$"


def fila(id_, tipo, canal, formato, titulo, cuerpo, detalle, orden):
    canal_sql = f"'{canal}'" if canal else "null"
    formato_sql = f"'{formato}'" if formato else "null"
    return (
        f"  ({sql(id_)}, '{tipo}', {canal_sql}, {formato_sql}, {sql(titulo)}, {sql(cuerpo)},\n"
        f"   {sql(json.dumps(detalle, ensure_ascii=False))}::jsonb, 'redactado_ia_aprobado', true,\n"
        f"   {sql(APROBADO_POR)}, '{APROBADO_EL}', {orden})"
    )


filas = []

# --- Homepage copy -----------------------------------------------------------
landing = seccion("Homepage copy")
filas.append(fila("landing", "landing", None, None, "Homepage copy", limpio(landing.split("\n---")[0]), {}, 0))

# --- The 10 posts ------------------------------------------------------------
posts = re.split(r"^### ", seccion("10 posts"), flags=re.M)[1:]
assert len(posts) == 10, f"expected 10 posts, found {len(posts)}"
for p in posts:
    cabeza, *resto = p.strip().split("\n")
    m = re.match(r"(\d+) · (Instagram|TikTok) · (carousel|post|video) — “(.+?)”(?: → script (\d))?", cabeza)
    assert m, f"cannot read the heading: {cabeza}"
    n, canal, formato, titulo, guion = m.groups()
    cuerpo_lineas, laminas, detalle = [], [], {}
    for ln in resto:
        if not ln.strip():
            continue
        if re.match(r"^\d+\. ", ln):
            laminas.append(limpio(re.sub(r"^\d+\. ", "", ln)))
        elif ln.startswith("**Caption:**"):
            detalle["texto"] = limpio(ln[len("**Caption:**"):])
        elif ln.startswith("**Hashtags:**"):
            detalle["hashtags"] = ln[len("**Hashtags:**"):].split()
        else:
            cuerpo_lineas.append(limpio(ln))
    if laminas:
        detalle["laminas"] = laminas
    if guion:
        detalle["guion"] = f"guion-{guion}"
    cuerpo = " ".join(cuerpo_lineas) or "\n".join(laminas) or detalle.get("texto", "")
    filas.append(
        fila(f"post-{int(n):02d}", "post", canal.lower(), FORMATO[formato], titulo, cuerpo, detalle, int(n))
    )

# --- The 3 scripts -----------------------------------------------------------
guiones = re.split(r"^### ", seccion("3 short video scripts (TikTok and Reels)"), flags=re.M)[1:]
assert len(guiones) == 3, f"expected 3 scripts, found {len(guiones)}"
for g in guiones:
    cabeza, *resto = g.strip().split("\n")
    m = re.match(r"Script (\d) · “(.+?)” · (~\d+ s)", cabeza)
    assert m, f"cannot read the heading: {cabeza}"
    n, titulo, duracion = m.groups()
    tomas = []
    for ln in resto:
        if not ln.startswith("|") or "---" in ln or ln.startswith("| Shot"):
            continue
        c = [x.strip() for x in ln.strip("|").split("|")]
        tomas.append({"toma": c[0], "se_ve": c[1], "texto": "" if c[2] == "—" else c[2], "voz": "" if c[3] == "—" else c[3]})
    voz = " ".join(t["voz"] for t in tomas if t["voz"])
    filas.append(fila(f"guion-{n}", "guion", "tiktok", "video", titulo, voz, {"duracion": duracion, "tomas": tomas}, int(n)))

# --- The calendar ------------------------------------------------------------
cal = seccion("14-day calendar")
dias = [ln for ln in cal.split("\n") if re.match(r"^\| \d+ \|", ln)]
assert len(dias) == 14, f"expected 14 days, found {len(dias)}"
for ln in dias:
    dia, canal, pieza, para = [x.strip() for x in ln.strip("|").split("|")]
    canal_id = {"Instagram": "instagram", "TikTok": "tiktok"}.get(canal)
    m = re.search(r"Post (\d+)", pieza)
    detalle = {"dia": int(dia), "para_que": para}
    if m:
        detalle["pieza"] = f"post-{int(m.group(1)):02d}"
    filas.append(fila(f"dia-{int(dia):02d}", "dia", canal_id, None, limpio(pieza), "", detalle, int(dia)))

print("insert into public.marketing_assets")
print("  (id, tipo, canal, formato, titulo, cuerpo, detalle, origen, aprobado, aprobado_por, aprobado_el, orden)")
print("values")
print(",\n".join(filas))
print("""on conflict (id) do update set
  tipo = excluded.tipo, canal = excluded.canal, formato = excluded.formato, titulo = excluded.titulo,
  cuerpo = excluded.cuerpo, detalle = excluded.detalle, origen = excluded.origen,
  aprobado = excluded.aprobado, aprobado_por = excluded.aprobado_por,
  aprobado_el = excluded.aprobado_el, orden = excluded.orden;""")
