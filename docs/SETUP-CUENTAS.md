# Runbook de cuentas (§5.1) — pasos 🔑 de Tamara

Claude no crea cuentas, no teclea contraseñas ni datos de pago, y no acepta términos y
condiciones. Todo lo de esta lista lo haces tú; yo sigo en cuanto me pases las llaves.

## Cómo me entregas las llaves

**No las pegues en el chat.** Escríbelas en `~/vestia/.env.local` (ya existe, ya está en
`.gitignore`, nunca se sube a GitHub). Ábrelo con:

```bash
open -e ~/vestia/.env.local
```

Cada vez que llenes una sección, me dices "ya está X" y yo la uso. Las contraseñas de las
cuentas **no van ahí** — esas se quedan en tu gestor de contraseñas y yo nunca las necesito.

---

## 1. Correo del proyecto — $0

Cuenta de Google nueva: **vestia.mx@gmail.com** (o la variante que esté libre).
Todas las cuentas de abajo se registran con este correo, no con el tuyo personal. Es lo que
mantiene Vestia separado de tus cosas y lo que hace que la cuenta sea transferible o vendible
después. Pide verificación por teléfono.

→ Anota en `.env.local`: nada todavía. Solo dime qué correo quedó.

## 2. Dominio vestia.mx — ~$45 USD/año · el único gasto fijo obligado

En **Namecheap** (namecheap.com) o **Akky** (akky.mx, registrar mexicano).
Busca `vestia.mx`, regístralo a 1 año. Activa la protección de privacidad de WHOIS si es gratis.

Verifícalo antes de pagar: el documento lo dio por libre el 19-ago-2026, conviene confirmar que
sigue así antes de seguir con el resto.

→ Después me dices en qué registrar quedó y yo te doy los registros DNS exactos que hay que
capturar (para Vercel y para Resend).

## 3. GitHub — $0

Cuenta nueva con el correo del proyecto. Crea un repo **privado** llamado `vestia`
(sin README, sin .gitignore, sin licencia — ya los tengo escritos aquí).

Luego, en la Terminal, corre esto y teclea el código que aparezca:

```bash
gh auth login
```

Elige: GitHub.com → HTTPS → autenticar con navegador. Ahí sí tecleas tú el código.

## 4. Vercel — $0 (plan Hobby)

Regístrate en vercel.com **con la cuenta de GitHub** que acabas de crear (no con correo).
No conectes el repo todavía: lo hago yo cuando el código esté listo para el primer deploy.

⚠️ Hobby prohíbe uso comercial. Sirve para desarrollo y para la evaluación del curso; el día
que entre el primer pago real hay que subir a Pro ($20 USD/mes). Está anotado en riesgos (§9).

## 5. Supabase — $0

supabase.com → nuevo proyecto **`vestia-prod`**, región la más cercana a México
(`East US (North Virginia)` o `West US`). Te va a pedir crear una contraseña de base de datos:
**guárdala en tu gestor**, la vas a necesitar.

Copia de *Project Settings → API* a `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=        # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # anon / public
SUPABASE_SERVICE_ROLE_KEY=       # service_role — esta es la llave maestra, nunca al cliente
```

Esto desbloquea aplicar las migraciones 001 y 002 que ya están escritas.

## 6. Google AI Studio — $0

aistudio.google.com con el correo del proyecto → *Get API key* → crear.

```
GEMINI_API_KEY=
```

Desbloquea catalogación de prendas y el estilista. Es de lo más barato de conseguir y de lo
que más avanza el producto: en cuanto la tenga puedo probar el pipeline de catalogación.

## 7. fal.ai — depósito ~$10 USD 🔑 pago

fal.ai → cuenta con el correo del proyecto → agregar $10 USD de saldo (lo pagas tú, con tu
tarjeta, en su sitio; yo no toco datos de pago). Ese depósito rinde ~130 renders de try-on
o ~10,000 recortes de fondo.

```
FAL_KEY=
```

## 8. Resend — $0

resend.com → cuenta → *Domains* → agregar `vestia.mx`. Te va a mostrar unos registros DNS;
mándamelos o dime que ya están y te digo exactamente qué capturar en el registrar.

```
RESEND_API_KEY=
```

## 9. Stripe — $0 fijo

stripe.com → cuenta de México. **Puedes empezar en modo test sin activar la cuenta**, así que
no necesitas tener listos los datos fiscales ni la cuenta bancaria todavía. Copia las llaves de
*Developers → API keys* con el switch en **Test mode**:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # pk_test_...
STRIPE_SECRET_KEY=                    # sk_test_...
```

La activación real (datos fiscales + banco) es Semana 4. Empiézala pronto de todos modos:
Stripe MX suele tardar en revisar y está listado como riesgo en §9.

## 10. Sentry — $0

sentry.io → proyecto `vestia` (plataforma: Next.js) → copiar el DSN.

```
SENTRY_DSN=
```

Es Semana 4; no corre prisa.

---

## Afiliados — Semana 3-4, requieren la URL ya deployada

11. **Amazon Afiliados MX** (afiliados.amazon.com.mx) — paga 10% en moda, alta inmediata.
    Pide la URL del sitio, por eso va después del primer deploy. Anota el tag (`vestia-20`).
    ⚠️ Cierran cuentas sin 3 ventas en 180 días, pero se puede volver a aplicar.
12. **Mercado Libre Afiliados** — requiere cuenta de ML + Mercado Pago del proyecto.

---

## Orden recomendado si quieres avanzar rápido

Con **1, 5 y 6** (correo, Supabase, Gemini) ya puedo construir el clóset digital completo,
que es toda la Semana 1. El dominio y Vercel se necesitan para el primer deploy; fal.ai para
el try-on de Semana 3; Stripe para Semana 3-4.
