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

