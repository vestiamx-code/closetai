# Registro de prompts al agente de código

Evidencia de rúbrica: *Coding/build evidence* (≥5 prompts por semana).
Una entrada por sesión de trabajo con el agente. Se llena **durante** el trabajo, no al final.

Formato:

```
## [YYYY-MM-DD] — Sesión N
**Prompt:** lo que se le pidió al agente (textual o resumido fielmente)
**Resultado:** qué produjo
**Juicio humano:** qué se aceptó, qué se rechazó y por qué
**Commit:** hash
```

---

## [2026-08-19] — Sesión 1
**Prompt:** Se entregó al agente `CLOSETAI-DOCUMENTO-MAESTRO.md` sin más instrucción, con la
indicación implícita de ejecutarlo desde §0.
**Resultado:** auditoría de la máquina (toolchain vacío), scaffold del repo, transcripción de la
migración 001 desde el Apéndice B y redacción de la migración 002 con las piezas faltantes
(trigger de `profiles`, débito atómico de créditos, buckets de Storage).
**Juicio humano:** pendiente de revisión por Tamara. El agente se detuvo antes de instalar
software de sistema y antes de crear cuentas — ambos pasos requieren a una persona.
**Commit:** (ver commit inicial)

## [2026-08-19] — Sesión 2
**Prompt:** continuar §5.0 tras instalar Homebrew: dejar el toolchain completo y levantar el
scaffold de la aplicación.
**Resultado:** node 26.7 / pnpm 11.22 / gh / supabase 2.115 / stripe 1.50.3 / vercel 59.1.4
instalados; Next.js 16.3.1 + React 19.2 + Tailwind v4; landing en es-MX con paleta propia y
dark mode; SDKs de Supabase, Gemini, fal.ai, Stripe, Resend y zod; Vitest + Playwright
configurados; CI de GitHub Actions; contrato zod del catalogador con 9 pruebas.
**Juicio humano:** dos cosas se rechazaron a propósito. (1) La sugerencia del entorno de instalar
un plugin de Stripe: es un cambio de configuración de la máquina y se pospone a la Semana 3.
(2) Los scripts de instalación de `@google/genai` y `protobufjs`: en vez de aprobarlos para
desbloquear el build, se revisó qué ejecutan y se dejaron bloqueados — ver ITERATION_LOG.
**Commit:** feat: scaffold Next.js app

## [2026-08-20] — Sesión 3
**Prompt:** publicar el proyecto: GitHub, CI, Vercel y dominio propio.
**Resultado:** repo `vestiamx-code/closetai` con 10 commits y CI verde; Vercel Hobby con deploy
automático desde `main`; `closetai.lat` con HTTPS y redirección forzada desde http.
**Juicio humano:** dos correcciones que valió la pena hacer en el momento y no después.
(1) Vercel había quedado ligado a la cuenta personal de GitHub en vez de la del proyecto — se
rehízo el registro para no partir la titularidad entre dos cuentas. (2) Se eligió el dominio
apex (`closetai.lat`) sobre `www` como canónico, para que coincida con `NEXT_PUBLIC_APP_URL` y
los metadatos del sitio.
**Commit:** docs: record live deployment at closetai.lat

