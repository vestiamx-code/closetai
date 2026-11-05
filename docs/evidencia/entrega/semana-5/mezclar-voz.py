# Week 5 video: narration recorded by Tamara on Nov 4, 2026 (WhatsApp audio, 1:48).
# Places each sentence over its scene. Only pauses and the filler "And so" / "And"
# at the start of two sentences are cut. Usage: python3 mezclar-voz.py <audio> <video> <out>
import subprocess, sys
VOZ, VIDEO, SALIDA = sys.argv[1:4]
# (audio from, audio to, earliest place in the video, what it says)
CLIPS = [
 (0.00, 8.25, 0.3, "Hi, I'm Tamara…"),
 (9.00, 18.40, 8.6, "It's at closetai.lat/chat…"),
 (20.35, 31.30, 18.5, "First, which section…"),
 (31.85, 39.40, 32.0, "Now the AI builds an outfit…"),
 (40.80, 51.20, 50.4, "Each garment has…"),
 (52.95, 55.20, 64.3, "People can rate every answer."),
 (56.60, 58.25, 70.0, "They can ask follow-up questions."),
 (58.60, 61.30, 84.0, "Here it adapts the outfit…"),
 (62.30, 66.70, 87.2, "There's a limit…"),
 (67.50, 75.60, 93.6, "Now the guardrail…"),
 (76.30, 83.05, 106.8, "That's the human checkpoint…"),
 (83.80, 89.50, 118.8, "This is where a store link takes you…"),
 (90.30, 101.15, 131.3, "Three people outside the project…"),
 (101.90, 105.75, 149.3, "The plan was committed…"),
 (106.70, 107.85, 0.0, "So, thank you."),
]
t, filtros, etiquetas = 0.0, [], []
for i, (a, b, lugar, txt) in enumerate(CLIPS):
    inicio = max(lugar, t + 0.35) if i else lugar
    t = inicio + (b - a)
    print(f"{inicio:6.1f}–{t:6.1f}  {txt}")
    filtros.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={b-a-0.06:.2f}:d=0.06,adelay={int(inicio*1000)}:all=1[c{i}]")
    etiquetas.append(f"[c{i}]")
filtros.append("".join(etiquetas) + f"amix=inputs={len(CLIPS)}:normalize=0,highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11,apad[voz]")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", VOZ, "-i", VIDEO, "-filter_complex", ";".join(filtros),
                "-map", "1:v", "-map", "[voz]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
                "-shortest", "-movflags", "+faststart", SALIDA], check=True)
