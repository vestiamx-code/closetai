# Pendientes

Actualizado: 2026-08-22.

El producto está completo y en vivo en **https://closetai.lat**. Esto es lo que
queda, ordenado por lo que de verdad bloquea.

---

## 🔴 Cinco minutos, y solo tú puedes hacerlo

### 1. Borrar el archivo con tus llaves
Sigue en tu carpeta personal, en texto plano. Las 23 variables ya están en Vercel,
así que no sirve para nada.

```bash
rm -f ~/VERCEL-VARIABLES.txt
```

### 2. Borrar dos endpoints viejos de Stripe
Hay **tres** registrados y solo uno sirve. Uno apunta a `/api/stripe/webhook-v2`,
una ruta que no existe: Stripe le manda eventos, recibe 404, reintenta durante
días y acabas con un correo de "tu endpoint está fallando".

Yo creé el bueno, pero borrar en servicios externos no lo hago sin que me lo
confirmes. En [Stripe → Webhooks](https://dashboard.stripe.com/test/webhooks):

| Borrar | id |
|---|---|
| `…/api/stripe/webhook-v2` | `we_1U71dZ5wCnbZNWy3SCQQ8rah` |
| `…/api/stripe/webhook` (el viejo) | `we_1U71dK5wCnbZNWy3UKPH7vu3` |

**Deja vivo** `we_1U75Hg5wCnbZNWy3JFtGKa9K` — es el que tiene el secreto que la
app conoce. Mientras no los borres no se rompe nada: los viejos fallan la
verificación de firma y se rechazan.

### 3. Limpiar el clóset de demo
Dos prendas sobran y se ven mal: **"silueta gráfica de prenda"** (la IA describió
literalmente una imagen de relleno del script de siembra) y una de las dos
**"sudadera con capucha"** duplicadas. Se borran desde la ficha de cada prenda.

---

## 🚨 Antes de que alguien que no seas tú use la app

### Activar facturación en la API de Gemini — bloqueante
**Disparador:** el día que otra persona suba una foto suya.

El nivel gratuito dice que las peticiones **pueden ser revisadas por humanos y
usadas para entrenar los modelos de Google**. Con ropa tuya no importa. Con fotos
del cuerpo de otras personas sí: es dato sensible bajo la LFPDPPP y contradice el
§3.2 del documento maestro.

Se resuelve activando facturación; en el nivel de pago Google no entrena con los
datos. No hay que cambiar de proveedor ni tocar código. Catalogar una prenda
cuesta ~$0.0003 USD.

### Borrar la cuenta de demostración
`demo@closetai.lat` vive en la base de producción con prendas sembradas. Sirvió
para el video y la entrega; bórrala antes de abrir a gente real.

### Stripe a modo real
Hoy las llaves son `sk_test_`: nadie puede pagarte de verdad, que es lo correcto
mientras pruebas. Para cobrar en serio hay que activar la cuenta (te pedirán datos
fiscales), cambiar las llaves y recrear el webhook.

**Antes de eso:** 2FA en GitHub `vestiamx-code`, en Vercel y en el Gmail del
proyecto. Se pospuso a propósito durante el setup; con dinero real ya no.

---

## 🟡 Mejoras del producto (puedo hacerlas yo)

### El clóset solo aprende una vez al día
`updateStyleProfile` se llama **únicamente** desde el cron de las 8am. Alguien que
se registra hoy, sube ropa y reacciona a diez outfits ve *"Todavía no te conozco"*
hasta mañana — justo en la ventana donde decide si la app vale la pena.

**Arreglo:** recalcular el perfil en cuanto haya suficientes reacciones nuevas, y
dejar el cron como red de seguridad. Es la mejora con mejor relación
impacto/esfuerzo que le queda al producto.

### No hay onboarding
La columna `onboarding_done` existe en la base y **ningún archivo la lee ni la
escribe**. Una persona nueva cae en un clóset vacío sin saber que necesita ~10
prendas para que el estilista sirva.

### Sentry
La ranura `SENTRY_DSN` está en el código y vacía. Sin ella, si algo truena en
producción te enteras por una usuaria, no por una alerta.

---

## ⏰ Sin prisa

### El dominio está a tu nombre personal
La cuenta de Namecheap y el contacto de `closetai.lat` usan
`tamaramunozdel@gmail.com`, no el correo del proyecto. Si algún día se transfiere
o se vende ClosetAI, el dominio hay que moverlo aparte.

### El original de una prenda quedó girado
Al arreglar la rotación EXIF corregí el recorte —que es lo que se muestra y lo que
usa el try-on— pero el archivo `.webp` original de esa sudadera sigue de lado. No
se ve en ningún lado; se arregla solo si vuelves a subir esa prenda.
