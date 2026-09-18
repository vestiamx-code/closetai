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

## [2026-08-20] — Sesión 4 (autónoma)
**Prompt:** *"tu sigue y mañana me encuentro con el closet funcionando"* — construir
la Semana 1 completa sin supervisión.
**Resultado:** M1 y M2 funcionando contra producción. Registro, entrada,
recuperación de contraseña, protección de rutas, subida de fotos por lotes con
compresión a WebP en el navegador, catalogación con IA, clóset con filtros,
detalle de prenda con corrección, perfil con tallas y borrado real de cuenta.
8 pruebas e2e y 12 unitarias en verde.
**Juicio humano:** lo más importante de la sesión fue **leer la documentación
antes de escribir**. El proyecto avisa que Next 16 tiene cambios que rompen lo
aprendido, y resultó cierto: `middleware.ts` está renombrado a `proxy.ts`. Haberlo
dado por sabido habría dejado la aplicación sin protección de rutas y sin un solo
error que lo delatara.
**Commit:** feat: week 1 — auth and digital closet


---

# Semana 1 · Núcleo de estilo (`/core`)

## [2026-09-02] — Sesión 1 · Planear antes de programar
**Prompt:** "Aquí está la tarea de la Semana 1 y su rúbrica. Dime qué ya tenemos y qué falta,
antes de escribir nada."
**Resultado:** inventario contra la rúbrica. Cinco motores generativos ya existían, pero todos
detrás de un login; `/core` daba 404. La rúbrica tiene un tope duro: sin página en vivo, máximo
5/10.
**Juicio humano:** se decidió que el "módulo generativo" fuera el Apéndice A3 del Documento
Maestro —cómo ClosetAI deduce el estilo— y no un extractor genérico de textos. Un extractor
genérico habría cumplido la letra de la tarea sin servirle al producto.
**Commit:** a4e9890

## [2026-09-02] — Sesión 2 · El packet, antes del código
**Prompt:** "Escribe el Build Discipline Packet de esta función y **commitéalo antes** de tocar
código, para que el historial pruebe el orden."
**Resultado:** `docs/SEMANA-1-PACKET.md` con problema, usuaria, éxito, UX, recorte de alcance,
especificación con criterios comprobables, arquitectura, stack, DevOps y plan de pruebas.
**Juicio humano:** el recorte de alcance se escribió con razones, no como lista de deseos. No
conectar el núcleo al estilista todavía es deliberado: primero hay que comprobar que el núcleo
que sale es bueno.
**Commit:** a4e9890

## [2026-09-02] — Sesión 3 · Migración y contrato
**Prompt:** "Escribe la migración de `core_outputs` y el contrato zod. No inventes columnas."
**Resultado:** migración 005 y `styleCoreSchema` con topes por lista.
**Juicio humano:** dos decisiones de seguridad que no venían en la tarea. La tabla revoca
`insert` a `anon` —si no, cualquiera escribe filas saltándose el contrato— y la consulta pública
**no selecciona la columna `entrada`**: lo que alguien escribe sobre sí misma es suyo, y la
lista muestra el núcleo, no la confesión.
**Commit:** (ver commit de la función)

## [2026-09-02] — Sesión 4 · El prompt del módulo
**Prompt:** "Escribe el prompt de extracción. Que no invente: si el texto es vago, que lo diga."
**Resultado:** `src/lib/ai/prompts/core.ts`, versionado como los demás. Prohíbe explícitamente el
relleno de revista ("elegancia atemporal", "versátil y sofisticado") y obliga a declarar
`confianza` y `falta`.
**Juicio humano:** temperatura 0.45, elegida probando. Con 0 el modelo repetía las mismas cinco
frases para entradas distintas; más alto empezaba a inventar colores que nadie mencionó.
**Commit:** (ver commit de la función)

## [2026-09-02] — Sesión 5 · Página y guardado
**Prompt:** "Arma `/core`: formulario, tarjeta estructurada, botón de guardar y la lista de
guardados. Pública, sin sesión."
**Resultado:** la página fuera del grupo `(app)` para que no herede la exigencia de sesión, con
las Server Actions `generarNucleo` y `guardarNucleo`.
**Juicio humano:** `guardarNucleo` **vuelve a validar** lo que llega del navegador. Una Server
Action se puede llamar por POST directo; confiar en que el payload sigue siendo el que generamos
sería dejar la puerta abierta.
**Commit:** (ver commit de la función)

## [2026-09-02] — Sesión 6 · Probar contra el sitio real
**Prompt:** "Corre las tres pruebas contra producción, no contra localhost, con entradas
distintas — incluida una vaga a propósito."
**Resultado:** las tres pasaron. La tercera es la que importa: con texto vago el módulo devolvió
25% de confianza, paleta vacía y dijo qué le faltaba saber.
**Juicio humano:** dos pruebas mías estuvieron mal escritas antes de estarlo bien, y las dos
fallaron igual: afirmaban texto que **también existe en la página recién cargada**. Ver el
Iteration Log.
**Commit:** (ver commit de evidencia)


---

# Semana 2 · Investigación y benchmarking (`/research`)

## [2026-09-14] — Sesión 1 · Verificar antes de planear
**Prompt:** "Esto es lo que tenemos que entregar esta semana. Antes de construir, revisa qué
investigación ya existe en el Documento Maestro y comprueba cada dato en su fuente."
**Resultado:** la investigación del §2.2 revisada fuente por fuente. Nueve afirmaciones no
sobrevivieron tal cual y seis se descartaron por no poder comprobarse. Registro completo en
`docs/evidencia/INVESTIGACION-SEMANA-2.md`.
**Juicio humano:** la regla fue **abrir la fuente, no leer el resumen del buscador**. Resultó
necesaria: el buscador resumió que Indyx cobra estilista desde $25 al mes (la página dice $15) y
que GoTrendier cobra 20% + $9 (el desarrollador dice 14% + $14). El hallazgo más importante
cambió la tesis del producto: **sí hay apps de clóset en español**. El hueco no es el idioma, es México.
**Commit:** e3f65d3

## [2026-09-14] — Sesión 2 · El packet, antes del código
**Prompt:** "Escribe el Build Discipline Packet de /research sobre la investigación verificada y
commitéalo antes de tocar código."
**Resultado:** `docs/SEMANA-2-PACKET.md`, commit `e3f65d3` a las 11:37. El primer archivo de
código entró en `1d0f355` a las 11:51.
**Juicio humano:** el recorte de alcance más importante fue **no dejar que la IA investigue en
internet**. Un modelo que busca y resume inventa cifras con total seguridad, y en esta misma
sesión el buscador ya se había equivocado dos veces.
**Commit:** e3f65d3

## [2026-09-14] — Sesión 3 · Migración y datos sembrados
**Prompt:** "Escribe la migración 006 con las cuatro tablas y siembra solo lo que está en el
documento de investigación, con su URL y fecha. La tabla de validación no se siembra."
**Resultado:** `research_sources` (15 filas), `research_risks` (7), `validation_conversations`
(vacía, con check de consentimiento) y `research_outputs`. Lectura pública, escritura solo desde
el servidor.
**Juicio humano:** la tabla de validación **exige consentimiento a nivel de base de datos**, no
solo en la interfaz. Y como Postgres no permite llave foránea sobre un arreglo, la integridad de
la evidencia de cada riesgo la garantiza una prueba e2e en lugar de confiar en que nadie se equivoque.
**Commit:** 1d0f355

## [2026-09-14] — Sesión 4 · El contrato que no deja inventar fuentes
**Prompt:** "El informe solo puede usar los datos de la tabla. Haz que el contrato lo compruebe:
si cita un id que no existe, se rechaza entero."
**Resultado:** `parseResearchReport` valida el esquema y luego cada cita contra los ids reales.
Nueva razón de fallo, `invented_source`, distinta de un error de formato.
**Juicio humano:** el prompt **pide** no inventar; el contrato lo **impide**. Temperatura 0.2,
más baja que la de `/core` (0.45): allá importaba que dos personas recibieran núcleos distintos;
aquí importa que la misma evidencia dé la misma respuesta. Y al guardar se revalida contra la
base, porque una Server Action se puede llamar por POST directo.
**Commit:** 1d0f355

## [2026-09-14] — Sesión 5 · La página
**Prompt:** "Arma /research: panel de resumen desde la base, pregunta de investigación, 5
referentes, México, tabla con filtro y búsqueda, mapa de riesgos, validación y lo descartado."
**Resultado:** página pública con la tabla y el filtro como componente de cliente, y el mapa de
riesgos como cuadrícula de CSS.
**Juicio humano:** la búsqueda **ignora acentos**: quien escribe "mexico" en el celular no pone
tilde, y sin eso la búsqueda falla en silencio. La sección de validación dice "Pendiente" mientras
no haya una conversación real, y lo que no se pudo verificar aparece al final, fuera de los datos.
**Commit:** 1d0f355

## [2026-09-14] — Sesión 6 · Ver fallar las pruebas antes de creerles
**Prompt:** "Las 18 pruebas pasan. Sabotea el código a propósito y comprueba que las importantes
fallan con el motivo correcto."
**Resultado:** al quitar la comprobación de citas, falla exactamente la prueba de fuentes
inventadas; al quitar la normalización de acentos, fallan las dos de búsqueda. Restaurado: 18 de 18.
**Juicio humano:** es la lección de las semanas 0 y 1 aplicada desde el principio, no después del
susto: una prueba que nunca has visto fallar no prueba nada.
**Commit:** 1d0f355

## [2026-09-14] — Sesión 7 · Reproducir el fallo fuera del navegador
**Prompt:** "La prueba de generación falla en producción. No cambies nada todavía: reproduce la
llamada fuera del navegador, con la misma pregunta y los mismos datos, y enséñame la respuesta cruda."
**Resultado:** Gemini respondía 503 UNAVAILABLE. La página culpaba a la pregunta.
**Juicio humano:** diagnosticar antes de arreglar. Con solo el mensaje de la interfaz, lo obvio era
sospechar del contrato o del prompt; la respuesta cruda mostró que el problema estaba en otro lado.
**Commit:** bb9ac53

## [2026-09-14] — Sesión 8 · Medir antes de decidir el respaldo
**Prompt:** "Antes de agregar un modelo de respaldo, mide: ¿el SDK permite tiempo máximo? ¿el modelo
ligero está respondiendo mientras el principal no?"
**Resultado:** flash tardó 86 s o dio 503; flash-lite respondió en medio segundo tres veces. El SDK
acepta `abortSignal`.
**Juicio humano:** el respaldo solo se activa cuando falla el proveedor. Si la petición está mal,
cambiar de modelo escondería un error real. Y se registra qué modelo contestó.
**Commit:** 23abff3

## [2026-09-14] — Sesión 9 · Prompt v2, a partir de una corrida real
**Prompt:** "En la corrida 1 el informe dijo 'no hay competidores locales' cuando la fuente dice
'ninguna de las revisadas'. Agrega la regla y repite la misma pregunta."
**Resultado:** v2 conserva el límite del dato.
**Juicio humano:** el cambio salió de leer la respuesta con lupa, no de una prueba automática: ningún
contrato detecta que una frase generalizó de más. Eso lo tiene que ver una persona.
**Commit:** 46a1e64

## [2026-09-18] — Sesión 10 · Leer la pantalla del fallo, no solo el mensaje
**Prompt:** "Corre toda la suite contra producción. Si algo falla, no lo marques como intermitente
sin antes leer qué había en la pantalla."
**Resultado:** la falla del estilista resultó intermitente, pero su pantalla mostraba "Ciudad de
M√©xico". Una cuenta temporal confirmó que la base le asignaba ese valor a toda cuenta nueva.
**Juicio humano:** el error que importaba no era el que hizo fallar la prueba, sino uno que estaba
en la captura, al lado. Y en la Semana 1 ya se había visto: se corrigió el síntoma y no la causa.
**Commit:** (ver commit de la migración 007)
