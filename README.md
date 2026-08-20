# Vestia

Estilista personal con IA para México. Fotografías tu ropa, la IA arma tus outfits,
te los muestra puestos sobre tu propia foto y aprende tus gustos.

**Fuente única de verdad:** [`docs/DOCUMENTO-MAESTRO.md`](docs/DOCUMENTO-MAESTRO.md).
Todo lo que contradiga ese documento está mal.

## Estado

Semana 0 — Build Discipline Packet. Sin código de producto todavía.

| Pieza | Estado |
|---|---|
| Documento maestro en el repo | ✅ |
| Migraciones SQL (esquema + RLS + storage) | ✅ escritas, sin aplicar (falta proyecto Supabase) |
| Toolchain local (node, pnpm, gh, supabase, stripe, vercel) | ⛔ no instalado |
| Cuentas 🔑 (dominio, GitHub, Vercel, Supabase, Stripe, Resend, Gemini, fal.ai) | ⛔ pendientes |
| App Next.js | ⛔ pendiente |

Pendientes que bloquean: [`PENDIENTES.md`](PENDIENTES.md).

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
