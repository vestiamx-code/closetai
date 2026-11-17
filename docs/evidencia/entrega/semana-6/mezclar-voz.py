# Week 6 video: narration recorded by Tamara on Nov 16, 2026 (WhatsApp audio, 3:35),
# over the screen recording made by grabar-video.mjs. Each sentence is placed just after
# its scene starts; nothing she said is cut except the silences between sentences.
# Usage: python3 mezclar-voz.py <audio> <video.webm> <marcas.json> <out.mp4>
import json, subprocess, sys

VOZ, VIDEO, MARCAS, SALIDA = sys.argv[1:5]
marcas = {m["escena"]: m["segundo"] for m in json.load(open(MARCAS))}
INICIO = marcas["portada"]  # the recording starts with a warm-up; the video starts here
DESPUES = 0.6               # seconds into the scene before her voice comes in

# (audio from, audio to, scene, what it says) — times from faster-whisper
CLIPS = [
    (0.00, 10.35, "portada", "Hi, I'm Tamara…"),
    (10.45, 28.05, "demo", "For six weeks I built it…"),
    (28.35, 36.85, "menu", "Before, each page only linked back home…"),
    (37.05, 44.55, "pasos", "The demo page is a guided tour…"),
    (45.20, 57.20, "preguntas", "Step one: anyone can ask the stylist…"),
    (57.35, 71.90, "outfit", "Then the AI builds an outfit…"),
    (72.90, 82.75, "filtro", "And this is what it won't do…"),
    (82.90, 96.20, "app", "With an account, ClosetAI catalogs…"),
    (97.45, 116.05, "dashboard", "This is the new dashboard…"),
    (117.05, 128.85, "docs", "The docs page shows how it was built…"),
    (129.35, 143.55, "agentes", "This is the agent map…"),
    (145.10, 167.10, "testers", "Five people outside the project…"),
    (167.30, 181.60, "regresion", "I also ran an automated test…"),
    (183.60, 196.55, "impacto", "The impact check pairs each risk…"),
    (196.60, 209.35, "roadmap", "And this is version two…"),
    (209.40, 215.30, "github", "All the work is on GitHub…"),
]

fin_anterior, filtros, etiquetas = 0.0, [], []
for i, (a, b, escena, texto) in enumerate(CLIPS):
    lugar = marcas[escena] - INICIO + DESPUES
    inicio = max(lugar, fin_anterior + 0.3) if i else 0.4
    fin_anterior = inicio + (b - a)
    print(f"{inicio:6.1f}–{fin_anterior:6.1f}  {escena:10} {texto}")
    filtros.append(
        f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,"
        f"afade=t=out:st={b - a - 0.06:.2f}:d=0.06,adelay={int(inicio * 1000)}:all=1[c{i}]"
    )
    etiquetas.append(f"[c{i}]")
filtros.append(
    "".join(etiquetas)
    + f"amix=inputs={len(CLIPS)}:normalize=0,highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11,apad[voz]"
)
duracion = marcas["fin"] - INICIO
subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-y", "-i", VOZ, "-ss", str(INICIO), "-t", str(duracion), "-i", VIDEO,
     "-filter_complex", ";".join(filtros), "-map", "1:v", "-map", "[voz]",
     "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-r", "30",
     "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-shortest", "-movflags", "+faststart", SALIDA],
    check=True,
)
print(f"video: {duracion:.1f} s")
