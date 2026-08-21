# Pendientes que bloquean el avance

Actualizado: 2026-08-19. Ordenado por lo que desbloquea más.

## 🚨 Bloqueante de lanzamiento (no de fecha, de evento)

### Activar facturación en la API de Gemini — **ANTES de la primera usuaria real**
**Disparador:** el día que alguien que no seas tú suba una foto suya a ClosetAI.

El nivel gratuito de Gemini (el que aceptamos el 20-ago-2026 en AI Studio) dice explícitamente
que las peticiones **pueden ser revisadas por humanos y usadas para entrenar los modelos de
Google**. Con ropa de prueba tuya no importa. Con fotos de cuerpo de usuarias reales sí: es dato
personal sensible bajo la LFPDPPP y contradice el principio de privacidad del §3.2.

**Cómo se resuelve:** activar facturación en la API de Gemini (Google Cloud). En el nivel de
pago, Google no usa los datos para entrenar. No hay que cambiar de proveedor ni tocar código —
el adapter de `lib/ai/` se queda igual, solo cambia el nivel de la cuenta.

**Costo:** catalogar una prenda cuesta ~$0.0003 USD. Mil prendas = $0.30 USD. El gasto real
sigue siendo despreciable; lo que cambia es el trato legal de los datos.

## ⏰ Con fecha límite

### Verificar contacto del dominio (ICANN) — **antes del 4-sep-2026**
Namecheap muestra un **ALERT** en `closetai.lat`: falta confirmar el correo del titular. Es un
requisito de ICANN. **Si no se hace en 15 días, suspenden el dominio** y el sitio se cae.
Namecheap mandó un correo con el enlace de verificación — hay que darle clic. También se puede
desde Domain List → botón *VERIFY CONTACTS*.

### 2FA en las cuentas del proyecto
Se pospuso a propósito durante el setup. Hacerlo **antes de activar Stripe**, cuando haya dinero
real: GitHub `vestiamx-code`, Vercel y el Gmail del proyecto. Guardar los códigos de
recuperación en el gestor de contraseñas, no en el mismo correo.

## 🔴 Bloqueantes ahora mismo

### ~~1. ¿Quién es la titular?~~ ✅ RESUELTO 19-ago-2026
El proyecto es de **Tamara Muñoz Delgadillo** (`tamaramunozdel@gmail.com`). El documento maestro
se actualizó a v1.1: §2.1, §5.1, §5.2 (`ADMIN_EMAILS`), §7 y todas las marcas 🔑.

### 2. Toolchain: la máquina está vacía
Instalado: `git` (Apple, 2.50.1) y `python3` 3.9.6. **No instalado:** Homebrew, node, pnpm, npm,
`gh`, `supabase`, `stripe`, `vercel`.

Instalar Homebrew modifica el sistema y **pide contraseña de administrador** — la teclea la
persona, no el agente. Es el paso §5.0 y bloquea todo lo demás: sin node no hay Next.js, sin
`supabase` no se aplican las migraciones, sin `vercel` no hay deploy.

### 3. Cuentas 🔑 (§5.1) — ninguna existe
Ninguna la puede crear el agente (crear cuentas, teclear contraseñas y aceptar términos son
pasos de la persona). **Runbook paso a paso: [`docs/SETUP-CUENTAS.md`](docs/SETUP-CUENTAS.md).**
Orden y dependencias:

| # | Cuenta | Costo | Desbloquea |
|---|---|---|---|
| 1 | ~~Correo del proyecto~~ ✅ `vestia.mx@gmail.com` | $0 | todas las demás |
| 2 | ~~Dominio **closetai.lat**~~ ✅ 19-ago-2026 | $2 USD 1er año | URL viva (rúbrica), DNS de Resend |
| 3 | ~~GitHub + repo `closetai`~~ ✅ 20-ago-2026 | $0 | evidencia de commits, deploy de Vercel |
| 4 | ~~Vercel~~ ✅ 20-ago-2026 | $0 (Hobby) | URL viva |
| 5 | Supabase (proyecto `closetai-prod`) | $0 | aplicar migraciones 001 y 002 |
| 6 | Stripe MX (modo test basta al inicio) | $0 | Semana 3 |
| 7 | Resend + verificar dominio | $0 | correos de registro/recuperación |
| 8 | Google AI Studio (`GEMINI_API_KEY`) | $0 | catalogación y estilista |
| 9 | fal.ai + depósito ~$10 USD | $10 USD | recorte de fondo y try-on |
| 10 | Sentry | $0 | Semana 4 |

Afiliados (Amazon MX, Mercado Libre) son Semana 3-4: requieren la URL ya deployada.

## 🟡 Inconsistencias detectadas en el documento maestro

1. **§7 vs §6:** la tabla de rúbrica menciona *"final (Week 6) 5 min"* pero el plan es de
   4 semanas (§6) y el video final se agenda en Semana 4. Confirmar cuál es el plazo real.
2. **Carpeta `Rubriuca` (§2.4):** no existe en esta máquina. La única transcripción disponible
   de la rúbrica es §7 del propio documento; los `.docx` de rúbrica en Downloads son de otro
   curso (trabajo en equipo / bachillerato). Si existe la rúbrica original, conviene traerla.
3. **Vercel Hobby es no-comercial** (ya anotado en §4.1): en cuanto haya un cobro real hay que
   subir a Pro. No es un problema durante desarrollo y evaluación.
4. **Apéndice A3** trae una comilla tipográfica mal puesta (`„evidencia`) que rompería el JSON
   si se copia literal al prompt. Se corrige al implementar `lib/ai/prompts/`.

## 🟢 Hecho (sin necesidad de cuentas ni instalaciones)

- Repo `~/closetai` inicializado, documento maestro como base del historial.
- Migración 001: esquema completo del Apéndice B, RLS en las 13 tablas.
- Migración 002: trigger de alta de `profiles`, débito atómico de créditos con idempotencia,
  buckets privados de Storage con políticas por carpeta.
- Plantilla `.env.local.example`, `.gitignore` que protege secretos, README.
- Esqueletos de los 4 logs de evidencia de la rúbrica (§7).

## 🟠 Para el día de la evaluación

El repo `vestiamx-code/closetai` es **privado**. La rúbrica pide los commits como evidencia, así
que ese día hay que darle acceso a quien califique (Settings → Collaborators) o cambiarlo a
público temporalmente. No dejarlo para el último momento.
