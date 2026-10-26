"""
Fills the commit and deployment tables of cuerpo.html from git and Vercel,
so the counts in the document are read, never typed.

Usage (repo root):  python3 docs/evidencia/entrega/semana-4/tablas.py
Needs the Vercel CLI logged in. Rewrites cuerpo.html in place.

The week's first 13 commits were rewritten in English on Oct 26, 2026; their
deployments still carry the original (Spanish) commit sha, so those are mapped
to the new hashes through the local backup tag `respaldo-semana-4-en-espanol`.
"""

import datetime as dt
import html
import json
import re
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[4]
CUERPO = Path(__file__).with_name("cuerpo.html")
BASE = "1415102"  # last commit before Week 4
MX = dt.timezone(dt.timedelta(hours=-6))


def git(*args):
    return subprocess.run(["git", *args], cwd=RAIZ, capture_output=True, text=True, check=True).stdout


def commits():
    filas = []
    for linea in git("log", "--reverse", "--format=%H%x09%at%x09%s", f"{BASE}..HEAD").splitlines():
        sha, ts, asunto = linea.split("\t", 2)
        filas.append((sha, dt.datetime.fromtimestamp(int(ts), MX), asunto))
    return filas


def viejo_a_nuevo(nuevos):
    try:
        viejos = git("log", "--reverse", "--format=%H", f"{BASE}..respaldo-semana-4-en-espanol").split()
    except subprocess.CalledProcessError:
        return {}
    return {v: n[0] for v, n in zip(viejos, nuevos)}


def despliegues():
    todos, siguiente = [], None
    for _ in range(5):
        cmd = ["vercel", "ls", "closetai", "--prod", "--json"] + (["--next", str(siguiente)] if siguiente else [])
        salida = subprocess.run(cmd, cwd=RAIZ, capture_output=True, text=True, check=True).stdout
        datos = json.loads(salida)
        todos += datos.get("deployments", [])
        siguiente = (datos.get("pagination") or {}).get("next")
        if not siguiente:
            break
    return todos


def cuando(d):
    return d.strftime("%b %-d, %H:%M")


def main():
    cs = commits()
    inicio = cs[0][1] - dt.timedelta(minutes=2)
    mapa = viejo_a_nuevo(cs)
    por_sha = {sha: (fecha, asunto) for sha, fecha, asunto in cs}

    deps = []
    for d in despliegues():
        creado = dt.datetime.fromtimestamp(d["createdAt"] / 1000, MX)
        if creado < inicio or d.get("state") != "READY":
            continue
        sha = d.get("meta", {}).get("githubCommitSha", "")
        sha = mapa.get(sha, sha)
        asunto = por_sha.get(sha, (None, "(not on main)"))[1]
        deps.append((creado, sha, asunto))
    deps.sort()

    def msg(asunto):
        # "type(scope): text" → "type: text", as the table always showed it
        return html.escape(re.sub(r"^(\w+)\([^)]*\):", r"\1:", asunto))

    filas_c = "\n".join(
        f'      <tr><td class="mono">{sha[:7]}</td><td>{cuando(f)}</td><td>{msg(a)}</td></tr>' for sha, f, a in cs
    )
    filas_d = "\n".join(
        f'      <tr><td>{cuando(f)}</td><td class="ok">● Ready</td><td><span class="mono">{sha[:7]}</span> · {msg(a)}</td></tr>'
        for f, sha, a in deps
    )

    t = CUERPO.read_text(encoding="utf-8")
    t = re.sub(
        r'(<h2>8 · GitHub commits — )(?:<span class="pendiente">\[PENDING: n\]</span>|\d+)',
        rf"\g<1>{len(cs)}", t)
    t = re.sub(
        r'(<h2>9 · Vercel deployments — )(?:<span class="pendiente">\[PENDING: n\]</span>|\d+)',
        rf"\g<1>{len(deps)}", t)
    t = re.sub(r"(<!-- ============ 8\. COMMITS.*?<tbody>\n).*?(\n    </tbody>)",
               lambda m: m.group(1) + filas_c + m.group(2), t, count=1, flags=re.S)
    t = re.sub(r"(<!-- ============ 9\. DEPLOYS.*?<tbody>\n).*?(\n    </tbody>)",
               lambda m: m.group(1) + filas_d + m.group(2), t, count=1, flags=re.S)
    for etiqueta, n in (("commits", len(cs)), ("deployments", len(deps))):
        t = re.sub(rf'<b>(?:<span class="pendiente">\[PENDING: n\]</span>|\d+) {etiqueta}</b>', f"<b>{n} {etiqueta}</b>", t)
    t = re.sub(r'§8 · (?:<span class="pendiente">\[PENDING: n\]</span>|\d+) commits · §9 · (?:<span class="pendiente">\[PENDING: n\]</span>|\d+) production deployments',
               f"§8 · {len(cs)} commits · §9 · {len(deps)} production deployments", t)
    CUERPO.write_text(t, encoding="utf-8")
    print(f"{len(cs)} commits, {len(deps)} deployments")


if __name__ == "__main__":
    main()
