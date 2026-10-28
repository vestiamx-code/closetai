# Week 4 video: narration recorded by Tamara on Oct 28, 2026 (WhatsApp audio, 2:20).
# Usage: python3 mezclar-voz.py <audio> <silent video> <output>
"""Places each narrated sentence over its scene, dropping the scene labels that were read aloud."""
import subprocess, sys
VOZ, VIDEO, SALIDA = sys.argv[1:4]
# (audio from, audio to, earliest place in the video, what it says)
CLIPS = [
 (0.00, 8.70, 0.3, "Hi, I'm Tamara…"),
 (10.00, 18.10, 8.3, "The homepage is an A/B test…"),
 (22.80, 25.70, 17.3, "The page reads like an argument, first the problem,"),
 (25.80, 27.45, 22.3, "then how it works in three steps."),
 (27.40, 30.60, 27.9, "Then proof…"),
 (30.95, 35.90, 34.0, "Then the price…"),
 (36.35, 38.40, 39.6, "And privacy…"),
 (40.50, 46.00, 43.9, "This is the marketing page…"),
 (48.00, 52.35, 51.4, "The brand…"),
 (53.75, 62.05, 58.9, "The persona is Sofía…"),
 (64.25, 73.75, 68.7, "These are the live results…"),
 (76.25, 84.30, 79.3, "Ten posts…"),
 (87.25, 88.00, 93.6, "Three short"),
 (88.90, 91.15, 0.0, "video scripts, shot by shot."),
 (93.40, 97.40, 101.2, "And a fourteen-day calendar…"),
 (100.85, 108.05, 110.4, "The generator writes new posts…"),
 (110.95, 118.05, 118.5, "This one passed…"),
 (119.85, 124.05, 127.9, "Everything saved stays here…"),
 (127.85, 137.55, 135.5, "My tests run against the live site…"),
 (138.35, 139.35, 0.0, "Thank you."),
]
GAP = {12: 0.05}  # "three short" flows straight into "video scripts"
t, filtros, etiquetas = 0.0, [], []
for i, (a, b, lugar, txt) in enumerate(CLIPS):
    inicio = max(lugar, t + GAP.get(i - 1, 0.35)) if i else lugar
    t = inicio + (b - a)
    print(f"{inicio:6.1f}–{t:6.1f}  {txt}")
    filtros.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={b-a-0.06:.2f}:d=0.06,adelay={int(inicio*1000)}:all=1[c{i}]")
    etiquetas.append(f"[c{i}]")
filtros.append("".join(etiquetas) + f"amix=inputs={len(CLIPS)}:normalize=0,highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11,apad[voz]")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", VOZ, "-i", VIDEO, "-filter_complex", ";".join(filtros),
                "-map", "1:v", "-map", "[voz]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
                "-shortest", "-movflags", "+faststart", SALIDA], check=True)
