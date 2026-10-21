"""
Convierte el contenido aprobado de la Semana 4 en la migración que lo siembra.

La fuente de verdad es docs/evidencia/MARKETING-SEMANA-4.md, el documento que
Tamara aprobó. La migración se genera desde ahí, no se escribe a mano: así lo que
llega a la base es exactamente lo que se aprobó, y si el documento cambia, la
migración se vuelve a generar en vez de editarse en dos lugares.

Uso:  python3 scripts/contenido-semana-4.py > supabase/migrations/20261021000011_marketing_contenido.sql
"""

import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MD = (RAIZ / "docs/evidencia/MARKETING-SEMANA-4.md").read_text(encoding="utf-8")

APROBADO_POR = "Tamara Muñoz Delgadillo"
APROBADO_EL = "2026-10-21"


def seccion(titulo: str) -> str:
    partes = re.split(r"^## ", MD, flags=re.M)
    for p in partes:
        if p.startswith(titulo):
            return p[len(titulo):]
    sys.exit(f"no encontré la sección «{titulo}»")


def limpio(s: str) -> str:
    """Quita el marcado de markdown: en la base va texto, no asteriscos."""
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

# --- La portada -------------------------------------------------------------
landing = seccion("Texto de la landing (la portada)")
filas.append(fila("landing", "landing", None, None, "Texto de la portada",
                  limpio(landing.split("\n---")[0]), {}, 0))

# --- Los 10 posts ------------------------------------------------------------
posts = re.split(r"^### ", seccion("10 posts"), flags=re.M)[1:]
assert len(posts) == 10, f"se esperaban 10 posts, hay {len(posts)}"
for p in posts:
    cabeza, *resto = p.strip().split("\n")
    m = re.match(r"(\d+) · (Instagram|TikTok) · (carrusel|post|video) — «(.+?)»(?: → guion (\d))?", cabeza)
    assert m, f"no entiendo el encabezado: {cabeza}"
    n, canal, formato, titulo, guion = m.groups()
    cuerpo_lineas, laminas, detalle = [], [], {}
    for ln in resto:
        if not ln.strip():
            continue
        if re.match(r"^\d+\. ", ln):
            laminas.append(limpio(re.sub(r"^\d+\. ", "", ln)))
        elif ln.startswith("**Texto:**"):
            detalle["texto"] = limpio(ln[len("**Texto:**"):])
        elif ln.startswith("**Hashtags:**"):
            detalle["hashtags"] = ln[len("**Hashtags:**"):].split()
        else:
            cuerpo_lineas.append(limpio(ln))
    if laminas:
        detalle["laminas"] = laminas
    if guion:
        detalle["guion"] = f"guion-{guion}"
    cuerpo = " ".join(cuerpo_lineas) or "\n".join(laminas) or detalle.get("texto", "")
    filas.append(fila(f"post-{int(n):02d}", "post", canal.lower(), formato, titulo, cuerpo, detalle, int(n)))

# --- Los 3 guiones -----------------------------------------------------------
guiones = re.split(r"^### ", seccion("3 guiones de video corto (TikTok y Reels)"), flags=re.M)[1:]
assert len(guiones) == 3, f"se esperaban 3 guiones, hay {len(guiones)}"
for g in guiones:
    cabeza, *resto = g.strip().split("\n")
    m = re.match(r"Guion (\d) · «(.+?)» · (~\d+ s)", cabeza)
    assert m, f"no entiendo el encabezado: {cabeza}"
    n, titulo, duracion = m.groups()
    tomas = []
    for ln in resto:
        if not ln.startswith("|") or "---" in ln or ln.startswith("| Toma"):
            continue
        c = [x.strip() for x in ln.strip("|").split("|")]
        tomas.append({"toma": c[0], "se_ve": c[1], "texto": "" if c[2] == "—" else c[2], "voz": "" if c[3] == "—" else c[3]})
    voz = " ".join(t["voz"] for t in tomas if t["voz"])
    filas.append(fila(f"guion-{n}", "guion", "tiktok", "video", titulo, voz,
                      {"duracion": duracion, "tomas": tomas}, int(n)))

# --- El calendario -----------------------------------------------------------
cal = seccion("Calendario de 14 días")
dias = [ln for ln in cal.split("\n") if re.match(r"^\| \d+ \|", ln)]
assert len(dias) == 14, f"se esperaban 14 días, hay {len(dias)}"
for ln in dias:
    dia, canal, pieza, para = [x.strip() for x in ln.strip("|").split("|")]
    canal_id = {"Instagram": "instagram", "TikTok": "tiktok"}.get(canal)
    m = re.search(r"Post (\d+)", pieza)
    detalle = {"dia": int(dia), "para_que": para}
    if m:
        detalle["pieza"] = f"post-{int(m.group(1)):02d}"
    filas.append(fila(f"dia-{int(dia):02d}", "dia", canal_id, None, limpio(pieza), "", detalle, int(dia)))

print("""-- Semana 4 · El contenido de lanzamiento, aprobado por Tamara el 21 de octubre de 2026.
--
-- GENERADO por scripts/contenido-semana-4.py desde docs/evidencia/MARKETING-SEMANA-4.md.
-- No se edita a mano: si el contenido cambia, se cambia el documento y se regenera.
""")
print("insert into public.marketing_assets")
print("  (id, tipo, canal, formato, titulo, cuerpo, detalle, origen, aprobado, aprobado_por, aprobado_el, orden)")
print("values")
print(",\n".join(filas))
print("""on conflict (id) do update set
  tipo = excluded.tipo, canal = excluded.canal, formato = excluded.formato, titulo = excluded.titulo,
  cuerpo = excluded.cuerpo, detalle = excluded.detalle, origen = excluded.origen,
  aprobado = excluded.aprobado, aprobado_por = excluded.aprobado_por,
  aprobado_el = excluded.aprobado_el, orden = excluded.orden;

-- El mapa de producto prometía, desde la Semana 3, que la prueba virtual «funciona sin
-- que salga tu cara». Nunca se comprobó. El validador de fotos ya acepta fotos sin cara,
-- pero el resultado con ellas no se ha visto, así que el mapa deja de prometerlo.
update public.pricing_features
   set descripcion = 'Tu foto base de cuerpo completo, para probarte la ropa.'
 where id = 'avatar';""")
