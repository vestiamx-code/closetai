"""
Translates the Demo account's own data into English (Oct 26, 2026).

Migration 013 translated the public tables. This one covers what the logged-in
screens show for the Demo account: its garments, its outfits, its learned style
profile, its shopping recommendations, its photo note and its city. Everything
was written by the AI in Spanish before the course required English.

What does NOT change: ids, enum codes (category, pattern, styles...), and the
`busqueda` of each recommendation, which stays in Spanish because Mexican stores
are searched in Spanish.

Usage:
  python3 scripts/traduccion-014.py sql    > supabase/migrations/20261026000014_demo_account_english.sql
  python3 scripts/traduccion-014.py apply  (applies it through the REST API, service key from .env.local)
"""

import json
import sys
import urllib.request
from pathlib import Path

GARMENTS = {
    "5d2ffc56-6f44-4c4d-8eea-69f4ec1b5ff0": {
        "subcategory": "sweatshirt", "colors": ["grey", "brown"], "material": "cotton",
        "styling_note": "Pair this sweatshirt with light jeans or joggers and white sneakers for a casual, comfortable look.",
    },
    "7aaf2a89-3cd8-4fcc-a8d0-3e748a8b4ae5": {
        "subcategory": "pants", "colors": ["blue"], "material": "cotton",
        "styling_note": "Pair them with a basic white shirt for a clean, relaxed look.",
    },
    "6f334536-0335-426f-b21b-5c9850f45c29": {
        "subcategory": "t-shirt", "colors": ["navy blue", "white"], "material": "cotton",
        "styling_note": "Pair it with light denim jeans and white sneakers for a classic sailor look.",
    },
    "4d997ffd-9966-486c-92c5-cd01a5b61c60": {
        "subcategory": "fleece sweatshirt", "colors": ["black"], "material": "synthetic fleece",
        "styling_note": "Great with leggings and sneakers for a comfortable daytime look.",
    },
    "586d44f8-a6e6-48fb-a483-af7092bc7fb8": {
        "subcategory": "flared dress", "colors": ["red"], "material": "cotton",
        "styling_note": "Pair it with flat sandals or white sneakers for a fresh, casual look.",
    },
    "49789602-3ef7-4c3f-9396-48ad502e97e1": {
        "subcategory": "hoodie", "colors": ["black"], "material": "cotton",
        "styling_note": "Pair it with matching sweatpants or relaxed jeans and white sneakers for a comfortable street look.",
    },
    "a4b07f86-619c-4dc8-8049-08516d2abef9": {
        "subcategory": "pajama shirt", "colors": ["pink", "white"], "material": "satin",
        "styling_note": "Perfect for a loungewear look, or worn as an outer layer in a pajama-chic style with minimalist sandals.",
    },
}

CLIMA = {"nublado": "cloudy", "con llovizna": "drizzle"}

OUTFITS = {
    "c3c100f8-0852-486d-99af-2310f731a747": ("City basics",
        "This look balances the freshness of the striped t-shirt with the structure of the blue pants. The beige graphic piece on top works as a big neutral accent that protects you a little from Mexico City's mild wind.\n\nAdd classic white leather sneakers to keep the style comfortable and clean."),
    "de9a3c83-9d8f-454a-96a7-a7a13ecdd97c": ("Neutral and structured",
        "Beige and blue is a classic formula that never fails, thanks to its color harmony. The graphic silhouette on the torso adds interesting visual texture over the clean cut of the pants.\n\nAdd minimalist gold accessories to lift this set of neutrals effortlessly."),
    "98e77924-569e-4ad5-ac86-38aa30cb37e1": ("Autumn contrast",
        "The vibrant red of the dress breaks perfectly with the soberness of a cloudy day. Layering the beige graphic piece over it softens the intensity of the color and adapts the garment to a cooler temperature.\n\nPair it with brown leather ankle boots for a more urban, autumn touch."),
    "eb2dce0a-5d2e-4a3a-b9af-1c2746df90a7": ("Relaxed autumn basics",
        "The grey and brown sweatshirt with the blue pants creates a perfect neutral balance for a cloudy day at 16°C. The relaxed cut of the sweatshirt keeps you warm effortlessly, for a comfortable, super practical silhouette for your daily errands.\n\nAdd spotless white sneakers for a clean, modern touch."),
    "27b9a140-34b4-4fe9-a127-62bdd9aecf10": ("Urban layers",
        "Layering is ideal for Mexico City's weather; the t-shirt adds a subtle touch of color under the open black sweatshirt. The blue pants balance the visual weight of the top, for an urban, functional and very comfortable style.\n\nLet the bottom hem of the t-shirt peek out under the sweatshirt to create visual depth."),
    "475ff9c6-d556-4707-8bfc-c89c9f5f4a49": ("Urban romantic",
        "A great way to wear your red dress in cool weather is with the black sweatshirt on top, which visually turns it into a flared skirt. The contrast of vibrant red with black neutralizes the sporty side of the look, giving you an original, warm option.\n\nPair it with black track-sole boots to reinforce the urban aesthetic and protect you from the cold."),
    "5ce320f2-9442-4343-a37b-cdbc27f4b8a4": ("Relaxed streetwear",
        "The grey and brown sweatshirt will give you just the right warmth for 19 degrees and the city's drizzle. With the blue pants, you get a very comfortable casual balance, ready for any errand of the day.\n\nPair it with spotless white sneakers to brighten the outfit on this grey day."),
    "85b44325-8507-4c67-9dc3-57f0deb98547": ("Layered casual",
        "The sailor t-shirt adds visual texture under the black fleece sweatshirt, which will protect you from the damp wind. The minimalist-cut blue pants give the look structure so it doesn't feel sloppy.\n\nPush the sweatshirt sleeves up a little to show the t-shirt's pattern at your wrists."),
    "a2310555-c09b-4ec8-88b7-77349a36a638": ("Urban grunge twist",
        "Wearing the black hoodie over the red flared dress creates an amazing color contrast and protects you from Mexico City's mild weather. It is a different take that mixes the romantic and the urban in a practical way.\n\nWear combat boots or black ankle boots to tie the aesthetic together and keep your feet safe from puddles."),
}

RECS = {
    "3ef8f7d1-38ac-468d-9bdf-4cb8cad1f50e": ("black dress pants, straight cut",
        "Right now you only have one pair of blue pants. Black dress pants give you a formal option for the office and instantly match all your sweatshirts and t-shirts, for casual and smart-casual looks."),
    "e4c80b9a-a8b1-4022-a4b2-13d31de90022": ("beige blazer, structured cut",
        "You're missing a formal outer layer to lift your outfits. This neutral blazer turns your casual t-shirts and pants into outfits ready for the office or a dinner."),
    "743b81fb-fbc0-4712-9cb8-412cb21c6fd4": ("white button-up shirt, 100% cotton",
        "It is the basic that will give your closet structure. Wear it buttoned with your blue pants for a clean look, open over your sailor t-shirt, or even tied over your red dress for a fresh style."),
}

DEMO = "fe52f467-60e9-412d-b29a-3df7fb3ba6f1"
NOTAS_PERFIL = (
    "Two acceptances without specific details and one explicit rejection were recorded on August 22, 2026, "
    "because the user didn't like the suggested combination. On August 24, 2026, the user corrected a "
    "garment's label from 'hoodie' to 'fleece sweatshirt' in the outerwear category."
)
NOTA_FOTO = "Excellent photo! Your full body is clearly visible and well lit."

# Feedback events feed the learning prompt: their text goes in English too.
EVENTO_RECHAZO = (19, {"motivo": "I don't like the combination"})
EVENTO_CORRECCION = (39, {
    "antes": {"category": "abrigo", "subcategory": "hoodie"},
    "despues": {"category": "abrigo", "subcategory": "fleece sweatshirt"},
})


def leer(tabla: str, filtro: str):
    return pedir("GET", f"{tabla}?{filtro}")


def cambios():
    """(table, filter, patch) for every row. Reads the current outfits to keep their weather numbers."""
    yield from (("garments", f"id=eq.{i}", d) for i, d in GARMENTS.items())
    for o in leer("outfits", "select=id,weather&id=in.(" + ",".join(OUTFITS) + ")"):
        titulo, explicacion = OUTFITS[o["id"]]
        clima = dict(o["weather"] or {})
        if clima:
            clima["ciudad"] = "Mexico City"
            clima["descripcion"] = CLIMA.get(clima.get("descripcion"), clima.get("descripcion"))
        yield "outfits", f"id=eq.{o['id']}", {"title": titulo, "explanation": explicacion, "weather": clima}
    for r in leer("shopping_recs", "select=id,gap&id=in.(" + ",".join(RECS) + ")"):
        prenda, porque = RECS[r["id"]]
        yield "shopping_recs", f"id=eq.{r['id']}", {"gap": {**r["gap"], "prenda": prenda, "porque": porque}}
    perfil = leer("style_profiles", f"select=profile&user_id=eq.{DEMO}")[0]["profile"]
    yield "style_profiles", f"user_id=eq.{DEMO}", {"profile": {**perfil, "notas_libres": NOTAS_PERFIL}}
    yield "avatar_photos", f"user_id=eq.{DEMO}&is_primary=eq.true", {"validation_note": NOTA_FOTO}
    yield "profiles", "city=eq.Ciudad%20de%20M%C3%A9xico", {"city": "Mexico City"}
    for i, payload in (EVENTO_RECHAZO, EVENTO_CORRECCION):
        yield "feedback_events", f"id=eq.{i}", {"payload": payload}


def env():
    v = {}
    for linea in (Path(__file__).resolve().parent.parent / ".env.local").read_text().splitlines():
        if "=" in linea and not linea.startswith("#"):
            k, _, val = linea.partition("=")
            v[k.strip()] = val.split("#")[0].strip()
    return v


E = env()


def pedir(metodo, ruta, cuerpo=None):
    req = urllib.request.Request(
        f"{E['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/{ruta}",
        method=metodo,
        data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
        headers={
            "apikey": E["SUPABASE_SERVICE_ROLE_KEY"],
            "Authorization": f"Bearer {E['SUPABASE_SERVICE_ROLE_KEY']}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read() or "null")


def sql_valor(v):
    if isinstance(v, (dict, list)) and not (isinstance(v, list) and all(isinstance(x, str) for x in v)):
        return f"$j${json.dumps(v, ensure_ascii=False)}$j$::jsonb"
    if isinstance(v, list):
        return "array[" + ", ".join(f"$t${x}$t$" for x in v) + "]::text[]"
    return f"$t${v}$t$"


def filtro_sql(f):
    partes = []
    for p in f.split("&"):
        col, _, cond = p.partition("=")
        op, _, val = cond.partition(".")
        val = urllib.parse.unquote(val)
        partes.append(f"{col} = {'true' if val == 'true' else repr(val)}")
    return " and ".join(partes)


if __name__ == "__main__":
    import urllib.parse

    modo = sys.argv[1] if len(sys.argv) > 1 else "sql"
    filas = list(cambios())
    if modo == "sql":
        print("-- Demo account data in English (Oct 26, 2026). Generated by scripts/traduccion-014.py.")
        print("begin;")
        print("-- New accounts are born in English too. (The weather lookup knows both spellings.)")
        print("alter table public.profiles alter column city set default 'Mexico City';")
        for tabla, f, patch in filas:
            sets = ", ".join(f"{k} = {sql_valor(v)}" for k, v in patch.items())
            print(f"update public.{tabla} set {sets} where {filtro_sql(f)};")
        print("commit;")
    elif modo == "apply":
        for tabla, f, patch in filas:
            r = pedir("PATCH", f"{tabla}?{f}", patch)
            print(f"{tabla:16} {f[:50]:50} {len(r)} row(s)")
