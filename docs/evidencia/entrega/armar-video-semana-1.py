"""Une la voz de Tamara al video de la Semana 1.

Quita solo tramos donde la pantalla está congelada, acelera un scroll y coloca
cada bloque de voz en el momento que le toca. Todos los tiempos se midieron:
freezedetect para los tramos quietos, cuadros extraídos para los clics y
silencedetect para las pausas de la voz.
"""
import subprocess

VIDEO = "/Users/tamaramunozdelgadillo/Desktop/ClosetAI-Semana1-Core.mp4"
VOZ = "/private/tmp/claude-501/-Users-tamaramunozdelgadillo/efcc2386-85cb-43f4-a8d2-509d42bd9f44/scratchpad/voz"
SALIDA = "/private/tmp/claude-501/-Users-tamaramunozdelgadillo/efcc2386-85cb-43f4-a8d2-509d42bd9f44/scratchpad/voz/final.mp4"

# (inicio, fin, velocidad) en el tiempo del video original
TRAMOS = [
    (0.0, 47.6, 1),     # landing, /core, texto escrito
    (63.6, 95.5, 1),    # clic, "Leyéndote…", la tarjeta y su recorrido
    (109.0, 137.2, 1),  # la escena de la confianza
    (143.5, 148.9, 1),  # la escena de guardar, sin los 6 s de portada quieta
    (148.9, 156.3, 2),  # scroll por los núcleos guardados, al doble
    (156.3, 158.0, 1),
    (160.4, 175.9, 1),  # GitHub hasta que se ve el commit del packet
]

# Dónde empieza a hablar en el video nuevo, y cuánto silencio trae el corte antes de la voz
VOZ_EN = [0.5, 16.4, 36.0, 54.4, 80.5, 108.5, 122.3]
ENTRADA = [0.25, 0.43, 0.28, 0.30, 0.49, 0.16, 0.36]

duracion = sum((b - a) / v for a, b, v in TRAMOS)

partes = []
for i, (a, b, v) in enumerate(TRAMOS):
    partes.append(f"[0:v]trim={a}:{b},setpts=(PTS-STARTPTS)/{v}[v{i}]")
partes.append("".join(f"[v{i}]" for i in range(len(TRAMOS))) + f"concat=n={len(TRAMOS)}:v=1:a=0,fps=30,format=yuv420p[v]")

for i, (en, entrada) in enumerate(zip(VOZ_EN, ENTRADA)):
    ms = round((en - entrada) * 1000)
    partes.append(f"[{i + 1}:a]adelay={ms}:all=1[a{i}]")
partes.append(
    "".join(f"[a{i}]" for i in range(7))
    + f"amix=inputs=7:normalize=0:dropout_transition=0,apad,atrim=0:{duracion:.3f}[a]"
)

cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", VIDEO]
for i in range(1, 8):
    cmd += ["-i", f"{VOZ}/b{i}.wav"]
cmd += [
    "-filter_complex", ";".join(partes),
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20",
    "-c:a", "aac", "-b:a", "160k", "-ac", "2", "-ar", "48000",
    "-movflags", "+faststart", "-t", f"{duracion:.3f}",
    SALIDA,
]
subprocess.run(cmd, check=True)
print(f"listo · duración esperada {duracion:.1f}s ({int(duracion // 60)}:{duracion % 60:04.1f})")
