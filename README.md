# ClosetAI

Estilista personal con IA para México. Fotografías tu ropa, la IA arma tus outfits,
te los muestra puestos sobre tu propia foto y aprende tus gustos.

**Fuente única de verdad:** [`docs/DOCUMENTO-MAESTRO.md`](docs/DOCUMENTO-MAESTRO.md).
Todo lo que contradiga ese documento está mal.

## 🌐 En vivo

**https://closetai.lat** · deploy automático desde `main` en Vercel

## Estado

**Semana 1 terminada.** El clóset digital funciona de punta a punta.

| Módulo | Estado |
|---|---|
| **M1 · Cuentas y perfil** | ✅ registro, entrada, recuperación, rutas protegidas, tallas, borrado real de cuenta |
| **M2 · Clóset digital** | ✅ subida por lotes, compresión a WebP, catalogación con IA, filtros, corrección manual |
| M3 · Estilista IA | ⬜ Semana 2 |
| M4 · Aprendizaje de gustos | 🟡 los `feedback_event` ya se están recolectando |
| M5 · Avatar y try-on | ⬜ Semana 3 · requiere `FAL_KEY` |
| M6 · Recomendaciones | ⬜ Semana 4 |
| M7 · Pagos | 🟡 el ledger de créditos ya existe y está probado · falta Stripe |
| M8 · Panel admin | ⬜ Semana 4 |

### Infraestructura

| Pieza | Estado |
|---|---|
| Sitio en vivo | ✅ [closetai.lat](https://closetai.lat) con HTTPS |
| Repo + CI | ✅ [vestiamx-code/closetai](https://github.com/vestiamx-code/closetai) |
| Base de datos | ✅ `closetai-prod` · 13 tablas con RLS · 3 buckets privados |
| Catalogación con IA | ✅ `gemini-3.5-flash-lite` verificado contra el modelo real |
| Pruebas | ✅ 12 unitarias · 8 e2e (perfil móvil) |
| Variables en Vercel | ⛔ **pendiente** — sin esto el sitio en vivo no ve la base de datos |
| Recorte de fondo (BiRefNet) | ⛔ requiere `FAL_KEY` |
| Correos propios (Resend) | ⛔ hoy usa el correo de cortesía de Supabase, con límites |

Pendientes: [`PENDIENTES.md`](PENDIENTES.md) · Runbook: [`docs/SETUP-CUENTAS.md`](docs/SETUP-CUENTAS.md)

## Desarrollo

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test:unit    # Vitest
pnpm test:e2e     # Playwright (perfil móvil)
pnpm typecheck    # next typegen + tsc

node scripts/sembrar-demo.mjs   # cuenta de demostración con prendas catalogadas
node scripts/capturas.mjs       # capturas para la evidencia de la rúbrica
```

> **Nota de versión:** este proyecto usa Next.js 16, donde `middleware.ts` está
> deprecado y se llama **`proxy.ts`**. La documentación de la versión instalada
> vive en `node_modules/next/dist/docs/` — léela antes de escribir código.

## Stack

Next.js 15 (App Router) · Tailwind v4 + shadcn/ui · Supabase (Postgres + Auth + Storage)
· Vercel · Stripe MX · Gemini 2.5 · fal.ai (BiRefNet + FASHN) · Resend · Sentry.
Justificación de cada elección: §4.1 del documento maestro.

## Estructura

```
docs/            documento maestro + evidencia de rúbrica (§7)
supabase/        migraciones SQL versionadas (001-004, aplicadas)
scripts/         herramientas de desarrollo (sembrar demo, capturas)
src/
  app/(auth)/    registro, entrada, recuperación
  app/(app)/     clóset, prenda, perfil — todo detrás de sesión
  lib/ai/        adapter de Gemini + contratos de salida
  lib/supabase/  clientes navegador / servidor / servicio
  proxy.ts       sesión y protección de rutas (Next 16)
e2e/             Playwright
```

## Convenciones

- Rama `main` protegida y siempre deployable. Ramas `feat/*`, `fix/*`.
- Commits convencionales **en inglés** (`feat: garment batch upload`); producto y docs en es-MX.
- Toda tabla nueva nace con RLS activada y política owner-only.
- Las API keys viven en `.env.local` y en Vercel env vars. Nunca en el repo, nunca en el cliente.
