# ClosetAI

Estilista personal con IA para México. Fotografías tu ropa, la IA arma tus outfits,
te los muestra puestos sobre tu propia foto y aprende tus gustos.

**Fuente única de verdad:** [`docs/DOCUMENTO-MAESTRO.md`](docs/DOCUMENTO-MAESTRO.md).
Todo lo que contradiga ese documento está mal.

## Estado

Semana 0 — Build Discipline Packet.

| Pieza | Estado |
|---|---|
| Documento maestro en el repo | ✅ |
| Migraciones SQL (esquema + RLS + storage) | ✅ escritas, sin aplicar (falta proyecto Supabase) |
| Toolchain local | ✅ node 26.7 · pnpm 11.22 · gh · supabase · stripe · vercel |
| App Next.js 16 + Tailwind v4 + landing | ✅ build verde |
| Pipeline de calidad (lint · typecheck · unit · build) | ✅ verde · CI en GitHub Actions |
| Contrato zod de salida del catalogador | ✅ 9 pruebas |
| Mockups generados por imagen (rúbrica) | ⛔ requiere `GEMINI_API_KEY` |
| Cuentas 🔑 y primer deploy | ⛔ pendientes |

Pendientes que bloquean: [`PENDIENTES.md`](PENDIENTES.md) ·
Runbook de cuentas: [`docs/SETUP-CUENTAS.md`](docs/SETUP-CUENTAS.md).

## Desarrollo

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test:unit    # Vitest
pnpm test:e2e     # Playwright
pnpm typecheck    # next typegen + tsc
```

## Stack

Next.js 15 (App Router) · Tailwind v4 + shadcn/ui · Supabase (Postgres + Auth + Storage)
· Vercel · Stripe MX · Gemini 2.5 · fal.ai (BiRefNet + FASHN) · Resend · Sentry.
Justificación de cada elección: §4.1 del documento maestro.

## Estructura

```
docs/            documento maestro + evidencia de rúbrica (§7)
supabase/        migraciones SQL versionadas
src/             app Next.js (pendiente)
e2e/             Playwright (pendiente)
```

## Convenciones

- Rama `main` protegida y siempre deployable. Ramas `feat/*`, `fix/*`.
- Commits convencionales **en inglés** (`feat: garment batch upload`); producto y docs en es-MX.
- Toda tabla nueva nace con RLS activada y política owner-only.
- Las API keys viven en `.env.local` y en Vercel env vars. Nunca en el repo, nunca en el cliente.
