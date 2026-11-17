import subprocess, sys
base = sys.argv[1]
D = [3.0, 2.6, 3.2, 3.6, 3.4, 4.8]
args = []
for k, d in enumerate(D, 1):
    args += ["-loop", "1", "-t", str(d), "-i", f"{base}/app/{k}.jpg"]
F = "".join(f"[{k}:v]scale=1280:-2,pad=1280:720:0:(oh-ih)/2:color=0xF7F6F3,setsar=1,fps=30,format=yuv420p[s{k}];" for k in range(6))
prev, off = "s0", 0.0
for k in range(1, 6):
    off += D[k - 1] - 0.4
    out = "v" if k == 5 else f"x{k}"
    F += f"[{prev}][s{k}]xfade=transition=fade:duration=0.4:offset={off:.2f}[{out}];"
    prev = out
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args, "-filter_complex", F.rstrip(";"), "-map", "[v]",
                "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", f"{base}/app.mp4"], check=True)
