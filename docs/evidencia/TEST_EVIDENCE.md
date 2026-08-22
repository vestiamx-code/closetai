# Evidencia de pruebas

Evidencia de rúbrica: *Testing & iteration* (≥3 pruebas por semana con evidencia).
Cada entrada: qué se probó, cómo, resultado, y captura/salida.

Formato:

```
## [YYYY-MM-DD] CA-Mx.n — nombre del criterio de aceptación
**Tipo:** unit (Vitest) | e2e (Playwright) | manual
**Cómo:** comando o pasos
**Resultado:** ✅ pasa / ❌ falla → qué se hizo
**Evidencia:** ruta de captura o salida pegada
```

---

## [2026-08-19] Contrato de salida del catalogador de prendas
**Tipo:** unit (Vitest 4.1.11) — `src/lib/ai/schemas.test.ts`
**Qué se prueba:** que nada llegue a la base de datos sin validar. Un LLM puede devolver
cualquier cosa, así que `parseGarmentCatalog` es la única puerta de entrada de la salida del
modelo de visión (Apéndice A1).
**Cómo:** `pnpm test:unit`
**Casos (9):**
1. Quita el envoltorio ```` ```json ```` que los modelos añaden aunque se les pida JSON pelón.
2. Deja intacto el JSON sin envoltorio.
3. Acepta una catalogación válida y conserva sus campos.
4. Acepta una catalogación envuelta en bloque de código.
5. Distingue el **rechazo del modelo** (`{"error": ...}`, imagen que no es ropa) de un error de
   formato — son dos caminos distintos en la UI y no se pueden confundir.
6. Rechaza una categoría fuera del catálogo (`"sombrero"`).
7. Rechaza `confianza` fuera del rango 0-1.
8. Rechaza más de 3 colores: el esquema promete 1-3 dominantes.
9. No lanza excepción cuando el modelo devuelve texto suelto — el pipeline marca la prenda como
   `failed` y sigue con las demás en vez de tumbar el lote entero.
**Resultado:** ✅ 9/9 pasan. `Test Files 1 passed (1) · Tests 9 passed (9) · 689ms`
**Evidencia:** salida de `pnpm test:unit` reproducible en local y en CI.

## [2026-08-19] Pipeline de calidad completo
**Tipo:** verificación de build
**Cómo:** `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build`
**Resultado:** ✅ todo verde. Build de Next 16.3.1: compilado en 2.2 s, 4 rutas estáticas.
**Evidencia:** el mismo pipeline corre en `.github/workflows/ci.yml` en cada PR.

## [2026-08-19] Landing en producción — humo e2e
**Tipo:** e2e (Playwright 1.62.1) — `e2e/landing.spec.ts`, perfil `mobile-chrome` (Pixel 7)
**Por qué en móvil:** ClosetAI es mobile-first (§3.1) — la suite corre primero en el dispositivo
donde de verdad va a estar el usuario, no en escritorio.
**Cómo:** `pnpm test:e2e --project=mobile-chrome`
**Casos (3):**
1. La página carga, el `<h1>` comunica la promesa y el título contiene la marca.
2. El documento declara `lang="es-MX"` — importa para lectores de pantalla y para SEO local.
3. La promesa de que el clóset es gratis está visible: es el antídoto contra la queja #2 de la
   categoría (§2.2) y si desaparece de la landing, la prueba falla.
**Resultado:** ✅ 3/3 pasan en 8.7 s.
**Evidencia:** salida de `playwright test --reporter=list`.

## [2026-08-20] El pipeline corre solo en cada push
**Tipo:** CI (GitHub Actions) — `.github/workflows/ci.yml`
**Qué prueba:** que la suite no dependa de esta máquina. Instala en limpio, sin `node_modules`
ni caché local, y sin ningún secreto real (el build usa claves de relleno a propósito).
**Cómo:** automático en cada push a `main` y en cada PR.
**Resultado:** ✅ verde a la primera. `success · 2m51s` — install, lint, typecheck, 9 pruebas
unitarias, build y auditoría de dependencias.
**Evidencia:** run `32420304079` en github.com/vestiamx-code/closetai/actions

## [2026-08-20] El producto responde en su propio dominio
**Tipo:** verificación de producción (curl + openssl, desde fuera de la máquina de desarrollo)
**Qué se prueba:** que el sitio esté realmente publicado y accesible en internet, no solo en local.
**Resultado:** ✅
- `https://closetai.lat` → **HTTP 200**, título `ClosetAI — Tu estilista, en tu bolsillo`
- `http://closetai.lat` → **308** hacia `https://` (redirección forzada a TLS)
- Certificado: `CN=closetai.lat`, emisor Let's Encrypt, válido hasta 18-nov-2026
- DNS propagado y coherente en los resolvers de Google (8.8.8.8) y Cloudflare (1.1.1.1)
**Evidencia:** salida de `curl -w`, `dig +short` y `openssl s_client`.

## [2026-08-20] El catalogador funciona contra Gemini real
**Tipo:** integración (Vitest) — `src/lib/ai/gemini.live.test.ts`
**Qué prueba:** la cadena completa de catalogación, no una simulación: imagen → API de
Gemini → JSON → validación con zod → objeto tipado. Es el corazón del M2.
**Cómo:** `pnpm test:unit`. La prueba **se salta sola si no hay `GEMINI_API_KEY`**, para que el
CI no dependa de secretos ni queme cuota.
**Prenda de prueba:** `src/tests/fixtures/playera-rayas.png` — una playera de rayas azul marino
generada por código (PNG escrito a mano en Python), para no depender de fotos de nadie.

**Resultado:** ✅ pasa. Respuesta del modelo `gemini-3.5-flash-lite`:

| Campo | Devuelto |
|---|---|
| categoria | `top` |
| subcategoria | `playera` (es-MX correcto, no "t-shirt") |
| colores | azul marino, blanco |
| patron | `rayas` |
| material_aparente | algodón |
| estilos | casual, minimalista |
| temporadas | verano, primavera |
| ocasiones | diario |
| confianza | 0.98 |

`notas_styling`: *"Combínala con unos jeans de mezclilla y tenis blancos para un look marinero
clásico y relajado."*

**Lo que esto demuestra:** el modelo responde en español de México con vocabulario local, respeta
el esquema del Apéndice A1 sin inventarse categorías, y el contrato de zod acepta la salida sin
correcciones. Costo de la llamada: ~$0.0003 USD.

## [2026-08-20] Base de datos en producción: alta de usuaria y ciclo de créditos
**Tipo:** integración contra el proyecto real `closetai-prod` (no una copia local)
**Cómo:** llamadas HTTP a la API de Supabase con la llave de servicio.

### Estructura
- ✅ Las **13 tablas** del Apéndice B responden.
- ✅ Los **3 buckets** de Storage existen y los tres son **privados**.
- ✅ El chequeo automático de Supabase al aplicar el SQL solo objetó la tabla de
  bitácora de migraciones: confirmó por su cuenta que las 13 tablas del producto
  ya traían RLS activada.

### Alta de usuaria (trigger de la migración 002)
Al crear una usuaria, sin que la app haga nada más:
- ✅ `profiles` → `{display_name: "Prueba Trigger", plan: "free", city: "Ciudad de México", onboarding_done: false}`
- ✅ `style_profiles` → `{version: 0, profile: {}}`

### Ciclo completo de créditos
| Paso | Esperado | Resultado |
|---|---|---|
| Cobrar sin saldo | rechazo | ✅ `insufficient_credits` |
| Abonar compra de 30 | saldo 30 | ✅ 30.0 |
| Cobrar 1 render | saldo 29 | ✅ 29.0 |
| Reintentar el mismo pago de Stripe | bloqueado | ✅ HTTP 409 |
| Saldo tras el duplicado | 29 | ✅ 29.0 |
| Borrar usuaria | borra sus movimientos | ✅ cascada correcta |

El cuarto renglón es el que protege el dinero: Stripe reenvía webhooks cuando no
recibe confirmación, y sin el índice único en `credit_ledger.ref` una sola compra
podría abonar créditos varias veces.

**Limpieza:** las usuarias de prueba se borraron; la base quedó en cero.

## [2026-08-20] Semana 1 completa: de la foto al clóset
**Tipo:** e2e (Playwright, perfil móvil) — `e2e/closet.spec.ts`
**Qué prueba:** el recorrido real de una usuaria contra Supabase y Gemini de
producción. La prueba crea su propia usuaria desechable y la borra al terminar.

| # | Caso | Por qué importa | Resultado |
|---|---|---|---|
| 1 | Entrar a `/closet` sin sesión | La protección de rutas no puede depender de que la UI esconda el enlace | ✅ redirige a `/entrar` y recuerda a dónde iba |
| 2 | Contraseña incorrecta vs. correo inexistente | Si los mensajes difieren, cualquiera puede averiguar qué correos tienen cuenta | ✅ mensaje idéntico |
| 3 | Subir foto → catalogar → ver en el clóset | Es el producto | ✅ 7.4 s de punta a punta |
| 4 | Corregir el nombre de una prenda | Cada corrección debe alimentar el aprendizaje (M4), no solo cambiar un dato | ✅ genera `feedback_event` tipo `tag_fix` |
| 5 | Costo de la llamada a la IA | El control de gasto (§4.4) necesita que cada llamada quede registrada | ✅ fila en `api_costs` |

**Resultado:** ✅ 8/8 pruebas e2e (5 de clóset + 3 de landing) y 12 unitarias.

**Capturas de la app funcionando:** `docs/evidencia/capturas/`

## [2026-08-21] Semana 2: el estilista arma outfits con el clóset real
**Tipo:** e2e (`e2e/estilista.spec.ts`) + integración contra Gemini (`stylist.live.test.ts`)

| Caso | Por qué importa | Resultado |
|---|---|---|
| Arma 3 outfits con explicación | Es el producto | ✅ referencian solo prendas reales |
| Cita el clima real en la explicación | Sin eso, la recomendación es genérica | ✅ "los 22°C de la ciudad" |
| **Respeta un color y estilo vetados** | **Es el moat: aprender que odias algo** | ✅ el vestido vino desapareció de las 3 propuestas |
| Rechazar deja `feedback_event` con motivo | Sin eso M4 no aprende nada | ✅ |
| El costo de cada llamada queda en `api_costs` | Control de gasto (§4.4) | ✅ |

## [2026-08-21] Semana 3: el camino del dinero
**Tipo:** e2e (`e2e/pagos.spec.ts`) — webhook real, firmado con el mismo secreto que usa Stripe.

| Caso | Por qué importa | Resultado |
|---|---|---|
| Webhook con firma inválida | Sin verificar firma, cualquiera se regala créditos con un POST | ✅ HTTP 400 |
| Pago válido | | ✅ plan `lifetime` + 30 créditos + compra registrada por $100 |
| **Mismo evento reenviado** | **Stripe reenvía cuando no recibe 200 a tiempo** | ✅ HTTP 200, saldo sigue en 30 |
| Recarga posterior | | ✅ saldo 50, plan intacto |
| Pago sin metadata | Un 500 haría que Stripe reintentara para siempre | ✅ HTTP 200 + incidente en el log |

## [2026-08-21] Semana 3: try-on y recorte de fondo contra fal.ai
**Tipo:** integración (`src/lib/fal.live.test.ts`) — llamadas reales, con cargo real al saldo.

- ✅ **Recorte de fondo** sobre una prenda del clóset, usando una URL firmada de Storage — el mismo camino que recorre una foto de verdad. Devolvió PNG de 1400px.
- ✅ **Try-on con FASHN**: render fotorrealista, la tela cae correctamente y la persona conserva su identidad. Revisado a ojo, no solo por el código de respuesta.
- ✅ **Una imagen que fal no puede descargar se reporta como fallo.** Esto era un bug: fal responde HTTP 200 con el error dentro del cuerpo, y el adapter lo tomaba como éxito.
- ✅ Las categorías que no se pueden probar (calzado, bolsas, accesorios) devuelven `null` en vez de intentar un render deforme.

**Lo que falta verificar y solo puede hacerlo una persona:** la calidad del try-on con una
foto casera real, tomada con celular. Es la queja #4 de la categoría (§2.2) y ningún test
automático la puede medir.


## [2026-08-21] Verificación contra el sitio en vivo (closetai.lat)
**Tipo:** end-to-end contra producción, con la cuenta demo y perfil de iPhone 13.

Esto no lo cubre el pipeline: el pipeline levanta un servidor local. Producción
tiene HTTPS, arranques en frío y el proxy de Vercel enfrente — y ahí es donde
apareció el bug de sesión que ninguna prueba local vio.

| Qué se probó | Resultado |
|---|---|
| Entrar con `demo@closetai.lat` | ✅ `POST /entrar` entrega la cookie de sesión |
| La cookie va marcada `Secure` sobre HTTPS | ✅ (antes no lo estaba) |
| `/closet` `/hoy` `/estilo` `/probar` `/comprar` `/perfil` con sesión viva | ✅ 6/6, dos vueltas |
| Diez navegaciones seguidas entre secciones | ✅ la sesión no se cae |
| El clóset sirve las imágenes con URL firmada | ✅ 4 prendas |
| Rutas privadas sin sesión | ✅ 307 a `/entrar?destino=…` |
| Webhook de Stripe sin firma | ✅ HTTP 400, no 500 |
| Cron sin secreto | ✅ HTTP 401 |
| Errores 5xx o de JavaScript | ✅ ninguno |

**20 de 20 en dos vueltas completas.** La afirmación importante no es "la página
carga": es **"no aparece el campo de contraseña"**. Con la primera, una sesión
caída se ve idéntica a un éxito — que es justo como este bug llegó a producción.
