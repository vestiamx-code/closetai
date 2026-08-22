# Pendientes

Actualizado: 2026-08-21, al terminar las cuatro semanas.

El producto está completo y en vivo en **https://closetai.lat**. Lo que queda son
tareas que **necesitan tus manos** (contraseñas, tarjetas, decisiones tuyas) o que
son de lanzamiento real, no de desarrollo.

---

## 🔴 Cosas que solo puedes hacer tú

### 1. Borrar dos endpoints viejos de Stripe — 2 minutos
Durante la configuración quedaron tres endpoints de webhook registrados. Uno apunta a
`/api/stripe/webhook-v2`, una ruta que **no existe** en el código: Stripe le va a mandar
eventos, va a recibir 404, va a reintentar durante días y te va a llegar un correo de
"tu endpoint está fallando".

Yo creé el bueno y le puse su secreto correcto a la app, pero **no pude borrar los
viejos**: borrar cosas en servicios externos es una acción que no ejecuto sin que me lo
confirmes.

Entra a [Stripe → Webhooks](https://dashboard.stripe.com/test/webhooks) y borra estos dos:

| Endpoint | id |
|---|---|
| `https://closetai.lat/api/stripe/webhook-v2` | `we_1U71dZ5wCnbZNWy3SCQQ8rah` |
| `https://closetai.lat/api/stripe/webhook` (el viejo) | `we_1U71dK5wCnbZNWy3UKPH7vu3` |

**Deja vivo** el que dice `we_1U75Hg5wCnbZNWy3JFtGKa9K`. Ese es el que tiene el secreto
que la app conoce.

Mientras no los borres no se rompe nada — los viejos fallan la verificación de firma y la
app los rechaza, y el índice único de `credit_ledger` hace imposible abonar créditos dos
veces. Es ruido, no un agujero.

### 2. Borrar el archivo con las llaves
`~/VERCEL-VARIABLES.txt` ya no sirve para nada: las 23 variables están cargadas en Vercel.
Es un archivo de texto plano con todos tus secretos.

```bash
rm -f ~/VERCEL-VARIABLES.txt
```

### 3. Revisar y firmar las notas de decisión
Están en [`docs/evidencia/DECISION_NOTES.md`](docs/evidencia/DECISION_NOTES.md), escritas
en tu voz, una por semana. **Léelas antes de firmar**: si algo no lo piensas así, cámbialo.
Son tuyas, no mías.

### 4. Grabar el video
Guion completo, minuto a minuto, en [`docs/evidencia/GUION-VIDEO.md`](docs/evidencia/GUION-VIDEO.md).

### 5. Revocar mi acceso a Vercel cuando ya no lo necesites
Para cargar las variables sin escribir tus secretos en el chat, autoricé la CLI de Vercel
en tu máquina (device authorization, cuenta `vestiamx-code`). Si quieres cerrarlo:

```bash
npx vercel logout
```

---

## 🚨 Bloqueante de lanzamiento (de evento, no de fecha)

### Activar facturación en la API de Gemini — **ANTES de la primera usuaria real**
**Disparador:** el día que alguien que no seas tú suba una foto suya a ClosetAI.

El nivel gratuito de Gemini dice explícitamente que las peticiones **pueden ser revisadas
por humanos y usadas para entrenar los modelos de Google**. Con ropa de prueba tuya no
importa. Con fotos de cuerpo de usuarias reales sí: es dato personal sensible bajo la
LFPDPPP y contradice el §3.2 del documento.

**Cómo se resuelve:** activar facturación en la API de Gemini. En el nivel de pago Google
no usa los datos para entrenar. No hay que cambiar de proveedor ni tocar código.

**Costo:** catalogar una prenda cuesta ~$0.0003 USD. Mil prendas = $0.30 USD.

### Pasar Stripe a modo real
Hoy las llaves son `sk_test_`. Nadie puede pagarte de verdad todavía, que es lo correcto
mientras pruebas. Para cobrar en serio: activar la cuenta en Stripe (te va a pedir datos
fiscales), cambiar las llaves y recrear el webhook con las llaves reales.

**Antes de eso:** activar 2FA en GitHub `vestiamx-code`, Vercel y el Gmail del proyecto.
Se pospuso a propósito durante el setup; con dinero real de por medio ya no.

### Borrar la cuenta de demostración
`demo@closetai.lat` existe en la base de producción con prendas sembradas, para el video.
Bórrala antes del lanzamiento real.

---

## ⏰ Sin prisa

### El dominio está a tu nombre personal
La cuenta de Namecheap y el contacto de `closetai.lat` usan `tamaramunozdel@gmail.com`, no
el correo del proyecto. No urge. Si algún día se transfiere o se vende ClosetAI, el dominio
hay que moverlo aparte del resto de las cuentas.

### Sentry
La ranura `SENTRY_DSN` está en el código y vacía. Sin ella, si algo truena en producción te
enteras por una usuaria, no por una alerta. Se pospuso por un choque de correos en el alta.
